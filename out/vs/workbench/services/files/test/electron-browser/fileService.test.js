/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/path", "os", "assert", "vs/workbench/services/files/node/fileService", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/pfs", "vs/base/node/encoding", "vs/workbench/services/files/test/electron-browser/utils", "vs/workbench/test/workbenchTestServices", "vs/base/test/node/testUtils", "vs/platform/notification/test/common/testNotificationService", "vs/platform/workspace/common/workspace", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/model/textModel", "vs/base/common/amd"], function (require, exports, fs, path, os, assert, fileService_1, uri_1, uuid, pfs, encodingLib, utils, workbenchTestServices_1, testUtils_1, testNotificationService_1, workspace_1, testConfigurationService_1, textModel_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FileService', () => {
        let service;
        const parentDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'fileservice');
        let testDir;
        setup(function () {
            const id = uuid.generateUuid();
            testDir = path.join(parentDir, id);
            const sourceDir = amd_1.getPathFromAmdModule(require, './fixtures/service');
            return pfs.copy(sourceDir, testDir).then(() => {
                service = new fileService_1.FileService(new workbenchTestServices_1.TestContextService(new workspace_1.Workspace(testDir, workspace_1.toWorkspaceFolders([{ path: testDir }]))), workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestTextResourceConfigurationService(), new testConfigurationService_1.TestConfigurationService(), new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), { disableWatcher: true });
            });
        });
        teardown(() => {
            service.dispose();
            return pfs.del(parentDir, os.tmpdir());
        });
        test('createFile', () => {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const contents = 'Hello World';
            const resource = uri_1.URI.file(path.join(testDir, 'test.txt'));
            return service.createFile(resource, contents).then(s => {
                assert.equal(s.name, 'test.txt');
                assert.equal(fs.existsSync(s.resource.fsPath), true);
                assert.equal(fs.readFileSync(s.resource.fsPath), contents);
                assert.ok(event);
                assert.equal(event.resource.fsPath, resource.fsPath);
                assert.equal(event.operation, 0 /* CREATE */);
                assert.equal(event.target.resource.fsPath, resource.fsPath);
                toDispose.dispose();
            });
        });
        test('createFile (does not overwrite by default)', function () {
            const contents = 'Hello World';
            const resource = uri_1.URI.file(path.join(testDir, 'test.txt'));
            fs.writeFileSync(resource.fsPath, ''); // create file
            return service.createFile(resource, contents).then(undefined, error => {
                assert.ok(error);
            });
        });
        test('createFile (allows to overwrite existing)', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const contents = 'Hello World';
            const resource = uri_1.URI.file(path.join(testDir, 'test.txt'));
            fs.writeFileSync(resource.fsPath, ''); // create file
            return service.createFile(resource, contents, { overwrite: true }).then(s => {
                assert.equal(s.name, 'test.txt');
                assert.equal(fs.existsSync(s.resource.fsPath), true);
                assert.equal(fs.readFileSync(s.resource.fsPath), contents);
                assert.ok(event);
                assert.equal(event.resource.fsPath, resource.fsPath);
                assert.equal(event.operation, 0 /* CREATE */);
                assert.equal(event.target.resource.fsPath, resource.fsPath);
                toDispose.dispose();
            });
        });
        test('createFolder', () => {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            return service.resolveFile(uri_1.URI.file(testDir)).then(parent => {
                const resource = uri_1.URI.file(path.join(parent.resource.fsPath, 'newFolder'));
                return service.createFolder(resource).then(f => {
                    assert.equal(f.name, 'newFolder');
                    assert.equal(fs.existsSync(f.resource.fsPath), true);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 0 /* CREATE */);
                    assert.equal(event.target.resource.fsPath, resource.fsPath);
                    assert.equal(event.target.isDirectory, true);
                    toDispose.dispose();
                });
            });
        });
        test('createFolder: creating multiple folders at once', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const multiFolderPaths = ['a', 'couple', 'of', 'folders'];
            return service.resolveFile(uri_1.URI.file(testDir)).then(parent => {
                const resource = uri_1.URI.file(path.join(parent.resource.fsPath, ...multiFolderPaths));
                return service.createFolder(resource).then(f => {
                    const lastFolderName = multiFolderPaths[multiFolderPaths.length - 1];
                    assert.equal(f.name, lastFolderName);
                    assert.equal(fs.existsSync(f.resource.fsPath), true);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 0 /* CREATE */);
                    assert.equal(event.target.resource.fsPath, resource.fsPath);
                    assert.equal(event.target.isDirectory, true);
                    toDispose.dispose();
                });
            });
        });
        test('renameFile', () => {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            return service.resolveFile(resource).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(path.dirname(source.resource.fsPath), 'other.html'))).then(renamed => {
                    assert.equal(fs.existsSync(renamed.resource.fsPath), true);
                    assert.equal(fs.existsSync(source.resource.fsPath), false);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 2 /* MOVE */);
                    assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                    toDispose.dispose();
                });
            });
        });
        test('renameFile - multi folder', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const multiFolderPaths = ['a', 'couple', 'of', 'folders'];
            const renameToPath = path.join(...multiFolderPaths, 'other.html');
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            return service.resolveFile(resource).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(path.dirname(source.resource.fsPath), renameToPath))).then(renamed => {
                    assert.equal(fs.existsSync(renamed.resource.fsPath), true);
                    assert.equal(fs.existsSync(source.resource.fsPath), false);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 2 /* MOVE */);
                    assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                    toDispose.dispose();
                });
            });
        });
        test('renameFolder', () => {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const resource = uri_1.URI.file(path.join(testDir, 'deep'));
            return service.resolveFile(resource).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(path.dirname(source.resource.fsPath), 'deeper'))).then(renamed => {
                    assert.equal(fs.existsSync(renamed.resource.fsPath), true);
                    assert.equal(fs.existsSync(source.resource.fsPath), false);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 2 /* MOVE */);
                    assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                    toDispose.dispose();
                });
            });
        });
        test('renameFolder - multi folder', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const multiFolderPaths = ['a', 'couple', 'of', 'folders'];
            const renameToPath = path.join(...multiFolderPaths);
            const resource = uri_1.URI.file(path.join(testDir, 'deep'));
            return service.resolveFile(resource).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(path.dirname(source.resource.fsPath), renameToPath))).then(renamed => {
                    assert.equal(fs.existsSync(renamed.resource.fsPath), true);
                    assert.equal(fs.existsSync(source.resource.fsPath), false);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 2 /* MOVE */);
                    assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                    toDispose.dispose();
                });
            });
        });
        test('renameFile - MIX CASE', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            return service.resolveFile(resource).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(path.dirname(source.resource.fsPath), 'INDEX.html'))).then(renamed => {
                    assert.equal(fs.existsSync(renamed.resource.fsPath), true);
                    assert.equal(path.basename(renamed.resource.fsPath), 'INDEX.html');
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 2 /* MOVE */);
                    assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                    toDispose.dispose();
                });
            });
        });
        test('moveFile', () => {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            return service.resolveFile(resource).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(testDir, 'other.html'))).then(renamed => {
                    assert.equal(fs.existsSync(renamed.resource.fsPath), true);
                    assert.equal(fs.existsSync(source.resource.fsPath), false);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 2 /* MOVE */);
                    assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                    toDispose.dispose();
                });
            });
        });
        test('move - source parent of target', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            return service.resolveFile(uri_1.URI.file(path.join(testDir, 'index.html'))).then(source => {
                return service.moveFile(uri_1.URI.file(testDir), uri_1.URI.file(path.join(testDir, 'binary.txt'))).then(undefined, (e) => {
                    assert.ok(e);
                    assert.ok(!event);
                    toDispose.dispose();
                });
            });
        });
        test('move - FILE_MOVE_CONFLICT', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            return service.resolveFile(uri_1.URI.file(path.join(testDir, 'index.html'))).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(testDir, 'binary.txt'))).then(undefined, (e) => {
                    assert.equal(e.fileOperationResult, 5 /* FILE_MOVE_CONFLICT */);
                    assert.ok(!event);
                    toDispose.dispose();
                });
            });
        });
        test('moveFile - MIX CASE', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            return service.resolveFile(resource).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(testDir, 'INDEX.html'))).then(renamed => {
                    assert.equal(fs.existsSync(renamed.resource.fsPath), true);
                    assert.equal(path.basename(renamed.resource.fsPath), 'INDEX.html');
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 2 /* MOVE */);
                    assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                    toDispose.dispose();
                });
            });
        });
        test('moveFile - overwrite folder with file', function () {
            let createEvent;
            let moveEvent;
            let deleteEvent;
            const toDispose = service.onAfterOperation(e => {
                if (e.operation === 0 /* CREATE */) {
                    createEvent = e;
                }
                else if (e.operation === 1 /* DELETE */) {
                    deleteEvent = e;
                }
                else if (e.operation === 2 /* MOVE */) {
                    moveEvent = e;
                }
            });
            return service.resolveFile(uri_1.URI.file(testDir)).then(parent => {
                const folderResource = uri_1.URI.file(path.join(parent.resource.fsPath, 'conway.js'));
                return service.createFolder(folderResource).then(f => {
                    const resource = uri_1.URI.file(path.join(testDir, 'deep', 'conway.js'));
                    return service.moveFile(resource, f.resource, true).then(moved => {
                        assert.equal(fs.existsSync(moved.resource.fsPath), true);
                        assert.ok(fs.statSync(moved.resource.fsPath).isFile);
                        assert.ok(createEvent);
                        assert.ok(deleteEvent);
                        assert.ok(moveEvent);
                        assert.equal(moveEvent.resource.fsPath, resource.fsPath);
                        assert.equal(moveEvent.target.resource.fsPath, moved.resource.fsPath);
                        assert.equal(deleteEvent.resource.fsPath, folderResource.fsPath);
                        toDispose.dispose();
                    });
                });
            });
        });
        test('copyFile', () => {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            return service.resolveFile(uri_1.URI.file(path.join(testDir, 'index.html'))).then(source => {
                const resource = uri_1.URI.file(path.join(testDir, 'other.html'));
                return service.copyFile(source.resource, resource).then(copied => {
                    assert.equal(fs.existsSync(copied.resource.fsPath), true);
                    assert.equal(fs.existsSync(source.resource.fsPath), true);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, source.resource.fsPath);
                    assert.equal(event.operation, 3 /* COPY */);
                    assert.equal(event.target.resource.fsPath, copied.resource.fsPath);
                    toDispose.dispose();
                });
            });
        });
        test('copyFile - overwrite folder with file', function () {
            let createEvent;
            let copyEvent;
            let deleteEvent;
            const toDispose = service.onAfterOperation(e => {
                if (e.operation === 0 /* CREATE */) {
                    createEvent = e;
                }
                else if (e.operation === 1 /* DELETE */) {
                    deleteEvent = e;
                }
                else if (e.operation === 3 /* COPY */) {
                    copyEvent = e;
                }
            });
            return service.resolveFile(uri_1.URI.file(testDir)).then(parent => {
                const folderResource = uri_1.URI.file(path.join(parent.resource.fsPath, 'conway.js'));
                return service.createFolder(folderResource).then(f => {
                    const resource = uri_1.URI.file(path.join(testDir, 'deep', 'conway.js'));
                    return service.copyFile(resource, f.resource, true).then(copied => {
                        assert.equal(fs.existsSync(copied.resource.fsPath), true);
                        assert.ok(fs.statSync(copied.resource.fsPath).isFile);
                        assert.ok(createEvent);
                        assert.ok(deleteEvent);
                        assert.ok(copyEvent);
                        assert.equal(copyEvent.resource.fsPath, resource.fsPath);
                        assert.equal(copyEvent.target.resource.fsPath, copied.resource.fsPath);
                        assert.equal(deleteEvent.resource.fsPath, folderResource.fsPath);
                        toDispose.dispose();
                    });
                });
            });
        });
        test('copyFile - MIX CASE', function () {
            return service.resolveFile(uri_1.URI.file(path.join(testDir, 'index.html'))).then(source => {
                return service.moveFile(source.resource, uri_1.URI.file(path.join(path.dirname(source.resource.fsPath), 'CONWAY.js'))).then(renamed => {
                    assert.equal(fs.existsSync(renamed.resource.fsPath), true);
                    assert.ok(fs.readdirSync(testDir).some(f => f === 'CONWAY.js'));
                    return service.resolveFile(uri_1.URI.file(path.join(testDir, 'deep', 'conway.js'))).then(source => {
                        const targetParent = uri_1.URI.file(testDir);
                        const target = targetParent.with({ path: path.posix.join(targetParent.path, path.posix.basename(source.resource.path)) });
                        return service.copyFile(source.resource, target, true).then(res => {
                            assert.equal(fs.existsSync(res.resource.fsPath), true);
                            assert.ok(fs.readdirSync(testDir).some(f => f === 'conway.js'));
                        });
                    });
                });
            });
        });
        test('copyFile - same file', function () {
            return service.resolveFile(uri_1.URI.file(path.join(testDir, 'index.html'))).then(source => {
                const targetParent = uri_1.URI.file(path.dirname(source.resource.fsPath));
                const target = targetParent.with({ path: path.posix.join(targetParent.path, path.posix.basename(source.resource.path)) });
                return service.copyFile(source.resource, target, true).then(copied => {
                    assert.equal(copied.size, source.size);
                });
            });
        });
        test('deleteFile', () => {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const resource = uri_1.URI.file(path.join(testDir, 'deep', 'conway.js'));
            return service.resolveFile(resource).then(source => {
                return service.del(source.resource).then(() => {
                    assert.equal(fs.existsSync(source.resource.fsPath), false);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 1 /* DELETE */);
                    toDispose.dispose();
                });
            });
        });
        test('deleteFolder (recursive)', function () {
            let event;
            const toDispose = service.onAfterOperation(e => {
                event = e;
            });
            const resource = uri_1.URI.file(path.join(testDir, 'deep'));
            return service.resolveFile(resource).then(source => {
                return service.del(source.resource, { recursive: true }).then(() => {
                    assert.equal(fs.existsSync(source.resource.fsPath), false);
                    assert.ok(event);
                    assert.equal(event.resource.fsPath, resource.fsPath);
                    assert.equal(event.operation, 1 /* DELETE */);
                    toDispose.dispose();
                });
            });
        });
        test('deleteFolder (non recursive)', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'deep'));
            return service.resolveFile(resource).then(source => {
                return service.del(source.resource).then(() => {
                    return Promise.reject(new Error('Unexpected'));
                }, error => {
                    return Promise.resolve(true);
                });
            });
        });
        test('resolveFile', () => {
            return service.resolveFile(uri_1.URI.file(testDir), { resolveTo: [uri_1.URI.file(path.join(testDir, 'deep'))] }).then(r => {
                assert.equal(r.children.length, 8);
                const deep = utils.getByName(r, 'deep');
                assert.equal(deep.children.length, 4);
            });
        });
        test('resolveFiles', () => {
            return service.resolveFiles([
                { resource: uri_1.URI.file(testDir), options: { resolveTo: [uri_1.URI.file(path.join(testDir, 'deep'))] } },
                { resource: uri_1.URI.file(path.join(testDir, 'deep')) }
            ]).then(res => {
                const r1 = res[0].stat;
                assert.equal(r1.children.length, 8);
                const deep = utils.getByName(r1, 'deep');
                assert.equal(deep.children.length, 4);
                const r2 = res[1].stat;
                assert.equal(r2.children.length, 4);
                assert.equal(r2.name, 'deep');
            });
        });
        test('existsFile', () => {
            return service.existsFile(uri_1.URI.file(testDir)).then((exists) => {
                assert.equal(exists, true);
                return service.existsFile(uri_1.URI.file(testDir + 'something')).then((exists) => {
                    assert.equal(exists, false);
                });
            });
        });
        test('updateContent', () => {
            const resource = uri_1.URI.file(path.join(testDir, 'small.txt'));
            return service.resolveContent(resource).then(c => {
                assert.equal(c.value, 'Small File');
                c.value = 'Updates to the small file';
                return service.updateContent(c.resource, c.value).then(c => {
                    assert.equal(fs.readFileSync(resource.fsPath), 'Updates to the small file');
                });
            });
        });
        test('updateContent (ITextSnapShot)', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'small.txt'));
            return service.resolveContent(resource).then(c => {
                assert.equal(c.value, 'Small File');
                const model = textModel_1.TextModel.createFromString('Updates to the small file');
                return service.updateContent(c.resource, model.createSnapshot()).then(c => {
                    assert.equal(fs.readFileSync(resource.fsPath), 'Updates to the small file');
                    model.dispose();
                });
            });
        });
        test('updateContent (large file)', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'lorem.txt'));
            return service.resolveContent(resource).then(c => {
                const newValue = c.value + c.value;
                c.value = newValue;
                return service.updateContent(c.resource, c.value).then(c => {
                    assert.equal(fs.readFileSync(resource.fsPath), newValue);
                });
            });
        });
        test('updateContent (large file, ITextSnapShot)', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'lorem.txt'));
            return service.resolveContent(resource).then(c => {
                const newValue = c.value + c.value;
                const model = textModel_1.TextModel.createFromString(newValue);
                return service.updateContent(c.resource, model.createSnapshot()).then(c => {
                    assert.equal(fs.readFileSync(resource.fsPath), newValue);
                });
            });
        });
        test('updateContent - use encoding (UTF 16 BE)', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'small.txt'));
            const encoding = 'utf16be';
            return service.resolveContent(resource).then(c => {
                c.encoding = encoding;
                return service.updateContent(c.resource, c.value, { encoding: encoding }).then(c => {
                    return encodingLib.detectEncodingByBOM(c.resource.fsPath).then((enc) => {
                        assert.equal(enc, encodingLib.UTF16be);
                        return service.resolveContent(resource).then(c => {
                            assert.equal(c.encoding, encoding);
                        });
                    });
                });
            });
        });
        test('updateContent - use encoding (UTF 16 BE, ITextSnapShot)', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'small.txt'));
            const encoding = 'utf16be';
            return service.resolveContent(resource).then(c => {
                c.encoding = encoding;
                const model = textModel_1.TextModel.createFromString(c.value);
                return service.updateContent(c.resource, model.createSnapshot(), { encoding: encoding }).then(c => {
                    return encodingLib.detectEncodingByBOM(c.resource.fsPath).then((enc) => {
                        assert.equal(enc, encodingLib.UTF16be);
                        return service.resolveContent(resource).then(c => {
                            assert.equal(c.encoding, encoding);
                            model.dispose();
                        });
                    });
                });
            });
        });
        test('updateContent - encoding preserved (UTF 16 LE)', function () {
            const encoding = 'utf16le';
            const resource = uri_1.URI.file(path.join(testDir, 'some_utf16le.css'));
            return service.resolveContent(resource).then(c => {
                assert.equal(c.encoding, encoding);
                c.value = 'Some updates';
                return service.updateContent(c.resource, c.value, { encoding: encoding }).then(c => {
                    return encodingLib.detectEncodingByBOM(c.resource.fsPath).then((enc) => {
                        assert.equal(enc, encodingLib.UTF16le);
                        return service.resolveContent(resource).then(c => {
                            assert.equal(c.encoding, encoding);
                        });
                    });
                });
            });
        });
        test('updateContent - encoding preserved (UTF 16 LE, ITextSnapShot)', function () {
            const encoding = 'utf16le';
            const resource = uri_1.URI.file(path.join(testDir, 'some_utf16le.css'));
            return service.resolveContent(resource).then(c => {
                assert.equal(c.encoding, encoding);
                const model = textModel_1.TextModel.createFromString('Some updates');
                return service.updateContent(c.resource, model.createSnapshot(), { encoding: encoding }).then(c => {
                    return encodingLib.detectEncodingByBOM(c.resource.fsPath).then((enc) => {
                        assert.equal(enc, encodingLib.UTF16le);
                        return service.resolveContent(resource).then(c => {
                            assert.equal(c.encoding, encoding);
                            model.dispose();
                        });
                    });
                });
            });
        });
        test('resolveContent - large file', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'lorem.txt'));
            return service.resolveContent(resource).then(c => {
                assert.ok(c.value.length > 64000);
            });
        });
        test('Files are intermingled #38331', function () {
            let resource1 = uri_1.URI.file(path.join(testDir, 'lorem.txt'));
            let resource2 = uri_1.URI.file(path.join(testDir, 'some_utf16le.css'));
            let value1;
            let value2;
            // load in sequence and keep data
            return service.resolveContent(resource1).then(c => value1 = c.value).then(() => {
                return service.resolveContent(resource2).then(c => value2 = c.value);
            }).then(() => {
                // load in parallel in expect the same result
                return Promise.all([
                    service.resolveContent(resource1).then(c => assert.equal(c.value, value1)),
                    service.resolveContent(resource2).then(c => assert.equal(c.value, value2))
                ]);
            });
        });
        test('resolveContent - FILE_IS_BINARY', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'binary.txt'));
            return service.resolveContent(resource, { acceptTextOnly: true }).then(undefined, (e) => {
                assert.equal(e.fileOperationResult, 0 /* FILE_IS_BINARY */);
                return service.resolveContent(uri_1.URI.file(path.join(testDir, 'small.txt')), { acceptTextOnly: true }).then(r => {
                    assert.equal(r.name, 'small.txt');
                });
            });
        });
        test('resolveContent - FILE_IS_DIRECTORY', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'deep'));
            return service.resolveContent(resource).then(undefined, (e) => {
                assert.equal(e.fileOperationResult, 1 /* FILE_IS_DIRECTORY */);
            });
        });
        test('resolveContent - FILE_NOT_FOUND', function () {
            const resource = uri_1.URI.file(path.join(testDir, '404.html'));
            return service.resolveContent(resource).then(undefined, (e) => {
                assert.equal(e.fileOperationResult, 2 /* FILE_NOT_FOUND */);
            });
        });
        test('resolveContent - FILE_NOT_MODIFIED_SINCE', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            return service.resolveContent(resource).then(c => {
                return service.resolveContent(resource, { etag: c.etag }).then(undefined, (e) => {
                    assert.equal(e.fileOperationResult, 3 /* FILE_NOT_MODIFIED_SINCE */);
                });
            });
        });
        test('resolveContent - FILE_MODIFIED_SINCE', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            return service.resolveContent(resource).then(c => {
                fs.writeFileSync(resource.fsPath, 'Updates Incoming!');
                return service.updateContent(resource, c.value, { etag: c.etag, mtime: c.mtime - 1000 }).then(undefined, (e) => {
                    assert.equal(e.fileOperationResult, 4 /* FILE_MODIFIED_SINCE */);
                });
            });
        });
        test('resolveContent - encoding picked up', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            const encoding = 'windows1252';
            return service.resolveContent(resource, { encoding: encoding }).then(c => {
                assert.equal(c.encoding, encoding);
            });
        });
        test('resolveContent - user overrides BOM', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'some_utf16le.css'));
            return service.resolveContent(resource, { encoding: 'windows1252' }).then(c => {
                assert.equal(c.encoding, 'windows1252');
            });
        });
        test('resolveContent - BOM removed', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'some_utf8_bom.txt'));
            return service.resolveContent(resource).then(c => {
                assert.equal(encodingLib.detectEncodingByBOMFromBuffer(Buffer.from(c.value), 512), null);
            });
        });
        test('resolveContent - invalid encoding', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            return service.resolveContent(resource, { encoding: 'superduper' }).then(c => {
                assert.equal(c.encoding, 'utf8');
            });
        });
        test('watchFileChanges', function (done) {
            const toWatch = uri_1.URI.file(path.join(testDir, 'index.html'));
            service.watchFileChanges(toWatch);
            service.onFileChanges((e) => {
                assert.ok(e);
                service.unwatchFileChanges(toWatch);
                done();
            });
            setTimeout(() => {
                fs.writeFileSync(toWatch.fsPath, 'Changes');
            }, 100);
        });
        // test('watchFileChanges - support atomic save', function (done) {
        // 	const toWatch = uri.file(path.join(testDir, 'index.html'));
        // 	service.watchFileChanges(toWatch);
        // 	service.onFileChanges((e: FileChangesEvent) => {
        // 		assert.ok(e);
        // 		service.unwatchFileChanges(toWatch);
        // 		done();
        // 	});
        // 	setTimeout(() => {
        // 		// Simulate atomic save by deleting the file, creating it under different name
        // 		// and then replacing the previously deleted file with those contents
        // 		const renamed = `${toWatch.fsPath}.bak`;
        // 		fs.unlinkSync(toWatch.fsPath);
        // 		fs.writeFileSync(renamed, 'Changes');
        // 		fs.renameSync(renamed, toWatch.fsPath);
        // 	}, 100);
        // });
        test('options - encoding override (parent)', function () {
            // setup
            const _id = uuid.generateUuid();
            const _testDir = path.join(parentDir, _id);
            const _sourceDir = amd_1.getPathFromAmdModule(require, './fixtures/service');
            return pfs.copy(_sourceDir, _testDir).then(() => {
                const encodingOverride = [];
                encodingOverride.push({
                    parent: uri_1.URI.file(path.join(testDir, 'deep')),
                    encoding: 'utf16le'
                });
                const configurationService = new testConfigurationService_1.TestConfigurationService();
                configurationService.setUserConfiguration('files', { encoding: 'windows1252' });
                const textResourceConfigurationService = new workbenchTestServices_1.TestTextResourceConfigurationService(configurationService);
                const _service = new fileService_1.FileService(new workbenchTestServices_1.TestContextService(new workspace_1.Workspace(_testDir, workspace_1.toWorkspaceFolders([{ path: _testDir }]))), workbenchTestServices_1.TestEnvironmentService, textResourceConfigurationService, configurationService, new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), {
                    encodingOverride,
                    disableWatcher: true
                });
                return _service.resolveContent(uri_1.URI.file(path.join(testDir, 'index.html'))).then(c => {
                    assert.equal(c.encoding, 'windows1252');
                    return _service.resolveContent(uri_1.URI.file(path.join(testDir, 'deep', 'conway.js'))).then(c => {
                        assert.equal(c.encoding, 'utf16le');
                        // teardown
                        _service.dispose();
                    });
                });
            });
        });
        test('options - encoding override (extension)', function () {
            // setup
            const _id = uuid.generateUuid();
            const _testDir = path.join(parentDir, _id);
            const _sourceDir = amd_1.getPathFromAmdModule(require, './fixtures/service');
            return pfs.copy(_sourceDir, _testDir).then(() => {
                const encodingOverride = [];
                encodingOverride.push({
                    extension: 'js',
                    encoding: 'utf16le'
                });
                const configurationService = new testConfigurationService_1.TestConfigurationService();
                configurationService.setUserConfiguration('files', { encoding: 'windows1252' });
                const textResourceConfigurationService = new workbenchTestServices_1.TestTextResourceConfigurationService(configurationService);
                const _service = new fileService_1.FileService(new workbenchTestServices_1.TestContextService(new workspace_1.Workspace(_testDir, workspace_1.toWorkspaceFolders([{ path: _testDir }]))), workbenchTestServices_1.TestEnvironmentService, textResourceConfigurationService, configurationService, new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), {
                    encodingOverride,
                    disableWatcher: true
                });
                return _service.resolveContent(uri_1.URI.file(path.join(testDir, 'index.html'))).then(c => {
                    assert.equal(c.encoding, 'windows1252');
                    return _service.resolveContent(uri_1.URI.file(path.join(testDir, 'deep', 'conway.js'))).then(c => {
                        assert.equal(c.encoding, 'utf16le');
                        // teardown
                        _service.dispose();
                    });
                });
            });
        });
        test('UTF 8 BOMs', function () {
            // setup
            const _id = uuid.generateUuid();
            const _testDir = path.join(parentDir, _id);
            const _sourceDir = amd_1.getPathFromAmdModule(require, './fixtures/service');
            const resource = uri_1.URI.file(path.join(testDir, 'index.html'));
            const _service = new fileService_1.FileService(new workbenchTestServices_1.TestContextService(new workspace_1.Workspace(_testDir, workspace_1.toWorkspaceFolders([{ path: _testDir }]))), workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestTextResourceConfigurationService(), new testConfigurationService_1.TestConfigurationService(), new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), {
                disableWatcher: true
            });
            return pfs.copy(_sourceDir, _testDir).then(() => {
                return pfs.readFile(resource.fsPath).then(data => {
                    assert.equal(encodingLib.detectEncodingByBOMFromBuffer(data, 512), null);
                    const model = textModel_1.TextModel.createFromString('Hello Bom');
                    // Update content: UTF_8 => UTF_8_BOM
                    return _service.updateContent(resource, model.createSnapshot(), { encoding: encodingLib.UTF8_with_bom }).then(() => {
                        return pfs.readFile(resource.fsPath).then(data => {
                            assert.equal(encodingLib.detectEncodingByBOMFromBuffer(data, 512), encodingLib.UTF8);
                            // Update content: PRESERVE BOM when using UTF-8
                            model.setValue('Please stay Bom');
                            return _service.updateContent(resource, model.createSnapshot(), { encoding: encodingLib.UTF8 }).then(() => {
                                return pfs.readFile(resource.fsPath).then(data => {
                                    assert.equal(encodingLib.detectEncodingByBOMFromBuffer(data, 512), encodingLib.UTF8);
                                    // Update content: REMOVE BOM
                                    model.setValue('Go away Bom');
                                    return _service.updateContent(resource, model.createSnapshot(), { encoding: encodingLib.UTF8, overwriteEncoding: true }).then(() => {
                                        return pfs.readFile(resource.fsPath).then(data => {
                                            assert.equal(encodingLib.detectEncodingByBOMFromBuffer(data, 512), null);
                                            // Update content: BOM comes not back
                                            model.setValue('Do not come back Bom');
                                            return _service.updateContent(resource, model.createSnapshot(), { encoding: encodingLib.UTF8 }).then(() => {
                                                return pfs.readFile(resource.fsPath).then(data => {
                                                    assert.equal(encodingLib.detectEncodingByBOMFromBuffer(data, 512), null);
                                                    model.dispose();
                                                    _service.dispose();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        test('resolveContent - from position (ASCII)', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'small.txt'));
            return service.resolveContent(resource, { position: 6 }).then(content => {
                assert.equal(content.value, 'File');
            });
        });
        test('resolveContent - from position (with umlaut)', function () {
            const resource = uri_1.URI.file(path.join(testDir, 'small_umlaut.txt'));
            return service.resolveContent(resource, { position: Buffer.from('Small File with Ü').length }).then(content => {
                assert.equal(content.value, 'mlaut');
            });
        });
    });
});
//# sourceMappingURL=fileService.test.js.map