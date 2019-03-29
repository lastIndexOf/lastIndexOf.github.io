/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "vs/base/common/event", "vs/base/parts/ipc/node/ipc", "vs/base/common/path", "os", "vs/base/common/uuid"], function (require, exports, net_1, event_1, ipc_1, path_1, os_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function generateRandomPipeName() {
        const randomSuffix = uuid_1.generateUuid();
        if (process.platform === 'win32') {
            return `\\\\.\\pipe\\vscode-ipc-${randomSuffix}-sock`;
        }
        else {
            // Mac/Unix: use socket file
            return path_1.join(os_1.tmpdir(), `vscode-ipc-${randomSuffix}.sock`);
        }
    }
    exports.generateRandomPipeName = generateRandomPipeName;
    class ChunkStream {
        get byteLength() {
            return this._totalLength;
        }
        constructor() {
            this._chunks = [];
            this._totalLength = 0;
        }
        acceptChunk(buff) {
            this._chunks.push(buff);
            this._totalLength += buff.byteLength;
        }
        readUInt32BE() {
            let tmp = this.read(4);
            return tmp.readUInt32BE(0);
        }
        read(byteCount) {
            if (byteCount === 0) {
                return Buffer.allocUnsafe(0);
            }
            if (byteCount > this._totalLength) {
                throw new Error(`Cannot read so many bytes!`);
            }
            if (this._chunks[0].byteLength === byteCount) {
                // super fast path, precisely first chunk must be returned
                const result = this._chunks.shift();
                this._totalLength -= byteCount;
                return result;
            }
            if (this._chunks[0].byteLength > byteCount) {
                // fast path, the reading is entirely within the first chunk
                const result = this._chunks[0].slice(0, byteCount);
                this._chunks[0] = this._chunks[0].slice(byteCount);
                this._totalLength -= byteCount;
                return result;
            }
            let result = Buffer.allocUnsafe(byteCount);
            let resultOffset = 0;
            while (byteCount > 0) {
                const chunk = this._chunks[0];
                if (chunk.byteLength > byteCount) {
                    // this chunk will survive
                    this._chunks[0] = chunk.slice(byteCount);
                    chunk.copy(result, resultOffset, 0, byteCount);
                    resultOffset += byteCount;
                    this._totalLength -= byteCount;
                    byteCount -= byteCount;
                }
                else {
                    // this chunk will be entirely read
                    this._chunks.shift();
                    chunk.copy(result, resultOffset, 0, chunk.byteLength);
                    resultOffset += chunk.byteLength;
                    this._totalLength -= chunk.byteLength;
                    byteCount -= chunk.byteLength;
                }
            }
            return result;
        }
    }
    /**
     * A message has the following format:
     *
     * 		[bodyLen|message]
     * 		[header^|data^^^]
     * 		[u32be^^|buffer^]
     */
    class Protocol {
        constructor(_socket) {
            this._socket = _socket;
            this._onMessage = new event_1.Emitter();
            this.onMessage = this._onMessage.event;
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this._writeBuffer = new class {
                constructor() {
                    this._data = [];
                    this._totalLength = 0;
                }
                add(head, body) {
                    const wasEmpty = this._totalLength === 0;
                    this._data.push(head, body);
                    this._totalLength += head.length + body.length;
                    return wasEmpty;
                }
                take() {
                    const ret = Buffer.concat(this._data, this._totalLength);
                    this._data.length = 0;
                    this._totalLength = 0;
                    return ret;
                }
            };
            this._isDisposed = false;
            this._incomingData = new ChunkStream();
            const state = {
                readHead: true,
                bodyLen: -1,
            };
            const acceptChunk = (data) => {
                this._incomingData.acceptChunk(data);
                while (this._incomingData.byteLength > 0) {
                    if (state.readHead) {
                        // expecting header -> read header
                        if (this._incomingData.byteLength >= Protocol._headerLen) {
                            state.bodyLen = this._incomingData.readUInt32BE();
                            state.readHead = false;
                        }
                        else {
                            break;
                        }
                    }
                    if (!state.readHead) {
                        // expecting body -> read bodyLen-bytes for
                        // the actual message or wait for more data
                        if (this._incomingData.byteLength >= state.bodyLen) {
                            const buffer = this._incomingData.read(state.bodyLen);
                            state.bodyLen = -1;
                            state.readHead = true;
                            console.log(buffer.toString());
                            this._onMessage.fire(buffer);
                            if (this._isDisposed) {
                                // check if an event listener lead to our disposal
                                break;
                            }
                        }
                        else {
                            break;
                        }
                    }
                }
            };
            this._socketDataListener = (data) => {
                acceptChunk(data);
            };
            _socket.on('data', this._socketDataListener);
            this._socketEndListener = () => {
            };
            _socket.on('end', this._socketEndListener);
            this._socketCloseListener = () => {
                this._onClose.fire();
            };
            _socket.once('close', this._socketCloseListener);
        }
        dispose() {
            this._isDisposed = true;
            this._socket.removeListener('data', this._socketDataListener);
            this._socket.removeListener('end', this._socketEndListener);
            this._socket.removeListener('close', this._socketCloseListener);
        }
        end() {
            this._socket.end();
        }
        readEntireBuffer() {
            return this._incomingData.read(this._incomingData.byteLength);
        }
        send(buffer) {
            const header = Buffer.allocUnsafe(Protocol._headerLen);
            header.writeUInt32BE(buffer.length, 0, true);
            this._writeSoon(header, buffer);
        }
        _writeSoon(header, data) {
            if (this._writeBuffer.add(header, data)) {
                setImmediate(() => {
                    // return early if socket has been destroyed in the meantime
                    if (this._socket.destroyed) {
                        return;
                    }
                    // we ignore the returned value from `write` because we would have to cached the data
                    // anyways and nodejs is already doing that for us:
                    // > https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
                    // > However, the false return value is only advisory and the writable stream will unconditionally
                    // > accept and buffer chunk even if it has not not been allowed to drain.
                    this._socket.write(this._writeBuffer.take());
                });
            }
        }
    }
    Protocol._headerLen = 4;
    exports.Protocol = Protocol;
    class Server extends ipc_1.IPCServer {
        static toClientConnectionEvent(server) {
            const onConnection = event_1.Event.fromNodeEventEmitter(server, 'connection');
            return event_1.Event.map(onConnection, socket => ({
                protocol: new Protocol(socket),
                onDidClientDisconnect: event_1.Event.once(event_1.Event.fromNodeEventEmitter(socket, 'close'))
            }));
        }
        constructor(server) {
            super(Server.toClientConnectionEvent(server));
            this.server = server;
        }
        dispose() {
            super.dispose();
            if (this.server) {
                this.server.close();
                this.server = null;
            }
        }
    }
    exports.Server = Server;
    class Client extends ipc_1.IPCClient {
        constructor(protocol, id) {
            super(protocol, id);
            this.protocol = protocol;
        }
        static fromSocket(socket, id) {
            return new Client(new Protocol(socket), id);
        }
        get onClose() { return this.protocol.onClose; }
        dispose() {
            super.dispose();
            this.protocol.end();
        }
    }
    exports.Client = Client;
    function serve(hook) {
        return new Promise((c, e) => {
            const server = net_1.createServer();
            server.on('error', e);
            server.listen(hook, () => {
                server.removeListener('error', e);
                c(new Server(server));
            });
        });
    }
    exports.serve = serve;
    function connect(hook, clientId) {
        return new Promise((c, e) => {
            const socket = net_1.createConnection(hook, () => {
                socket.removeListener('error', e);
                c(Client.fromSocket(socket, clientId));
            });
            socket.once('error', e);
        });
    }
    exports.connect = connect;
    /**
     * Will ensure no messages are lost if there are no event listeners.
     */
    function createBufferedEvent(source) {
        let emitter;
        let hasListeners = false;
        let isDeliveringMessages = false;
        let bufferedMessages = [];
        const deliverMessages = () => {
            if (isDeliveringMessages) {
                return;
            }
            isDeliveringMessages = true;
            while (hasListeners && bufferedMessages.length > 0) {
                emitter.fire(bufferedMessages.shift());
            }
            isDeliveringMessages = false;
        };
        source((e) => {
            bufferedMessages.push(e);
            deliverMessages();
        });
        emitter = new event_1.Emitter({
            onFirstListenerAdd: () => {
                hasListeners = true;
                // it is important to deliver these messages after this call, but before
                // other messages have a chance to be received (to guarantee in order delivery)
                // that's why we're using here nextTick and not other types of timeouts
                process.nextTick(deliverMessages);
            },
            onLastListenerRemove: () => {
                hasListeners = false;
            }
        });
        return emitter.event;
    }
    /**
     * Will ensure no messages are lost if there are no event listeners.
     */
    class BufferedProtocol {
        constructor(actual) {
            this._actual = actual;
            this.onMessage = createBufferedEvent(this._actual.onMessage);
            this.onClose = createBufferedEvent(this._actual.onClose);
        }
        send(buffer) {
            this._actual.send(buffer);
        }
        end() {
            this._actual.end();
        }
    }
    exports.BufferedProtocol = BufferedProtocol;
});
//# sourceMappingURL=ipc.net.js.map