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
define(["require", "exports", "vs/nls", "child_process", "electron", "net", "vs/base/common/amd", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/console", "vs/base/node/ports", "vs/base/parts/ipc/node/ipc.net", "vs/workbench/services/broadcast/electron-browser/broadcastService", "vs/platform/environment/common/environment", "vs/platform/extensions/common/extensionHost", "vs/platform/label/common/label", "vs/platform/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/product/node/product", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/windows/common/windows", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/node/extensionHostProtocol", "vs/base/common/types"], function (require, exports, nls, child_process_1, electron_1, net_1, amd_1, async_1, errorMessage_1, event_1, lifecycle_1, network_1, objects, platform_1, resources_1, uri_1, console_1, ports_1, ipc_net_1, broadcastService_1, environment_1, extensionHost_1, label_1, lifecycle_2, log_1, product_1, notification_1, telemetry_1, windows_1, workspace_1, extensionHostProtocol_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function parseExtensionDevOptions(environmentService) {
        // handle extension host lifecycle a bit special when we know we are developing an extension that runs inside
        let isExtensionDevHost = environmentService.isExtensionDevelopment;
        const extDevLoc = environmentService.extensionDevelopmentLocationURI;
        const debugOk = !extDevLoc || extDevLoc.scheme === network_1.Schemas.file;
        let isExtensionDevDebug = debugOk && typeof environmentService.debugExtensionHost.port === 'number';
        let isExtensionDevDebugBrk = debugOk && !!environmentService.debugExtensionHost.break;
        let isExtensionDevTestFromCli = isExtensionDevHost && !!environmentService.extensionTestsLocationURI && !environmentService.debugExtensionHost.break;
        return {
            isExtensionDevHost,
            isExtensionDevDebug,
            isExtensionDevDebugBrk,
            isExtensionDevTestFromCli,
        };
    }
    exports.parseExtensionDevOptions = parseExtensionDevOptions;
    let ExtensionHostProcessWorker = class ExtensionHostProcessWorker {
        constructor(_autoStart, _extensions, _extensionHostLogsLocation, _contextService, _notificationService, _windowsService, _windowService, _broadcastService, _lifecycleService, _environmentService, _telemetryService, _logService, _labelService) {
            this._autoStart = _autoStart;
            this._extensions = _extensions;
            this._extensionHostLogsLocation = _extensionHostLogsLocation;
            this._contextService = _contextService;
            this._notificationService = _notificationService;
            this._windowsService = _windowsService;
            this._windowService = _windowService;
            this._broadcastService = _broadcastService;
            this._lifecycleService = _lifecycleService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._labelService = _labelService;
            this._onCrashed = new event_1.Emitter();
            this.onCrashed = this._onCrashed.event;
            const devOpts = parseExtensionDevOptions(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
            this._isExtensionDevDebug = devOpts.isExtensionDevDebug;
            this._isExtensionDevDebugBrk = devOpts.isExtensionDevDebugBrk;
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
            this._lastExtensionHostError = null;
            this._terminating = false;
            this._namedPipeServer = null;
            this._extensionHostProcess = null;
            this._extensionHostConnection = null;
            this._messageProtocol = null;
            this._toDispose = [];
            this._toDispose.push(this._onCrashed);
            this._toDispose.push(this._lifecycleService.onWillShutdown(e => this._onWillShutdown(e)));
            this._toDispose.push(this._lifecycleService.onShutdown(reason => this.terminate()));
            this._toDispose.push(this._broadcastService.onBroadcast(b => this._onBroadcast(b)));
            const globalExitListener = () => this.terminate();
            process.once('exit', globalExitListener);
            this._toDispose.push(lifecycle_1.toDisposable(() => {
                process.removeListener('exit', globalExitListener);
            }));
        }
        dispose() {
            this.terminate();
        }
        _onBroadcast(broadcast) {
            // Close Ext Host Window Request
            if (broadcast.channel === extensionHost_1.EXTENSION_CLOSE_EXTHOST_BROADCAST_CHANNEL && this._isExtensionDevHost) {
                const extensionLocations = broadcast.payload;
                if (Array.isArray(extensionLocations) && extensionLocations.some(uriString => resources_1.isEqual(this._environmentService.extensionDevelopmentLocationURI, uri_1.URI.parse(uriString)))) {
                    this._windowService.closeWindow();
                }
            }
            if (broadcast.channel === extensionHost_1.EXTENSION_RELOAD_BROADCAST_CHANNEL && this._isExtensionDevHost) {
                const extensionPaths = broadcast.payload;
                if (Array.isArray(extensionPaths) && extensionPaths.some(uriString => resources_1.isEqual(this._environmentService.extensionDevelopmentLocationURI, uri_1.URI.parse(uriString)))) {
                    this._windowService.reloadWindow();
                }
            }
        }
        start() {
            if (this._terminating) {
                // .terminate() was called
                return null;
            }
            if (!this._messageProtocol) {
                this._messageProtocol = Promise.all([this._tryListenOnPipe(), this._tryFindDebugPort()]).then(data => {
                    const pipeName = data[0];
                    const portData = data[1];
                    const opts = {
                        env: objects.mixin(objects.deepClone(process.env), {
                            AMD_ENTRYPOINT: 'vs/workbench/services/extensions/node/extensionHostProcess',
                            PIPE_LOGGING: 'true',
                            VERBOSE_LOGGING: true,
                            VSCODE_IPC_HOOK_EXTHOST: pipeName,
                            VSCODE_HANDLES_UNCAUGHT_ERRORS: true,
                            VSCODE_LOG_STACK: !this._isExtensionDevTestFromCli && (this._isExtensionDevHost || !this._environmentService.isBuilt || product_1.default.quality !== 'stable' || this._environmentService.verbose),
                            VSCODE_LOG_LEVEL: this._environmentService.verbose ? 'trace' : this._environmentService.log
                        }),
                        // We only detach the extension host on windows. Linux and Mac orphan by default
                        // and detach under Linux and Mac create another process group.
                        // We detach because we have noticed that when the renderer exits, its child processes
                        // (i.e. extension host) are taken down in a brutal fashion by the OS
                        detached: !!platform_1.isWindows,
                        execArgv: undefined,
                        silent: true
                    };
                    if (portData.actual) {
                        opts.execArgv = [
                            '--nolazy',
                            (this._isExtensionDevDebugBrk ? '--inspect-brk=' : '--inspect=') + portData.actual
                        ];
                        if (!portData.expected) {
                            // No one asked for 'inspect' or 'inspect-brk', only us. We add another
                            // option such that the extension host can manipulate the execArgv array
                            opts.env.VSCODE_PREVENT_FOREIGN_INSPECT = true;
                        }
                    }
                    const crashReporterOptions = undefined; // TODO@electron pass this in as options to the extension host after verifying this actually works
                    if (crashReporterOptions) {
                        opts.env.CRASH_REPORTER_START_OPTIONS = JSON.stringify(crashReporterOptions);
                    }
                    // Run Extension Host as fork of current process
                    /**
                     * Extensions Process
                     */
                    this._extensionHostProcess = child_process_1.fork(amd_1.getPathFromAmdModule(require, 'bootstrap-fork'), ['--type=extensionHost'], opts);
                    if (process.env.isBrowser) {
                        window['extensionManager'] = this._extensionHostProcess['worker'];
                        this._extensionHostProcess['worker'].addEventListener('message', this._namedPipeServer['_initListenerFunction']);
                    }
                    this._extensionHostProcess.stdout.setEncoding('utf8');
                    this._extensionHostProcess.stderr.setEncoding('utf8');
                    const onStdout = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stdout, 'data');
                    const onStderr = event_1.Event.fromNodeEventEmitter(this._extensionHostProcess.stderr, 'data');
                    const onOutput = event_1.Event.any(event_1.Event.map(onStdout, o => ({ data: `%c${o}`, format: [''] })), event_1.Event.map(onStderr, o => ({ data: `%c${o}`, format: ['color: red'] })));
                    // Debounce all output, so we can render it in the Chrome console as a group
                    const onDebouncedOutput = event_1.Event.debounce(onOutput, (r, o) => {
                        return r
                            ? { data: r.data + o.data, format: [...r.format, ...o.format] }
                            : { data: o.data, format: o.format };
                    }, 100);
                    // Print out extension host output
                    onDebouncedOutput(output => {
                        console.log(output);
                        const inspectorUrlMatch = output.data && output.data.match(/ws:\/\/([^\s]+:(\d+)\/[^\s]+)/);
                        if (inspectorUrlMatch) {
                            if (!this._environmentService.isBuilt) {
                                console.log(`%c[Extension Host] %cdebugger inspector at chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${inspectorUrlMatch[1]}`, 'color: blue', 'color: black');
                            }
                            if (!this._inspectPort) {
                                this._inspectPort = Number(inspectorUrlMatch[2]);
                            }
                        }
                        else {
                            console.group('Extension Host');
                            console.log(output.data, ...output.format);
                            console.groupEnd();
                        }
                    });
                    // Support logging from extension host
                    this._extensionHostProcess.on('message', msg => {
                        if (msg && msg.type === '__$console') {
                            this._logExtensionHostMessage(msg);
                        }
                    });
                    // Lifecycle
                    this._extensionHostProcess.on('error', (err) => this._onExtHostProcessError(err));
                    this._extensionHostProcess.on('exit', (code, signal) => this._onExtHostProcessExit(code, signal));
                    // Notify debugger that we are ready to attach to the process if we run a development extension
                    if (this._isExtensionDevHost && portData.actual && this._isExtensionDevDebug) {
                        this._broadcastService.broadcast({
                            channel: extensionHost_1.EXTENSION_ATTACH_BROADCAST_CHANNEL,
                            payload: {
                                debugId: this._environmentService.debugExtensionHost.debugId,
                                port: portData.actual
                            }
                        });
                    }
                    this._inspectPort = portData.actual;
                    // Help in case we fail to start it
                    let startupTimeoutHandle;
                    if (!this._environmentService.isBuilt && !this._windowService.getConfiguration().remoteAuthority || this._isExtensionDevHost) {
                        startupTimeoutHandle = setTimeout(() => {
                            const msg = this._isExtensionDevDebugBrk
                                ? nls.localize('extensionHostProcess.startupFailDebug', "Extension host did not start in 10 seconds, it might be stopped on the first line and needs a debugger to continue.")
                                : nls.localize('extensionHostProcess.startupFail', "Extension host did not start in 10 seconds, that might be a problem.");
                            this._notificationService.prompt(notification_1.Severity.Warning, msg, [{
                                    label: nls.localize('reloadWindow', "Reload Window"),
                                    run: () => this._windowService.reloadWindow()
                                }], { sticky: true });
                        }, 10000);
                    }
                    // Initialize extension host process with hand shakes
                    return this._tryExtHostHandshake().then((protocol) => {
                        clearTimeout(startupTimeoutHandle);
                        return protocol;
                    });
                });
            }
            return this._messageProtocol;
        }
        /**
         * Start a server (`this._namedPipeServer`) that listens on a named pipe and return the named pipe name.
         */
        _tryListenOnPipe() {
            return new Promise((resolve, reject) => {
                const pipeName = process.env.isBrowser ? 'VSCODE_IPC_HOOK_EXTHOST' : ipc_net_1.generateRandomPipeName();
                this._namedPipeServer = net_1.createServer();
                this._namedPipeServer.on('error', reject);
                this._namedPipeServer.listen(pipeName, () => {
                    if (this._namedPipeServer) {
                        this._namedPipeServer.removeListener('error', reject);
                    }
                    resolve(pipeName);
                });
            });
        }
        /**
         * Find a free port if extension host debugging is enabled.
         */
        _tryFindDebugPort() {
            let expected;
            let startPort = ports_1.randomPort();
            if (typeof this._environmentService.debugExtensionHost.port === 'number') {
                startPort = expected = this._environmentService.debugExtensionHost.port;
            }
            return new Promise(resolve => {
                return ports_1.findFreePort(startPort, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */).then(port => {
                    if (!port) {
                        console.warn('%c[Extension Host] %cCould not find a free port for debugging', 'color: blue', 'color: black');
                    }
                    else {
                        if (expected && port !== expected) {
                            console.warn(`%c[Extension Host] %cProvided debugging port ${expected} is not free, using ${port} instead.`, 'color: blue', 'color: black');
                        }
                        if (this._isExtensionDevDebugBrk) {
                            console.warn(`%c[Extension Host] %cSTOPPED on first line for debugging on port ${port}`, 'color: blue', 'color: black');
                        }
                        else {
                            console.info(`%c[Extension Host] %cdebugger listening on port ${port}`, 'color: blue', 'color: black');
                        }
                    }
                    return resolve({ expected, actual: port });
                });
            });
        }
        _tryExtHostHandshake() {
            return new Promise((resolve, reject) => {
                // Wait for the extension host to connect to our named pipe
                // and wrap the socket in the message passing protocol
                let handle = setTimeout(() => {
                    if (this._namedPipeServer) {
                        this._namedPipeServer.close();
                        this._namedPipeServer = null;
                    }
                    reject('timeout');
                }, 60 * 1000);
                this._namedPipeServer.on('connection', socket => {
                    clearTimeout(handle);
                    if (this._namedPipeServer) {
                        this._namedPipeServer.close();
                        this._namedPipeServer = null;
                    }
                    this._extensionHostConnection = socket;
                    // using a buffered message protocol here because between now
                    // and the first time a `then` executes some messages might be lost
                    // unless we immediately register a listener for `onMessage`.
                    resolve(new ipc_net_1.BufferedProtocol(new ipc_net_1.Protocol(this._extensionHostConnection)));
                });
            }).then((protocol) => {
                // 1) wait for the incoming `ready` event and send the initialization data.
                // 2) wait for the incoming `initialized` event.
                return new Promise((resolve, reject) => {
                    let timeoutHandle;
                    const installTimeoutCheck = () => {
                        timeoutHandle = setTimeout(() => {
                            reject('timeout');
                        }, 60 * 1000);
                    };
                    const uninstallTimeoutCheck = () => {
                        clearTimeout(timeoutHandle);
                    };
                    // Wait 60s for the ready message
                    installTimeoutCheck();
                    const disposable = protocol.onMessage(msg => {
                        if (extensionHostProtocol_1.isMessageOfType(msg, 1 /* Ready */)) {
                            // 1) Extension Host is ready to receive messages, initialize it
                            uninstallTimeoutCheck();
                            this._createExtHostInitData().then(data => {
                                // Wait 60s for the initialized message
                                installTimeoutCheck();
                                protocol.send(Buffer.from(JSON.stringify(data)));
                            });
                            return;
                        }
                        if (extensionHostProtocol_1.isMessageOfType(msg, 0 /* Initialized */)) {
                            // 2) Extension Host is initialized
                            uninstallTimeoutCheck();
                            // stop listening for messages here
                            disposable.dispose();
                            // release this promise
                            resolve(protocol);
                            return;
                        }
                        console.error(`received unexpected message during handshake phase from the extension host: `, msg);
                    });
                });
            });
        }
        _createExtHostInitData() {
            return Promise.all([this._telemetryService.getTelemetryInfo(), this._extensions])
                .then(([telemetryInfo, extensionDescriptions]) => {
                const workspace = this._contextService.getWorkspace();
                const r = {
                    commit: product_1.default.commit,
                    parentPid: process.pid,
                    environment: {
                        isExtensionDevelopmentDebug: this._isExtensionDevDebug,
                        appRoot: this._environmentService.appRoot ? uri_1.URI.file(this._environmentService.appRoot) : undefined,
                        appSettingsHome: this._environmentService.appSettingsHome ? uri_1.URI.file(this._environmentService.appSettingsHome) : undefined,
                        extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                        extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                        globalStorageHome: uri_1.URI.file(this._environmentService.globalStorageHome),
                        userHome: uri_1.URI.file(this._environmentService.userHome)
                    },
                    workspace: this._contextService.getWorkbenchState() === 1 /* EMPTY */ ? undefined : {
                        configuration: types_1.withNullAsUndefined(workspace.configuration),
                        id: workspace.id,
                        name: this._labelService.getWorkspaceLabel(workspace)
                    },
                    resolvedExtensions: [],
                    hostExtensions: [],
                    extensions: extensionDescriptions,
                    telemetryInfo,
                    logLevel: this._logService.getLevel(),
                    logsLocation: this._extensionHostLogsLocation,
                    autoStart: this._autoStart
                };
                return r;
            });
        }
        _logExtensionHostMessage(entry) {
            // Send to local console unless we run tests from cli
            if (!this._isExtensionDevTestFromCli) {
                console_1.log(entry, 'Extension Host');
            }
            // Log on main side if running tests from cli
            if (this._isExtensionDevTestFromCli) {
                this._windowsService.log(entry.severity, ...console_1.parse(entry).args);
            }
            // Broadcast to other windows if we are in development mode
            else if (!this._environmentService.isBuilt || this._isExtensionDevHost) {
                this._broadcastService.broadcast({
                    channel: extensionHost_1.EXTENSION_LOG_BROADCAST_CHANNEL,
                    payload: {
                        logEntry: entry,
                        debugId: this._environmentService.debugExtensionHost.debugId
                    }
                });
            }
        }
        _onExtHostProcessError(err) {
            let errorMessage = errorMessage_1.toErrorMessage(err);
            if (errorMessage === this._lastExtensionHostError) {
                return; // prevent error spam
            }
            this._lastExtensionHostError = errorMessage;
            this._notificationService.error(nls.localize('extensionHostProcess.error', "Error from the extension host: {0}", errorMessage));
        }
        _onExtHostProcessExit(code, signal) {
            if (this._terminating) {
                // Expected termination path (we asked the process to terminate)
                return;
            }
            // Unexpected termination
            if (!this._isExtensionDevHost) {
                this._onCrashed.fire([code, signal]);
            }
            // Expected development extension termination: When the extension host goes down we also shutdown the window
            else if (!this._isExtensionDevTestFromCli) {
                this._windowService.closeWindow();
            }
            // When CLI testing make sure to exit with proper exit code
            else {
                electron_1.ipcRenderer.send('vscode:exit', code);
            }
        }
        enableInspector() {
            if (this._inspectPort) {
                return Promise.resolve();
            }
            // send SIGUSR1 and wait a little the actual port is read from the process stdout which we
            // scan here: https://github.com/Microsoft/vscode/blob/67ffab8dcd1a6752d8b62bcd13d7020101eef568/src/vs/workbench/services/extensions/electron-browser/extensionHost.ts#L225-L240
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill('SIGUSR1');
            }
            return async_1.timeout(1000);
        }
        getInspectPort() {
            return this._inspectPort;
        }
        terminate() {
            if (this._terminating) {
                return;
            }
            this._terminating = true;
            lifecycle_1.dispose(this._toDispose);
            if (!this._messageProtocol) {
                // .start() was not called
                return;
            }
            this._messageProtocol.then((protocol) => {
                // Send the extension host a request to terminate itself
                // (graceful termination)
                protocol.send(extensionHostProtocol_1.createMessageOfType(2 /* Terminate */));
                // Give the extension host 10s, after which we will
                // try to kill the process and release any resources
                setTimeout(() => this._cleanResources(), 10 * 1000);
            }, (err) => {
                // Establishing a protocol with the extension host failed, so
                // try to kill the process and release any resources.
                this._cleanResources();
            });
        }
        _cleanResources() {
            if (this._namedPipeServer) {
                this._namedPipeServer.close();
                this._namedPipeServer = null;
            }
            if (this._extensionHostConnection) {
                this._extensionHostConnection.end();
                this._extensionHostConnection = null;
            }
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill();
                this._extensionHostProcess = null;
            }
        }
        _onWillShutdown(event) {
            // If the extension development host was started without debugger attached we need
            // to communicate this back to the main side to terminate the debug session
            if (this._isExtensionDevHost && !this._isExtensionDevTestFromCli && !this._isExtensionDevDebug) {
                this._broadcastService.broadcast({
                    channel: extensionHost_1.EXTENSION_TERMINATE_BROADCAST_CHANNEL,
                    payload: {
                        debugId: this._environmentService.debugExtensionHost.debugId
                    }
                });
                event.join(async_1.timeout(100 /* wait a bit for IPC to get delivered */));
            }
        }
    };
    ExtensionHostProcessWorker = __decorate([
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, notification_1.INotificationService),
        __param(5, windows_1.IWindowsService),
        __param(6, windows_1.IWindowService),
        __param(7, broadcastService_1.IBroadcastService),
        __param(8, lifecycle_2.ILifecycleService),
        __param(9, environment_1.IEnvironmentService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, log_1.ILogService),
        __param(12, label_1.ILabelService)
    ], ExtensionHostProcessWorker);
    exports.ExtensionHostProcessWorker = ExtensionHostProcessWorker;
});
//# sourceMappingURL=extensionHost.js.map