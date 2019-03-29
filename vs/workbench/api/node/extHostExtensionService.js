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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/severity", "vs/base/common/uri", "vs/base/node/pfs", "vs/workbench/api/node/extHost.api.impl", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/node/extHostExtensionActivator", "vs/workbench/api/node/extHostStorage", "vs/workbench/services/extensions/node/extensionDescriptionRegistry", "vs/workbench/services/extensions/node/proxyResolver", "vs/base/common/cancellation", "vs/base/common/errors", "vs/platform/extensions/common/extensions", "vs/base/common/network"], function (require, exports, nls, path, resources_1, async_1, lifecycle_1, map_1, severity_1, uri_1, pfs, extHost_api_impl_1, extHost_protocol_1, extHostExtensionActivator_1, extHostStorage_1, extensionDescriptionRegistry_1, proxyResolver_1, cancellation_1, errors, extensions_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionMemento {
        constructor(id, global, storage) {
            this._id = id;
            this._shared = global;
            this._storage = storage;
            this._init = this._storage.getValue(this._shared, this._id, Object.create(null)).then(value => {
                this._value = value;
                return this;
            });
            this._storageListener = this._storage.onDidChangeStorage(e => {
                if (e.shared === this._shared && e.key === this._id) {
                    this._value = e.value;
                }
            });
        }
        get whenReady() {
            return this._init;
        }
        get(key, defaultValue) {
            let value = this._value[key];
            if (typeof value === 'undefined') {
                value = defaultValue;
            }
            return value;
        }
        update(key, value) {
            this._value[key] = value;
            return this._storage
                .setValue(this._shared, this._id, this._value)
                .then(() => true);
        }
        dispose() {
            this._storageListener.dispose();
        }
    }
    class ExtensionStoragePath {
        constructor(workspace, environment) {
            this._workspace = workspace;
            this._environment = environment;
            this._ready = this._getOrCreateWorkspaceStoragePath().then(value => this._value = value);
        }
        get whenReady() {
            return this._ready;
        }
        workspaceValue(extension) {
            if (this._value) {
                return path.join(this._value, extension.identifier.value);
            }
            return undefined;
        }
        globalValue(extension) {
            return path.join(this._environment.globalStorageHome.fsPath, extension.identifier.value.toLowerCase());
        }
        _getOrCreateWorkspaceStoragePath() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._workspace) {
                    return Promise.resolve(undefined);
                }
                if (!this._environment.appSettingsHome) {
                    return undefined;
                }
                const storageName = this._workspace.id;
                const storagePath = path.join(this._environment.appSettingsHome.fsPath, 'workspaceStorage', storageName);
                const exists = yield pfs.dirExists(storagePath);
                if (exists) {
                    return storagePath;
                }
                try {
                    yield pfs.mkdirp(storagePath);
                    yield pfs.writeFile(path.join(storagePath, 'meta.json'), JSON.stringify({
                        id: this._workspace.id,
                        configuration: this._workspace.configuration && uri_1.URI.revive(this._workspace.configuration).toString(),
                        name: this._workspace.name
                    }, undefined, 2));
                    return storagePath;
                }
                catch (e) {
                    console.error(e);
                    return undefined;
                }
            });
        }
    }
    class ExtHostExtensionService {
        constructor(nativeExit, initData, extHostContext, extHostWorkspace, extHostConfiguration, extHostLogService) {
            this._nativeExit = nativeExit;
            this._initData = initData;
            this._extHostContext = extHostContext;
            this._extHostWorkspace = extHostWorkspace;
            this._extHostConfiguration = extHostConfiguration;
            this._extHostLogService = extHostLogService;
            this._mainThreadWorkspaceProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadWorkspace);
            this._mainThreadTelemetryProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            this._mainThreadExtensionsProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            this._almostReadyToRunExtensions = new async_1.Barrier();
            this._readyToRunExtensions = new async_1.Barrier();
            this._registry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(initData.extensions);
            this._storage = new extHostStorage_1.ExtHostStorage(this._extHostContext);
            this._storagePath = new ExtensionStoragePath(initData.workspace, initData.environment);
            const hostExtensions = new Set();
            initData.hostExtensions.forEach((extensionId) => hostExtensions.add(extensions_1.ExtensionIdentifier.toKey(extensionId)));
            this._activator = new extHostExtensionActivator_1.ExtensionsActivator(this._registry, initData.resolvedExtensions, initData.hostExtensions, {
                showMessage: (severity, message) => {
                    this._mainThreadExtensionsProxy.$localShowMessage(severity, message);
                    switch (severity) {
                        case severity_1.default.Error:
                            console.error(message);
                            break;
                        case severity_1.default.Warning:
                            console.warn(message);
                            break;
                        default:
                            console.log(message);
                    }
                },
                actualActivateExtension: (extensionId, reason) => __awaiter(this, void 0, void 0, function* () {
                    if (hostExtensions.has(extensions_1.ExtensionIdentifier.toKey(extensionId))) {
                        const activationEvent = (reason instanceof extHostExtensionActivator_1.ExtensionActivatedByEvent ? reason.activationEvent : null);
                        yield this._mainThreadExtensionsProxy.$activateExtension(extensionId, activationEvent);
                        return new extHostExtensionActivator_1.HostExtension();
                    }
                    const extensionDescription = this._registry.getExtensionDescription(extensionId);
                    return this._activateExtension(extensionDescription, reason);
                })
            });
            this._extensionPathIndex = null;
            // initialize API first (i.e. do not release barrier until the API is initialized)
            this._extensionApiFactory = extHost_api_impl_1.createApiFactory(this._initData, this._extHostContext, this._extHostWorkspace, this._extHostConfiguration, this, this._extHostLogService, this._storage);
            this._resolvers = Object.create(null);
            this._started = false;
            this._initialize();
            if (this._initData.autoStart) {
                this._startExtensionHost();
            }
        }
        _initialize() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const configProvider = yield this._extHostConfiguration.getConfigProvider();
                    yield extHost_api_impl_1.initializeExtensionApi(this, this._extensionApiFactory, this._registry, configProvider);
                    // Do this when extension service exists, but extensions are not being activated yet.
                    yield proxyResolver_1.connectProxyResolver(this._extHostWorkspace, configProvider, this, this._extHostLogService, this._mainThreadTelemetryProxy);
                    this._almostReadyToRunExtensions.open();
                    yield this._extHostWorkspace.waitForInitializeCall();
                    this._readyToRunExtensions.open();
                }
                catch (err) {
                    errors.onUnexpectedError(err);
                }
            });
        }
        deactivateAll() {
            return __awaiter(this, void 0, void 0, function* () {
                let allPromises = [];
                try {
                    const allExtensions = this._registry.getAllExtensionDescriptions();
                    const allExtensionsIds = allExtensions.map(ext => ext.identifier);
                    const activatedExtensions = allExtensionsIds.filter(id => this.isActivated(id));
                    allPromises = activatedExtensions.map((extensionId) => {
                        return this._deactivate(extensionId);
                    });
                }
                catch (err) {
                    // TODO: write to log once we have one
                }
                yield allPromises;
            });
        }
        isActivated(extensionId) {
            if (this._readyToRunExtensions.isOpen()) {
                return this._activator.isActivated(extensionId);
            }
            return false;
        }
        _activateByEvent(activationEvent, startup) {
            const reason = new extHostExtensionActivator_1.ExtensionActivatedByEvent(startup, activationEvent);
            return this._activator.activateByEvent(activationEvent, reason);
        }
        _activateById(extensionId, reason) {
            return this._activator.activateById(extensionId, reason);
        }
        activateByIdWithErrors(extensionId, reason) {
            return this._activateById(extensionId, reason).then(() => {
                const extension = this._activator.getActivatedExtension(extensionId);
                if (extension.activationFailed) {
                    // activation failed => bubble up the error as the promise result
                    return Promise.reject(extension.activationFailedError);
                }
                return undefined;
            });
        }
        getExtensionRegistry() {
            return this._readyToRunExtensions.wait().then(_ => this._registry);
        }
        getExtensionExports(extensionId) {
            if (this._readyToRunExtensions.isOpen()) {
                return this._activator.getActivatedExtension(extensionId).exports;
            }
            else {
                return null;
            }
        }
        // create trie to enable fast 'filename -> extension id' look up
        getExtensionPathIndex() {
            if (!this._extensionPathIndex) {
                const tree = map_1.TernarySearchTree.forPaths();
                const extensions = this._registry.getAllExtensionDescriptions().map(ext => {
                    if (!ext.main) {
                        return undefined;
                    }
                    return pfs.realpath(ext.extensionLocation.fsPath).then(value => tree.set(uri_1.URI.file(value).fsPath, ext));
                });
                this._extensionPathIndex = Promise.all(extensions).then(() => tree);
            }
            return this._extensionPathIndex;
        }
        _deactivate(extensionId) {
            let result = Promise.resolve(undefined);
            if (!this._readyToRunExtensions.isOpen()) {
                return result;
            }
            if (!this._activator.isActivated(extensionId)) {
                return result;
            }
            const extension = this._activator.getActivatedExtension(extensionId);
            if (!extension) {
                return result;
            }
            // call deactivate if available
            try {
                if (typeof extension.module.deactivate === 'function') {
                    result = Promise.resolve(extension.module.deactivate()).then(undefined, (err) => {
                        // TODO: Do something with err if this is not the shutdown case
                        return Promise.resolve(undefined);
                    });
                }
            }
            catch (err) {
                // TODO: Do something with err if this is not the shutdown case
            }
            // clean up subscriptions
            try {
                lifecycle_1.dispose(extension.subscriptions);
            }
            catch (err) {
                // TODO: Do something with err if this is not the shutdown case
            }
            return result;
        }
        addMessage(extensionId, severity, message) {
            this._mainThreadExtensionsProxy.$addMessage(extensionId, severity, message);
        }
        // --- impl
        _activateExtension(extensionDescription, reason) {
            this._mainThreadExtensionsProxy.$onWillActivateExtension(extensionDescription.identifier);
            return this._doActivateExtension(extensionDescription, reason).then((activatedExtension) => {
                const activationTimes = activatedExtension.activationTimes;
                const activationEvent = (reason instanceof extHostExtensionActivator_1.ExtensionActivatedByEvent ? reason.activationEvent : null);
                this._mainThreadExtensionsProxy.$onDidActivateExtension(extensionDescription.identifier, activationTimes.startup, activationTimes.codeLoadingTime, activationTimes.activateCallTime, activationTimes.activateResolvedTime, activationEvent);
                this._logExtensionActivationTimes(extensionDescription, reason, 'success', activationTimes);
                return activatedExtension;
            }, (err) => {
                this._mainThreadExtensionsProxy.$onExtensionActivationFailed(extensionDescription.identifier);
                this._logExtensionActivationTimes(extensionDescription, reason, 'failure');
                throw err;
            });
        }
        _logExtensionActivationTimes(extensionDescription, reason, outcome, activationTimes) {
            const event = getTelemetryActivationEvent(extensionDescription, reason);
            /* __GDPR__
                "extensionActivationTimes" : {
                    "${include}": [
                        "${TelemetryActivationEvent}",
                        "${ExtensionActivationTimes}"
                    ],
                    "outcome" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this._mainThreadTelemetryProxy.$publicLog('extensionActivationTimes', Object.assign({}, event, (activationTimes || {}), { outcome }));
        }
        _doActivateExtension(extensionDescription, reason) {
            const event = getTelemetryActivationEvent(extensionDescription, reason);
            /* __GDPR__
                "activatePlugin" : {
                    "${include}": [
                        "${TelemetryActivationEvent}"
                    ]
                }
            */
            this._mainThreadTelemetryProxy.$publicLog('activatePlugin', event);
            if (!extensionDescription.main) {
                // Treat the extension as being empty => NOT AN ERROR CASE
                return Promise.resolve(new extHostExtensionActivator_1.EmptyExtension(extHostExtensionActivator_1.ExtensionActivationTimes.NONE));
            }
            this._extHostLogService.info(`ExtensionService#_doActivateExtension ${extensionDescription.identifier.value} ${JSON.stringify(reason)}`);
            const activationTimesBuilder = new extHostExtensionActivator_1.ExtensionActivationTimesBuilder(reason.startup);
            return Promise.all([
                loadCommonJSModule(this._extHostLogService, extensionDescription.main, activationTimesBuilder),
                this._loadExtensionContext(extensionDescription)
            ]).then(values => {
                return ExtHostExtensionService._callActivate(this._extHostLogService, extensionDescription.identifier, values[0], values[1], activationTimesBuilder);
            });
        }
        _loadExtensionContext(extensionDescription) {
            const globalState = new ExtensionMemento(extensionDescription.identifier.value, true, this._storage);
            const workspaceState = new ExtensionMemento(extensionDescription.identifier.value, false, this._storage);
            this._extHostLogService.trace(`ExtensionService#loadExtensionContext ${extensionDescription.identifier.value}`);
            return Promise.all([
                globalState.whenReady,
                workspaceState.whenReady,
                this._storagePath.whenReady
            ]).then(() => {
                const that = this;
                return Object.freeze({
                    globalState,
                    workspaceState,
                    subscriptions: [],
                    get extensionPath() { return extensionDescription.extensionLocation.fsPath; },
                    storagePath: this._storagePath.workspaceValue(extensionDescription),
                    globalStoragePath: this._storagePath.globalValue(extensionDescription),
                    asAbsolutePath: (relativePath) => { return path.join(extensionDescription.extensionLocation.fsPath, relativePath); },
                    logPath: that._extHostLogService.getLogDirectory(extensionDescription.identifier)
                });
            });
        }
        static _callActivate(logService, extensionId, extensionModule, context, activationTimesBuilder) {
            // Make sure the extension's surface is not undefined
            extensionModule = extensionModule || {
                activate: undefined,
                deactivate: undefined
            };
            return this._callActivateOptional(logService, extensionId, extensionModule, context, activationTimesBuilder).then((extensionExports) => {
                return new extHostExtensionActivator_1.ActivatedExtension(false, null, activationTimesBuilder.build(), extensionModule, extensionExports, context.subscriptions);
            });
        }
        static _callActivateOptional(logService, extensionId, extensionModule, context, activationTimesBuilder) {
            if (typeof extensionModule.activate === 'function') {
                try {
                    activationTimesBuilder.activateCallStart();
                    logService.trace(`ExtensionService#_callActivateOptional ${extensionId.value}`);
                    const activateResult = extensionModule.activate.apply(process.env.isBrowser ? self : global, [context]);
                    activationTimesBuilder.activateCallStop();
                    activationTimesBuilder.activateResolveStart();
                    return Promise.resolve(activateResult).then((value) => {
                        activationTimesBuilder.activateResolveStop();
                        return value;
                    });
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
            else {
                // No activate found => the module is the extension's exports
                return Promise.resolve(extensionModule);
            }
        }
        // -- eager activation
        // Handle "eager" activation extensions
        _handleEagerExtensions() {
            this._activateByEvent('*', true).then(undefined, (err) => {
                console.error(err);
            });
            return this._handleWorkspaceContainsEagerExtensions(this._extHostWorkspace.workspace);
        }
        _handleWorkspaceContainsEagerExtensions(workspace) {
            if (!workspace || workspace.folders.length === 0) {
                return Promise.resolve(undefined);
            }
            return Promise.all(this._registry.getAllExtensionDescriptions().map((desc) => {
                return this._handleWorkspaceContainsEagerExtension(workspace, desc);
            })).then(() => { });
        }
        _handleWorkspaceContainsEagerExtension(workspace, desc) {
            const activationEvents = desc.activationEvents;
            if (!activationEvents) {
                return Promise.resolve(undefined);
            }
            const fileNames = [];
            const globPatterns = [];
            for (const activationEvent of activationEvents) {
                if (/^workspaceContains:/.test(activationEvent)) {
                    const fileNameOrGlob = activationEvent.substr('workspaceContains:'.length);
                    if (fileNameOrGlob.indexOf('*') >= 0 || fileNameOrGlob.indexOf('?') >= 0) {
                        globPatterns.push(fileNameOrGlob);
                    }
                    else {
                        fileNames.push(fileNameOrGlob);
                    }
                }
            }
            if (fileNames.length === 0 && globPatterns.length === 0) {
                return Promise.resolve(undefined);
            }
            const fileNamePromise = Promise.all(fileNames.map((fileName) => this._activateIfFileName(workspace, desc.identifier, fileName))).then(() => { });
            const globPatternPromise = this._activateIfGlobPatterns(desc.identifier, globPatterns);
            return Promise.all([fileNamePromise, globPatternPromise]).then(() => { });
        }
        _activateIfFileName(workspace, extensionId, fileName) {
            return __awaiter(this, void 0, void 0, function* () {
                // find exact path
                for (const { uri } of workspace.folders) {
                    if (yield pfs.exists(path.join(uri_1.URI.revive(uri).fsPath, fileName))) {
                        // the file was found
                        return (this._activateById(extensionId, new extHostExtensionActivator_1.ExtensionActivatedByEvent(true, `workspaceContains:${fileName}`))
                            .then(undefined, err => console.error(err)));
                    }
                }
                return undefined;
            });
        }
        _activateIfGlobPatterns(extensionId, globPatterns) {
            return __awaiter(this, void 0, void 0, function* () {
                this._extHostLogService.trace(`extensionHostMain#activateIfGlobPatterns: fileSearch, extension: ${extensionId.value}, entryPoint: workspaceContains`);
                if (globPatterns.length === 0) {
                    return Promise.resolve(undefined);
                }
                const tokenSource = new cancellation_1.CancellationTokenSource();
                const searchP = this._mainThreadWorkspaceProxy.$checkExists(globPatterns, tokenSource.token);
                const timer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    tokenSource.cancel();
                    this._activateById(extensionId, new extHostExtensionActivator_1.ExtensionActivatedByEvent(true, `workspaceContainsTimeout:${globPatterns.join(',')}`))
                        .then(undefined, err => console.error(err));
                }), ExtHostExtensionService.WORKSPACE_CONTAINS_TIMEOUT);
                let exists = false;
                try {
                    exists = yield searchP;
                }
                catch (err) {
                    if (!errors.isPromiseCanceledError(err)) {
                        console.error(err);
                    }
                }
                tokenSource.dispose();
                clearTimeout(timer);
                if (exists) {
                    // a file was found matching one of the glob patterns
                    return (this._activateById(extensionId, new extHostExtensionActivator_1.ExtensionActivatedByEvent(true, `workspaceContains:${globPatterns.join(',')}`))
                        .then(undefined, err => console.error(err)));
                }
                return Promise.resolve(undefined);
            });
        }
        _handleExtensionTests() {
            return this._doHandleExtensionTests().then(undefined, error => {
                console.error(error); // ensure any error message makes it onto the console
                return Promise.reject(error);
            });
        }
        _doHandleExtensionTests() {
            const { extensionDevelopmentLocationURI, extensionTestsLocationURI } = this._initData.environment;
            if (!(extensionDevelopmentLocationURI && extensionTestsLocationURI && extensionTestsLocationURI.scheme === network_1.Schemas.file)) {
                return Promise.resolve(undefined);
            }
            const extensionTestsPath = resources_1.originalFSPath(extensionTestsLocationURI);
            // Require the test runner via node require from the provided path
            let testRunner;
            let requireError;
            try {
                testRunner = require.__$__nodeRequire(extensionTestsPath);
            }
            catch (error) {
                requireError = error;
            }
            // Execute the runner if it follows our spec
            if (testRunner && typeof testRunner.run === 'function') {
                return new Promise((c, e) => {
                    testRunner.run(extensionTestsPath, (error, failures) => {
                        if (error) {
                            e(error.toString());
                        }
                        else {
                            c(undefined);
                        }
                        // after tests have run, we shutdown the host
                        this._gracefulExit(error || (typeof failures === 'number' && failures > 0) ? 1 /* ERROR */ : 0 /* OK */);
                    });
                });
            }
            // Otherwise make sure to shutdown anyway even in case of an error
            else {
                this._gracefulExit(1 /* ERROR */);
            }
            return Promise.reject(new Error(requireError ? requireError.toString() : nls.localize('extensionTestError', "Path {0} does not point to a valid extension test runner.", extensionTestsPath)));
        }
        _gracefulExit(code) {
            // to give the PH process a chance to flush any outstanding console
            // messages to the main process, we delay the exit() by some time
            setTimeout(() => this._nativeExit(code), 500);
        }
        _startExtensionHost() {
            if (this._started) {
                throw new Error(`Extension host is already started!`);
            }
            this._started = true;
            return this._readyToRunExtensions.wait()
                .then(() => this._handleEagerExtensions())
                .then(() => this._handleExtensionTests())
                .then(() => {
                this._extHostLogService.info(`eager extensions activated`);
            });
        }
        // -- called by extensions
        registerRemoteAuthorityResolver(authorityPrefix, resolver) {
            this._resolvers[authorityPrefix] = resolver;
            return lifecycle_1.toDisposable(() => {
                delete this._resolvers[authorityPrefix];
            });
        }
        // -- called by main thread
        $resolveAuthority(remoteAuthority) {
            return __awaiter(this, void 0, void 0, function* () {
                const authorityPlusIndex = remoteAuthority.indexOf('+');
                if (authorityPlusIndex === -1) {
                    throw new Error(`Not an authority that can be resolved!`);
                }
                const authorityPrefix = remoteAuthority.substr(0, authorityPlusIndex);
                yield this._almostReadyToRunExtensions.wait();
                yield this._activateByEvent(`onResolveRemoteAuthority:${authorityPrefix}`, false);
                const resolver = this._resolvers[authorityPrefix];
                if (!resolver) {
                    throw new Error(`No resolver available for ${authorityPrefix}`);
                }
                const result = yield resolver.resolve(remoteAuthority);
                return {
                    authority: remoteAuthority,
                    host: result.host,
                    port: result.port,
                    debugListenPort: result.debugListenPort,
                    debugConnectPort: result.debugConnectPort,
                };
            });
        }
        $startExtensionHost(enabledExtensionIds) {
            this._registry.keepOnly(enabledExtensionIds);
            return this._startExtensionHost();
        }
        $activateByEvent(activationEvent) {
            return (this._readyToRunExtensions.wait()
                .then(_ => this._activateByEvent(activationEvent, false)));
        }
        $activate(extensionId, activationEvent) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this._readyToRunExtensions.wait();
                if (!this._registry.getExtensionDescription(extensionId)) {
                    // unknown extension => ignore
                    return false;
                }
                yield this._activateById(extensionId, new extHostExtensionActivator_1.ExtensionActivatedByEvent(false, activationEvent));
                return true;
            });
        }
        $deltaExtensions(toAdd, toRemove) {
            return __awaiter(this, void 0, void 0, function* () {
                toAdd.forEach((extension) => extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation));
                const trie = yield this.getExtensionPathIndex();
                yield Promise.all(toRemove.map((extensionId) => __awaiter(this, void 0, void 0, function* () {
                    const extensionDescription = this._registry.getExtensionDescription(extensionId);
                    if (!extensionDescription) {
                        return;
                    }
                    const realpath = yield pfs.realpath(extensionDescription.extensionLocation.fsPath);
                    trie.delete(uri_1.URI.file(realpath).fsPath);
                })));
                yield Promise.all(toAdd.map((extensionDescription) => __awaiter(this, void 0, void 0, function* () {
                    const realpath = yield pfs.realpath(extensionDescription.extensionLocation.fsPath);
                    trie.set(uri_1.URI.file(realpath).fsPath, extensionDescription);
                })));
                this._registry.deltaExtensions(toAdd, toRemove);
                return Promise.resolve(undefined);
            });
        }
        $test_latency(n) {
            return __awaiter(this, void 0, void 0, function* () {
                return n;
            });
        }
        $test_up(b) {
            return __awaiter(this, void 0, void 0, function* () {
                return b.length;
            });
        }
        $test_down(size) {
            return __awaiter(this, void 0, void 0, function* () {
                const b = Buffer.alloc(size, Math.random() % 256);
                return b;
            });
        }
    }
    ExtHostExtensionService.WORKSPACE_CONTAINS_TIMEOUT = 7000;
    exports.ExtHostExtensionService = ExtHostExtensionService;
    function loadCommonJSModule(logService, modulePath, activationTimesBuilder) {
        let r = null;
        activationTimesBuilder.codeLoadingStart();
        logService.info(`ExtensionService#loadCommonJSModule ${modulePath}`);
        try {
            if (process.env.isBrowser) {
                r = self['require'].__$__nodeRequire(modulePath);
            }
            else {
                r = require.__$__nodeRequire(modulePath);
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
        finally {
            activationTimesBuilder.codeLoadingStop();
        }
        return Promise.resolve(r);
    }
    function getTelemetryActivationEvent(extensionDescription, reason) {
        const reasonStr = reason instanceof extHostExtensionActivator_1.ExtensionActivatedByEvent ? reason.activationEvent :
            reason instanceof extHostExtensionActivator_1.ExtensionActivatedByAPI ? 'api' :
                '';
        /* __GDPR__FRAGMENT__
            "TelemetryActivationEvent" : {
                "id": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                "name": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                "extensionVersion": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                "publisherDisplayName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "activationEvents": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "isBuiltin": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "reason": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            }
        */
        const event = {
            id: extensionDescription.identifier.value,
            name: extensionDescription.name,
            extensionVersion: extensionDescription.version,
            publisherDisplayName: extensionDescription.publisher,
            activationEvents: extensionDescription.activationEvents ? extensionDescription.activationEvents.join(',') : null,
            isBuiltin: extensionDescription.isBuiltin,
            reason: reasonStr
        };
        return event;
    }
});
//# sourceMappingURL=extHostExtensionService.js.map