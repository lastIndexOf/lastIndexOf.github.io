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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/contrib/debug/common/debug", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/electron-browser/extHostCustomers", "vs/base/common/severity", "vs/workbench/contrib/debug/node/debugAdapter", "vs/workbench/contrib/debug/common/debugUtils"], function (require, exports, lifecycle_1, uri_1, debug_1, extHost_protocol_1, extHostCustomers_1, severity_1, debugAdapter_1, debugUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadDebugService = class MainThreadDebugService {
        constructor(extHostContext, debugService) {
            this.debugService = debugService;
            this._debugAdaptersHandleCounter = 1;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDebugService);
            this._toDispose = [];
            this._toDispose.push(debugService.onDidNewSession(session => {
                this._proxy.$acceptDebugSessionStarted(this.getSessionDto(session));
            }));
            // Need to start listening early to new session events because a custom event can come while a session is initialising
            this._toDispose.push(debugService.onWillNewSession(session => {
                this._toDispose.push(session.onDidCustomEvent(event => this._proxy.$acceptDebugSessionCustomEvent(this.getSessionDto(session), event)));
            }));
            this._toDispose.push(debugService.onDidEndSession(session => {
                this._proxy.$acceptDebugSessionTerminated(this.getSessionDto(session));
                this._sessions.delete(session.getId());
            }));
            this._toDispose.push(debugService.getViewModel().onDidFocusSession(session => {
                this._proxy.$acceptDebugSessionActiveChanged(this.getSessionDto(session));
            }));
            this._debugAdapters = new Map();
            this._debugConfigurationProviders = new Map();
            this._debugAdapterDescriptorFactories = new Map();
            this._debugAdapterTrackerFactories = new Map();
            this._sessions = new Set();
        }
        dispose() {
            this._toDispose = lifecycle_1.dispose(this._toDispose);
        }
        // interface IDebugAdapterProvider
        createDebugAdapter(session) {
            const handle = this._debugAdaptersHandleCounter++;
            const da = new ExtensionHostDebugAdapter(this, handle, this._proxy, session);
            this._debugAdapters.set(handle, da);
            return da;
        }
        substituteVariables(folder, config) {
            return Promise.resolve(this._proxy.$substituteVariables(folder ? folder.uri : undefined, config));
        }
        runInTerminal(args, config) {
            return Promise.resolve(this._proxy.$runInTerminal(args, config));
        }
        // RPC methods (MainThreadDebugServiceShape)
        $registerDebugTypes(debugTypes) {
            this._toDispose.push(this.debugService.getConfigurationManager().registerDebugAdapterFactory(debugTypes, this));
        }
        $startBreakpointEvents() {
            if (!this._breakpointEventsActive) {
                this._breakpointEventsActive = true;
                // set up a handler to send more
                this._toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(e => {
                    // Ignore session only breakpoint events since they should only reflect in the UI
                    if (e && !e.sessionOnly) {
                        const delta = {};
                        if (e.added) {
                            delta.added = this.convertToDto(e.added);
                        }
                        if (e.removed) {
                            delta.removed = e.removed.map(x => x.getId());
                        }
                        if (e.changed) {
                            delta.changed = this.convertToDto(e.changed);
                        }
                        if (delta.added || delta.removed || delta.changed) {
                            this._proxy.$acceptBreakpointsDelta(delta);
                        }
                    }
                }));
                // send all breakpoints
                const bps = this.debugService.getModel().getBreakpoints();
                const fbps = this.debugService.getModel().getFunctionBreakpoints();
                if (bps.length > 0 || fbps.length > 0) {
                    this._proxy.$acceptBreakpointsDelta({
                        added: this.convertToDto(bps).concat(this.convertToDto(fbps))
                    });
                }
            }
        }
        $registerBreakpoints(DTOs) {
            for (let dto of DTOs) {
                if (dto.type === 'sourceMulti') {
                    const rawbps = dto.lines.map(l => ({
                        id: l.id,
                        enabled: l.enabled,
                        lineNumber: l.line + 1,
                        column: l.character > 0 ? l.character + 1 : undefined,
                        condition: l.condition,
                        hitCondition: l.hitCondition,
                        logMessage: l.logMessage
                    }));
                    this.debugService.addBreakpoints(uri_1.URI.revive(dto.uri), rawbps, 'extension');
                }
                else if (dto.type === 'function') {
                    this.debugService.addFunctionBreakpoint(dto.functionName, dto.id);
                }
            }
            return Promise.resolve();
        }
        $unregisterBreakpoints(breakpointIds, functionBreakpointIds) {
            breakpointIds.forEach(id => this.debugService.removeBreakpoints(id));
            functionBreakpointIds.forEach(id => this.debugService.removeFunctionBreakpoints(id));
            return Promise.resolve();
        }
        $registerDebugConfigurationProvider(debugType, hasProvide, hasResolve, hasProvideDebugAdapter, handle) {
            const provider = {
                type: debugType
            };
            if (hasProvide) {
                provider.provideDebugConfigurations = (folder) => {
                    return Promise.resolve(this._proxy.$provideDebugConfigurations(handle, folder));
                };
            }
            if (hasResolve) {
                provider.resolveDebugConfiguration = (folder, config) => {
                    return Promise.resolve(this._proxy.$resolveDebugConfiguration(handle, folder, config));
                };
            }
            if (hasProvideDebugAdapter) {
                console.info('DebugConfigurationProvider.debugAdapterExecutable is deprecated and will be removed soon; please use DebugAdapterDescriptorFactory.createDebugAdapterDescriptor instead.');
                provider.debugAdapterExecutable = (folder) => {
                    return Promise.resolve(this._proxy.$legacyDebugAdapterExecutable(handle, folder));
                };
            }
            this._debugConfigurationProviders.set(handle, provider);
            this._toDispose.push(this.debugService.getConfigurationManager().registerDebugConfigurationProvider(provider));
            return Promise.resolve(undefined);
        }
        $unregisterDebugConfigurationProvider(handle) {
            const provider = this._debugConfigurationProviders.get(handle);
            if (provider) {
                this._debugConfigurationProviders.delete(handle);
                this.debugService.getConfigurationManager().unregisterDebugConfigurationProvider(provider);
            }
        }
        $registerDebugAdapterDescriptorFactory(debugType, handle) {
            const provider = {
                type: debugType,
                createDebugAdapterDescriptor: session => {
                    return Promise.resolve(this._proxy.$provideDebugAdapter(handle, this.getSessionDto(session)));
                }
            };
            this._debugAdapterDescriptorFactories.set(handle, provider);
            this._toDispose.push(this.debugService.getConfigurationManager().registerDebugAdapterDescriptorFactory(provider));
            return Promise.resolve(undefined);
        }
        $unregisterDebugAdapterDescriptorFactory(handle) {
            const provider = this._debugAdapterDescriptorFactories.get(handle);
            if (provider) {
                this._debugAdapterDescriptorFactories.delete(handle);
                this.debugService.getConfigurationManager().unregisterDebugAdapterDescriptorFactory(provider);
            }
        }
        $registerDebugAdapterTrackerFactory(debugType, handle) {
            const factory = {
                type: debugType,
            };
            this._debugAdapterTrackerFactories.set(handle, factory);
            this._toDispose.push(this.debugService.getConfigurationManager().registerDebugAdapterTrackerFactory(factory));
            return Promise.resolve(undefined);
        }
        $unregisterDebugAdapterTrackerFactory(handle) {
            const factory = this._debugAdapterTrackerFactories.get(handle);
            if (factory) {
                this._debugAdapterTrackerFactories.delete(handle);
                this.debugService.getConfigurationManager().unregisterDebugAdapterTrackerFactory(factory);
            }
        }
        $startDebugging(_folderUri, nameOrConfiguration) {
            const folderUri = _folderUri ? uri_1.URI.revive(_folderUri) : undefined;
            const launch = this.debugService.getConfigurationManager().getLaunch(folderUri);
            return this.debugService.startDebugging(launch, nameOrConfiguration).then(success => {
                return success;
            }, err => {
                return Promise.reject(new Error(err && err.message ? err.message : 'cannot start debugging'));
            });
        }
        $customDebugAdapterRequest(sessionId, request, args) {
            const session = this.debugService.getModel().getSessions(true).filter(s => s.getId() === sessionId).pop();
            if (session) {
                return session.customRequest(request, args).then(response => {
                    if (response && response.success) {
                        return response.body;
                    }
                    else {
                        return Promise.reject(new Error(response ? response.message : 'custom request failed'));
                    }
                });
            }
            return Promise.reject(new Error('debug session not found'));
        }
        $appendDebugConsole(value) {
            // Use warning as severity to get the orange color for messages coming from the debug extension
            const session = this.debugService.getViewModel().focusedSession;
            if (session) {
                session.appendToRepl(value, severity_1.default.Warning);
            }
        }
        $acceptDAMessage(handle, message) {
            this.getDebugAdapter(handle).acceptMessage(debugUtils_1.convertToVSCPaths(message, false));
        }
        $acceptDAError(handle, name, message, stack) {
            this.getDebugAdapter(handle).fireError(handle, new Error(`${name}: ${message}\n${stack}`));
        }
        $acceptDAExit(handle, code, signal) {
            this.getDebugAdapter(handle).fireExit(handle, code, signal);
        }
        getDebugAdapter(handle) {
            const adapter = this._debugAdapters.get(handle);
            if (!adapter) {
                throw new Error('Invalid debug adapter');
            }
            return adapter;
        }
        // dto helpers
        $sessionCached(sessionID) {
            // remember that the EH has cached the session and we do not have to send it again
            this._sessions.add(sessionID);
        }
        getSessionDto(session) {
            if (session) {
                const sessionID = session.getId();
                if (this._sessions.has(sessionID)) {
                    return sessionID;
                }
                else {
                    // this._sessions.add(sessionID); 	// #69534: see $sessionCached above
                    return {
                        id: sessionID,
                        type: session.configuration.type,
                        name: session.configuration.name,
                        folderUri: session.root ? session.root.uri : undefined,
                        configuration: session.configuration
                    };
                }
            }
            return undefined;
        }
        convertToDto(bps) {
            return bps.map(bp => {
                if ('name' in bp) {
                    const fbp = bp;
                    return {
                        type: 'function',
                        id: fbp.getId(),
                        enabled: fbp.enabled,
                        condition: fbp.condition,
                        hitCondition: fbp.hitCondition,
                        logMessage: fbp.logMessage,
                        functionName: fbp.name
                    };
                }
                else {
                    const sbp = bp;
                    return {
                        type: 'source',
                        id: sbp.getId(),
                        enabled: sbp.enabled,
                        condition: sbp.condition,
                        hitCondition: sbp.hitCondition,
                        logMessage: sbp.logMessage,
                        uri: sbp.uri,
                        line: sbp.lineNumber > 0 ? sbp.lineNumber - 1 : 0,
                        character: (typeof sbp.column === 'number' && sbp.column > 0) ? sbp.column - 1 : 0,
                    };
                }
            });
        }
    };
    MainThreadDebugService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadDebugService),
        __param(1, debug_1.IDebugService)
    ], MainThreadDebugService);
    exports.MainThreadDebugService = MainThreadDebugService;
    /**
     * DebugAdapter that communicates via extension protocol with another debug adapter.
     */
    class ExtensionHostDebugAdapter extends debugAdapter_1.AbstractDebugAdapter {
        constructor(_ds, _handle, _proxy, _session) {
            super();
            this._ds = _ds;
            this._handle = _handle;
            this._proxy = _proxy;
            this._session = _session;
        }
        fireError(handle, err) {
            this._onError.fire(err);
        }
        fireExit(handle, code, signal) {
            this._onExit.fire(code);
        }
        startSession() {
            return Promise.resolve(this._proxy.$startDASession(this._handle, this._ds.getSessionDto(this._session)));
        }
        sendMessage(message) {
            this._proxy.$sendDAMessage(this._handle, debugUtils_1.convertToDAPaths(message, true));
        }
        stopSession() {
            return Promise.resolve(this._proxy.$stopDASession(this._handle));
        }
    }
});
//# sourceMappingURL=mainThreadDebugService.js.map