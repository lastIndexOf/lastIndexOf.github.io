/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/node/extfs", "vs/platform/environment/node/environmentService", "vs/platform/environment/node/argv", "vs/base/test/node/testUtils", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/extensionManagement/node/extensionGalleryService", "vs/base/common/uuid"], function (require, exports, assert, os, extfs, environmentService_1, argv_1, testUtils_1, path_1, pfs_1, extensionGalleryService_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Extension Gallery Service', () => {
        const parentDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'extensiongalleryservice');
        const marketplaceHome = path_1.join(parentDir, 'Marketplace');
        setup(done => {
            // Delete any existing backups completely and then re-create it.
            extfs.del(marketplaceHome, os.tmpdir(), () => {
                pfs_1.mkdirp(marketplaceHome).then(() => {
                    done();
                }, error => done(error));
            });
        });
        teardown(done => {
            extfs.del(marketplaceHome, os.tmpdir(), done);
        });
        test('marketplace machine id', () => {
            const args = ['--user-data-dir', marketplaceHome];
            const environmentService = new environmentService_1.EnvironmentService(argv_1.parseArgs(args), process.execPath);
            return extensionGalleryService_1.resolveMarketplaceHeaders(environmentService).then(headers => {
                assert.ok(uuid_1.isUUID(headers['X-Market-User-Id']));
                return extensionGalleryService_1.resolveMarketplaceHeaders(environmentService).then(headers2 => {
                    assert.equal(headers['X-Market-User-Id'], headers2['X-Market-User-Id']);
                });
            });
        });
    });
});
//# sourceMappingURL=extensionGalleryService.test.js.map