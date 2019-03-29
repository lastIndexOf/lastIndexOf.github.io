/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/performance", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/platform/product/node/package", "vs/platform/product/node/product", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/windows/common/windows", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/extensions/electron-browser/extensionHost", "vs/workbench/services/extensions/node/extensionDescriptionRegistry", "vs/workbench/services/extensions/electron-browser/cachedExtensionScanner", "vs/workbench/services/extensions/electron-browser/extensionHostProcessManager", "vs/platform/extensions/common/extensions", "vs/base/common/network", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, path, arrays_1, async_1, event_1, lifecycle_1, perf, resources_1, uri_1, environment_1, extensionManagement_1, extensionManagementUtil_1, instantiation_1, lifecycle_2, package_1, product_1, notification_1, telemetry_1, windows_1, extensions_1, extensionsRegistry_1, extensionHost_1, extensionDescriptionRegistry_1, cachedExtensionScanner_1, extensionHostProcessManager_1, extensions_2, network_1, extensions_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const hasOwnProperty = Object.hasOwnProperty;
    const NO_OP_VOID_PROMISE = Promise.resolve(undefined);
    extensionsRegistry_1.schema.properties.engines.properties.vscode.default = `^${package_1.default.version}`;
    let productAllowProposedApi = null;
    function allowProposedApiFromProduct(id) {
        // create set if needed
        if (!productAllowProposedApi) {
            productAllowProposedApi = new Set();
            if (arrays_1.isNonEmptyArray(product_1.default.extensionAllowedProposedApi)) {
                product_1.default.extensionAllowedProposedApi.forEach((id) => productAllowProposedApi.add(extensions_2.ExtensionIdentifier.toKey(id)));
            }
        }
        return productAllowProposedApi.has(extensions_2.ExtensionIdentifier.toKey(id));
    }
    class DeltaExtensionsQueueItem {
        constructor(toAdd, toRemove) {
            this.toAdd = toAdd;
            this.toRemove = toRemove;
        }
    }
    let ExtensionService = class ExtensionService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _notificationService, _environmentService, _telemetryService, _extensionEnablementService, _extensionManagementService, _windowService, _lifecycleService) {
            super();
            this._instantiationService = _instantiationService;
            this._notificationService = _notificationService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._extensionEnablementService = _extensionEnablementService;
            this._extensionManagementService = _extensionManagementService;
            this._windowService = _windowService;
            this._lifecycleService = _lifecycleService;
            this._onDidRegisterExtensions = this._register(new event_1.Emitter());
            this.onDidRegisterExtensions = this._onDidRegisterExtensions.event;
            this._onDidChangeExtensionsStatus = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsStatus = this._onDidChangeExtensionsStatus.event;
            this._onDidChangeExtensions = this._register(new event_1.Emitter());
            this.onDidChangeExtensions = this._onDidChangeExtensions.event;
            this._onWillActivateByEvent = this._register(new event_1.Emitter());
            this.onWillActivateByEvent = this._onWillActivateByEvent.event;
            this._onDidChangeResponsiveChange = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveChange = this._onDidChangeResponsiveChange.event;
            this._inHandleDeltaExtensions = false;
            this._extensionHostLogsLocation = uri_1.URI.file(path.join(this._environmentService.logsPath, `exthost${this._windowService.getCurrentWindowId()}`));
            this._registry = null;
            this._installedExtensionsReady = new async_1.Barrier();
            this._isDev = !this._environmentService.isBuilt || this._environmentService.isExtensionDevelopment;
            this._extensionsMessages = new Map();
            this._allRequestedActivateEvents = Object.create(null);
            this._extensionScanner = this._instantiationService.createInstance(cachedExtensionScanner_1.CachedExtensionScanner);
            this._deltaExtensionsQueue = [];
            this._extensionHostProcessManagers = [];
            this._extensionHostActiveExtensions = new Map();
            this._extensionHostProcessActivationTimes = new Map();
            this._extensionHostExtensionRuntimeErrors = new Map();
            this._startDelayed(this._lifecycleService);
            if (this._extensionEnablementService.allUserExtensionsDisabled) {
                this._notificationService.prompt(notification_1.Severity.Info, nls.localize('extensionsDisabled', "All installed extensions are temporarily disabled. Reload the window to return to the previous state."), [{
                        label: nls.localize('Reload', "Reload"),
                        run: () => {
                            this._windowService.reloadWindow();
                        }
                    }]);
            }
            this._extensionEnablementService.onEnablementChanged((extensions) => {
                let toAdd = [];
                let toRemove = [];
                for (const extension of extensions) {
                    if (this._extensionEnablementService.isEnabled(extension)) {
                        // an extension has been enabled
                        toAdd.push(extension);
                    }
                    else {
                        // an extension has been disabled
                        toRemove.push(extension.identifier.id);
                    }
                }
                this._handleDeltaExtensions(new DeltaExtensionsQueueItem(toAdd, toRemove));
            });
            this._extensionManagementService.onDidInstallExtension((event) => {
                if (event.local) {
                    if (this._extensionEnablementService.isEnabled(event.local)) {
                        // an extension has been installed
                        this._handleDeltaExtensions(new DeltaExtensionsQueueItem([event.local], []));
                    }
                }
            });
            this._extensionManagementService.onDidUninstallExtension((event) => {
                if (!event.error) {
                    // an extension has been uninstalled
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem([], [event.identifier.id]));
                }
            });
        }
        _handleDeltaExtensions(item) {
            return __awaiter(this, void 0, void 0, function* () {
                this._deltaExtensionsQueue.push(item);
                if (this._inHandleDeltaExtensions) {
                    // Let the current item finish, the new one will be picked up
                    return;
                }
                while (this._deltaExtensionsQueue.length > 0) {
                    const item = this._deltaExtensionsQueue.shift();
                    try {
                        this._inHandleDeltaExtensions = true;
                        yield this._deltaExtensions(item.toAdd, item.toRemove);
                    }
                    finally {
                        this._inHandleDeltaExtensions = false;
                    }
                }
            });
        }
        _deltaExtensions(_toAdd, _toRemove) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._windowService.getConfiguration().remoteAuthority) {
                    return;
                }
                let toAdd = [];
                for (let i = 0, len = _toAdd.length; i < len; i++) {
                    const extension = _toAdd[i];
                    if (extension.location.scheme !== network_1.Schemas.file) {
                        continue;
                    }
                    const existingExtensionDescription = this._registry.getExtensionDescription(extension.identifier.id);
                    if (existingExtensionDescription) {
                        // this extension is already running (most likely at a different version)
                        continue;
                    }
                    const extensionDescription = yield this._extensionScanner.scanSingleExtension(extension.location.fsPath, extension.type === 0 /* System */, this.createLogger());
                    if (!extensionDescription) {
                        // could not scan extension...
                        continue;
                    }
                    toAdd.push(extensionDescription);
                }
                let toRemove = [];
                for (let i = 0, len = _toRemove.length; i < len; i++) {
                    const extensionId = _toRemove[i];
                    const extensionDescription = this._registry.getExtensionDescription(extensionId);
                    if (!extensionDescription) {
                        // ignore disabling/uninstalling an extension which is not running
                        continue;
                    }
                    if (!this._canRemoveExtension(extensionDescription)) {
                        // uses non-dynamic extension point or is activated
                        continue;
                    }
                    toRemove.push(extensionDescription);
                }
                if (toAdd.length === 0 && toRemove.length === 0) {
                    return;
                }
                // Update the local registry
                const result = this._registry.deltaExtensions(toAdd, toRemove.map(e => e.identifier));
                toRemove = toRemove.concat(result.removedDueToLooping);
                if (result.removedDueToLooping.length > 0) {
                    this._logOrShowMessage(notification_1.Severity.Error, nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', ')));
                }
                // Update extension points
                this._rehandleExtensionPoints([].concat(toAdd).concat(toRemove));
                // Update the extension host
                if (this._extensionHostProcessManagers.length > 0) {
                    yield this._extensionHostProcessManagers[0].deltaExtensions(toAdd, toRemove.map(e => e.identifier));
                }
                this._onDidChangeExtensions.fire(undefined);
                for (let i = 0; i < toAdd.length; i++) {
                    this._activateAddedExtensionIfNeeded(toAdd[i]);
                }
            });
        }
        _rehandleExtensionPoints(extensionDescriptions) {
            const affectedExtensionPoints = Object.create(null);
            for (let extensionDescription of extensionDescriptions) {
                if (extensionDescription.contributes) {
                    for (let extPointName in extensionDescription.contributes) {
                        if (hasOwnProperty.call(extensionDescription.contributes, extPointName)) {
                            affectedExtensionPoints[extPointName] = true;
                        }
                    }
                }
            }
            const messageHandler = (msg) => this._handleExtensionPointMessage(msg);
            const availableExtensions = this._registry.getAllExtensionDescriptions();
            const extensionPoints = extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints();
            for (let i = 0, len = extensionPoints.length; i < len; i++) {
                if (affectedExtensionPoints[extensionPoints[i].name]) {
                    ExtensionService._handleExtensionPoint(extensionPoints[i], availableExtensions, messageHandler);
                }
            }
        }
        canAddExtension(extension) {
            if (this._windowService.getConfiguration().remoteAuthority) {
                return false;
            }
            if (extension.extensionLocation.scheme !== network_1.Schemas.file) {
                return false;
            }
            const extensionDescription = this._registry.getExtensionDescription(extension.identifier);
            if (extensionDescription) {
                // ignore adding an extension which is already running and cannot be removed
                if (!this._canRemoveExtension(extensionDescription)) {
                    return false;
                }
            }
            return true;
        }
        canRemoveExtension(extension) {
            if (this._windowService.getConfiguration().remoteAuthority) {
                return false;
            }
            if (extension.extensionLocation.scheme !== network_1.Schemas.file) {
                return false;
            }
            const extensionDescription = this._registry.getExtensionDescription(extension.identifier);
            if (!extensionDescription) {
                // ignore removing an extension which is not running
                return false;
            }
            return this._canRemoveExtension(extensionDescription);
        }
        _canRemoveExtension(extension) {
            if (this._extensionHostActiveExtensions.has(extensions_2.ExtensionIdentifier.toKey(extension.identifier))) {
                // Extension is running, cannot remove it safely
                return false;
            }
            return true;
        }
        _activateAddedExtensionIfNeeded(extensionDescription) {
            return __awaiter(this, void 0, void 0, function* () {
                let shouldActivate = false;
                let shouldActivateReason = null;
                if (Array.isArray(extensionDescription.activationEvents)) {
                    for (let activationEvent of extensionDescription.activationEvents) {
                        // TODO@joao: there's no easy way to contribute this
                        if (activationEvent === 'onUri') {
                            activationEvent = `onUri:${extensions_2.ExtensionIdentifier.toKey(extensionDescription.identifier)}`;
                        }
                        if (this._allRequestedActivateEvents[activationEvent]) {
                            // This activation event was fired before the extension was added
                            shouldActivate = true;
                            shouldActivateReason = activationEvent;
                            break;
                        }
                        if (activationEvent === '*') {
                            shouldActivate = true;
                            shouldActivateReason = activationEvent;
                            break;
                        }
                        if (/^workspaceContains/.test(activationEvent)) {
                            // do not trigger a search, just activate in this case...
                            shouldActivate = true;
                            shouldActivateReason = activationEvent;
                            break;
                        }
                    }
                }
                if (shouldActivate) {
                    yield Promise.all(this._extensionHostProcessManagers.map(extHostManager => extHostManager.activate(extensionDescription.identifier, shouldActivateReason))).then(() => { });
                }
            });
        }
        _startDelayed(lifecycleService) {
            // delay extension host creation and extension scanning
            // until the workbench is running. we cannot defer the
            // extension host more (LifecyclePhase.Restored) because
            // some editors require the extension host to restore
            // and this would result in a deadlock
            // see https://github.com/Microsoft/vscode/issues/41322
            lifecycleService.when(2 /* Ready */).then(() => {
                // reschedule to ensure this runs after restoring viewlets, panels, and editors
                async_1.runWhenIdle(() => {
                    perf.mark('willLoadExtensions');
                    this._startExtensionHostProcess(true, []);
                    this._scanAndHandleExtensions();
                    this.whenInstalledExtensionsRegistered().then(() => perf.mark('didLoadExtensions'));
                }, 50 /*max delay*/);
            });
        }
        dispose() {
            super.dispose();
            this._onWillActivateByEvent.dispose();
            this._onDidChangeResponsiveChange.dispose();
        }
        restartExtensionHost() {
            this._stopExtensionHostProcess();
            this._startExtensionHostProcess(false, Object.keys(this._allRequestedActivateEvents));
        }
        startExtensionHost() {
            this._startExtensionHostProcess(false, Object.keys(this._allRequestedActivateEvents));
        }
        stopExtensionHost() {
            this._stopExtensionHostProcess();
        }
        _stopExtensionHostProcess() {
            let previouslyActivatedExtensionIds = [];
            this._extensionHostActiveExtensions.forEach((value) => {
                previouslyActivatedExtensionIds.push(value);
            });
            for (const manager of this._extensionHostProcessManagers) {
                manager.dispose();
            }
            this._extensionHostProcessManagers = [];
            this._extensionHostActiveExtensions = new Map();
            this._extensionHostProcessActivationTimes = new Map();
            this._extensionHostExtensionRuntimeErrors = new Map();
            if (previouslyActivatedExtensionIds.length > 0) {
                this._onDidChangeExtensionsStatus.fire(previouslyActivatedExtensionIds);
            }
        }
        _startExtensionHostProcess(isInitialStart, initialActivationEvents) {
            this._stopExtensionHostProcess();
            let autoStart;
            let extensions;
            if (isInitialStart) {
                autoStart = false;
                extensions = this._extensionScanner.scannedExtensions;
            }
            else {
                // restart case
                autoStart = true;
                extensions = this.getExtensions();
            }
            const extHostProcessWorker = this._instantiationService.createInstance(extensionHost_1.ExtensionHostProcessWorker, autoStart, extensions, this._extensionHostLogsLocation);
            const extHostProcessManager = this._instantiationService.createInstance(extensionHostProcessManager_1.ExtensionHostProcessManager, extHostProcessWorker, null, initialActivationEvents);
            extHostProcessManager.onDidCrash(([code, signal]) => this._onExtensionHostCrashed(code, signal));
            extHostProcessManager.onDidChangeResponsiveState((responsiveState) => { this._onDidChangeResponsiveChange.fire({ target: extHostProcessManager, isResponsive: responsiveState === 0 /* Responsive */ }); });
            this._extensionHostProcessManagers.push(extHostProcessManager);
        }
        _onExtensionHostCrashed(code, signal) {
            console.error('Extension host terminated unexpectedly. Code: ', code, ' Signal: ', signal);
            this._stopExtensionHostProcess();
            if (code === 55) {
                this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionHostProcess.versionMismatchCrash', "Extension host cannot start: version mismatch."), [{
                        label: nls.localize('relaunch', "Relaunch VS Code"),
                        run: () => {
                            this._instantiationService.invokeFunction((accessor) => {
                                const windowsService = accessor.get(windows_1.IWindowsService);
                                windowsService.relaunch({});
                            });
                        }
                    }]);
                return;
            }
            let message = nls.localize('extensionHostProcess.crash', "Extension host terminated unexpectedly.");
            if (code === 87) {
                message = nls.localize('extensionHostProcess.unresponsiveCrash', "Extension host terminated because it was not responsive.");
            }
            this._notificationService.prompt(notification_1.Severity.Error, message, [{
                    label: nls.localize('devTools', "Open Developer Tools"),
                    run: () => this._windowService.openDevTools()
                },
                {
                    label: nls.localize('restart', "Restart Extension Host"),
                    run: () => this._startExtensionHostProcess(false, Object.keys(this._allRequestedActivateEvents))
                }]);
        }
        // ---- begin IExtensionService
        activateByEvent(activationEvent) {
            if (this._installedExtensionsReady.isOpen()) {
                // Extensions have been scanned and interpreted
                // Record the fact that this activationEvent was requested (in case of a restart)
                this._allRequestedActivateEvents[activationEvent] = true;
                if (!this._registry.containsActivationEvent(activationEvent)) {
                    // There is no extension that is interested in this activation event
                    return NO_OP_VOID_PROMISE;
                }
                return this._activateByEvent(activationEvent);
            }
            else {
                // Extensions have not been scanned yet.
                // Record the fact that this activationEvent was requested (in case of a restart)
                this._allRequestedActivateEvents[activationEvent] = true;
                return this._installedExtensionsReady.wait().then(() => this._activateByEvent(activationEvent));
            }
        }
        _activateByEvent(activationEvent) {
            const result = Promise.all(this._extensionHostProcessManagers.map(extHostManager => extHostManager.activateByEvent(activationEvent))).then(() => { });
            this._onWillActivateByEvent.fire({
                event: activationEvent,
                activation: result
            });
            return result;
        }
        whenInstalledExtensionsRegistered() {
            return this._installedExtensionsReady.wait();
        }
        getExtensions() {
            return this._installedExtensionsReady.wait().then(() => {
                return this._registry.getAllExtensionDescriptions();
            });
        }
        getExtension(id) {
            return this._installedExtensionsReady.wait().then(() => {
                return this._registry.getExtensionDescription(id);
            });
        }
        readExtensionPointContributions(extPoint) {
            return this._installedExtensionsReady.wait().then(() => {
                let availableExtensions = this._registry.getAllExtensionDescriptions();
                let result = [], resultLen = 0;
                for (let i = 0, len = availableExtensions.length; i < len; i++) {
                    let desc = availableExtensions[i];
                    if (desc.contributes && hasOwnProperty.call(desc.contributes, extPoint.name)) {
                        result[resultLen++] = new extensions_1.ExtensionPointContribution(desc, desc.contributes[extPoint.name]);
                    }
                }
                return result;
            });
        }
        getExtensionsStatus() {
            let result = Object.create(null);
            if (this._registry) {
                const extensions = this._registry.getAllExtensionDescriptions();
                for (const extension of extensions) {
                    const extensionKey = extensions_2.ExtensionIdentifier.toKey(extension.identifier);
                    result[extension.identifier.value] = {
                        messages: this._extensionsMessages.get(extensionKey),
                        activationTimes: this._extensionHostProcessActivationTimes.get(extensionKey),
                        runtimeErrors: this._extensionHostExtensionRuntimeErrors.get(extensionKey),
                    };
                }
            }
            return result;
        }
        canProfileExtensionHost() {
            for (let i = 0, len = this._extensionHostProcessManagers.length; i < len; i++) {
                const extHostProcessManager = this._extensionHostProcessManagers[i];
                if (extHostProcessManager.canProfileExtensionHost()) {
                    return true;
                }
            }
            return false;
        }
        startExtensionHostProfile() {
            for (let i = 0, len = this._extensionHostProcessManagers.length; i < len; i++) {
                const extHostProcessManager = this._extensionHostProcessManagers[i];
                if (extHostProcessManager.canProfileExtensionHost()) {
                    return extHostProcessManager.startExtensionHostProfile();
                }
            }
            throw new Error('Extension host not running or no inspect port available');
        }
        getInspectPort() {
            if (this._extensionHostProcessManagers.length > 0) {
                return this._extensionHostProcessManagers[0].getInspectPort();
            }
            return 0;
        }
        // ---- end IExtensionService
        // --- impl
        createLogger() {
            return new cachedExtensionScanner_1.Logger((severity, source, message) => {
                if (this._isDev && source) {
                    this._logOrShowMessage(severity, `[${source}]: ${message}`);
                }
                else {
                    this._logOrShowMessage(severity, message);
                }
            });
        }
        _scanAndHandleExtensions() {
            return __awaiter(this, void 0, void 0, function* () {
                this._extensionScanner.startScanningExtensions(this.createLogger());
                const extensionHost = this._extensionHostProcessManagers[0];
                const extensions = yield this._extensionScanner.scannedExtensions;
                const enabledExtensions = yield this._getRuntimeExtensions(extensions);
                this._handleExtensionPoints(enabledExtensions);
                extensionHost.start(enabledExtensions.map(extension => extension.identifier).filter(id => this._registry.containsExtension(id)));
                this._releaseBarrier();
            });
        }
        _handleExtensionPoints(allExtensions) {
            this._registry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry([]);
            const result = this._registry.deltaExtensions(allExtensions, []);
            if (result.removedDueToLooping.length > 0) {
                this._logOrShowMessage(notification_1.Severity.Error, nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', ')));
            }
            let availableExtensions = this._registry.getAllExtensionDescriptions();
            let extensionPoints = extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints();
            let messageHandler = (msg) => this._handleExtensionPointMessage(msg);
            for (let i = 0, len = extensionPoints.length; i < len; i++) {
                ExtensionService._handleExtensionPoint(extensionPoints[i], availableExtensions, messageHandler);
            }
        }
        _releaseBarrier() {
            perf.mark('extensionHostReady');
            this._installedExtensionsReady.open();
            this._onDidRegisterExtensions.fire(undefined);
            this._onDidChangeExtensionsStatus.fire(this._registry.getAllExtensionDescriptions().map(e => e.identifier));
        }
        _getRuntimeExtensions(allExtensions) {
            return this._extensionEnablementService.getDisabledExtensions()
                .then(disabledExtensions => {
                const runtimeExtensions = [];
                const extensionsToDisable = [];
                const userMigratedSystemExtensions = [{ id: extensionManagementUtil_1.BetterMergeId }];
                let enableProposedApiFor = this._environmentService.args['enable-proposed-api'] || [];
                const notFound = (id) => nls.localize('notFound', "Extension \`{0}\` cannot use PROPOSED API as it cannot be found", id);
                if (enableProposedApiFor.length) {
                    let allProposed = (enableProposedApiFor instanceof Array ? enableProposedApiFor : [enableProposedApiFor]);
                    allProposed.forEach(id => {
                        if (!allExtensions.some(description => extensions_2.ExtensionIdentifier.equals(description.identifier, id))) {
                            console.error(notFound(id));
                        }
                    });
                    // Make enabled proposed API be lowercase for case insensitive comparison
                    if (Array.isArray(enableProposedApiFor)) {
                        enableProposedApiFor = enableProposedApiFor.map(id => id.toLowerCase());
                    }
                    else {
                        enableProposedApiFor = enableProposedApiFor.toLowerCase();
                    }
                }
                const enableProposedApiForAll = !this._environmentService.isBuilt ||
                    (!!this._environmentService.extensionDevelopmentLocationURI && product_1.default.nameLong !== 'Visual Studio Code') ||
                    (enableProposedApiFor.length === 0 && 'enable-proposed-api' in this._environmentService.args);
                for (const extension of allExtensions) {
                    const isExtensionUnderDevelopment = this._environmentService.isExtensionDevelopment && resources_1.isEqualOrParent(extension.extensionLocation, this._environmentService.extensionDevelopmentLocationURI);
                    // Do not disable extensions under development
                    if (!isExtensionUnderDevelopment) {
                        if (disabledExtensions.some(disabled => extensionManagementUtil_1.areSameExtensions(disabled, { id: extension.identifier.value }))) {
                            continue;
                        }
                    }
                    if (!extension.isBuiltin) {
                        // Check if the extension is changed to system extension
                        const userMigratedSystemExtension = userMigratedSystemExtensions.filter(userMigratedSystemExtension => extensionManagementUtil_1.areSameExtensions(userMigratedSystemExtension, { id: extension.identifier.value }))[0];
                        if (userMigratedSystemExtension) {
                            extensionsToDisable.push(extension);
                            continue;
                        }
                    }
                    runtimeExtensions.push(this._updateEnableProposedApi(extension, enableProposedApiForAll, enableProposedApiFor));
                }
                this._telemetryService.publicLog('extensionsScanned', {
                    totalCount: runtimeExtensions.length,
                    disabledCount: disabledExtensions.length
                });
                if (extensionsToDisable.length) {
                    return this._extensionEnablementService.setEnablement(extensionsToDisable.map(e => extensions_1.toExtension(e)), 0 /* Disabled */)
                        .then(() => runtimeExtensions);
                }
                else {
                    return runtimeExtensions;
                }
            });
        }
        _updateEnableProposedApi(extension, enableProposedApiForAll, enableProposedApiFor) {
            if (allowProposedApiFromProduct(extension.identifier)) {
                // fast lane -> proposed api is available to all extensions
                // that are listed in product.json-files
                extension.enableProposedApi = true;
            }
            else if (extension.enableProposedApi && !extension.isBuiltin) {
                if (!enableProposedApiForAll &&
                    enableProposedApiFor.indexOf(extension.identifier.value.toLowerCase()) < 0) {
                    extension.enableProposedApi = false;
                    console.error(`Extension '${extension.identifier.value} cannot use PROPOSED API (must started out of dev or enabled via --enable-proposed-api)`);
                }
                else {
                    // proposed api is available when developing or when an extension was explicitly
                    // spelled out via a command line argument
                    console.warn(`Extension '${extension.identifier.value}' uses PROPOSED API which is subject to change and removal without notice.`);
                }
            }
            return extension;
        }
        _handleExtensionPointMessage(msg) {
            const extensionKey = extensions_2.ExtensionIdentifier.toKey(msg.extensionId);
            if (!this._extensionsMessages.has(extensionKey)) {
                this._extensionsMessages.set(extensionKey, []);
            }
            this._extensionsMessages.get(extensionKey).push(msg);
            const extension = this._registry.getExtensionDescription(msg.extensionId);
            const strMsg = `[${msg.extensionId.value}]: ${msg.message}`;
            if (extension && extension.isUnderDevelopment) {
                // This message is about the extension currently being developed
                this._showMessageToUser(msg.type, strMsg);
            }
            else {
                this._logMessageInConsole(msg.type, strMsg);
            }
            if (!this._isDev && msg.extensionId) {
                const { type, extensionId, extensionPointId, message } = msg;
                /* __GDPR__
                    "extensionsMessage" : {
                        "type" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                        "extensionId": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                        "extensionPointId": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                        "message": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                    }
                */
                this._telemetryService.publicLog('extensionsMessage', {
                    type, extensionId: extensionId.value, extensionPointId, message
                });
            }
        }
        static _handleExtensionPoint(extensionPoint, availableExtensions, messageHandler) {
            let users = [], usersLen = 0;
            for (let i = 0, len = availableExtensions.length; i < len; i++) {
                let desc = availableExtensions[i];
                if (desc.contributes && hasOwnProperty.call(desc.contributes, extensionPoint.name)) {
                    users[usersLen++] = {
                        description: desc,
                        value: desc.contributes[extensionPoint.name],
                        collector: new extensionsRegistry_1.ExtensionMessageCollector(messageHandler, desc, extensionPoint.name)
                    };
                }
            }
            extensionPoint.acceptUsers(users);
        }
        _showMessageToUser(severity, msg) {
            if (severity === notification_1.Severity.Error || severity === notification_1.Severity.Warning) {
                this._notificationService.notify({ severity, message: msg });
            }
            else {
                this._logMessageInConsole(severity, msg);
            }
        }
        _logMessageInConsole(severity, msg) {
            if (severity === notification_1.Severity.Error) {
                console.error(msg);
            }
            else if (severity === notification_1.Severity.Warning) {
                console.warn(msg);
            }
            else {
                console.log(msg);
            }
        }
        // -- called by extension host
        _logOrShowMessage(severity, msg) {
            if (this._isDev) {
                this._showMessageToUser(severity, msg);
            }
            else {
                this._logMessageInConsole(severity, msg);
            }
        }
        _activateById(extensionId, activationEvent) {
            return __awaiter(this, void 0, void 0, function* () {
                const results = yield Promise.all(this._extensionHostProcessManagers.map(manager => manager.activate(extensionId, activationEvent)));
                const activated = results.some(e => e);
                if (!activated) {
                    throw new Error(`Unknown extension ${extensionId.value}`);
                }
            });
        }
        _onWillActivateExtension(extensionId) {
            this._extensionHostActiveExtensions.set(extensions_2.ExtensionIdentifier.toKey(extensionId), extensionId);
        }
        _onDidActivateExtension(extensionId, startup, codeLoadingTime, activateCallTime, activateResolvedTime, activationEvent) {
            this._extensionHostProcessActivationTimes.set(extensions_2.ExtensionIdentifier.toKey(extensionId), new extensions_1.ActivationTimes(startup, codeLoadingTime, activateCallTime, activateResolvedTime, activationEvent));
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
        _onExtensionRuntimeError(extensionId, err) {
            const extensionKey = extensions_2.ExtensionIdentifier.toKey(extensionId);
            if (!this._extensionHostExtensionRuntimeErrors.has(extensionKey)) {
                this._extensionHostExtensionRuntimeErrors.set(extensionKey, []);
            }
            this._extensionHostExtensionRuntimeErrors.get(extensionKey).push(err);
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
        _addMessage(extensionId, severity, message) {
            const extensionKey = extensions_2.ExtensionIdentifier.toKey(extensionId);
            if (!this._extensionsMessages.has(extensionKey)) {
                this._extensionsMessages.set(extensionKey, []);
            }
            this._extensionsMessages.get(extensionKey).push({
                type: severity,
                message: message,
                extensionId: null,
                extensionPointId: null
            });
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
    };
    ExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_1.IExtensionEnablementService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, windows_1.IWindowService),
        __param(7, lifecycle_2.ILifecycleService)
    ], ExtensionService);
    exports.ExtensionService = ExtensionService;
    extensions_3.registerSingleton(extensions_1.IExtensionService, ExtensionService);
});
//# sourceMappingURL=extensionService.js.map