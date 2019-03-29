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
define(["require", "exports", "assert", "vs/base/common/objects", "vs/base/common/uuid", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/electron-browser/extensionsActions", "vs/workbench/contrib/extensions/node/extensionsWorkbenchService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionManagementService", "vs/workbench/contrib/extensions/electron-browser/extensionTipsService", "vs/platform/extensionManagement/test/electron-browser/extensionEnablementService.test", "vs/platform/extensionManagement/node/extensionGalleryService", "vs/platform/url/common/url", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/test/workbenchTestServices", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/windows/common/windows", "vs/platform/url/common/urlService", "vs/base/common/uri", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/extensions/electron-browser/extensionManagementServerService", "vs/workbench/services/remote/node/remoteAgentService", "vs/workbench/services/remote/electron-browser/remoteAgentServiceImpl", "vs/platform/extensions/common/extensions", "vs/platform/ipc/electron-browser/sharedProcessService"], function (require, exports, assert, objects_1, uuid_1, extensions_1, ExtensionsActions, extensionsWorkbenchService_1, extensionManagement_1, extensionManagementUtil_1, extensionManagementService_1, extensionTipsService_1, extensionEnablementService_test_1, extensionGalleryService_1, url_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, extensions_2, workspace_1, workbenchTestServices_1, configuration_1, log_1, windows_1, urlService_1, uri_1, testConfigurationService_1, extensionManagementServerService_1, remoteAgentService_1, remoteAgentServiceImpl_1, extensions_3, sharedProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsActions Test', () => {
        let instantiationService;
        let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
        suiteSetup(() => {
            installEvent = new event_1.Emitter();
            didInstallEvent = new event_1.Emitter();
            uninstallEvent = new event_1.Emitter();
            didUninstallEvent = new event_1.Emitter();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
            instantiationService.stub(windows_1.IWindowService, workbenchTestServices_1.TestWindowService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(sharedProcessService_1.ISharedProcessService, workbenchTestServices_1.TestSharedProcessService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, extensionManagementService_1.ExtensionManagementService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onInstallExtension', installEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidInstallExtension', didInstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onUninstallExtension', uninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidUninstallExtension', didUninstallEvent.event);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentServiceImpl_1.RemoteAgentService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementServerService, instantiationService.createInstance(extensionManagementServerService_1.ExtensionManagementServerService, { authority: 'vscode-local', extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService), label: 'local' }));
            instantiationService.stub(extensionManagement_1.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.set(extensionManagement_1.IExtensionTipsService, instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService));
            instantiationService.stub(url_1.IURLService, urlService_1.URLService);
        });
        setup(() => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getExtensionsReport', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            instantiationService.stub(extensions_2.IExtensionService, { getExtensions: () => Promise.resolve([]), onDidChangeExtensions: new event_1.Emitter().event, canAddExtension: (extension) => false, canRemoveExtension: (extension) => false });
            yield instantiationService.get(extensionManagement_1.IExtensionEnablementService).reset();
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
        }));
        teardown(() => {
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).dispose();
        });
        test('Install action is disabled when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            assert.ok(!testObject.enabled);
        });
        test('Test Install action when state is installed', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return workbenchService.queryLocal()
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier })));
                return workbenchService.queryGallery()
                    .then((paged) => {
                    testObject.extension = paged.firstPage[0];
                    assert.ok(!testObject.enabled);
                    assert.equal('Install', testObject.label);
                    assert.equal('extension-action prominent install', testObject.class);
                });
            });
        });
        test('Test Install action when state is installing', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery()
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
                assert.equal('Installing', testObject.label);
                assert.equal('extension-action install installing', testObject.class);
            });
        });
        test('Test Install action when state is uninstalled', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery()
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                assert.ok(testObject.enabled);
                assert.equal('Install', testObject.label);
            });
        });
        test('Test Install action when extension is system action', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                uninstallEvent.fire(local.identifier);
                didUninstallEvent.fire({ identifier: local.identifier });
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test Install action when extension doesnot has gallery', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                uninstallEvent.fire(local.identifier);
                didUninstallEvent.fire({ identifier: local.identifier });
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Uninstall action is disabled when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            assert.ok(!testObject.enabled);
        });
        test('Test Uninstall action when state is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
                assert.equal('Uninstalling', testObject.label);
                assert.equal('extension-action uninstall uninstalling', testObject.class);
            });
        });
        test('Test Uninstall action when state is installed and is user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.equal('Uninstall', testObject.label);
                assert.equal('extension-action uninstall', testObject.class);
            });
        });
        test('Test Uninstall action when state is installed and is system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
                assert.equal('Uninstall', testObject.label);
                assert.equal('extension-action uninstall', testObject.class);
            });
        });
        test('Test Uninstall action when state is installing and is user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const gallery = aGalleryExtension('a');
                const extension = extensions[0];
                extension.gallery = gallery;
                installEvent.fire({ identifier: gallery.identifier, gallery });
                testObject.extension = extension;
                assert.ok(!testObject.enabled);
            });
        });
        test('Test Uninstall action after extension is installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then(paged => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
                assert.ok(testObject.enabled);
                assert.equal('Uninstall', testObject.label);
                assert.equal('extension-action uninstall', testObject.class);
            });
        });
        test('Test CombinedInstallAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            assert.ok(!testObject.enabled);
            assert.equal('extension-action prominent install no-extension', testObject.class);
        });
        test('Test CombinedInstallAction when extension is system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
                assert.equal('extension-action prominent install no-extension', testObject.class);
            });
        });
        test('Test CombinedInstallAction when installAction is enabled', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery()
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                assert.ok(testObject.enabled);
                assert.equal('Install', testObject.label);
                assert.equal('extension-action prominent install', testObject.class);
            });
        });
        test('Test CombinedInstallAction when unInstallAction is enabled', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.equal('Uninstall', testObject.label);
                assert.equal('extension-action uninstall', testObject.class);
            });
        });
        test('Test CombinedInstallAction when state is installing', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery()
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
                assert.equal('Installing', testObject.label);
                assert.equal('extension-action install installing', testObject.class);
            });
        });
        test('Test CombinedInstallAction when state is installing during update', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const gallery = aGalleryExtension('a');
                const extension = extensions[0];
                extension.gallery = gallery;
                testObject.extension = extension;
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
                assert.equal('Installing', testObject.label);
                assert.equal('extension-action install installing', testObject.class);
            });
        });
        test('Test CombinedInstallAction when state is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.CombinedInstallAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
                assert.equal('Uninstalling', testObject.label);
                assert.equal('extension-action uninstall uninstalling', testObject.class);
            });
        });
        test('Test UpdateAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            assert.ok(!testObject.enabled);
        });
        test('Test UpdateAction when extension is uninstalled', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test UpdateAction when extension is installed and not outdated', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: local.manifest.version })));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                    .then(extensions => assert.ok(!testObject.enabled));
            });
        });
        test('Test UpdateAction when extension is installed outdated and system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', { version: '1.0.0' }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' })));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                    .then(extensions => assert.ok(!testObject.enabled));
            });
        });
        test('Test UpdateAction when extension is installed outdated and user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            return workbenchService.queryLocal()
                .then((extensions) => __awaiter(this, void 0, void 0, function* () {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' })));
                assert.ok(!testObject.enabled);
                return new Promise(c => {
                    testObject.onDidChange(() => {
                        if (testObject.enabled) {
                            c();
                        }
                    });
                    instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery();
                });
            }));
        });
        test('Test UpdateAction when extension is installing and outdated and user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' });
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                    .then(extensions => {
                    installEvent.fire({ identifier: local.identifier, gallery });
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test ManageExtensionAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            assert.ok(!testObject.enabled);
        });
        test('Test ManageExtensionAction when extension is installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.equal('extension-action manage', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is uninstalled', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then(page => {
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
                assert.equal('extension-action manage hide', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is installing', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then(page => {
                testObject.extension = page.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
                assert.equal('extension-action manage hide', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is queried from gallery and installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then(page => {
                testObject.extension = page.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
                assert.ok(testObject.enabled);
                assert.equal('extension-action manage', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.equal('extension-action manage', testObject.class);
                assert.equal('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
                assert.equal('extension-action manage', testObject.class);
                assert.equal('Uninstalling', testObject.tooltip);
            });
        });
        test('Test EnableForWorkspaceAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableForWorkspaceAction when there extension is not disabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableForWorkspaceAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableForWorkspaceAction when extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 1 /* WorkspaceDisabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableForWorkspaceAction when the extension is disabled globally and workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 1 /* WorkspaceDisabled */))
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableGloballyAction when the extension is not disabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableGloballyAction when the extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 1 /* WorkspaceDisabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when the extension is disabled in both', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 1 /* WorkspaceDisabled */))
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test EnableAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableDropDownAction when extension is installed and enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is installed and disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableDropDownAction when extension is installed and disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 1 /* WorkspaceDisabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableDropDownAction when extension is uninstalled', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is installing', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = page.firstPage[0];
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is uninstalling', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableForWorkspaceAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
            assert.ok(!testObject.enabled);
        });
        test('Test DisableForWorkspaceAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableForWorkspaceAction when the extension is disabled workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableForWorkspaceAction when extension is enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
            assert.ok(!testObject.enabled);
        });
        test('Test DisableGloballyAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when the extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 1 /* WorkspaceDisabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when the extension is enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableDropDownAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, []);
            assert.ok(!testObject.enabled);
        });
        test('Test DisableDropDownAction when extension is installed and enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableDropDownAction when extension is installed and disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableDropDownAction when extension is installed and disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 1 /* WorkspaceDisabled */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableDropDownAction when extension is uninstalled', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableDropDownAction when extension is installing', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = page.firstPage[0];
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableDropDownAction when extension is uninstalling', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableDropDownAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
            });
        });
        test('Test UpdateAllAction when no installed extensions', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            assert.ok(!testObject.enabled);
        });
        test('Test UpdateAllAction when installed extensions are not outdated', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a'), aLocalExtension('b')]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => assert.ok(!testObject.enabled));
        });
        test('Test UpdateAllAction when some installed extensions are outdated', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            const local = [aLocalExtension('a', { version: '1.0.1' }), aLocalExtension('b', { version: '1.0.1' }), aLocalExtension('c', { version: '1.0.1' })];
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', local);
            return workbenchService.queryLocal()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local[0].identifier, version: '1.0.2' }), aGalleryExtension('b', { identifier: local[1].identifier, version: '1.0.2' }), aGalleryExtension('c', local[2].manifest)));
                assert.ok(!testObject.enabled);
                return new Promise(c => {
                    testObject.onDidChange(() => {
                        if (testObject.enabled) {
                            c();
                        }
                    });
                    workbenchService.queryGallery();
                });
            }));
        });
        test('Test UpdateAllAction when some installed extensions are outdated and some outdated are being installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            const local = [aLocalExtension('a', { version: '1.0.1' }), aLocalExtension('b', { version: '1.0.1' }), aLocalExtension('c', { version: '1.0.1' })];
            const gallery = [aGalleryExtension('a', { identifier: local[0].identifier, version: '1.0.2' }), aGalleryExtension('b', { identifier: local[1].identifier, version: '1.0.2' }), aGalleryExtension('c', local[2].manifest)];
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', local);
            return workbenchService.queryLocal()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...gallery));
                assert.ok(!testObject.enabled);
                return new Promise(c => {
                    installEvent.fire({ identifier: local[0].identifier, gallery: gallery[0] });
                    testObject.onDidChange(() => {
                        if (testObject.enabled) {
                            c();
                        }
                    });
                    workbenchService.queryGallery();
                });
            }));
        });
        test('Test UpdateAllAction when some installed extensions are outdated and all outdated are being installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAllAction, 'id', 'label');
            const local = [aLocalExtension('a', { version: '1.0.1' }), aLocalExtension('b', { version: '1.0.1' }), aLocalExtension('c', { version: '1.0.1' })];
            const gallery = [aGalleryExtension('a', { identifier: local[0].identifier, version: '1.0.2' }), aGalleryExtension('b', { identifier: local[1].identifier, version: '1.0.2' }), aGalleryExtension('c', local[2].manifest)];
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', local);
            return workbenchService.queryLocal()
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...gallery));
                return workbenchService.queryGallery()
                    .then(() => {
                    installEvent.fire({ identifier: local[0].identifier, gallery: gallery[0] });
                    installEvent.fire({ identifier: local[1].identifier, gallery: gallery[1] });
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test ReloadAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension state is installing', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery()
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test ReloadAction when extension state is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
            });
        });
        test('Test ReloadAction when extension is newly installed', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = yield instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery();
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            return new Promise(c => {
                testObject.onDidChange(() => {
                    if (testObject.enabled && testObject.tooltip === 'Please reload Visual Studio Code to complete the installation of this extension.') {
                        c();
                    }
                });
                installEvent.fire({ identifier: gallery.identifier, gallery });
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
            });
        }));
        test('Test ReloadAction when extension is installed and uninstalled', () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery()
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                const identifier = gallery.identifier;
                installEvent.fire({ identifier, gallery });
                didInstallEvent.fire({ identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, { identifier }) });
                uninstallEvent.fire(identifier);
                didUninstallEvent.fire({ identifier });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test ReloadAction when extension is uninstalled', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = yield instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            return new Promise(c => {
                testObject.onDidChange(() => {
                    if (testObject.enabled && testObject.tooltip === 'Please reload Visual Studio Code to complete the uninstallation of this extension.') {
                        c();
                    }
                });
                uninstallEvent.fire(local.identifier);
                didUninstallEvent.fire({ identifier: local.identifier });
            });
        }));
        test('Test ReloadAction when extension is uninstalled and installed', () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), version: '1.0.0', extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                didUninstallEvent.fire({ identifier: local.identifier });
                const gallery = aGalleryExtension('a');
                const identifier = gallery.identifier;
                installEvent.fire({ identifier, gallery });
                didInstallEvent.fire({ identifier, gallery, operation: 1 /* Install */, local });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test ReloadAction when extension is updated while running', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), version: '1.0.1', extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', { version: '1.0.1' });
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = yield workbenchService.queryLocal();
            testObject.extension = extensions[0];
            return new Promise(c => {
                testObject.onDidChange(() => {
                    if (testObject.enabled && testObject.tooltip === 'Please reload Visual Studio Code to complete the updating of this extension.') {
                        c();
                    }
                });
                const gallery = aGalleryExtension('a', { uuid: local.identifier.id, version: '1.0.2' });
                installEvent.fire({ identifier: gallery.identifier, gallery });
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
            });
        }));
        test('Test ReloadAction when extension is updated when not running', () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const local = aLocalExtension('a', { version: '1.0.1' });
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
                const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return workbenchService.queryLocal()
                    .then(extensions => {
                    testObject.extension = extensions[0];
                    const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.2' });
                    installEvent.fire({ identifier: gallery.identifier, gallery });
                    didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test ReloadAction when extension is disabled when running', () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return workbenchService.queryLocal().then(extensions => {
                testObject.extension = extensions[0];
                return workbenchService.setEnablement(extensions[0], 0 /* Disabled */)
                    .then(() => testObject.update())
                    .then(() => {
                    assert.ok(testObject.enabled);
                    assert.equal('Please reload Visual Studio Code to complete the disabling of this extension.', testObject.tooltip);
                });
            });
        });
        test('Test ReloadAction when extension enablement is toggled when running', () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), version: '1.0.0', extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a');
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return workbenchService.queryLocal().
                then(extensions => {
                testObject.extension = extensions[0];
                return workbenchService.setEnablement(extensions[0], 0 /* Disabled */)
                    .then(() => workbenchService.setEnablement(extensions[0], 2 /* Enabled */))
                    .then(() => assert.ok(!testObject.enabled));
            });
        });
        test('Test ReloadAction when extension is enabled when not running', () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
                const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return workbenchService.queryLocal()
                    .then(extensions => {
                    testObject.extension = extensions[0];
                    return workbenchService.setEnablement(extensions[0], 2 /* Enabled */)
                        .then(() => testObject.update())
                        .then(() => {
                        assert.ok(testObject.enabled);
                        assert.equal('Please reload Visual Studio Code to complete the enabling of this extension.', testObject.tooltip);
                    });
                });
            });
        });
        test('Test ReloadAction when extension enablement is toggled when not running', () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
                const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return workbenchService.queryLocal()
                    .then(extensions => {
                    testObject.extension = extensions[0];
                    return workbenchService.setEnablement(extensions[0], 2 /* Enabled */)
                        .then(() => workbenchService.setEnablement(extensions[0], 0 /* Disabled */))
                        .then(() => assert.ok(!testObject.enabled));
                });
            });
        });
        test('Test ReloadAction when extension is updated when not running and enabled', () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const local = aLocalExtension('a', { version: '1.0.1' });
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([local], 0 /* Disabled */)
                .then(() => {
                const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
                const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return workbenchService.queryLocal()
                    .then(extensions => {
                    testObject.extension = extensions[0];
                    const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.2' });
                    installEvent.fire({ identifier: gallery.identifier, gallery });
                    didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', gallery, gallery) });
                    return workbenchService.setEnablement(extensions[0], 2 /* Enabled */)
                        .then(() => testObject.update())
                        .then(() => {
                        assert.ok(testObject.enabled);
                        assert.equal('Please reload Visual Studio Code to complete the enabling of this extension.', testObject.tooltip);
                    });
                });
            });
        });
        test('Test ReloadAction when a localization extension is newly installed', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.b'), extensionLocation: uri_1.URI.file('pub.b') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = yield instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery();
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, gallery });
            didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', Object.assign({}, gallery, { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }), gallery) });
            assert.ok(!testObject.enabled);
        }));
        test('Test ReloadAction when a localization extension is updated while running', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), version: '1.0.1', extensionLocation: uri_1.URI.file('pub.a') }]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.get(extensions_1.IExtensionsWorkbenchService).onChange(() => testObject.update());
            const local = aLocalExtension('a', { version: '1.0.1', contributes: { localizations: [{ languageId: 'de', translations: [] }] } });
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = yield workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { uuid: local.identifier.id, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, gallery });
            didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension('a', Object.assign({}, gallery, { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }), gallery) });
            assert.ok(!testObject.enabled);
        }));
        test(`RecommendToFolderAction`, () => {
            // TODO: Implement test
        });
        function aLocalExtension(name = 'someext', manifest = {}, properties = {}) {
            manifest = objects_1.assign({ name, publisher: 'pub', version: '1.0.0' }, manifest);
            properties = objects_1.assign({
                type: 1 /* User */,
                location: uri_1.URI.file(`pub.${name}`),
                identifier: { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name), uuid: undefined },
                metadata: { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name), publisherId: manifest.publisher, publisherDisplayName: 'somename' }
            }, properties);
            return Object.create(Object.assign({ manifest }, properties));
        }
        function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = {}) {
            const galleryExtension = Object.create({});
            objects_1.assign(galleryExtension, { name, publisher: 'pub', version: '1.0.0', properties: {}, assets: {} }, properties);
            objects_1.assign(galleryExtension.properties, { dependencies: [] }, galleryExtensionProperties);
            objects_1.assign(galleryExtension.assets, assets);
            galleryExtension.identifier = { id: extensionManagementUtil_1.getGalleryExtensionId(galleryExtension.publisher, galleryExtension.name), uuid: uuid_1.generateUuid() };
            return galleryExtension;
        }
        function aPage(...objects) {
            return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
        }
    });
});
//# sourceMappingURL=extensionsActions.test.js.map