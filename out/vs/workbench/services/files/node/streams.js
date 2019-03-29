/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "stream", "vs/base/node/encoding", "vs/base/common/errors"], function (require, exports, stream_1, encoding_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createWritableOfProvider(provider, resource, opts) {
        if (provider.capabilities & 4 /* FileOpenReadWriteClose */) {
            return createWritable(provider, resource, opts);
        }
        else if (provider.capabilities & 2 /* FileReadWrite */) {
            return createSimpleWritable(provider, resource, opts);
        }
        else {
            throw errors_1.illegalArgument();
        }
    }
    exports.createWritableOfProvider = createWritableOfProvider;
    function createSimpleWritable(provider, resource, opts) {
        return new class extends stream_1.Writable {
            constructor(opts) {
                super(opts);
                this._chunks = [];
            }
            _write(chunk, encoding, callback) {
                this._chunks.push(chunk);
                callback(null);
            }
            end() {
                // todo@joh - end might have another chunk...
                provider.writeFile(resource, Buffer.concat(this._chunks), opts).then(_ => {
                    super.end();
                }, err => {
                    this.emit('error', err);
                });
            }
        };
    }
    function createWritable(provider, resource, opts) {
        return new class extends stream_1.Writable {
            constructor(opts) {
                super(opts);
                this._pos = 0;
            }
            _write(chunk, encoding, callback) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        if (typeof this._fd !== 'number') {
                            this._fd = yield provider.open(resource, { create: true });
                        }
                        let bytesWritten = yield provider.write(this._fd, this._pos, chunk, 0, chunk.length);
                        this._pos += bytesWritten;
                        callback();
                    }
                    catch (err) {
                        callback(err);
                    }
                });
            }
            _final(callback) {
                if (typeof this._fd !== 'number') {
                    provider.open(resource, { create: true }).then(fd => provider.close(fd)).finally(callback);
                }
                else {
                    provider.close(this._fd).finally(callback);
                }
            }
        };
    }
    function createReadableOfProvider(provider, resource, position) {
        if (provider.capabilities & 4 /* FileOpenReadWriteClose */) {
            return createReadable(provider, resource, position);
        }
        else if (provider.capabilities & 2 /* FileReadWrite */) {
            return createSimpleReadable(provider, resource, position);
        }
        else {
            throw errors_1.illegalArgument();
        }
    }
    exports.createReadableOfProvider = createReadableOfProvider;
    function createReadable(provider, resource, position) {
        return new class extends stream_1.Readable {
            constructor() {
                super(...arguments);
                this._pos = position;
                this._reading = false;
            }
            _read(size = Math.pow(2, 10)) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (this._reading) {
                        return;
                    }
                    this._reading = true;
                    try {
                        if (typeof this._fd !== 'number') {
                            this._fd = yield provider.open(resource, { create: false });
                        }
                        while (this._reading) {
                            let buffer = Buffer.allocUnsafe(size);
                            let bytesRead = yield provider.read(this._fd, this._pos, buffer, 0, buffer.length);
                            if (bytesRead === 0) {
                                yield provider.close(this._fd);
                                this._reading = false;
                                this.push(null);
                            }
                            else {
                                this._reading = this.push(buffer.slice(0, bytesRead));
                                this._pos += bytesRead;
                            }
                        }
                    }
                    catch (err) {
                        //
                        this.emit('error', err);
                    }
                });
            }
            _destroy(_err, callback) {
                if (typeof this._fd === 'number') {
                    provider.close(this._fd).then(callback, callback);
                }
            }
        };
    }
    function createSimpleReadable(provider, resource, position) {
        return new class extends stream_1.Readable {
            _read(size) {
                if (this._readOperation) {
                    return;
                }
                this._readOperation = provider.readFile(resource).then(data => {
                    this.push(data.slice(position));
                    this.push(null);
                }, err => {
                    this.emit('error', err);
                    this.push(null);
                });
            }
        };
    }
    function createReadableOfSnapshot(snapshot) {
        return new stream_1.Readable({
            read: function () {
                try {
                    let chunk = null;
                    let canPush = true;
                    // Push all chunks as long as we can push and as long as
                    // the underlying snapshot returns strings to us
                    while (canPush && typeof (chunk = snapshot.read()) === 'string') {
                        canPush = this.push(chunk);
                    }
                    // Signal EOS by pushing NULL
                    if (typeof chunk !== 'string') {
                        this.push(null);
                    }
                }
                catch (error) {
                    this.emit('error', error);
                }
            },
            encoding: encoding_1.UTF8 // very important, so that strings are passed around and not buffers!
        });
    }
    exports.createReadableOfSnapshot = createReadableOfSnapshot;
});
//# sourceMappingURL=streams.js.map