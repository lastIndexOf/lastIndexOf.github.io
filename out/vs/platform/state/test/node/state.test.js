/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/node/extfs", "vs/base/test/node/testUtils", "vs/platform/state/node/stateService"], function (require, exports, assert, os, path, extfs, testUtils_1, stateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StateService', () => {
        const parentDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'stateservice');
        const storageFile = path.join(parentDir, 'storage.json');
        teardown(done => {
            extfs.del(parentDir, os.tmpdir(), done);
        });
        test('Basics', () => {
            return extfs.mkdirp(parentDir).then(() => {
                extfs.writeFileAndFlushSync(storageFile, '');
                let service = new stateService_1.FileStorage(storageFile, () => null);
                service.setItem('some.key', 'some.value');
                assert.equal(service.getItem('some.key'), 'some.value');
                service.removeItem('some.key');
                assert.equal(service.getItem('some.key', 'some.default'), 'some.default');
                assert.ok(!service.getItem('some.unknonw.key'));
                service.setItem('some.other.key', 'some.other.value');
                service = new stateService_1.FileStorage(storageFile, () => null);
                assert.equal(service.getItem('some.other.key'), 'some.other.value');
                service.setItem('some.other.key', 'some.other.value');
                assert.equal(service.getItem('some.other.key'), 'some.other.value');
                service.setItem('some.undefined.key', undefined);
                assert.equal(service.getItem('some.undefined.key', 'some.default'), 'some.default');
                service.setItem('some.null.key', null);
                assert.equal(service.getItem('some.null.key', 'some.default'), 'some.default');
            });
        });
    });
});
//# sourceMappingURL=state.test.js.map