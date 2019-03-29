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
define(["require", "exports", "assert", "events", "vs/base/parts/ipc/node/ipc.net"], function (require, exports, assert, events_1, ipc_net_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MockDuplex extends events_1.EventEmitter {
        constructor() {
            super(...arguments);
            this._cache = [];
            this.destroyed = false;
        }
        _deliver() {
            if (this._cache.length) {
                const data = Buffer.concat(this._cache);
                this._cache.length = 0;
                this.emit('data', data);
            }
        }
        write(data, cb) {
            this._cache.push(data);
            setImmediate(() => this._deliver());
            return true;
        }
    }
    suite('IPC, Socket Protocol', () => {
        let stream;
        setup(() => {
            stream = new MockDuplex();
        });
        test('read/write', () => __awaiter(this, void 0, void 0, function* () {
            const a = new ipc_net_1.Protocol(stream);
            const b = new ipc_net_1.Protocol(stream);
            yield new Promise(resolve => {
                const sub = b.onMessage(data => {
                    sub.dispose();
                    assert.equal(data.toString(), 'foobarfarboo');
                    resolve(undefined);
                });
                a.send(Buffer.from('foobarfarboo'));
            });
            return new Promise(resolve => {
                const sub_1 = b.onMessage(data => {
                    sub_1.dispose();
                    assert.equal(data.readInt8(0), 123);
                    resolve(undefined);
                });
                const buffer = Buffer.allocUnsafe(1);
                buffer.writeInt8(123, 0);
                a.send(buffer);
            });
        }));
        test('read/write, object data', () => {
            const a = new ipc_net_1.Protocol(stream);
            const b = new ipc_net_1.Protocol(stream);
            const data = {
                pi: Math.PI,
                foo: 'bar',
                more: true,
                data: 'Hello World'.split('')
            };
            a.send(Buffer.from(JSON.stringify(data)));
            return new Promise(resolve => {
                b.onMessage(msg => {
                    assert.deepEqual(JSON.parse(msg.toString()), data);
                    resolve(undefined);
                });
            });
        });
    });
});
//# sourceMappingURL=ipc.net.test.js.map