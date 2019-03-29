/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "fs", "vs/base/common/path", "os", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/environment/node/argv", "vs/base/node/pfs", "vs/base/common/uuid", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/configuration/node/configurationService", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/test/workbenchTestServices", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/services/files/node/fileService", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/services/resolverService", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/workbench/services/configuration/node/jsonEditingService", "crypto", "vs/base/common/event", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/platform"], function (require, exports, assert, sinon, fs, path, os, uri_1, platform_1, environment_1, environmentService_1, argv_1, pfs, uuid, configurationRegistry_1, configurationService_1, files_1, workspace_1, configuration_1, workbenchTestServices_1, testNotificationService_1, fileService_1, textfiles_1, resolverService_1, textModelResolverService_1, jsonEditingService_1, crypto_1, event_1, network_1, resources_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SettingsTestEnvironmentService extends environmentService_1.EnvironmentService {
        constructor(args, _execPath, customAppSettingsHome) {
            super(args, _execPath);
            this.customAppSettingsHome = customAppSettingsHome;
        }
        get appSettingsPath() { return this.customAppSettingsHome; }
    }
    function setUpFolderWorkspace(folderName) {
        const id = uuid.generateUuid();
        const parentDir = path.join(os.tmpdir(), 'vsctests', id);
        return setUpFolder(folderName, parentDir).then(folderDir => ({ parentDir, folderDir }));
    }
    function setUpFolder(folderName, parentDir) {
        const folderDir = path.join(parentDir, folderName);
        const workspaceSettingsDir = path.join(folderDir, '.vscode');
        return Promise.resolve(pfs.mkdirp(workspaceSettingsDir, 493).then(() => folderDir));
    }
    function convertToWorkspacePayload(folder) {
        return {
            id: crypto_1.createHash('md5').update(folder.fsPath).digest('hex'),
            folder
        };
    }
    function setUpWorkspace(folders) {
        const id = uuid.generateUuid();
        const parentDir = path.join(os.tmpdir(), 'vsctests', id);
        return Promise.resolve(pfs.mkdirp(parentDir, 493)
            .then(() => {
            const configPath = path.join(parentDir, 'vsctests.code-workspace');
            const workspace = { folders: folders.map(path => ({ path })) };
            fs.writeFileSync(configPath, JSON.stringify(workspace, null, '\t'));
            return Promise.all(folders.map(folder => setUpFolder(folder, parentDir)))
                .then(() => ({ parentDir, configPath: uri_1.URI.file(configPath) }));
        }));
    }
    suite('WorkspaceContextService - Folder', () => {
        let workspaceName = `testWorkspace${uuid.generateUuid()}`, parentResource, workspaceResource, workspaceContextService;
        setup(() => {
            return setUpFolderWorkspace(workspaceName)
                .then(({ parentDir, folderDir }) => {
                parentResource = parentDir;
                workspaceResource = folderDir;
                const globalSettingsFile = path.join(parentDir, 'settings.json');
                const environmentService = new SettingsTestEnvironmentService(argv_1.parseArgs(process.argv), process.execPath, globalSettingsFile);
                workspaceContextService = new configurationService_1.WorkspaceService(environmentService);
                return workspaceContextService.initialize(convertToWorkspacePayload(uri_1.URI.file(folderDir)));
            });
        });
        teardown(() => {
            if (workspaceContextService) {
                workspaceContextService.dispose();
            }
            if (parentResource) {
                return pfs.del(parentResource, os.tmpdir());
            }
            return undefined;
        });
        test('getWorkspace()', () => {
            const actual = workspaceContextService.getWorkspace();
            assert.equal(actual.folders.length, 1);
            assert.equal(actual.folders[0].uri.fsPath, uri_1.URI.file(workspaceResource).fsPath);
            assert.equal(actual.folders[0].name, workspaceName);
            assert.equal(actual.folders[0].index, 0);
            assert.ok(!actual.configuration);
        });
        test('getWorkbenchState()', () => {
            const actual = workspaceContextService.getWorkbenchState();
            assert.equal(actual, 2 /* FOLDER */);
        });
        test('getWorkspaceFolder()', () => {
            const actual = workspaceContextService.getWorkspaceFolder(uri_1.URI.file(path.join(workspaceResource, 'a')));
            assert.equal(actual, workspaceContextService.getWorkspace().folders[0]);
        });
        test('isCurrentWorkspace() => true', () => {
            assert.ok(workspaceContextService.isCurrentWorkspace(uri_1.URI.file(workspaceResource)));
        });
        test('isCurrentWorkspace() => false', () => {
            assert.ok(!workspaceContextService.isCurrentWorkspace(uri_1.URI.file(workspaceResource + 'abc')));
        });
        test('workspace is complete', () => workspaceContextService.getCompleteWorkspace());
    });
    suite('WorkspaceContextService - Workspace', () => {
        let parentResource, testObject, instantiationService;
        setup(() => {
            return setUpWorkspace(['a', 'b'])
                .then(({ parentDir, configPath }) => {
                parentResource = parentDir;
                const environmentService = new SettingsTestEnvironmentService(argv_1.parseArgs(process.argv), process.execPath, path.join(parentDir, 'settings.json'));
                const workspaceService = new configurationService_1.WorkspaceService(environmentService);
                instantiationService = workbenchTestServices_1.workbenchInstantiationService();
                instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
                instantiationService.stub(configuration_1.IConfigurationService, workspaceService);
                instantiationService.stub(environment_1.IEnvironmentService, environmentService);
                return workspaceService.initialize(getWorkspaceIdentifier(configPath)).then(() => {
                    workspaceService.acquireInstantiationService(instantiationService);
                    testObject = workspaceService;
                });
            });
        });
        teardown(() => {
            if (testObject) {
                testObject.dispose();
            }
            if (parentResource) {
                return pfs.del(parentResource, os.tmpdir());
            }
            return undefined;
        });
        test('workspace folders', () => {
            const actual = testObject.getWorkspace().folders;
            assert.equal(actual.length, 2);
            assert.equal(path.basename(actual[0].uri.fsPath), 'a');
            assert.equal(path.basename(actual[1].uri.fsPath), 'b');
        });
        test('getWorkbenchState()', () => {
            const actual = testObject.getWorkbenchState();
            assert.equal(actual, 3 /* WORKSPACE */);
        });
        test('workspace is complete', () => testObject.getCompleteWorkspace());
    });
    suite('WorkspaceContextService - Workspace Editing', () => {
        let parentResource, testObject, instantiationService, fileChangeEvent = new event_1.Emitter();
        setup(() => {
            return setUpWorkspace(['a', 'b'])
                .then(({ parentDir, configPath }) => {
                parentResource = parentDir;
                const environmentService = new SettingsTestEnvironmentService(argv_1.parseArgs(process.argv), process.execPath, path.join(parentDir, 'settings.json'));
                const workspaceService = new configurationService_1.WorkspaceService(environmentService);
                instantiationService = workbenchTestServices_1.workbenchInstantiationService();
                instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
                instantiationService.stub(configuration_1.IConfigurationService, workspaceService);
                instantiationService.stub(environment_1.IEnvironmentService, environmentService);
                return workspaceService.initialize(getWorkspaceIdentifier(configPath)).then(() => {
                    const fileService = new (class TestFileService extends fileService_1.FileService {
                        get onFileChanges() { return fileChangeEvent.event; }
                    })(workspaceService, workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestTextResourceConfigurationService(), workspaceService, new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), { disableWatcher: true });
                    instantiationService.stub(files_1.IFileService, fileService);
                    instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
                    instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
                    workspaceService.acquireInstantiationService(instantiationService);
                    workspaceService.acquireFileService(fileService);
                    testObject = workspaceService;
                });
            });
        });
        teardown(() => {
            if (testObject) {
                testObject.dispose();
            }
            if (parentResource) {
                return pfs.del(parentResource, os.tmpdir());
            }
            return undefined;
        });
        test('add folders', () => {
            const workspaceDir = path.dirname(testObject.getWorkspace().folders[0].uri.fsPath);
            return testObject.addFolders([{ uri: uri_1.URI.file(path.join(workspaceDir, 'd')) }, { uri: uri_1.URI.file(path.join(workspaceDir, 'c')) }])
                .then(() => {
                const actual = testObject.getWorkspace().folders;
                assert.equal(actual.length, 4);
                assert.equal(path.basename(actual[0].uri.fsPath), 'a');
                assert.equal(path.basename(actual[1].uri.fsPath), 'b');
                assert.equal(path.basename(actual[2].uri.fsPath), 'd');
                assert.equal(path.basename(actual[3].uri.fsPath), 'c');
            });
        });
        test('add folders (at specific index)', () => {
            const workspaceDir = path.dirname(testObject.getWorkspace().folders[0].uri.fsPath);
            return testObject.addFolders([{ uri: uri_1.URI.file(path.join(workspaceDir, 'd')) }, { uri: uri_1.URI.file(path.join(workspaceDir, 'c')) }], 0)
                .then(() => {
                const actual = testObject.getWorkspace().folders;
                assert.equal(actual.length, 4);
                assert.equal(path.basename(actual[0].uri.fsPath), 'd');
                assert.equal(path.basename(actual[1].uri.fsPath), 'c');
                assert.equal(path.basename(actual[2].uri.fsPath), 'a');
                assert.equal(path.basename(actual[3].uri.fsPath), 'b');
            });
        });
        test('add folders (at specific wrong index)', () => {
            const workspaceDir = path.dirname(testObject.getWorkspace().folders[0].uri.fsPath);
            return testObject.addFolders([{ uri: uri_1.URI.file(path.join(workspaceDir, 'd')) }, { uri: uri_1.URI.file(path.join(workspaceDir, 'c')) }], 10)
                .then(() => {
                const actual = testObject.getWorkspace().folders;
                assert.equal(actual.length, 4);
                assert.equal(path.basename(actual[0].uri.fsPath), 'a');
                assert.equal(path.basename(actual[1].uri.fsPath), 'b');
                assert.equal(path.basename(actual[2].uri.fsPath), 'd');
                assert.equal(path.basename(actual[3].uri.fsPath), 'c');
            });
        });
        test('add folders (with name)', () => {
            const workspaceDir = path.dirname(testObject.getWorkspace().folders[0].uri.fsPath);
            return testObject.addFolders([{ uri: uri_1.URI.file(path.join(workspaceDir, 'd')), name: 'DDD' }, { uri: uri_1.URI.file(path.join(workspaceDir, 'c')), name: 'CCC' }])
                .then(() => {
                const actual = testObject.getWorkspace().folders;
                assert.equal(actual.length, 4);
                assert.equal(path.basename(actual[0].uri.fsPath), 'a');
                assert.equal(path.basename(actual[1].uri.fsPath), 'b');
                assert.equal(path.basename(actual[2].uri.fsPath), 'd');
                assert.equal(path.basename(actual[3].uri.fsPath), 'c');
                assert.equal(actual[2].name, 'DDD');
                assert.equal(actual[3].name, 'CCC');
            });
        });
        test('add folders triggers change event', () => {
            const target = sinon.spy();
            testObject.onDidChangeWorkspaceFolders(target);
            const workspaceDir = path.dirname(testObject.getWorkspace().folders[0].uri.fsPath);
            const addedFolders = [{ uri: uri_1.URI.file(path.join(workspaceDir, 'd')) }, { uri: uri_1.URI.file(path.join(workspaceDir, 'c')) }];
            return testObject.addFolders(addedFolders)
                .then(() => {
                assert.equal(target.callCount, 1, `Should be called only once but called ${target.callCount} times`);
                const actual = target.args[0][0];
                assert.deepEqual(actual.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
                assert.deepEqual(actual.removed, []);
                assert.deepEqual(actual.changed, []);
            });
        });
        test('remove folders', () => {
            return testObject.removeFolders([testObject.getWorkspace().folders[0].uri])
                .then(() => {
                const actual = testObject.getWorkspace().folders;
                assert.equal(actual.length, 1);
                assert.equal(path.basename(actual[0].uri.fsPath), 'b');
            });
        });
        test('remove folders triggers change event', () => {
            const target = sinon.spy();
            testObject.onDidChangeWorkspaceFolders(target);
            const removedFolder = testObject.getWorkspace().folders[0];
            return testObject.removeFolders([removedFolder.uri])
                .then(() => {
                assert.equal(target.callCount, 1, `Should be called only once but called ${target.callCount} times`);
                const actual = target.args[0][0];
                assert.deepEqual(actual.added, []);
                assert.deepEqual(actual.removed.map(r => r.uri.toString()), [removedFolder.uri.toString()]);
                assert.deepEqual(actual.changed.map(c => c.uri.toString()), [testObject.getWorkspace().folders[0].uri.toString()]);
            });
        });
        test('remove folders and add them back by writing into the file', done => {
            const folders = testObject.getWorkspace().folders;
            testObject.removeFolders([folders[0].uri])
                .then(() => {
                testObject.onDidChangeWorkspaceFolders(actual => {
                    assert.deepEqual(actual.added.map(r => r.uri.toString()), [folders[0].uri.toString()]);
                    done();
                });
                const workspace = { folders: [{ path: folders[0].uri.fsPath }, { path: folders[1].uri.fsPath }] };
                instantiationService.get(files_1.IFileService).updateContent(testObject.getWorkspace().configuration, JSON.stringify(workspace, null, '\t'))
                    .then(() => {
                    fileChangeEvent.fire(new files_1.FileChangesEvent([
                        {
                            resource: testObject.getWorkspace().configuration,
                            type: 0 /* UPDATED */
                        }
                    ]));
                }, done);
            }, done);
        });
        test('update folders (remove last and add to end)', () => {
            const target = sinon.spy();
            testObject.onDidChangeWorkspaceFolders(target);
            const workspaceDir = path.dirname(testObject.getWorkspace().folders[0].uri.fsPath);
            const addedFolders = [{ uri: uri_1.URI.file(path.join(workspaceDir, 'd')) }, { uri: uri_1.URI.file(path.join(workspaceDir, 'c')) }];
            const removedFolders = [testObject.getWorkspace().folders[1]].map(f => f.uri);
            return testObject.updateFolders(addedFolders, removedFolders)
                .then(() => {
                assert.equal(target.callCount, 1, `Should be called only once but called ${target.callCount} times`);
                const actual = target.args[0][0];
                assert.deepEqual(actual.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
                assert.deepEqual(actual.removed.map(r => r.uri.toString()), removedFolders.map(a => a.toString()));
                assert.deepEqual(actual.changed, []);
            });
        });
        test('update folders (rename first via add and remove)', () => {
            const target = sinon.spy();
            testObject.onDidChangeWorkspaceFolders(target);
            const workspaceDir = path.dirname(testObject.getWorkspace().folders[0].uri.fsPath);
            const addedFolders = [{ uri: uri_1.URI.file(path.join(workspaceDir, 'a')), name: 'The Folder' }];
            const removedFolders = [testObject.getWorkspace().folders[0]].map(f => f.uri);
            return testObject.updateFolders(addedFolders, removedFolders, 0)
                .then(() => {
                assert.equal(target.callCount, 1, `Should be called only once but called ${target.callCount} times`);
                const actual = target.args[0][0];
                assert.deepEqual(actual.added, []);
                assert.deepEqual(actual.removed, []);
                assert.deepEqual(actual.changed.map(r => r.uri.toString()), removedFolders.map(a => a.toString()));
            });
        });
        test('update folders (remove first and add to end)', () => {
            const target = sinon.spy();
            testObject.onDidChangeWorkspaceFolders(target);
            const workspaceDir = path.dirname(testObject.getWorkspace().folders[0].uri.fsPath);
            const addedFolders = [{ uri: uri_1.URI.file(path.join(workspaceDir, 'd')) }, { uri: uri_1.URI.file(path.join(workspaceDir, 'c')) }];
            const removedFolders = [testObject.getWorkspace().folders[0]].map(f => f.uri);
            const changedFolders = [testObject.getWorkspace().folders[1]].map(f => f.uri);
            return testObject.updateFolders(addedFolders, removedFolders)
                .then(() => {
                assert.equal(target.callCount, 1, `Should be called only once but called ${target.callCount} times`);
                const actual = target.args[0][0];
                assert.deepEqual(actual.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
                assert.deepEqual(actual.removed.map(r => r.uri.toString()), removedFolders.map(a => a.toString()));
                assert.deepEqual(actual.changed.map(r => r.uri.toString()), changedFolders.map(a => a.toString()));
            });
        });
        test('reorder folders trigger change event', () => {
            const target = sinon.spy();
            testObject.onDidChangeWorkspaceFolders(target);
            const workspace = { folders: [{ path: testObject.getWorkspace().folders[1].uri.fsPath }, { path: testObject.getWorkspace().folders[0].uri.fsPath }] };
            fs.writeFileSync(testObject.getWorkspace().configuration.fsPath, JSON.stringify(workspace, null, '\t'));
            return testObject.reloadConfiguration()
                .then(() => {
                assert.equal(target.callCount, 1, `Should be called only once but called ${target.callCount} times`);
                const actual = target.args[0][0];
                assert.deepEqual(actual.added, []);
                assert.deepEqual(actual.removed, []);
                assert.deepEqual(actual.changed.map(c => c.uri.toString()), testObject.getWorkspace().folders.map(f => f.uri.toString()).reverse());
            });
        });
        test('rename folders trigger change event', () => {
            const target = sinon.spy();
            testObject.onDidChangeWorkspaceFolders(target);
            const workspace = { folders: [{ path: testObject.getWorkspace().folders[0].uri.fsPath, name: '1' }, { path: testObject.getWorkspace().folders[1].uri.fsPath }] };
            fs.writeFileSync(testObject.getWorkspace().configuration.fsPath, JSON.stringify(workspace, null, '\t'));
            return testObject.reloadConfiguration()
                .then(() => {
                assert.equal(target.callCount, 1, `Should be called only once but called ${target.callCount} times`);
                const actual = target.args[0][0];
                assert.deepEqual(actual.added, []);
                assert.deepEqual(actual.removed, []);
                assert.deepEqual(actual.changed.map(c => c.uri.toString()), [testObject.getWorkspace().folders[0].uri.toString()]);
            });
        });
    });
    suite('WorkspaceService - Initialization', () => {
        let parentResource, workspaceConfigPath, testObject, globalSettingsFile;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'initialization.testSetting1': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 3 /* RESOURCE */
                    },
                    'initialization.testSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 3 /* RESOURCE */
                    }
                }
            });
        });
        setup(() => {
            return setUpWorkspace(['1', '2'])
                .then(({ parentDir, configPath }) => {
                parentResource = parentDir;
                workspaceConfigPath = configPath;
                globalSettingsFile = path.join(parentDir, 'settings.json');
                const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
                const environmentService = new SettingsTestEnvironmentService(argv_1.parseArgs(process.argv), process.execPath, globalSettingsFile);
                const workspaceService = new configurationService_1.WorkspaceService(environmentService);
                instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
                instantiationService.stub(configuration_1.IConfigurationService, workspaceService);
                instantiationService.stub(environment_1.IEnvironmentService, environmentService);
                return workspaceService.initialize({ id: '' }).then(() => {
                    const fileService = new fileService_1.FileService(workspaceService, workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestTextResourceConfigurationService(), workspaceService, new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), { disableWatcher: true });
                    instantiationService.stub(files_1.IFileService, fileService);
                    instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
                    instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
                    workspaceService.acquireInstantiationService(instantiationService);
                    workspaceService.acquireFileService(fileService);
                    testObject = workspaceService;
                });
            });
        });
        teardown(() => {
            if (testObject) {
                testObject.dispose();
            }
            if (parentResource) {
                return pfs.del(parentResource, os.tmpdir());
            }
            return undefined;
        });
        test('initialize a folder workspace from an empty workspace with no configuration changes', () => {
            fs.writeFileSync(globalSettingsFile, '{ "initialization.testSetting1": "userValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                const target = sinon.spy();
                testObject.onDidChangeWorkbenchState(target);
                testObject.onDidChangeWorkspaceName(target);
                testObject.onDidChangeWorkspaceFolders(target);
                testObject.onDidChangeConfiguration(target);
                return testObject.initialize(convertToWorkspacePayload(uri_1.URI.file(path.join(parentResource, '1'))))
                    .then(() => {
                    assert.equal(testObject.getValue('initialization.testSetting1'), 'userValue');
                    assert.equal(target.callCount, 3);
                    assert.deepEqual(target.args[0], [2 /* FOLDER */]);
                    assert.deepEqual(target.args[1], [undefined]);
                    assert.deepEqual(target.args[2][0].added.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '1')).fsPath]);
                    assert.deepEqual(target.args[2][0].removed, []);
                    assert.deepEqual(target.args[2][0].changed, []);
                });
            });
        });
        test('initialize a folder workspace from an empty workspace with configuration changes', () => {
            fs.writeFileSync(globalSettingsFile, '{ "initialization.testSetting1": "userValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                const target = sinon.spy();
                testObject.onDidChangeWorkbenchState(target);
                testObject.onDidChangeWorkspaceName(target);
                testObject.onDidChangeWorkspaceFolders(target);
                testObject.onDidChangeConfiguration(target);
                fs.writeFileSync(path.join(parentResource, '1', '.vscode', 'settings.json'), '{ "initialization.testSetting1": "workspaceValue" }');
                return testObject.initialize(convertToWorkspacePayload(uri_1.URI.file(path.join(parentResource, '1'))))
                    .then(() => {
                    assert.equal(testObject.getValue('initialization.testSetting1'), 'workspaceValue');
                    assert.equal(target.callCount, 4);
                    assert.deepEqual(target.args[0][0].affectedKeys, ['initialization.testSetting1']);
                    assert.deepEqual(target.args[1], [2 /* FOLDER */]);
                    assert.deepEqual(target.args[2], [undefined]);
                    assert.deepEqual(target.args[3][0].added.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '1')).fsPath]);
                    assert.deepEqual(target.args[3][0].removed, []);
                    assert.deepEqual(target.args[3][0].changed, []);
                });
            });
        });
        test('initialize a multi root workspace from an empty workspace with no configuration changes', () => {
            fs.writeFileSync(globalSettingsFile, '{ "initialization.testSetting1": "userValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                const target = sinon.spy();
                testObject.onDidChangeWorkbenchState(target);
                testObject.onDidChangeWorkspaceName(target);
                testObject.onDidChangeWorkspaceFolders(target);
                testObject.onDidChangeConfiguration(target);
                return testObject.initialize(getWorkspaceIdentifier(workspaceConfigPath))
                    .then(() => {
                    assert.equal(target.callCount, 3);
                    assert.deepEqual(target.args[0], [3 /* WORKSPACE */]);
                    assert.deepEqual(target.args[1], [undefined]);
                    assert.deepEqual(target.args[2][0].added.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '1')).fsPath, uri_1.URI.file(path.join(parentResource, '2')).fsPath]);
                    assert.deepEqual(target.args[2][0].removed, []);
                    assert.deepEqual(target.args[2][0].changed, []);
                });
            });
        });
        test('initialize a multi root workspace from an empty workspace with configuration changes', () => {
            fs.writeFileSync(globalSettingsFile, '{ "initialization.testSetting1": "userValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                const target = sinon.spy();
                testObject.onDidChangeWorkbenchState(target);
                testObject.onDidChangeWorkspaceName(target);
                testObject.onDidChangeWorkspaceFolders(target);
                testObject.onDidChangeConfiguration(target);
                fs.writeFileSync(path.join(parentResource, '1', '.vscode', 'settings.json'), '{ "initialization.testSetting1": "workspaceValue1" }');
                fs.writeFileSync(path.join(parentResource, '2', '.vscode', 'settings.json'), '{ "initialization.testSetting2": "workspaceValue2" }');
                return testObject.initialize(getWorkspaceIdentifier(workspaceConfigPath))
                    .then(() => {
                    assert.equal(target.callCount, 4);
                    assert.deepEqual(target.args[0][0].affectedKeys, ['initialization.testSetting1', 'initialization.testSetting2']);
                    assert.deepEqual(target.args[1], [3 /* WORKSPACE */]);
                    assert.deepEqual(target.args[2], [undefined]);
                    assert.deepEqual(target.args[3][0].added.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '1')).fsPath, uri_1.URI.file(path.join(parentResource, '2')).fsPath]);
                    assert.deepEqual(target.args[3][0].removed, []);
                    assert.deepEqual(target.args[3][0].changed, []);
                });
            });
        });
        test('initialize a folder workspace from a folder workspace with no configuration changes', () => {
            return testObject.initialize(convertToWorkspacePayload(uri_1.URI.file(path.join(parentResource, '1'))))
                .then(() => {
                fs.writeFileSync(globalSettingsFile, '{ "initialization.testSetting1": "userValue" }');
                return testObject.reloadConfiguration()
                    .then(() => {
                    const target = sinon.spy();
                    testObject.onDidChangeWorkbenchState(target);
                    testObject.onDidChangeWorkspaceName(target);
                    testObject.onDidChangeWorkspaceFolders(target);
                    testObject.onDidChangeConfiguration(target);
                    return testObject.initialize(convertToWorkspacePayload(uri_1.URI.file(path.join(parentResource, '2'))))
                        .then(() => {
                        assert.equal(testObject.getValue('initialization.testSetting1'), 'userValue');
                        assert.equal(target.callCount, 1);
                        assert.deepEqual(target.args[0][0].added.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '2')).fsPath]);
                        assert.deepEqual(target.args[0][0].removed.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '1')).fsPath]);
                        assert.deepEqual(target.args[0][0].changed, []);
                    });
                });
            });
        });
        test('initialize a folder workspace from a folder workspace with configuration changes', () => {
            return testObject.initialize(convertToWorkspacePayload(uri_1.URI.file(path.join(parentResource, '1'))))
                .then(() => {
                const target = sinon.spy();
                testObject.onDidChangeWorkbenchState(target);
                testObject.onDidChangeWorkspaceName(target);
                testObject.onDidChangeWorkspaceFolders(target);
                testObject.onDidChangeConfiguration(target);
                fs.writeFileSync(path.join(parentResource, '2', '.vscode', 'settings.json'), '{ "initialization.testSetting1": "workspaceValue2" }');
                return testObject.initialize(convertToWorkspacePayload(uri_1.URI.file(path.join(parentResource, '2'))))
                    .then(() => {
                    assert.equal(testObject.getValue('initialization.testSetting1'), 'workspaceValue2');
                    assert.equal(target.callCount, 2);
                    assert.deepEqual(target.args[0][0].affectedKeys, ['initialization.testSetting1']);
                    assert.deepEqual(target.args[1][0].added.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '2')).fsPath]);
                    assert.deepEqual(target.args[1][0].removed.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '1')).fsPath]);
                    assert.deepEqual(target.args[1][0].changed, []);
                });
            });
        });
        test('initialize a multi folder workspace from a folder workspacce triggers change events in the right order', () => {
            const folderDir = path.join(parentResource, '1');
            return testObject.initialize(convertToWorkspacePayload(uri_1.URI.file(folderDir)))
                .then(() => {
                const target = sinon.spy();
                testObject.onDidChangeWorkbenchState(target);
                testObject.onDidChangeWorkspaceName(target);
                testObject.onDidChangeWorkspaceFolders(target);
                testObject.onDidChangeConfiguration(target);
                fs.writeFileSync(path.join(parentResource, '1', '.vscode', 'settings.json'), '{ "initialization.testSetting1": "workspaceValue2" }');
                return testObject.initialize(getWorkspaceIdentifier(workspaceConfigPath))
                    .then(() => {
                    assert.equal(target.callCount, 4);
                    assert.deepEqual(target.args[0][0].affectedKeys, ['initialization.testSetting1']);
                    assert.deepEqual(target.args[1], [3 /* WORKSPACE */]);
                    assert.deepEqual(target.args[2], [undefined]);
                    assert.deepEqual(target.args[3][0].added.map(folder => folder.uri.fsPath), [uri_1.URI.file(path.join(parentResource, '2')).fsPath]);
                    assert.deepEqual(target.args[3][0].removed, []);
                    assert.deepEqual(target.args[3][0].changed, []);
                });
            });
        });
    });
    suite('WorkspaceConfigurationService - Folder', () => {
        let workspaceName = `testWorkspace${uuid.generateUuid()}`, parentResource, workspaceDir, testObject, globalSettingsFile;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* APPLICATION */
                    },
                    'configurationService.folder.testSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 3 /* RESOURCE */
                    }
                }
            });
        });
        setup(() => {
            return setUpFolderWorkspace(workspaceName)
                .then(({ parentDir, folderDir }) => {
                parentResource = parentDir;
                workspaceDir = folderDir;
                globalSettingsFile = path.join(parentDir, 'settings.json');
                const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
                const environmentService = new SettingsTestEnvironmentService(argv_1.parseArgs(process.argv), process.execPath, globalSettingsFile);
                const workspaceService = new configurationService_1.WorkspaceService(environmentService);
                instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
                instantiationService.stub(configuration_1.IConfigurationService, workspaceService);
                instantiationService.stub(environment_1.IEnvironmentService, environmentService);
                return workspaceService.initialize(convertToWorkspacePayload(uri_1.URI.file(folderDir))).then(() => {
                    const fileService = new fileService_1.FileService(workspaceService, workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestTextResourceConfigurationService(), workspaceService, new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), { disableWatcher: true });
                    instantiationService.stub(files_1.IFileService, fileService);
                    instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
                    instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
                    workspaceService.acquireInstantiationService(instantiationService);
                    workspaceService.acquireFileService(fileService);
                    testObject = workspaceService;
                });
            });
        });
        teardown(() => {
            if (testObject) {
                testObject.dispose();
            }
            if (parentResource) {
                return pfs.del(parentResource, os.tmpdir());
            }
            return undefined;
        });
        test('defaults', () => {
            assert.deepEqual(testObject.getValue('configurationService'), { 'folder': { 'applicationSetting': 'isSet', 'testSetting': 'isSet' } });
        });
        test('globals override defaults', () => {
            fs.writeFileSync(globalSettingsFile, '{ "configurationService.folder.testSetting": "userValue" }');
            return testObject.reloadConfiguration()
                .then(() => assert.equal(testObject.getValue('configurationService.folder.testSetting'), 'userValue'));
        });
        test('globals', () => {
            fs.writeFileSync(globalSettingsFile, '{ "testworkbench.editor.tabs": true }');
            return testObject.reloadConfiguration()
                .then(() => assert.equal(testObject.getValue('testworkbench.editor.tabs'), true));
        });
        test('workspace settings', () => {
            fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "testworkbench.editor.icons": true }');
            return testObject.reloadConfiguration()
                .then(() => assert.equal(testObject.getValue('testworkbench.editor.icons'), true));
        });
        test('workspace settings override user settings', () => {
            fs.writeFileSync(globalSettingsFile, '{ "configurationService.folder.testSetting": "userValue" }');
            fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "configurationService.folder.testSetting": "workspaceValue" }');
            return testObject.reloadConfiguration()
                .then(() => assert.equal(testObject.getValue('configurationService.folder.testSetting'), 'workspaceValue'));
        });
        test('workspace settings override user settings after defaults are registered ', () => {
            fs.writeFileSync(globalSettingsFile, '{ "configurationService.folder.newSetting": "userValue" }');
            fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "configurationService.folder.newSetting": "workspaceValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                configurationRegistry.registerConfiguration({
                    'id': '_test',
                    'type': 'object',
                    'properties': {
                        'configurationService.folder.newSetting': {
                            'type': 'string',
                            'default': 'isSet'
                        }
                    }
                });
                assert.equal(testObject.getValue('configurationService.folder.newSetting'), 'workspaceValue');
            });
        });
        test('application settings are not read from workspace', () => {
            fs.writeFileSync(globalSettingsFile, '{ "configurationService.folder.applicationSetting": "userValue" }');
            fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "configurationService.folder.applicationSetting": "workspaceValue" }');
            return testObject.reloadConfiguration()
                .then(() => assert.equal(testObject.getValue('configurationService.folder.applicationSetting'), 'userValue'));
        });
        test('get application scope settings are not loaded after defaults are registered', () => {
            fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "configurationService.folder.anotherApplicationSetting": "workspaceValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                configurationRegistry.registerConfiguration({
                    'id': '_test',
                    'type': 'object',
                    'properties': {
                        'configurationService.folder.anotherApplicationSetting': {
                            'type': 'string',
                            'default': 'isSet',
                            scope: 1 /* APPLICATION */
                        }
                    }
                });
                assert.deepEqual(testObject.keys().workspace, []);
            });
        });
        test('reload configuration emits events after global configuraiton changes', () => {
            fs.writeFileSync(globalSettingsFile, '{ "testworkbench.editor.tabs": true }');
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.reloadConfiguration().then(() => assert.ok(target.called));
        });
        test('reload configuration emits events after workspace configuraiton changes', () => {
            fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "configurationService.folder.testSetting": "workspaceValue" }');
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.reloadConfiguration().then(() => assert.ok(target.called));
        });
        test('reload configuration should not emit event if no changes', () => {
            fs.writeFileSync(globalSettingsFile, '{ "testworkbench.editor.tabs": true }');
            fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "configurationService.folder.testSetting": "workspaceValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                const target = sinon.spy();
                testObject.onDidChangeConfiguration(() => { target(); });
                return testObject.reloadConfiguration()
                    .then(() => assert.ok(!target.called));
            });
        });
        test('inspect', () => {
            let actual = testObject.inspect('something.missing');
            assert.equal(actual.default, undefined);
            assert.equal(actual.user, undefined);
            assert.equal(actual.workspace, undefined);
            assert.equal(actual.workspaceFolder, undefined);
            assert.equal(actual.value, undefined);
            actual = testObject.inspect('configurationService.folder.testSetting');
            assert.equal(actual.default, 'isSet');
            assert.equal(actual.user, undefined);
            assert.equal(actual.workspace, undefined);
            assert.equal(actual.workspaceFolder, undefined);
            assert.equal(actual.value, 'isSet');
            fs.writeFileSync(globalSettingsFile, '{ "configurationService.folder.testSetting": "userValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                actual = testObject.inspect('configurationService.folder.testSetting');
                assert.equal(actual.default, 'isSet');
                assert.equal(actual.user, 'userValue');
                assert.equal(actual.workspace, undefined);
                assert.equal(actual.workspaceFolder, undefined);
                assert.equal(actual.value, 'userValue');
                fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "configurationService.folder.testSetting": "workspaceValue" }');
                return testObject.reloadConfiguration()
                    .then(() => {
                    actual = testObject.inspect('configurationService.folder.testSetting');
                    assert.equal(actual.default, 'isSet');
                    assert.equal(actual.user, 'userValue');
                    assert.equal(actual.workspace, 'workspaceValue');
                    assert.equal(actual.workspaceFolder, undefined);
                    assert.equal(actual.value, 'workspaceValue');
                });
            });
        });
        test('keys', () => {
            let actual = testObject.keys();
            assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
            assert.deepEqual(actual.user, []);
            assert.deepEqual(actual.workspace, []);
            assert.deepEqual(actual.workspaceFolder, []);
            fs.writeFileSync(globalSettingsFile, '{ "configurationService.folder.testSetting": "userValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                actual = testObject.keys();
                assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
                assert.deepEqual(actual.user, ['configurationService.folder.testSetting']);
                assert.deepEqual(actual.workspace, []);
                assert.deepEqual(actual.workspaceFolder, []);
                fs.writeFileSync(path.join(workspaceDir, '.vscode', 'settings.json'), '{ "configurationService.folder.testSetting": "workspaceValue" }');
                return testObject.reloadConfiguration()
                    .then(() => {
                    actual = testObject.keys();
                    assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
                    assert.deepEqual(actual.user, ['configurationService.folder.testSetting']);
                    assert.deepEqual(actual.workspace, ['configurationService.folder.testSetting']);
                    assert.deepEqual(actual.workspaceFolder, []);
                });
            });
        });
        test('update user configuration', () => {
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 1 /* USER */)
                .then(() => assert.equal(testObject.getValue('configurationService.folder.testSetting'), 'value'));
        });
        test('update workspace configuration', () => {
            return testObject.updateValue('tasks.service.testSetting', 'value', 2 /* WORKSPACE */)
                .then(() => assert.equal(testObject.getValue('tasks.service.testSetting'), 'value'));
        });
        test('update application setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.folder.applicationSetting', 'workspaceValue', {}, 2 /* WORKSPACE */, true)
                .then(() => assert.fail('Should not be supported'), (e) => assert.equal(e.code, 1 /* ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */));
        });
        test('update tasks configuration', () => {
            return testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, 2 /* WORKSPACE */)
                .then(() => assert.deepEqual(testObject.getValue('tasks'), { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }));
        });
        test('update user configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 1 /* USER */)
                .then(() => assert.ok(target.called));
        });
        test('update workspace configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 2 /* WORKSPACE */)
                .then(() => assert.ok(target.called));
        });
        test('update memory configuration', () => {
            return testObject.updateValue('configurationService.folder.testSetting', 'memoryValue', 5 /* MEMORY */)
                .then(() => assert.equal(testObject.getValue('configurationService.folder.testSetting'), 'memoryValue'));
        });
        test('update memory configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.folder.testSetting', 'memoryValue', 5 /* MEMORY */)
                .then(() => assert.ok(target.called));
        });
        test('update task configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, 2 /* WORKSPACE */)
                .then(() => assert.ok(target.called));
        });
    });
    suite('WorkspaceConfigurationService-Multiroot', () => {
        let parentResource, workspaceContextService, environmentService, jsonEditingServce, testObject;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    },
                    'configurationService.workspace.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* APPLICATION */
                    },
                    'configurationService.workspace.testResourceSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 3 /* RESOURCE */
                    }
                }
            });
        });
        setup(() => {
            return setUpWorkspace(['1', '2'])
                .then(({ parentDir, configPath }) => {
                parentResource = parentDir;
                environmentService = new SettingsTestEnvironmentService(argv_1.parseArgs(process.argv), process.execPath, path.join(parentDir, 'settings.json'));
                const workspaceService = new configurationService_1.WorkspaceService(environmentService);
                const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
                instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
                instantiationService.stub(configuration_1.IConfigurationService, workspaceService);
                instantiationService.stub(environment_1.IEnvironmentService, environmentService);
                return workspaceService.initialize(getWorkspaceIdentifier(configPath)).then(() => {
                    const fileService = new fileService_1.FileService(workspaceService, workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestTextResourceConfigurationService(), workspaceService, new workbenchTestServices_1.TestLifecycleService(), new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), { disableWatcher: true });
                    instantiationService.stub(files_1.IFileService, fileService);
                    instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
                    instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
                    workspaceService.acquireInstantiationService(instantiationService);
                    workspaceService.acquireFileService(fileService);
                    workspaceContextService = workspaceService;
                    jsonEditingServce = instantiationService.createInstance(jsonEditingService_1.JSONEditingService);
                    testObject = workspaceService;
                });
            });
        });
        teardown(() => {
            if (testObject) {
                testObject.dispose();
            }
            if (parentResource) {
                return pfs.del(parentResource, os.tmpdir());
            }
            return undefined;
        });
        test('application settings are not read from workspace', () => {
            fs.writeFileSync(environmentService.appSettingsPath, '{ "configurationService.workspace.applicationSetting": "userValue" }');
            return jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, { key: 'settings', value: { 'configurationService.workspace.applicationSetting': 'workspaceValue' } }, true)
                .then(() => testObject.reloadConfiguration())
                .then(() => assert.equal(testObject.getValue('configurationService.workspace.applicationSetting'), 'userValue'));
        });
        test('workspace settings override user settings after defaults are registered ', () => {
            fs.writeFileSync(environmentService.appSettingsPath, '{ "configurationService.workspace.newSetting": "userValue" }');
            return jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, { key: 'settings', value: { 'configurationService.workspace.newSetting': 'workspaceValue' } }, true)
                .then(() => testObject.reloadConfiguration())
                .then(() => {
                configurationRegistry.registerConfiguration({
                    'id': '_test',
                    'type': 'object',
                    'properties': {
                        'configurationService.workspace.newSetting': {
                            'type': 'string',
                            'default': 'isSet'
                        }
                    }
                });
                assert.equal(testObject.getValue('configurationService.workspace.newSetting'), 'workspaceValue');
            });
        });
        test('application settings are not read from workspace folder', () => {
            fs.writeFileSync(environmentService.appSettingsPath, '{ "configurationService.workspace.applicationSetting": "userValue" }');
            fs.writeFileSync(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json').fsPath, '{ "configurationService.workspace.applicationSetting": "workspaceFolderValue" }');
            return testObject.reloadConfiguration()
                .then(() => assert.equal(testObject.getValue('configurationService.workspace.applicationSetting'), 'userValue'));
        });
        test('application settings are not read from workspace folder after defaults are registered', () => {
            fs.writeFileSync(environmentService.appSettingsPath, '{ "configurationService.workspace.testNewApplicationSetting": "userValue" }');
            fs.writeFileSync(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json').fsPath, '{ "configurationService.workspace.testNewApplicationSetting": "workspaceFolderValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                configurationRegistry.registerConfiguration({
                    'id': '_test',
                    'type': 'object',
                    'properties': {
                        'configurationService.workspace.testNewApplicationSetting': {
                            'type': 'string',
                            'default': 'isSet',
                            scope: 1 /* APPLICATION */
                        }
                    }
                });
                assert.equal(testObject.getValue('configurationService.workspace.testNewApplicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
            });
        });
        test('resource setting in folder is read after it is registered later', () => {
            fs.writeFileSync(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json').fsPath, '{ "configurationService.workspace.testNewResourceSetting2": "workspaceFolderValue" }');
            return jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, { key: 'settings', value: { 'configurationService.workspace.testNewResourceSetting2': 'workspaceValue' } }, true)
                .then(() => testObject.reloadConfiguration())
                .then(() => {
                configurationRegistry.registerConfiguration({
                    'id': '_test',
                    'type': 'object',
                    'properties': {
                        'configurationService.workspace.testNewResourceSetting2': {
                            'type': 'string',
                            'default': 'isSet',
                            scope: 3 /* RESOURCE */
                        }
                    }
                });
                assert.equal(testObject.getValue('configurationService.workspace.testNewResourceSetting2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
            });
        });
        test('inspect', () => {
            let actual = testObject.inspect('something.missing');
            assert.equal(actual.default, undefined);
            assert.equal(actual.user, undefined);
            assert.equal(actual.workspace, undefined);
            assert.equal(actual.workspaceFolder, undefined);
            assert.equal(actual.value, undefined);
            actual = testObject.inspect('configurationService.workspace.testResourceSetting');
            assert.equal(actual.default, 'isSet');
            assert.equal(actual.user, undefined);
            assert.equal(actual.workspace, undefined);
            assert.equal(actual.workspaceFolder, undefined);
            assert.equal(actual.value, 'isSet');
            fs.writeFileSync(environmentService.appSettingsPath, '{ "configurationService.workspace.testResourceSetting": "userValue" }');
            return testObject.reloadConfiguration()
                .then(() => {
                actual = testObject.inspect('configurationService.workspace.testResourceSetting');
                assert.equal(actual.default, 'isSet');
                assert.equal(actual.user, 'userValue');
                assert.equal(actual.workspace, undefined);
                assert.equal(actual.workspaceFolder, undefined);
                assert.equal(actual.value, 'userValue');
                return jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, { key: 'settings', value: { 'configurationService.workspace.testResourceSetting': 'workspaceValue' } }, true)
                    .then(() => testObject.reloadConfiguration())
                    .then(() => {
                    actual = testObject.inspect('configurationService.workspace.testResourceSetting');
                    assert.equal(actual.default, 'isSet');
                    assert.equal(actual.user, 'userValue');
                    assert.equal(actual.workspace, 'workspaceValue');
                    assert.equal(actual.workspaceFolder, undefined);
                    assert.equal(actual.value, 'workspaceValue');
                    fs.writeFileSync(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json').fsPath, '{ "configurationService.workspace.testResourceSetting": "workspaceFolderValue" }');
                    return testObject.reloadConfiguration()
                        .then(() => {
                        actual = testObject.inspect('configurationService.workspace.testResourceSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri });
                        assert.equal(actual.default, 'isSet');
                        assert.equal(actual.user, 'userValue');
                        assert.equal(actual.workspace, 'workspaceValue');
                        assert.equal(actual.workspaceFolder, 'workspaceFolderValue');
                        assert.equal(actual.value, 'workspaceFolderValue');
                    });
                });
            });
        });
        test('get launch configuration', () => {
            const expectedLaunchConfiguration = {
                'version': '0.1.0',
                'configurations': [
                    {
                        'type': 'node',
                        'request': 'launch',
                        'name': 'Gulp Build',
                        'program': '${workspaceFolder}/node_modules/gulp/bin/gulp.js',
                        'stopOnEntry': true,
                        'args': [
                            'watch-extension:json-client'
                        ],
                        'cwd': '${workspaceFolder}'
                    }
                ]
            };
            return jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, { key: 'launch', value: expectedLaunchConfiguration }, true)
                .then(() => testObject.reloadConfiguration())
                .then(() => {
                const actual = testObject.getValue('launch');
                assert.deepEqual(actual, expectedLaunchConfiguration);
            });
        });
        test('inspect launch configuration', () => {
            const expectedLaunchConfiguration = {
                'version': '0.1.0',
                'configurations': [
                    {
                        'type': 'node',
                        'request': 'launch',
                        'name': 'Gulp Build',
                        'program': '${workspaceFolder}/node_modules/gulp/bin/gulp.js',
                        'stopOnEntry': true,
                        'args': [
                            'watch-extension:json-client'
                        ],
                        'cwd': '${workspaceFolder}'
                    }
                ]
            };
            return jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, { key: 'launch', value: expectedLaunchConfiguration }, true)
                .then(() => testObject.reloadConfiguration())
                .then(() => {
                const actual = testObject.inspect('launch').workspace;
                assert.deepEqual(actual, expectedLaunchConfiguration);
            });
        });
        test('update user configuration', () => {
            return testObject.updateValue('configurationService.workspace.testSetting', 'userValue', 1 /* USER */)
                .then(() => assert.equal(testObject.getValue('configurationService.workspace.testSetting'), 'userValue'));
        });
        test('update user configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.workspace.testSetting', 'userValue', 1 /* USER */)
                .then(() => assert.ok(target.called));
        });
        test('update workspace configuration', () => {
            return testObject.updateValue('configurationService.workspace.testSetting', 'workspaceValue', 2 /* WORKSPACE */)
                .then(() => assert.equal(testObject.getValue('configurationService.workspace.testSetting'), 'workspaceValue'));
        });
        test('update workspace configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.workspace.testSetting', 'workspaceValue', 2 /* WORKSPACE */)
                .then(() => assert.ok(target.called));
        });
        test('update application setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.workspace.applicationSetting', 'workspaceValue', {}, 2 /* WORKSPACE */, true)
                .then(() => assert.fail('Should not be supported'), (e) => assert.equal(e.code, 1 /* ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */));
        });
        test('update workspace folder configuration', () => {
            const workspace = workspaceContextService.getWorkspace();
            return testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 3 /* WORKSPACE_FOLDER */)
                .then(() => assert.equal(testObject.getValue('configurationService.workspace.testResourceSetting', { resource: workspace.folders[0].uri }), 'workspaceFolderValue'));
        });
        test('update workspace folder configuration should trigger change event before promise is resolve', () => {
            const workspace = workspaceContextService.getWorkspace();
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 3 /* WORKSPACE_FOLDER */)
                .then(() => assert.ok(target.called));
        });
        test('update workspace folder configuration second time should trigger change event before promise is resolve', () => {
            const workspace = workspaceContextService.getWorkspace();
            return testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 3 /* WORKSPACE_FOLDER */)
                .then(() => {
                const target = sinon.spy();
                testObject.onDidChangeConfiguration(target);
                return testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue2', { resource: workspace.folders[0].uri }, 3 /* WORKSPACE_FOLDER */)
                    .then(() => assert.ok(target.called));
            });
        });
        test('update memory configuration', () => {
            return testObject.updateValue('configurationService.workspace.testSetting', 'memoryValue', 5 /* MEMORY */)
                .then(() => assert.equal(testObject.getValue('configurationService.workspace.testSetting'), 'memoryValue'));
        });
        test('update memory configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            testObject.onDidChangeConfiguration(target);
            return testObject.updateValue('configurationService.workspace.testSetting', 'memoryValue', 5 /* MEMORY */)
                .then(() => assert.ok(target.called));
        });
        test('update tasks configuration in a folder', () => {
            const workspace = workspaceContextService.getWorkspace();
            return testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, { resource: workspace.folders[0].uri }, 3 /* WORKSPACE_FOLDER */)
                .then(() => assert.deepEqual(testObject.getValue('tasks', { resource: workspace.folders[0].uri }), { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }));
        });
        test('update tasks configuration in a workspace is not supported', () => {
            const workspace = workspaceContextService.getWorkspace();
            return testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, { resource: workspace.folders[0].uri }, 2 /* WORKSPACE */, true)
                .then(() => assert.fail('Should not be supported'), (e) => assert.equal(e.code, 4 /* ERROR_INVALID_WORKSPACE_TARGET */));
        });
        test('update launch configuration in a workspace', () => {
            const workspace = workspaceContextService.getWorkspace();
            return testObject.updateValue('launch', { 'version': '1.0.0', configurations: [{ 'name': 'myLaunch' }] }, { resource: workspace.folders[0].uri }, 2 /* WORKSPACE */, true)
                .then(() => assert.deepEqual(testObject.getValue('launch'), { 'version': '1.0.0', configurations: [{ 'name': 'myLaunch' }] }));
        });
        test('task configurations are not read from workspace', () => {
            return jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, { key: 'tasks', value: { 'version': '1.0' } }, true)
                .then(() => testObject.reloadConfiguration())
                .then(() => {
                const actual = testObject.inspect('tasks.version');
                assert.equal(actual.workspace, undefined);
            });
        });
    });
    function getWorkspaceId(configPath) {
        let workspaceConfigPath = configPath.scheme === network_1.Schemas.file ? resources_1.originalFSPath(configPath) : configPath.toString();
        if (!platform_2.isLinux) {
            workspaceConfigPath = workspaceConfigPath.toLowerCase(); // sanitize for platform file system
        }
        return crypto_1.createHash('md5').update(workspaceConfigPath).digest('hex');
    }
    function getWorkspaceIdentifier(configPath) {
        return {
            configPath,
            id: getWorkspaceId(configPath)
        };
    }
    exports.getWorkspaceIdentifier = getWorkspaceIdentifier;
});
//# sourceMappingURL=configurationService.test.js.map