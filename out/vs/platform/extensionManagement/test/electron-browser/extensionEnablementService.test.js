var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "sinon", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/workspace/common/workspace", "vs/platform/environment/common/environment", "vs/platform/storage/common/storage", "vs/base/common/types"], function (require, exports, assert, sinon, extensionManagement_1, extensionEnablementService_1, instantiationServiceMock_1, event_1, workspace_1, environment_1, storage_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function storageService(instantiationService) {
        let service = instantiationService.get(storage_1.IStorageService);
        if (!service) {
            let workspaceContextService = instantiationService.get(workspace_1.IWorkspaceContextService);
            if (!workspaceContextService) {
                workspaceContextService = instantiationService.stub(workspace_1.IWorkspaceContextService, {
                    getWorkbenchState: () => 2 /* FOLDER */,
                });
            }
            service = instantiationService.stub(storage_1.IStorageService, new storage_1.InMemoryStorageService());
        }
        return service;
    }
    class TestExtensionEnablementService extends extensionEnablementService_1.ExtensionEnablementService {
        constructor(instantiationService) {
            super(storageService(instantiationService), instantiationService.get(workspace_1.IWorkspaceContextService), instantiationService.get(environment_1.IEnvironmentService) || instantiationService.stub(environment_1.IEnvironmentService, {}), instantiationService.get(extensionManagement_1.IExtensionManagementService) || instantiationService.stub(extensionManagement_1.IExtensionManagementService, { onDidInstallExtension: new event_1.Emitter().event, onDidUninstallExtension: new event_1.Emitter().event }));
        }
        reset() {
            return __awaiter(this, void 0, void 0, function* () {
                return this.getDisabledExtensions().then(extensions => extensions.forEach(d => this.setEnablement([aLocalExtension(d.id)], 2 /* Enabled */)));
            });
        }
    }
    exports.TestExtensionEnablementService = TestExtensionEnablementService;
    suite('ExtensionEnablementService Test', () => {
        let instantiationService;
        let testObject;
        const didUninstallEvent = new event_1.Emitter();
        const didInstallEvent = new event_1.Emitter();
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, { onDidUninstallExtension: didUninstallEvent.event, onDidInstallExtension: didInstallEvent.event, getInstalled: () => Promise.resolve([]) });
            testObject = new TestExtensionEnablementService(instantiationService);
        });
        teardown(() => {
            testObject.dispose();
        });
        test('test when no extensions are disabled', () => {
            return testObject.getDisabledExtensions().then(extensions => assert.deepEqual([], extensions));
        });
        test('test when no extensions are disabled for workspace when there is no workspace', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => {
                instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkbenchState', 1 /* EMPTY */);
                return testObject.getDisabledExtensions().then(extensions => assert.deepEqual([], extensions));
            });
        });
        test('test disable an extension globally', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([{ id: 'pub.a' }], extensions));
        });
        test('test disable an extension globally should return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(value => assert.ok(value));
        });
        test('test disable an extension globally triggers the change event', () => {
            const target = sinon.spy();
            testObject.onEnablementChanged(target);
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension globally again should return a falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(value => assert.ok(!value[0]));
        });
        test('test state of globally disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 0 /* Disabled */));
        });
        test('test state of globally enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* Enabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 2 /* Enabled */));
        });
        test('test disable an extension for workspace', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([{ id: 'pub.a' }], extensions));
        });
        test('test disable an extension for workspace returns a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(value => assert.ok(value));
        });
        test('test disable an extension for workspace again should return a falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */))
                .then(value => assert.ok(!value[0]));
        });
        test('test state of workspace disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 1 /* WorkspaceDisabled */));
        });
        test('test state of workspace and globally disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 1 /* WorkspaceDisabled */));
        });
        test('test state of workspace enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 3 /* WorkspaceEnabled */));
        });
        test('test state of globally disabled and workspace enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 3 /* WorkspaceEnabled */));
        });
        test('test state of an extension when disabled for workspace from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 1 /* WorkspaceDisabled */));
        });
        test('test state of an extension when disabled globally from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 0 /* Disabled */));
        });
        test('test state of an extension when disabled globally from workspace disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 0 /* Disabled */));
        });
        test('test state of an extension when enabled globally from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* Enabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 2 /* Enabled */));
        });
        test('test state of an extension when enabled globally from workspace disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* Enabled */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 2 /* Enabled */));
        });
        test('test disable an extension for workspace and then globally', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([{ id: 'pub.a' }], extensions));
        });
        test('test disable an extension for workspace and then globally return a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(value => assert.ok(value));
        });
        test('test disable an extension for workspace and then globally trigger the change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension globally and then for workspace', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */))
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([{ id: 'pub.a' }], extensions));
        });
        test('test disable an extension globally and then for workspace return a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */))
                .then(value => assert.ok(value));
        });
        test('test disable an extension globally and then for workspace triggers the change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension for workspace when there is no workspace throws error', () => {
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkbenchState', 1 /* EMPTY */);
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => assert.fail('should throw an error'), error => assert.ok(error));
        });
        test('test enable an extension globally', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* Enabled */))
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([], extensions));
        });
        test('test enable an extension globally return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* Enabled */))
                .then(value => assert.ok(value));
        });
        test('test enable an extension globally triggers change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* Enabled */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test enable an extension globally when already enabled return falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* Enabled */)
                .then(value => assert.ok(!value[0]));
        });
        test('test enable an extension for workspace', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */))
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([], extensions));
        });
        test('test enable an extension for workspace return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */))
                .then(value => assert.ok(value));
        });
        test('test enable an extension for workspace triggers change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.b')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.b')], 3 /* WorkspaceEnabled */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.b' });
            });
        });
        test('test enable an extension for workspace when already enabled return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */)
                .then(value => assert.ok(value));
        });
        test('test enable an extension for workspace when disabled in workspace and gloablly', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* WorkspaceEnabled */))
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([], extensions));
        });
        test('test enable an extension globally when disabled in workspace and gloablly', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* Enabled */))
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([], extensions));
        });
        test('test installing an extension re-eanbles it when disabled globally', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 0 /* Disabled */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            const extensions = yield testObject.getDisabledExtensions();
            assert.deepEqual([], extensions);
        }));
        test('test updating an extension does not re-eanbles it when disabled globally', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 0 /* Disabled */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            const extensions = yield testObject.getDisabledExtensions();
            assert.deepEqual([{ id: 'pub.a' }], extensions);
        }));
        test('test installing an extension fires enablement change event when disabled globally', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 0 /* Disabled */);
            return new Promise((c, e) => {
                testObject.onEnablementChanged(([e]) => {
                    if (e.identifier.id === local.identifier.id) {
                        c();
                    }
                });
                didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            });
        }));
        test('test updating an extension does not fires enablement change event when disabled globally', () => __awaiter(this, void 0, void 0, function* () {
            const target = sinon.spy();
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 0 /* Disabled */);
            testObject.onEnablementChanged(target);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            assert.ok(!target.called);
        }));
        test('test installing an extension re-eanbles it when workspace disabled', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 1 /* WorkspaceDisabled */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            const extensions = yield testObject.getDisabledExtensions();
            assert.deepEqual([], extensions);
        }));
        test('test updating an extension does not re-eanbles it when workspace disabled', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 1 /* WorkspaceDisabled */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            const extensions = yield testObject.getDisabledExtensions();
            assert.deepEqual([{ id: 'pub.a' }], extensions);
        }));
        test('test installing an extension fires enablement change event when workspace disabled', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 1 /* WorkspaceDisabled */);
            return new Promise((c, e) => {
                testObject.onEnablementChanged(([e]) => {
                    if (e.identifier.id === local.identifier.id) {
                        c();
                    }
                });
                didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            });
        }));
        test('test updating an extension does not fires enablement change event when workspace disabled', () => __awaiter(this, void 0, void 0, function* () {
            const target = sinon.spy();
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 1 /* WorkspaceDisabled */);
            testObject.onEnablementChanged(target);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            assert.ok(!target.called);
        }));
        test('test installing an extension should not fire enablement change event when extension is not disabled', () => __awaiter(this, void 0, void 0, function* () {
            const target = sinon.spy();
            const local = aLocalExtension('pub.a');
            testObject.onEnablementChanged(target);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            assert.ok(!target.called);
        }));
        test('test remove an extension from disablement list when uninstalled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */))
                .then(() => didUninstallEvent.fire({ identifier: { id: 'pub.a' } }))
                .then(() => testObject.getDisabledExtensions())
                .then(extensions => assert.deepEqual([], extensions));
        });
        test('test isEnabled return false extension is disabled globally', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 0 /* Disabled */)
                .then(() => assert.ok(!testObject.isEnabled(aLocalExtension('pub.a'))));
        });
        test('test isEnabled return false extension is disabled in workspace', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => assert.ok(!testObject.isEnabled(aLocalExtension('pub.a'))));
        });
        test('test isEnabled return true extension is not disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 1 /* WorkspaceDisabled */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.c')], 0 /* Disabled */))
                .then(() => assert.ok(testObject.isEnabled(aLocalExtension('pub.b'))));
        });
        test('test canChangeEnablement return false for language packs', () => {
            assert.equal(testObject.canChangeEnablement(aLocalExtension('pub.a', { localizations: [{ languageId: 'gr', translations: [{ id: 'vscode', path: 'path' }] }] })), false);
        });
        test('test canChangeEnablement return false when extensions are disabled in environment', () => {
            instantiationService.stub(environment_1.IEnvironmentService, { disableExtensions: true });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.equal(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return false when the extension is disabled in environment', () => {
            instantiationService.stub(environment_1.IEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.equal(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return true for system extensions when extensions are disabled in environment', () => {
            instantiationService.stub(environment_1.IEnvironmentService, { disableExtensions: true });
            testObject = new TestExtensionEnablementService(instantiationService);
            const extension = aLocalExtension('pub.a', undefined, 0 /* System */);
            assert.equal(testObject.canChangeEnablement(extension), true);
        });
        test('test canChangeEnablement return false for system extensions when extension is disabled in environment', () => {
            instantiationService.stub(environment_1.IEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            const extension = aLocalExtension('pub.a', undefined, 0 /* System */);
            assert.equal(testObject.canChangeEnablement(extension), true);
        });
        test('test getDisabledExtensions include extensions disabled in enviroment', () => {
            instantiationService.stub(environment_1.IEnvironmentService, { disableExtensions: ['pub.a'] });
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, { onDidUninstallExtension: didUninstallEvent.event, onDidInstallExtension: didInstallEvent.event, getInstalled: () => Promise.resolve([aLocalExtension('pub.a'), aLocalExtension('pub.b')]) });
            testObject = new TestExtensionEnablementService(instantiationService);
            return testObject.getDisabledExtensions()
                .then(actual => {
                assert.equal(actual.length, 1);
                assert.equal(actual[0].id, 'pub.a');
            });
        });
    });
    function aLocalExtension(id, contributes, type) {
        const [publisher, name] = id.split('.');
        type = types_1.isUndefinedOrNull(type) ? 1 /* User */ : type;
        return Object.create({
            identifier: { id },
            galleryIdentifier: { id, uuid: undefined },
            manifest: {
                name,
                publisher,
                contributes
            },
            type
        });
    }
});
//# sourceMappingURL=extensionEnablementService.test.js.map