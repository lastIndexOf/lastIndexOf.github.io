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
define(["require", "exports", "assert", "fs", "os", "vs/base/common/path", "vs/base/common/json", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/base/common/uuid", "vs/base/node/extfs", "vs/base/node/pfs", "vs/editor/common/services/modeService", "vs/editor/common/services/modeServiceImpl", "vs/editor/common/services/modelService", "vs/editor/common/services/modelServiceImpl", "vs/editor/common/services/resolverService", "vs/editor/common/services/resourceConfiguration", "vs/platform/configuration/common/configuration", "vs/platform/configuration/node/configurationService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/notification/test/common/testNotificationService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/services/backup/common/backup", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/files/node/fileService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/keybinding/common/keybindingEditing", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, fs, os, path, json, keyCodes_1, platform_1, uuid, extfs, pfs_1, modeService_1, modeServiceImpl_1, modelService_1, modelServiceImpl_1, resolverService_1, resourceConfiguration_1, configuration_1, configurationService_1, testConfigurationService_1, contextkey_1, environment_1, files_1, instantiationServiceMock_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, mockKeybindingService_1, lifecycle_1, log_1, testNotificationService_1, telemetry_1, telemetryUtils_1, workspace_1, backup_1, editorService_1, fileService_1, editorGroupsService_1, keybindingEditing_1, textfiles_1, textModelResolverService_1, untitledEditorService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('KeybindingsEditing', () => {
        let instantiationService;
        let testObject;
        let testDir;
        let keybindingsFile;
        setup(() => {
            return setUpWorkspace().then(() => {
                keybindingsFile = path.join(testDir, 'keybindings.json');
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                instantiationService.stub(environment_1.IEnvironmentService, { appKeybindingsPath: keybindingsFile, appSettingsPath: path.join(testDir, 'settings.json') });
                instantiationService.stub(configuration_1.IConfigurationService, configurationService_1.ConfigurationService);
                instantiationService.stub(configuration_1.IConfigurationService, 'getValue', { 'eol': '\n' });
                instantiationService.stub(configuration_1.IConfigurationService, 'onDidUpdateConfiguration', () => { });
                instantiationService.stub(configuration_1.IConfigurationService, 'onDidChangeConfiguration', () => { });
                instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
                const lifecycleService = new workbenchTestServices_1.TestLifecycleService();
                instantiationService.stub(lifecycle_1.ILifecycleService, lifecycleService);
                instantiationService.stub(contextkey_1.IContextKeyService, instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService));
                instantiationService.stub(editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService());
                instantiationService.stub(editorService_1.IEditorService, new workbenchTestServices_1.TestEditorService());
                instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
                instantiationService.stub(modeService_1.IModeService, modeServiceImpl_1.ModeServiceImpl);
                instantiationService.stub(log_1.ILogService, new workbenchTestServices_1.TestLogService());
                instantiationService.stub(resourceConfiguration_1.ITextResourcePropertiesService, new workbenchTestServices_1.TestTextResourcePropertiesService(instantiationService.get(configuration_1.IConfigurationService)));
                instantiationService.stub(modelService_1.IModelService, instantiationService.createInstance(modelServiceImpl_1.ModelServiceImpl));
                instantiationService.stub(files_1.IFileService, new fileService_1.FileService(new workbenchTestServices_1.TestContextService(new workspace_1.Workspace(testDir, workspace_1.toWorkspaceFolders([{ path: testDir }]))), workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_1.TestTextResourceConfigurationService(), new testConfigurationService_1.TestConfigurationService(), lifecycleService, new workbenchTestServices_1.TestStorageService(), new testNotificationService_1.TestNotificationService(), { disableWatcher: true }));
                instantiationService.stub(untitledEditorService_1.IUntitledEditorService, instantiationService.createInstance(untitledEditorService_1.UntitledEditorService));
                instantiationService.stub(textfiles_1.ITextFileService, instantiationService.createInstance(workbenchTestServices_1.TestTextFileService));
                instantiationService.stub(resolverService_1.ITextModelService, instantiationService.createInstance(textModelResolverService_1.TextModelResolverService));
                instantiationService.stub(backup_1.IBackupFileService, new workbenchTestServices_1.TestBackupFileService());
                testObject = instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService);
            });
        });
        function setUpWorkspace() {
            return __awaiter(this, void 0, void 0, function* () {
                testDir = path.join(os.tmpdir(), 'vsctests', uuid.generateUuid());
                return yield pfs_1.mkdirp(testDir, 493);
            });
        }
        teardown(() => {
            return new Promise((c, e) => {
                if (testDir) {
                    extfs.del(testDir, os.tmpdir(), () => c(undefined), () => c(undefined));
                }
                else {
                    c(undefined);
                }
            }).then(() => testDir = null);
        });
        test('errors cases - parse errors', () => {
            fs.writeFileSync(keybindingsFile, ',,,,,,,,,,,,,,');
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ } }), 'alt+c', undefined)
                .then(() => assert.fail('Should fail with parse errors'), error => assert.equal(error.message, 'Unable to write to the keybindings configuration file. Please open it to correct errors/warnings in the file and try again.'));
        });
        test('errors cases - parse errors 2', () => {
            fs.writeFileSync(keybindingsFile, '[{"key": }]');
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ } }), 'alt+c', undefined)
                .then(() => assert.fail('Should fail with parse errors'), error => assert.equal(error.message, 'Unable to write to the keybindings configuration file. Please open it to correct errors/warnings in the file and try again.'));
        });
        test('errors cases - dirty', () => {
            instantiationService.stub(textfiles_1.ITextFileService, 'isDirty', true);
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ } }), 'alt+c', undefined)
                .then(() => assert.fail('Should fail with dirty error'), error => assert.equal(error.message, 'Unable to write because the keybindings configuration file is dirty. Please save it first and then try again.'));
        });
        test('errors cases - did not find an array', () => {
            fs.writeFileSync(keybindingsFile, '{"key": "alt+c", "command": "hello"}');
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ } }), 'alt+c', undefined)
                .then(() => assert.fail('Should fail with dirty error'), error => assert.equal(error.message, 'Unable to write to the keybindings configuration file. It has an object which is not of type Array. Please open the file to clean up and try again.'));
        });
        test('edit a default keybinding to an empty file', () => {
            fs.writeFileSync(keybindingsFile, '');
            const expected = [{ key: 'alt+c', command: 'a' }, { key: 'escape', command: '-a' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ }, command: 'a' }), 'alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('edit a default keybinding to a non existing keybindings file', () => {
            keybindingsFile = path.join(testDir, 'nonExistingFile.json');
            instantiationService.get(environment_1.IEnvironmentService).appKeybindingsPath = keybindingsFile;
            testObject = instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService);
            const expected = [{ key: 'alt+c', command: 'a' }, { key: 'escape', command: '-a' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ }, command: 'a' }), 'alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('edit a default keybinding to an empty array', () => {
            writeToKeybindingsFile();
            const expected = [{ key: 'alt+c', command: 'a' }, { key: 'escape', command: '-a' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ }, command: 'a' }), 'alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('edit a default keybinding in an existing array', () => {
            writeToKeybindingsFile({ command: 'b', key: 'shift+c' });
            const expected = [{ key: 'shift+c', command: 'b' }, { key: 'alt+c', command: 'a' }, { key: 'escape', command: '-a' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ }, command: 'a' }), 'alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('add a new default keybinding', () => {
            const expected = [{ key: 'alt+c', command: 'a' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a' }), 'alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('edit an user keybinding', () => {
            writeToKeybindingsFile({ key: 'escape', command: 'b' });
            const expected = [{ key: 'alt+c', command: 'b' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ }, command: 'b', isDefault: false }), 'alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('edit an user keybinding with more than one element', () => {
            writeToKeybindingsFile({ key: 'escape', command: 'b' }, { key: 'alt+shift+g', command: 'c' });
            const expected = [{ key: 'alt+c', command: 'b' }, { key: 'alt+shift+g', command: 'c' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ firstPart: { keyCode: 9 /* Escape */ }, command: 'b', isDefault: false }), 'alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('remove a default keybinding', () => {
            const expected = [{ key: 'alt+c', command: '-a' }];
            return testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'a', firstPart: { keyCode: 33 /* KEY_C */, modifiers: { altKey: true } } }))
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('remove a user keybinding', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: 'b' });
            return testObject.removeKeybinding(aResolvedKeybindingItem({ command: 'b', firstPart: { keyCode: 33 /* KEY_C */, modifiers: { altKey: true } }, isDefault: false }))
                .then(() => assert.deepEqual(getUserKeybindings(), []));
        });
        test('reset an edited keybinding', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: 'b' });
            return testObject.resetKeybinding(aResolvedKeybindingItem({ command: 'b', firstPart: { keyCode: 33 /* KEY_C */, modifiers: { altKey: true } }, isDefault: false }))
                .then(() => assert.deepEqual(getUserKeybindings(), []));
        });
        test('reset a removed keybinding', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: '-b' });
            return testObject.resetKeybinding(aResolvedKeybindingItem({ command: 'b', isDefault: false }))
                .then(() => assert.deepEqual(getUserKeybindings(), []));
        });
        test('reset multiple removed keybindings', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: '-b' });
            writeToKeybindingsFile({ key: 'alt+shift+c', command: '-b' });
            writeToKeybindingsFile({ key: 'escape', command: '-b' });
            return testObject.resetKeybinding(aResolvedKeybindingItem({ command: 'b', isDefault: false }))
                .then(() => assert.deepEqual(getUserKeybindings(), []));
        });
        test('add a new keybinding to unassigned keybinding', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: '-a' });
            const expected = [{ key: 'alt+c', command: '-a' }, { key: 'shift+alt+c', command: 'a' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false }), 'shift+alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('add when expression', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: '-a' });
            const expected = [{ key: 'alt+c', command: '-a' }, { key: 'shift+alt+c', command: 'a', when: 'editorTextFocus' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false }), 'shift+alt+c', 'editorTextFocus')
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('update command and when expression', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' });
            const expected = [{ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' }, { key: 'shift+alt+c', command: 'a', when: 'editorTextFocus' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false }), 'shift+alt+c', 'editorTextFocus')
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('update when expression', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' }, { key: 'shift+alt+c', command: 'a', when: 'editorTextFocus && !editorReadonly' });
            const expected = [{ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' }, { key: 'shift+alt+c', command: 'a', when: 'editorTextFocus' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false, when: 'editorTextFocus && !editorReadonly' }), 'shift+alt+c', 'editorTextFocus')
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        test('remove when expression', () => {
            writeToKeybindingsFile({ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' });
            const expected = [{ key: 'alt+c', command: '-a', when: 'editorTextFocus && !editorReadonly' }, { key: 'shift+alt+c', command: 'a' }];
            return testObject.editKeybinding(aResolvedKeybindingItem({ command: 'a', isDefault: false }), 'shift+alt+c', undefined)
                .then(() => assert.deepEqual(getUserKeybindings(), expected));
        });
        function writeToKeybindingsFile(...keybindings) {
            fs.writeFileSync(keybindingsFile, JSON.stringify(keybindings || []));
        }
        function getUserKeybindings() {
            return json.parse(fs.readFileSync(keybindingsFile).toString('utf8'));
        }
        function aResolvedKeybindingItem({ command, when, isDefault, firstPart, chordPart }) {
            const aSimpleKeybinding = function (part) {
                const { ctrlKey, shiftKey, altKey, metaKey } = part.modifiers || { ctrlKey: false, shiftKey: false, altKey: false, metaKey: false };
                return new keyCodes_1.SimpleKeybinding(ctrlKey, shiftKey, altKey, metaKey, part.keyCode);
            };
            let parts = [];
            if (firstPart) {
                parts.push(aSimpleKeybinding(firstPart));
                if (chordPart) {
                    parts.push(aSimpleKeybinding(chordPart));
                }
            }
            let keybinding = parts.length > 0 ? new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(new keyCodes_1.ChordKeybinding(parts), platform_1.OS) : null;
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem(keybinding, command || 'some command', null, when ? contextkey_1.ContextKeyExpr.deserialize(when) : null, isDefault === undefined ? true : isDefault);
        }
    });
});
//# sourceMappingURL=keybindingEditing.test.js.map