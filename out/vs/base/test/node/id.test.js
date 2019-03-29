define(["require", "exports", "assert", "getmac", "vs/base/node/id"], function (require, exports, assert, getmac, id_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ID', () => {
        test('getMachineId', () => {
            return id_1.getMachineId().then(id => {
                assert.ok(id);
            });
        });
        test('getMac', () => {
            return new Promise((resolve, reject) => {
                getmac.getMac((err, macAddress) => err ? reject(err) : resolve(macAddress));
            }).then(macAddress => {
                assert.ok(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress), `Expected a MAC address, got: ${macAddress}`);
            });
        });
    });
});
//# sourceMappingURL=id.test.js.map