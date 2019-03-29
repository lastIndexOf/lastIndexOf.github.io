/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "crypto", "os", "fs", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/uri", "vs/workbench/services/backup/node/backupFileService", "vs/workbench/services/files/node/fileService", "vs/editor/common/model/textModel", "vs/workbench/test/workbenchTestServices", "vs/base/test/node/testUtils", "vs/platform/notification/test/common/testNotificationService", "vs/platform/workspace/common/workspace", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/files/common/files", "vs/base/common/network"], function (require, exports, assert, platform, crypto, os, fs, path, pfs, uri_1, backupFileService_1, fileService_1, textModel_1, workbenchTestServices_1, testUtils_1, testNotificationService_1, workspace_1, testConfigurationService_1, files_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const parentDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'backupfileservice');
    const backupHome = path.join(parentDir, 'Backups');
    const workspacesJsonPath = path.join(backupHome, 'workspaces.json');
    const workspaceResource = uri_1.URI.file(platform.isWindows ? 'c:\\workspace' : '/workspace');
    const workspaceBackupPath = path.join(backupHome, backupFileService_1.hashPath(workspaceResource));
    const fooFile = uri_1.URI.file(platform.isWindows ? 'c:\\Foo' : '/Foo');
    const barFile = uri_1.URI.file(platform.isWindows ? 'c:\\Bar' : '/Bar');
    const untitledFile = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
    const fooBackupPath = path.join(workspaceBackupPath, 'file', backupFileService_1.hashPath(fooFile));
    const barBackupPath = path.join(workspaceBackupPath, 'file', backupFileService_1.hashPath(barFile));
    const untitledBackupPath = path.join(workspaceBackupPath, 'untitled', backupFileService_1.hashPath(untitledFile));
    class TestBackupWindowService extends workbenchTestServices_1.TestWindowService {
        constructor(workspaceBackupPath) {
            super();
            this.config = Object.create(null);
            this.config.backupPath = workspaceBackupPath;
        }
        getConfiguration() {
            return this.config;
        }
    }
    class TestBackupFileService extends backupFileService_1.BackupFileService {
        constructor(workspace, backupHome, workspacesJsonPath) {
            const fileService = new fileService_1.FileService(new workbenchTestServices_1.TestContextService(new workspace_1.Workspace(workspace.fsPath, workspace_1.toWorkspaceFolders([{ path: workspace.fsPath }]))), workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestTextResourceConfigurationService(), new testConfigurationService_1.TestConfigurationService(), new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), { disableWatcher: true });
            const windowService = new TestBackupWindowService(workspaceBackupPath);
            super(windowService, fileService);
        }
        toBackupResource(resource) {
            return super.toBackupResource(resource);
        }
    }
    suite('BackupFileService', () => {
        let service;
        setup(() => {
            service = new TestBackupFileService(workspaceResource, backupHome, workspacesJsonPath);
            // Delete any existing backups completely and then re-create it.
            return pfs.del(backupHome, os.tmpdir()).then(() => {
                return pfs.mkdirp(backupHome).then(() => {
                    return pfs.writeFile(workspacesJsonPath, '');
                });
            });
        });
        teardown(() => {
            return pfs.del(backupHome, os.tmpdir());
        });
        suite('hashPath', () => {
            test('should correctly hash the path for untitled scheme URIs', () => {
                const uri = uri_1.URI.from({
                    scheme: 'untitled',
                    path: 'Untitled-1'
                });
                const actual = backupFileService_1.hashPath(uri);
                // If these hashes change people will lose their backed up files!
                assert.equal(actual, '13264068d108c6901b3592ea654fcd57');
                assert.equal(actual, crypto.createHash('md5').update(uri.fsPath).digest('hex'));
            });
            test('should correctly hash the path for file scheme URIs', () => {
                const uri = uri_1.URI.file('/foo');
                const actual = backupFileService_1.hashPath(uri);
                // If these hashes change people will lose their backed up files!
                if (platform.isWindows) {
                    assert.equal(actual, 'dec1a583f52468a020bd120c3f01d812');
                }
                else {
                    assert.equal(actual, '1effb2475fcfba4f9e8b8a1dbc8f3caf');
                }
                assert.equal(actual, crypto.createHash('md5').update(uri.fsPath).digest('hex'));
            });
        });
        suite('getBackupResource', () => {
            test('should get the correct backup path for text files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = fooFile;
                const workspaceHash = backupFileService_1.hashPath(workspaceResource);
                const filePathHash = backupFileService_1.hashPath(backupResource);
                const expectedPath = uri_1.URI.file(path.join(backupHome, workspaceHash, 'file', filePathHash)).fsPath;
                assert.equal(service.toBackupResource(backupResource).fsPath, expectedPath);
            });
            test('should get the correct backup path for untitled files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePath>
                const backupResource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
                const workspaceHash = backupFileService_1.hashPath(workspaceResource);
                const filePathHash = backupFileService_1.hashPath(backupResource);
                const expectedPath = uri_1.URI.file(path.join(backupHome, workspaceHash, 'untitled', filePathHash)).fsPath;
                assert.equal(service.toBackupResource(backupResource).fsPath, expectedPath);
            });
        });
        suite('loadBackupResource', () => {
            test('should return whether a backup resource exists', () => {
                return pfs.mkdirp(path.dirname(fooBackupPath)).then(() => {
                    fs.writeFileSync(fooBackupPath, 'foo');
                    service = new TestBackupFileService(workspaceResource, backupHome, workspacesJsonPath);
                    return service.loadBackupResource(fooFile).then(resource => {
                        assert.ok(resource);
                        assert.equal(path.basename(resource.fsPath), path.basename(fooBackupPath));
                        return service.hasBackups().then(hasBackups => {
                            assert.ok(hasBackups);
                        });
                    });
                });
            });
        });
        suite('backupResource', () => {
            test('text file', function () {
                return service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                    assert.equal(fs.existsSync(fooBackupPath), true);
                    assert.equal(fs.readFileSync(fooBackupPath), `${fooFile.toString()}\ntest`);
                });
            });
            test('untitled file', function () {
                return service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                    assert.equal(fs.existsSync(untitledBackupPath), true);
                    assert.equal(fs.readFileSync(untitledBackupPath), `${untitledFile.toString()}\ntest`);
                });
            });
            test('text file (ITextSnapshot)', function () {
                const model = textModel_1.TextModel.createFromString('test');
                return service.backupResource(fooFile, model.createSnapshot()).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                    assert.equal(fs.existsSync(fooBackupPath), true);
                    assert.equal(fs.readFileSync(fooBackupPath), `${fooFile.toString()}\ntest`);
                    model.dispose();
                });
            });
            test('untitled file (ITextSnapshot)', function () {
                const model = textModel_1.TextModel.createFromString('test');
                return service.backupResource(untitledFile, model.createSnapshot()).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                    assert.equal(fs.existsSync(untitledBackupPath), true);
                    assert.equal(fs.readFileSync(untitledBackupPath), `${untitledFile.toString()}\ntest`);
                    model.dispose();
                });
            });
            test('text file (large file, ITextSnapshot)', function () {
                const largeString = (new Array(10 * 1024)).join('Large String\n');
                const model = textModel_1.TextModel.createFromString(largeString);
                return service.backupResource(fooFile, model.createSnapshot()).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                    assert.equal(fs.existsSync(fooBackupPath), true);
                    assert.equal(fs.readFileSync(fooBackupPath), `${fooFile.toString()}\n${largeString}`);
                    model.dispose();
                });
            });
            test('untitled file (large file, ITextSnapshot)', function () {
                const largeString = (new Array(10 * 1024)).join('Large String\n');
                const model = textModel_1.TextModel.createFromString(largeString);
                return service.backupResource(untitledFile, model.createSnapshot()).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                    assert.equal(fs.existsSync(untitledBackupPath), true);
                    assert.equal(fs.readFileSync(untitledBackupPath), `${untitledFile.toString()}\n${largeString}`);
                    model.dispose();
                });
            });
        });
        suite('discardResourceBackup', () => {
            test('text file', function () {
                return service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                    return service.discardResourceBackup(fooFile).then(() => {
                        assert.equal(fs.existsSync(fooBackupPath), false);
                        assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 0);
                    });
                });
            });
            test('untitled file', function () {
                return service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                    return service.discardResourceBackup(untitledFile).then(() => {
                        assert.equal(fs.existsSync(untitledBackupPath), false);
                        assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 0);
                    });
                });
            });
        });
        suite('discardAllWorkspaceBackups', () => {
            test('text file', function () {
                return service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 1);
                    return service.backupResource(barFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                        assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'file')).length, 2);
                        return service.discardAllWorkspaceBackups().then(() => {
                            assert.equal(fs.existsSync(fooBackupPath), false);
                            assert.equal(fs.existsSync(barBackupPath), false);
                            assert.equal(fs.existsSync(path.join(workspaceBackupPath, 'file')), false);
                        });
                    });
                });
            });
            test('untitled file', function () {
                return service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    assert.equal(fs.readdirSync(path.join(workspaceBackupPath, 'untitled')).length, 1);
                    return service.discardAllWorkspaceBackups().then(() => {
                        assert.equal(fs.existsSync(untitledBackupPath), false);
                        assert.equal(fs.existsSync(path.join(workspaceBackupPath, 'untitled')), false);
                    });
                });
            });
            test('should disable further backups', function () {
                return service.discardAllWorkspaceBackups().then(() => {
                    return service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                        assert.equal(fs.existsSync(workspaceBackupPath), false);
                    });
                });
            });
        });
        suite('getWorkspaceFileBackups', () => {
            test('("file") - text file', () => {
                return service.backupResource(fooFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    return service.getWorkspaceFileBackups().then(textFiles => {
                        assert.deepEqual(textFiles.map(f => f.fsPath), [fooFile.fsPath]);
                        return service.backupResource(barFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                            return service.getWorkspaceFileBackups().then(textFiles => {
                                assert.deepEqual(textFiles.map(f => f.fsPath), [fooFile.fsPath, barFile.fsPath]);
                            });
                        });
                    });
                });
            });
            test('("file") - untitled file', () => {
                return service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    return service.getWorkspaceFileBackups().then(textFiles => {
                        assert.deepEqual(textFiles.map(f => f.fsPath), [untitledFile.fsPath]);
                    });
                });
            });
            test('("untitled") - untitled file', () => {
                return service.backupResource(untitledFile, textModel_1.createTextBufferFactory('test').create(1 /* LF */).createSnapshot(false)).then(() => {
                    return service.getWorkspaceFileBackups().then(textFiles => {
                        assert.deepEqual(textFiles.map(f => f.fsPath), ['Untitled-1']);
                    });
                });
            });
        });
        test('resolveBackupContent', () => {
            test('should restore the original contents (untitled file)', () => {
                const contents = 'test\nand more stuff';
                service.backupResource(untitledFile, textModel_1.createTextBufferFactory(contents).create(1 /* LF */).createSnapshot(false)).then(() => {
                    service.resolveBackupContent(service.toBackupResource(untitledFile)).then(factory => {
                        assert.equal(contents, files_1.snapshotToString(factory.create(platform.isWindows ? 2 /* CRLF */ : 1 /* LF */).createSnapshot(true)));
                    });
                });
            });
            test('should restore the original contents (text file)', () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit',
                ].join('');
                service.backupResource(fooFile, textModel_1.createTextBufferFactory(contents).create(1 /* LF */).createSnapshot(false)).then(() => {
                    service.resolveBackupContent(service.toBackupResource(untitledFile)).then(factory => {
                        assert.equal(contents, files_1.snapshotToString(factory.create(platform.isWindows ? 2 /* CRLF */ : 1 /* LF */).createSnapshot(true)));
                    });
                });
            });
        });
    });
    suite('BackupFilesModel', () => {
        test('simple', () => {
            const model = new backupFileService_1.BackupFilesModel();
            const resource1 = uri_1.URI.file('test.html');
            assert.equal(model.has(resource1), false);
            model.add(resource1);
            assert.equal(model.has(resource1), true);
            assert.equal(model.has(resource1, 0), true);
            assert.equal(model.has(resource1, 1), false);
            model.remove(resource1);
            assert.equal(model.has(resource1), false);
            model.add(resource1);
            assert.equal(model.has(resource1), true);
            assert.equal(model.has(resource1, 0), true);
            assert.equal(model.has(resource1, 1), false);
            model.clear();
            assert.equal(model.has(resource1), false);
            model.add(resource1, 1);
            assert.equal(model.has(resource1), true);
            assert.equal(model.has(resource1, 0), false);
            assert.equal(model.has(resource1, 1), true);
            const resource2 = uri_1.URI.file('test1.html');
            const resource3 = uri_1.URI.file('test2.html');
            const resource4 = uri_1.URI.file('test3.html');
            model.add(resource2);
            model.add(resource3);
            model.add(resource4);
            assert.equal(model.has(resource1), true);
            assert.equal(model.has(resource2), true);
            assert.equal(model.has(resource3), true);
            assert.equal(model.has(resource4), true);
        });
        test('resolve', () => {
            return pfs.mkdirp(path.dirname(fooBackupPath)).then(() => {
                fs.writeFileSync(fooBackupPath, 'foo');
                const model = new backupFileService_1.BackupFilesModel();
                return model.resolve(workspaceBackupPath).then(model => {
                    assert.equal(model.has(uri_1.URI.file(fooBackupPath)), true);
                });
            });
        });
        test('get', () => {
            const model = new backupFileService_1.BackupFilesModel();
            assert.deepEqual(model.get(), []);
            const file1 = uri_1.URI.file('/root/file/foo.html');
            const file2 = uri_1.URI.file('/root/file/bar.html');
            const untitled = uri_1.URI.file('/root/untitled/bar.html');
            model.add(file1);
            model.add(file2);
            model.add(untitled);
            assert.deepEqual(model.get().map(f => f.fsPath), [file1.fsPath, file2.fsPath, untitled.fsPath]);
        });
    });
});
//# sourceMappingURL=backupFileService.test.js.map