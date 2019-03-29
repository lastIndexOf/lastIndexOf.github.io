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
define(["require", "exports", "sinon", "assert", "fs", "vs/base/common/objects", "vs/base/common/uuid", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/node/extensionsWorkbenchService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionManagementService", "vs/workbench/contrib/extensions/electron-browser/extensionTipsService", "vs/platform/extensionManagement/test/electron-browser/extensionEnablementService.test", "vs/platform/extensionManagement/node/extensionGalleryService", "vs/platform/url/common/url", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/test/workbenchTestServices", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/windows/common/windows", "vs/platform/progress/common/progress", "vs/workbench/services/progress/browser/progressService2", "vs/platform/notification/common/notification", "vs/platform/url/common/urlService", "vs/base/common/uri", "vs/base/common/cancellation", "vs/workbench/services/extensions/electron-browser/extensionManagementServerService", "vs/workbench/services/remote/node/remoteAgentService", "vs/workbench/services/remote/electron-browser/remoteAgentServiceImpl", "vs/platform/ipc/electron-browser/sharedProcessService"], function (require, exports, sinon, assert, fs, objects_1, uuid_1, extensions_1, extensionsWorkbenchService_1, extensionManagement_1, extensionManagementUtil_1, extensionManagementService_1, extensionTipsService_1, extensionEnablementService_test_1, extensionGalleryService_1, url_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, workspace_1, workbenchTestServices_1, configuration_1, log_1, windows_1, progress_1, progressService2_1, notification_1, urlService_1, uri_1, cancellation_1, extensionManagementServerService_1, remoteAgentService_1, remoteAgentServiceImpl_1, sharedProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsWorkbenchServiceTest', () => {
        let instantiationService;
        let testObject;
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
            instantiationService.stub(progress_1.IProgressService2, progressService2_1.ProgressService2);
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(url_1.IURLService, urlService_1.URLService);
            instantiationService.stub(sharedProcessService_1.ISharedProcessService, workbenchTestServices_1.TestSharedProcessService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(configuration_1.IConfigurationService, {
                onDidUpdateConfiguration: () => { },
                onDidChangeConfiguration: () => { },
                getConfiguration: () => ({}),
                getValue: (key) => {
                    return (key === extensions_1.AutoCheckUpdatesConfigurationKey || key === extensions_1.AutoUpdateConfigurationKey) ? true : undefined;
                }
            });
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentServiceImpl_1.RemoteAgentService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementServerService, instantiationService.createInstance(extensionManagementServerService_1.ExtensionManagementServerService, { authority: 'vscode-local', extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService), label: 'local' }));
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, extensionManagementService_1.ExtensionManagementService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onInstallExtension', installEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidInstallExtension', didInstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onUninstallExtension', uninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidUninstallExtension', didUninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.set(extensionManagement_1.IExtensionTipsService, instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService));
            instantiationService.stub(notification_1.INotificationService, { prompt: () => null });
        });
        setup(() => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getExtensionsReport', []);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            instantiationService.stubPromise(notification_1.INotificationService, 'prompt', 0);
            yield instantiationService.get(extensionManagement_1.IExtensionEnablementService).reset();
        }));
        teardown(() => {
            testObject.dispose();
        });
        test('test gallery extension', () => __awaiter(this, void 0, void 0, function* () {
            const expected = aGalleryExtension('expectedName', {
                displayName: 'expectedDisplayName',
                version: '1.5',
                publisherId: 'expectedPublisherId',
                publisher: 'expectedPublisher',
                publisherDisplayName: 'expectedPublisherDisplayName',
                description: 'expectedDescription',
                installCount: 1000,
                rating: 4,
                ratingCount: 100
            }, {
                dependencies: ['pub.1', 'pub.2'],
            }, {
                manifest: { uri: 'uri:manifest', fallbackUri: 'fallback:manifest' },
                readme: { uri: 'uri:readme', fallbackUri: 'fallback:readme' },
                changelog: { uri: 'uri:changelog', fallbackUri: 'fallback:changlog' },
                download: { uri: 'uri:download', fallbackUri: 'fallback:download' },
                icon: { uri: 'uri:icon', fallbackUri: 'fallback:icon' },
                license: { uri: 'uri:license', fallbackUri: 'fallback:license' },
                repository: { uri: 'uri:repository', fallbackUri: 'fallback:repository' },
                coreTranslations: {}
            });
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(expected));
            return testObject.queryGallery().then(pagedResponse => {
                assert.equal(1, pagedResponse.firstPage.length);
                const actual = pagedResponse.firstPage[0];
                assert.equal(null, actual.type);
                assert.equal('expectedName', actual.name);
                assert.equal('expectedDisplayName', actual.displayName);
                assert.equal('expectedpublisher.expectedname', actual.identifier.id);
                assert.equal('expectedPublisher', actual.publisher);
                assert.equal('expectedPublisherDisplayName', actual.publisherDisplayName);
                assert.equal('1.5', actual.version);
                assert.equal('1.5', actual.latestVersion);
                assert.equal('expectedDescription', actual.description);
                assert.equal('uri:icon', actual.iconUrl);
                assert.equal('fallback:icon', actual.iconUrlFallback);
                assert.equal('uri:license', actual.licenseUrl);
                assert.equal(3 /* Uninstalled */, actual.state);
                assert.equal(1000, actual.installCount);
                assert.equal(4, actual.rating);
                assert.equal(100, actual.ratingCount);
                assert.equal(false, actual.outdated);
                assert.deepEqual(['pub.1', 'pub.2'], actual.dependencies);
            });
        }));
        test('test for empty installed extensions', () => __awaiter(this, void 0, void 0, function* () {
            testObject = yield aWorkbenchService();
            assert.deepEqual([], testObject.local);
        }));
        test('test for installed extensions', () => __awaiter(this, void 0, void 0, function* () {
            const expected1 = aLocalExtension('local1', {
                publisher: 'localPublisher1',
                version: '1.1.0',
                displayName: 'localDisplayName1',
                description: 'localDescription1',
                icon: 'localIcon1',
                extensionDependencies: ['pub.1', 'pub.2'],
            }, {
                type: 1 /* User */,
                readmeUrl: 'localReadmeUrl1',
                changelogUrl: 'localChangelogUrl1',
                location: uri_1.URI.file('localPath1')
            });
            const expected2 = aLocalExtension('local2', {
                publisher: 'localPublisher2',
                version: '1.2.0',
                displayName: 'localDisplayName2',
                description: 'localDescription2',
            }, {
                type: 0 /* System */,
                readmeUrl: 'localReadmeUrl2',
                changelogUrl: 'localChangelogUrl2',
            });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [expected1, expected2]);
            testObject = yield aWorkbenchService();
            const actuals = testObject.local;
            assert.equal(2, actuals.length);
            let actual = actuals[0];
            assert.equal(1 /* User */, actual.type);
            assert.equal('local1', actual.name);
            assert.equal('localDisplayName1', actual.displayName);
            assert.equal('localpublisher1.local1', actual.identifier.id);
            assert.equal('localPublisher1', actual.publisher);
            assert.equal('1.1.0', actual.version);
            assert.equal('1.1.0', actual.latestVersion);
            assert.equal('localDescription1', actual.description);
            assert.equal('file:///localPath1/localIcon1', actual.iconUrl);
            assert.equal('file:///localPath1/localIcon1', actual.iconUrlFallback);
            assert.equal(null, actual.licenseUrl);
            assert.equal(1 /* Installed */, actual.state);
            assert.equal(null, actual.installCount);
            assert.equal(null, actual.rating);
            assert.equal(null, actual.ratingCount);
            assert.equal(false, actual.outdated);
            assert.deepEqual(['pub.1', 'pub.2'], actual.dependencies);
            actual = actuals[1];
            assert.equal(0 /* System */, actual.type);
            assert.equal('local2', actual.name);
            assert.equal('localDisplayName2', actual.displayName);
            assert.equal('localpublisher2.local2', actual.identifier.id);
            assert.equal('localPublisher2', actual.publisher);
            assert.equal('1.2.0', actual.version);
            assert.equal('1.2.0', actual.latestVersion);
            assert.equal('localDescription2', actual.description);
            assert.ok(fs.existsSync(uri_1.URI.parse(actual.iconUrl).fsPath));
            assert.equal(null, actual.licenseUrl);
            assert.equal(1 /* Installed */, actual.state);
            assert.equal(null, actual.installCount);
            assert.equal(null, actual.rating);
            assert.equal(null, actual.ratingCount);
            assert.equal(false, actual.outdated);
            assert.deepEqual([], actual.dependencies);
        }));
        test('test installed extensions get syncs with gallery', () => __awaiter(this, void 0, void 0, function* () {
            const local1 = aLocalExtension('local1', {
                publisher: 'localPublisher1',
                version: '1.1.0',
                displayName: 'localDisplayName1',
                description: 'localDescription1',
                icon: 'localIcon1',
                extensionDependencies: ['pub.1', 'pub.2'],
            }, {
                type: 1 /* User */,
                readmeUrl: 'localReadmeUrl1',
                changelogUrl: 'localChangelogUrl1',
                location: uri_1.URI.file('localPath1')
            });
            const local2 = aLocalExtension('local2', {
                publisher: 'localPublisher2',
                version: '1.2.0',
                displayName: 'localDisplayName2',
                description: 'localDescription2',
            }, {
                type: 0 /* System */,
                readmeUrl: 'localReadmeUrl2',
                changelogUrl: 'localChangelogUrl2',
            });
            const gallery1 = aGalleryExtension(local1.manifest.name, {
                identifier: local1.identifier,
                displayName: 'expectedDisplayName',
                version: '1.5.0',
                publisherId: 'expectedPublisherId',
                publisher: local1.manifest.publisher,
                publisherDisplayName: 'expectedPublisherDisplayName',
                description: 'expectedDescription',
                installCount: 1000,
                rating: 4,
                ratingCount: 100
            }, {
                dependencies: ['pub.1'],
            }, {
                manifest: { uri: 'uri:manifest', fallbackUri: 'fallback:manifest' },
                readme: { uri: 'uri:readme', fallbackUri: 'fallback:readme' },
                changelog: { uri: 'uri:changelog', fallbackUri: 'fallback:changlog' },
                download: { uri: 'uri:download', fallbackUri: 'fallback:download' },
                icon: { uri: 'uri:icon', fallbackUri: 'fallback:icon' },
                license: { uri: 'uri:license', fallbackUri: 'fallback:license' },
                repository: { uri: 'uri:repository', fallbackUri: 'fallback:repository' },
                coreTranslations: {}
            });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local1, local2]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery1));
            testObject = yield aWorkbenchService();
            yield testObject.queryLocal();
            return eventToPromise(testObject.onChange).then(() => {
                const actuals = testObject.local;
                assert.equal(2, actuals.length);
                let actual = actuals[0];
                assert.equal(1 /* User */, actual.type);
                assert.equal('local1', actual.name);
                assert.equal('expectedDisplayName', actual.displayName);
                assert.equal('localpublisher1.local1', actual.identifier.id);
                assert.equal('localPublisher1', actual.publisher);
                assert.equal('1.1.0', actual.version);
                assert.equal('1.5.0', actual.latestVersion);
                assert.equal('expectedDescription', actual.description);
                assert.equal('uri:icon', actual.iconUrl);
                assert.equal('fallback:icon', actual.iconUrlFallback);
                assert.equal(1 /* Installed */, actual.state);
                assert.equal('uri:license', actual.licenseUrl);
                assert.equal(1000, actual.installCount);
                assert.equal(4, actual.rating);
                assert.equal(100, actual.ratingCount);
                assert.equal(true, actual.outdated);
                assert.deepEqual(['pub.1'], actual.dependencies);
                actual = actuals[1];
                assert.equal(0 /* System */, actual.type);
                assert.equal('local2', actual.name);
                assert.equal('localDisplayName2', actual.displayName);
                assert.equal('localpublisher2.local2', actual.identifier.id);
                assert.equal('localPublisher2', actual.publisher);
                assert.equal('1.2.0', actual.version);
                assert.equal('1.2.0', actual.latestVersion);
                assert.equal('localDescription2', actual.description);
                assert.ok(fs.existsSync(uri_1.URI.parse(actual.iconUrl).fsPath));
                assert.equal(null, actual.licenseUrl);
                assert.equal(1 /* Installed */, actual.state);
                assert.equal(null, actual.installCount);
                assert.equal(null, actual.rating);
                assert.equal(null, actual.ratingCount);
                assert.equal(false, actual.outdated);
                assert.deepEqual([], actual.dependencies);
            });
        }));
        test('test extension state computation', () => __awaiter(this, void 0, void 0, function* () {
            const gallery = aGalleryExtension('gallery1');
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return testObject.queryGallery().then(page => {
                const extension = page.firstPage[0];
                assert.equal(3 /* Uninstalled */, extension.state);
                testObject.install(extension);
                const identifier = gallery.identifier;
                // Installing
                installEvent.fire({ identifier, gallery });
                let local = testObject.local;
                assert.equal(1, local.length);
                const actual = local[0];
                assert.equal(`${gallery.publisher}.${gallery.name}`, actual.identifier.id);
                assert.equal(0 /* Installing */, actual.state);
                // Installed
                didInstallEvent.fire({ identifier, gallery, operation: 1 /* Install */, local: aLocalExtension(gallery.name, gallery, { identifier }) });
                assert.equal(1 /* Installed */, actual.state);
                assert.equal(1, testObject.local.length);
                testObject.uninstall(actual);
                // Uninstalling
                uninstallEvent.fire(identifier);
                assert.equal(2 /* Uninstalling */, actual.state);
                // Uninstalled
                didUninstallEvent.fire({ identifier });
                assert.equal(3 /* Uninstalled */, actual.state);
                assert.equal(0, testObject.local.length);
            });
        }));
        test('test extension doesnot show outdated for system extensions', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('a', { version: '1.0.1' }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension(local.manifest.name, { identifier: local.identifier, version: '1.0.2' })));
            testObject = yield aWorkbenchService();
            yield testObject.queryLocal();
            assert.ok(!testObject.local[0].outdated);
        }));
        test('test canInstall returns false for extensions with out gallery', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('a', { version: '1.0.1' }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testObject = yield aWorkbenchService();
            const target = testObject.local[0];
            testObject.uninstall(target);
            uninstallEvent.fire(local.identifier);
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(!testObject.canInstall(target));
        }));
        test('test canInstall returns false for a system extension', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('a', { version: '1.0.1' }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension(local.manifest.name, { identifier: local.identifier })));
            testObject = yield aWorkbenchService();
            const target = testObject.local[0];
            assert.ok(!testObject.canInstall(target));
        }));
        test('test canInstall returns true for extensions with gallery', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('a', { version: '1.0.1' }, { type: 1 /* User */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension(local.manifest.name, { identifier: local.identifier })));
            testObject = yield aWorkbenchService();
            const target = testObject.local[0];
            return eventToPromise(testObject.onChange).then(() => {
                assert.ok(testObject.canInstall(target));
            });
        }));
        test('test onchange event is triggered while installing', () => __awaiter(this, void 0, void 0, function* () {
            const gallery = aGalleryExtension('gallery1');
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const target = sinon.spy();
            return testObject.queryGallery().then(page => {
                const extension = page.firstPage[0];
                assert.equal(3 /* Uninstalled */, extension.state);
                testObject.install(extension);
                installEvent.fire({ identifier: gallery.identifier, gallery });
                testObject.onChange(target);
                // Installed
                didInstallEvent.fire({ identifier: gallery.identifier, gallery, operation: 1 /* Install */, local: aLocalExtension(gallery.name, gallery, gallery) });
                assert.ok(target.calledOnce);
            });
        }));
        test('test onchange event is triggered when installation is finished', () => __awaiter(this, void 0, void 0, function* () {
            const gallery = aGalleryExtension('gallery1');
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const target = sinon.spy();
            return testObject.queryGallery().then(page => {
                const extension = page.firstPage[0];
                assert.equal(3 /* Uninstalled */, extension.state);
                testObject.install(extension);
                testObject.onChange(target);
                // Installing
                installEvent.fire({ identifier: gallery.identifier, gallery });
                assert.ok(target.calledOnce);
            });
        }));
        test('test onchange event is triggered while uninstalling', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testObject = yield aWorkbenchService();
            const target = sinon.spy();
            testObject.uninstall(testObject.local[0]);
            testObject.onChange(target);
            uninstallEvent.fire(local.identifier);
            assert.ok(target.calledOnce);
        }));
        test('test onchange event is triggered when uninstalling is finished', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('a', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testObject = yield aWorkbenchService();
            const target = sinon.spy();
            testObject.uninstall(testObject.local[0]);
            uninstallEvent.fire(local.identifier);
            testObject.onChange(target);
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(target.calledOnce);
        }));
        test('test extension dependencies when empty', () => __awaiter(this, void 0, void 0, function* () {
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
            return testObject.queryGallery().then(page => {
                return testObject.loadDependencies(page.firstPage[0], cancellation_1.CancellationToken.None).then(dependencies => {
                    assert.equal(null, dependencies);
                });
            });
        }));
        test('test one level extension dependencies without cycle', () => __awaiter(this, void 0, void 0, function* () {
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', {}, { dependencies: ['pub.b', 'pub.c', 'pub.d'] })));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'loadAllDependencies', [aGalleryExtension('b'), aGalleryExtension('c'), aGalleryExtension('d')]);
            return testObject.queryGallery().then(page => {
                const extension = page.firstPage[0];
                return testObject.loadDependencies(extension, cancellation_1.CancellationToken.None).then(actual => {
                    assert.ok(actual.hasDependencies);
                    assert.equal(extension, actual.extension);
                    assert.equal(null, actual.dependent);
                    assert.equal(3, actual.dependencies.length);
                    assert.equal('pub.a', actual.identifier);
                    let dependent = actual;
                    actual = dependent.dependencies[0];
                    assert.ok(!actual.hasDependencies);
                    assert.equal('pub.b', actual.extension.identifier.id);
                    assert.equal('pub.b', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                    actual = dependent.dependencies[1];
                    assert.ok(!actual.hasDependencies);
                    assert.equal('pub.c', actual.extension.identifier.id);
                    assert.equal('pub.c', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                    actual = dependent.dependencies[2];
                    assert.ok(!actual.hasDependencies);
                    assert.equal('pub.d', actual.extension.identifier.id);
                    assert.equal('pub.d', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                });
            });
        }));
        test('test one level extension dependencies with cycle', () => __awaiter(this, void 0, void 0, function* () {
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', {}, { dependencies: ['pub.b', 'pub.a'] })));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'loadAllDependencies', [aGalleryExtension('b'), aGalleryExtension('a')]);
            return testObject.queryGallery().then(page => {
                const extension = page.firstPage[0];
                return testObject.loadDependencies(extension, cancellation_1.CancellationToken.None).then(actual => {
                    assert.ok(actual.hasDependencies);
                    assert.equal(extension, actual.extension);
                    assert.equal(null, actual.dependent);
                    assert.equal(2, actual.dependencies.length);
                    assert.equal('pub.a', actual.identifier);
                    let dependent = actual;
                    actual = dependent.dependencies[0];
                    assert.ok(!actual.hasDependencies);
                    assert.equal('pub.b', actual.extension.identifier.id);
                    assert.equal('pub.b', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                    actual = dependent.dependencies[1];
                    assert.ok(!actual.hasDependencies);
                    assert.equal('pub.a', actual.extension.identifier.id);
                    assert.equal('pub.a', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                });
            });
        }));
        test('test one level extension dependencies with missing dependencies', () => __awaiter(this, void 0, void 0, function* () {
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', {}, { dependencies: ['pub.b', 'pub.a'] })));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'loadAllDependencies', [aGalleryExtension('a')]);
            return testObject.queryGallery().then(page => {
                const extension = page.firstPage[0];
                return testObject.loadDependencies(extension, cancellation_1.CancellationToken.None).then(actual => {
                    assert.ok(actual.hasDependencies);
                    assert.equal(extension, actual.extension);
                    assert.equal(null, actual.dependent);
                    assert.equal(2, actual.dependencies.length);
                    assert.equal('pub.a', actual.identifier);
                    let dependent = actual;
                    actual = dependent.dependencies[0];
                    assert.ok(!actual.hasDependencies);
                    assert.equal(null, actual.extension);
                    assert.equal('pub.b', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                    actual = dependent.dependencies[1];
                    assert.ok(!actual.hasDependencies);
                    assert.equal('pub.a', actual.extension.identifier.id);
                    assert.equal('pub.a', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                });
            });
        }));
        test('test one level extension dependencies with in built dependencies', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('inbuilt', {}, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', {}, { dependencies: ['pub.inbuilt', 'pub.a'] })));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'loadAllDependencies', [aGalleryExtension('a')]);
            return testObject.queryGallery().then(page => {
                const extension = page.firstPage[0];
                return testObject.loadDependencies(extension, cancellation_1.CancellationToken.None).then(actual => {
                    assert.ok(actual.hasDependencies);
                    assert.equal(extension, actual.extension);
                    assert.equal(null, actual.dependent);
                    assert.equal(2, actual.dependencies.length);
                    assert.equal('pub.a', actual.identifier);
                    let dependent = actual;
                    actual = dependent.dependencies[0];
                    assert.ok(!actual.hasDependencies);
                    assert.equal('pub.inbuilt', actual.extension.identifier.id);
                    assert.equal('pub.inbuilt', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                    actual = dependent.dependencies[1];
                    assert.ok(!actual.hasDependencies);
                    assert.equal('pub.a', actual.extension.identifier.id);
                    assert.equal('pub.a', actual.identifier);
                    assert.equal(dependent, actual.dependent);
                    assert.equal(0, actual.dependencies.length);
                });
            });
        }));
        test('test more than one level of extension dependencies', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('c', { extensionDependencies: ['pub.d'] }, { type: 0 /* System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testObject = yield aWorkbenchService();
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', {}, { dependencies: ['pub.b', 'pub.c'] })));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'loadAllDependencies', [
                aGalleryExtension('b', {}, { dependencies: ['pub.d', 'pub.e'] }),
                aGalleryExtension('d', {}, { dependencies: ['pub.f', 'pub.c'] }),
                aGalleryExtension('e')
            ]);
            return testObject.queryGallery().then(page => {
                const extension = page.firstPage[0];
                return testObject.loadDependencies(extension, cancellation_1.CancellationToken.None).then(a => {
                    assert.ok(a.hasDependencies);
                    assert.equal(extension, a.extension);
                    assert.equal(null, a.dependent);
                    assert.equal(2, a.dependencies.length);
                    assert.equal('pub.a', a.identifier);
                    let b = a.dependencies[0];
                    assert.ok(b.hasDependencies);
                    assert.equal('pub.b', b.extension.identifier.id);
                    assert.equal('pub.b', b.identifier);
                    assert.equal(a, b.dependent);
                    assert.equal(2, b.dependencies.length);
                    let c = a.dependencies[1];
                    assert.ok(c.hasDependencies);
                    assert.equal('pub.c', c.extension.identifier.id);
                    assert.equal('pub.c', c.identifier);
                    assert.equal(a, c.dependent);
                    assert.equal(1, c.dependencies.length);
                    let d = b.dependencies[0];
                    assert.ok(d.hasDependencies);
                    assert.equal('pub.d', d.extension.identifier.id);
                    assert.equal('pub.d', d.identifier);
                    assert.equal(b, d.dependent);
                    assert.equal(2, d.dependencies.length);
                    let e = b.dependencies[1];
                    assert.ok(!e.hasDependencies);
                    assert.equal('pub.e', e.extension.identifier.id);
                    assert.equal('pub.e', e.identifier);
                    assert.equal(b, e.dependent);
                    assert.equal(0, e.dependencies.length);
                    let f = d.dependencies[0];
                    assert.ok(!f.hasDependencies);
                    assert.equal(null, f.extension);
                    assert.equal('pub.f', f.identifier);
                    assert.equal(d, f.dependent);
                    assert.equal(0, f.dependencies.length);
                    c = d.dependencies[1];
                    assert.ok(c.hasDependencies);
                    assert.equal('pub.c', c.extension.identifier.id);
                    assert.equal('pub.c', c.identifier);
                    assert.equal(d, c.dependent);
                    assert.equal(1, c.dependencies.length);
                    d = c.dependencies[0];
                    assert.ok(!d.hasDependencies);
                    assert.equal('pub.d', d.extension.identifier.id);
                    assert.equal('pub.d', d.identifier);
                    assert.equal(c, d.dependent);
                    assert.equal(0, d.dependencies.length);
                    c = a.dependencies[1];
                    d = c.dependencies[0];
                    assert.ok(d.hasDependencies);
                    assert.equal('pub.d', d.extension.identifier.id);
                    assert.equal('pub.d', d.identifier);
                    assert.equal(c, d.dependent);
                    assert.equal(2, d.dependencies.length);
                    f = d.dependencies[0];
                    assert.ok(!f.hasDependencies);
                    assert.equal(null, f.extension);
                    assert.equal('pub.f', f.identifier);
                    assert.equal(d, f.dependent);
                    assert.equal(0, f.dependencies.length);
                    c = d.dependencies[1];
                    assert.ok(!c.hasDependencies);
                    assert.equal('pub.c', c.extension.identifier.id);
                    assert.equal('pub.c', c.identifier);
                    assert.equal(d, c.dependent);
                    assert.equal(0, c.dependencies.length);
                });
            });
        }));
        test('test uninstalled extensions are always enabled', () => __awaiter(this, void 0, void 0, function* () {
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 1 /* WorkspaceDisabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                testObject = yield aWorkbenchService();
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
                return testObject.queryGallery().then(pagedResponse => {
                    const actual = pagedResponse.firstPage[0];
                    assert.equal(actual.enablementState, 2 /* Enabled */);
                });
            }));
        }));
        test('test enablement state installed enabled extension', () => __awaiter(this, void 0, void 0, function* () {
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 1 /* WorkspaceDisabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a')]);
                testObject = yield aWorkbenchService();
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 2 /* Enabled */);
            }));
        }));
        test('test workspace disabled extension', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('d')], 0 /* Disabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 1 /* WorkspaceDisabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('e')], 1 /* WorkspaceDisabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA]);
                testObject = yield aWorkbenchService();
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 1 /* WorkspaceDisabled */);
            }));
        }));
        test('test globally disabled extension', () => __awaiter(this, void 0, void 0, function* () {
            const localExtension = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([localExtension], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('d')], 0 /* Disabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 1 /* WorkspaceDisabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localExtension]);
                testObject = yield aWorkbenchService();
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 0 /* Disabled */);
            }));
        }));
        test('test enablement state is updated for user extensions', () => __awaiter(this, void 0, void 0, function* () {
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 1 /* WorkspaceDisabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a')]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 1 /* WorkspaceDisabled */)
                    .then(() => {
                    const actual = testObject.local[0];
                    assert.equal(actual.enablementState, 1 /* WorkspaceDisabled */);
                });
            }));
        }));
        test('test enable extension globally when extension is disabled for workspace', () => __awaiter(this, void 0, void 0, function* () {
            const localExtension = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([localExtension], 1 /* WorkspaceDisabled */)
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localExtension]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* Enabled */)
                    .then(() => {
                    const actual = testObject.local[0];
                    assert.equal(actual.enablementState, 2 /* Enabled */);
                });
            }));
        }));
        test('test disable extension globally', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a')]);
            testObject = yield aWorkbenchService();
            return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                .then(() => {
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 0 /* Disabled */);
            });
        }));
        test('test system extensions can be disabled', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a', {}, { type: 0 /* System */ })]);
            testObject = yield aWorkbenchService();
            return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                .then(() => {
                const actual = testObject.local[0];
                assert.equal(actual.enablementState, 0 /* Disabled */);
            });
        }));
        test('test enablement state is updated on change from outside', () => __awaiter(this, void 0, void 0, function* () {
            const localExtension = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 1 /* WorkspaceDisabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localExtension]);
                testObject = yield aWorkbenchService();
                return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([localExtension], 0 /* Disabled */)
                    .then(() => {
                    const actual = testObject.local[0];
                    assert.equal(actual.enablementState, 0 /* Disabled */);
                });
            }));
        }));
        test('test disable extension with dependencies disable only itself', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 0 /* Disabled */);
                    assert.equal(testObject.local[1].enablementState, 2 /* Enabled */);
                });
            }));
        }));
        test('test disable extension pack disables the pack', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionPack: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 0 /* Disabled */);
                    assert.equal(testObject.local[1].enablementState, 0 /* Disabled */);
                });
            }));
        }));
        test('test disable extension pack disable all', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionPack: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 0 /* Disabled */);
                    assert.equal(testObject.local[1].enablementState, 0 /* Disabled */);
                });
            }));
        }));
        test('test disable extension fails if extension is a dependent of other', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[1], 0 /* Disabled */).then(() => assert.fail('Should fail'), error => assert.ok(true));
            }));
        }));
        test('test disable extension when extension is part of a pack', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionPack: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[1], 0 /* Disabled */)
                    .then(() => {
                    assert.equal(testObject.local[1].enablementState, 0 /* Disabled */);
                });
            }));
        }));
        test('test disable both dependency and dependent do not promot and do not fail', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                const target = sinon.spy();
                testObject = yield aWorkbenchService();
                return testObject.setEnablement([testObject.local[1], testObject.local[0]], 0 /* Disabled */)
                    .then(() => {
                    assert.ok(!target.called);
                    assert.equal(testObject.local[0].enablementState, 0 /* Disabled */);
                    assert.equal(testObject.local[1].enablementState, 0 /* Disabled */);
                });
            }));
        }));
        test('test enable both dependency and dependent do not promot and do not fail', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 0 /* Disabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 0 /* Disabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                const target = sinon.spy();
                testObject = yield aWorkbenchService();
                return testObject.setEnablement([testObject.local[1], testObject.local[0]], 2 /* Enabled */)
                    .then(() => {
                    assert.ok(!target.called);
                    assert.equal(testObject.local[0].enablementState, 2 /* Enabled */);
                    assert.equal(testObject.local[1].enablementState, 2 /* Enabled */);
                });
            }));
        }));
        test('test disable extension does not fail if its dependency is a dependent of other but chosen to disable only itself', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.b'] });
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 0 /* Disabled */);
                });
            }));
        }));
        test('test disable extension if its dependency is a dependent of other disabled extension', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.b'] });
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 0 /* Disabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 0 /* Disabled */);
                });
            }));
        }));
        test('test disable extension if its dependencys dependency is itself', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b', { extensionDependencies: ['pub.a'] });
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => assert.fail('An extension with dependent should not be disabled'), () => null);
            }));
        }));
        test('test disable extension if its dependency is dependent and is disabled', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.b'] });
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 0 /* Disabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => assert.equal(testObject.local[0].enablementState, 0 /* Disabled */));
            }));
        }));
        test('test disable extension with cyclic dependencies', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b', { extensionDependencies: ['pub.c'] });
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.a'] });
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 2 /* Enabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 2 /* Enabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => assert.fail('An extension with dependent should not be disabled'), () => null);
            }));
        }));
        test('test enable extension with dependencies enable all', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 0 /* Disabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 0 /* Disabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* Enabled */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 2 /* Enabled */);
                    assert.equal(testObject.local[1].enablementState, 2 /* Enabled */);
                });
            }));
        }));
        test('test enable extension with dependencies does not prompt if dependency is enabled already', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 2 /* Enabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 0 /* Disabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                const target = sinon.spy();
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* Enabled */)
                    .then(() => {
                    assert.ok(!target.called);
                    assert.equal(testObject.local[0].enablementState, 2 /* Enabled */);
                });
            }));
        }));
        test('test enable extension with dependency does not prompt if both are enabled', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b');
            const extensionC = aLocalExtension('c');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 0 /* Disabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 0 /* Disabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                const target = sinon.spy();
                testObject = yield aWorkbenchService();
                return testObject.setEnablement([testObject.local[1], testObject.local[0]], 2 /* Enabled */)
                    .then(() => {
                    assert.ok(!target.called);
                    assert.equal(testObject.local[0].enablementState, 2 /* Enabled */);
                    assert.equal(testObject.local[1].enablementState, 2 /* Enabled */);
                });
            }));
        }));
        test('test enable extension with cyclic dependencies', () => __awaiter(this, void 0, void 0, function* () {
            const extensionA = aLocalExtension('a', { extensionDependencies: ['pub.b'] });
            const extensionB = aLocalExtension('b', { extensionDependencies: ['pub.c'] });
            const extensionC = aLocalExtension('c', { extensionDependencies: ['pub.a'] });
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionA], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionB], 0 /* Disabled */))
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([extensionC], 0 /* Disabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [extensionA, extensionB, extensionC]);
                testObject = yield aWorkbenchService();
                return testObject.setEnablement(testObject.local[0], 2 /* Enabled */)
                    .then(() => {
                    assert.equal(testObject.local[0].enablementState, 2 /* Enabled */);
                    assert.equal(testObject.local[1].enablementState, 2 /* Enabled */);
                    assert.equal(testObject.local[2].enablementState, 2 /* Enabled */);
                });
            }));
        }));
        test('test change event is fired when disablement flags are changed', () => __awaiter(this, void 0, void 0, function* () {
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 1 /* WorkspaceDisabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [aLocalExtension('a')]);
                testObject = yield aWorkbenchService();
                const target = sinon.spy();
                testObject.onChange(target);
                return testObject.setEnablement(testObject.local[0], 0 /* Disabled */)
                    .then(() => assert.ok(target.calledOnce));
            }));
        }));
        test('test change event is fired when disablement flags are changed from outside', () => __awaiter(this, void 0, void 0, function* () {
            const localExtension = aLocalExtension('a');
            return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('c')], 0 /* Disabled */)
                .then(() => instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([aLocalExtension('b')], 1 /* WorkspaceDisabled */))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localExtension]);
                testObject = yield aWorkbenchService();
                const target = sinon.spy();
                testObject.onChange(target);
                return instantiationService.get(extensionManagement_1.IExtensionEnablementService).setEnablement([localExtension], 0 /* Disabled */)
                    .then(() => assert.ok(target.calledOnce));
            }));
        }));
        function aWorkbenchService() {
            return __awaiter(this, void 0, void 0, function* () {
                const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
                yield workbenchService.queryLocal();
                return workbenchService;
            });
        }
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
        const noAssets = {
            changelog: null,
            download: null,
            icon: null,
            license: null,
            manifest: null,
            readme: null,
            repository: null,
            coreTranslations: null
        };
        function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = noAssets) {
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
        function eventToPromise(event, count = 1) {
            return new Promise(c => {
                let counter = 0;
                event(() => {
                    if (++counter === count) {
                        c(undefined);
                    }
                });
            });
        }
    });
});
//# sourceMappingURL=extensionsWorkbenchService.test.js.map