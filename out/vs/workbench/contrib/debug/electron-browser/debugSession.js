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
define(["require", "exports", "vs/base/common/resources", "vs/nls", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/event", "vs/editor/common/modes", "vs/base/browser/ui/aria/aria", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugSource", "vs/base/common/objects", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/electron-browser/rawDebugSession", "vs/platform/product/node/product", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/uuid", "vs/platform/windows/common/windows", "vs/platform/telemetry/common/telemetry", "vs/base/common/labels", "vs/workbench/contrib/output/common/output", "vs/editor/common/core/range", "vs/platform/configuration/common/configuration", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/contrib/debug/common/replModel", "vs/base/common/errors", "vs/platform/environment/common/environment", "vs/platform/notification/common/notification"], function (require, exports, resources, nls, platform, severity_1, event_1, modes_1, aria, debug_1, debugSource_1, objects_1, debugModel_1, rawDebugSession_1, product_1, workspace_1, lifecycle_1, async_1, uuid_1, windows_1, telemetry_1, labels_1, output_1, range_1, configuration_1, viewlet_1, replModel_1, errors_1, environment_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DebugSession = class DebugSession {
        constructor(_configuration, root, model, debugService, telemetryService, outputService, windowService, configurationService, viewletService, workspaceContextService, environmentService, notificationService) {
            this._configuration = _configuration;
            this.root = root;
            this.model = model;
            this.debugService = debugService;
            this.telemetryService = telemetryService;
            this.outputService = outputService;
            this.windowService = windowService;
            this.configurationService = configurationService;
            this.viewletService = viewletService;
            this.workspaceContextService = workspaceContextService;
            this.environmentService = environmentService;
            this.notificationService = notificationService;
            this.initialized = false;
            this.sources = new Map();
            this.threads = new Map();
            this.rawListeners = [];
            this._onDidChangeState = new event_1.Emitter();
            this._onDidEndAdapter = new event_1.Emitter();
            this._onDidLoadedSource = new event_1.Emitter();
            this._onDidCustomEvent = new event_1.Emitter();
            this._onDidChangeREPLElements = new event_1.Emitter();
            this.id = uuid_1.generateUuid();
            this.repl = new replModel_1.ReplModel(this);
        }
        getId() {
            return this.id;
        }
        get configuration() {
            return this._configuration.resolved;
        }
        get unresolvedConfiguration() {
            return this._configuration.unresolved;
        }
        setConfiguration(configuration) {
            this._configuration = configuration;
        }
        getLabel() {
            const includeRoot = this.workspaceContextService.getWorkspace().folders.length > 1;
            return includeRoot && this.root ? `${this.configuration.name} (${resources.basenameOrAuthority(this.root.uri)})` : this.configuration.name;
        }
        get state() {
            if (!this.initialized) {
                return 1 /* Initializing */;
            }
            if (!this.raw) {
                return 0 /* Inactive */;
            }
            const focusedThread = this.debugService.getViewModel().focusedThread;
            if (focusedThread && focusedThread.session === this) {
                return focusedThread.stopped ? 2 /* Stopped */ : 3 /* Running */;
            }
            if (this.getAllThreads().some(t => t.stopped)) {
                return 2 /* Stopped */;
            }
            return 3 /* Running */;
        }
        get capabilities() {
            return this.raw ? this.raw.capabilities : Object.create(null);
        }
        //---- events
        get onDidChangeState() {
            return this._onDidChangeState.event;
        }
        get onDidEndAdapter() {
            return this._onDidEndAdapter.event;
        }
        get onDidChangeReplElements() {
            return this._onDidChangeREPLElements.event;
        }
        //---- DAP events
        get onDidCustomEvent() {
            return this._onDidCustomEvent.event;
        }
        get onDidLoadedSource() {
            return this._onDidLoadedSource.event;
        }
        //---- DAP requests
        /**
         * create and initialize a new debug adapter for this session
         */
        initialize(dbgr) {
            if (this.raw) {
                // if there was already a connection make sure to remove old listeners
                this.shutdown();
            }
            return dbgr.getCustomTelemetryService().then(customTelemetryService => {
                return dbgr.createDebugAdapter(this, this.outputService).then(debugAdapter => {
                    this.raw = new rawDebugSession_1.RawDebugSession(debugAdapter, dbgr, this.telemetryService, customTelemetryService, this.environmentService);
                    return this.raw.start().then(() => {
                        this.registerListeners();
                        return this.raw.initialize({
                            clientID: 'vscode',
                            clientName: product_1.default.nameLong,
                            adapterID: this.configuration.type,
                            pathFormat: 'path',
                            linesStartAt1: true,
                            columnsStartAt1: true,
                            supportsVariableType: true,
                            supportsVariablePaging: true,
                            supportsRunInTerminalRequest: true,
                            locale: platform.locale
                        }).then(() => {
                            this.initialized = true;
                            this._onDidChangeState.fire();
                            this.model.setExceptionBreakpoints(this.raw.capabilities.exceptionBreakpointFilters || []);
                        });
                    });
                });
            });
        }
        /**
         * launch or attach to the debuggee
         */
        launchOrAttach(config) {
            if (this.raw) {
                // __sessionID only used for EH debugging (but we add it always for now...)
                config.__sessionId = this.getId();
                return this.raw.launchOrAttach(config).then(result => {
                    return undefined;
                });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        /**
         * end the current debug adapter session
         */
        terminate(restart = false) {
            if (this.raw) {
                if (this.raw.capabilities.supportsTerminateRequest && this._configuration.resolved.request === 'launch') {
                    return this.raw.terminate(restart).then(response => {
                        return undefined;
                    });
                }
                return this.raw.disconnect(restart).then(response => {
                    return undefined;
                });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        /**
         * end the current debug adapter session
         */
        disconnect(restart = false) {
            if (this.raw) {
                return this.raw.disconnect(restart).then(response => {
                    return undefined;
                });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        /**
         * restart debug adapter session
         */
        restart() {
            if (this.raw) {
                return this.raw.restart().then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        sendBreakpoints(modelUri, breakpointsToSend, sourceModified) {
            if (!this.raw) {
                return Promise.reject(new Error('no debug adapter'));
            }
            if (!this.raw.readyForBreakpoints) {
                return Promise.resolve(undefined);
            }
            const source = this.getSourceForUri(modelUri);
            let rawSource;
            if (source) {
                rawSource = source.raw;
            }
            else {
                const data = debugSource_1.Source.getEncodedDebugData(modelUri);
                rawSource = { name: data.name, path: data.path, sourceReference: data.sourceReference };
            }
            if (breakpointsToSend.length && !rawSource.adapterData) {
                rawSource.adapterData = breakpointsToSend[0].adapterData;
            }
            // Normalize all drive letters going out from vscode to debug adapters so we are consistent with our resolving #43959
            if (rawSource.path) {
                rawSource.path = labels_1.normalizeDriveLetter(rawSource.path);
            }
            return this.raw.setBreakpoints({
                source: rawSource,
                lines: breakpointsToSend.map(bp => bp.lineNumber),
                breakpoints: breakpointsToSend.map(bp => ({ line: bp.lineNumber, column: bp.column, condition: bp.condition, hitCondition: bp.hitCondition, logMessage: bp.logMessage })),
                sourceModified
            }).then(response => {
                if (response && response.body) {
                    const data = Object.create(null);
                    for (let i = 0; i < breakpointsToSend.length; i++) {
                        data[breakpointsToSend[i].getId()] = response.body.breakpoints[i];
                    }
                    this.model.setBreakpointSessionData(this.getId(), data);
                }
            });
        }
        sendFunctionBreakpoints(fbpts) {
            if (this.raw) {
                if (this.raw.readyForBreakpoints) {
                    return this.raw.setFunctionBreakpoints({ breakpoints: fbpts }).then(response => {
                        if (response && response.body) {
                            const data = Object.create(null);
                            for (let i = 0; i < fbpts.length; i++) {
                                data[fbpts[i].getId()] = response.body.breakpoints[i];
                            }
                            this.model.setBreakpointSessionData(this.getId(), data);
                        }
                    });
                }
                return Promise.resolve(undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        sendExceptionBreakpoints(exbpts) {
            if (this.raw) {
                if (this.raw.readyForBreakpoints) {
                    return this.raw.setExceptionBreakpoints({ filters: exbpts.map(exb => exb.filter) }).then(() => undefined);
                }
                return Promise.resolve(undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        customRequest(request, args) {
            if (this.raw) {
                return this.raw.custom(request, args);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        stackTrace(threadId, startFrame, levels) {
            if (this.raw) {
                return this.raw.stackTrace({ threadId, startFrame, levels });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        exceptionInfo(threadId) {
            if (this.raw) {
                return this.raw.exceptionInfo({ threadId }).then(response => {
                    if (response) {
                        return {
                            id: response.body.exceptionId,
                            description: response.body.description,
                            breakMode: response.body.breakMode,
                            details: response.body.details
                        };
                    }
                    return undefined;
                });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        scopes(frameId) {
            if (this.raw) {
                return this.raw.scopes({ frameId });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        variables(variablesReference, filter, start, count) {
            if (this.raw) {
                return this.raw.variables({ variablesReference, filter, start, count });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        evaluate(expression, frameId, context) {
            if (this.raw) {
                return this.raw.evaluate({ expression, frameId, context });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        restartFrame(frameId, threadId) {
            if (this.raw) {
                return this.raw.restartFrame({ frameId }, threadId).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        next(threadId) {
            if (this.raw) {
                return this.raw.next({ threadId }).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        stepIn(threadId) {
            if (this.raw) {
                return this.raw.stepIn({ threadId }).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        stepOut(threadId) {
            if (this.raw) {
                return this.raw.stepOut({ threadId }).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        stepBack(threadId) {
            if (this.raw) {
                return this.raw.stepBack({ threadId }).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        continue(threadId) {
            if (this.raw) {
                return this.raw.continue({ threadId }).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        reverseContinue(threadId) {
            if (this.raw) {
                return this.raw.reverseContinue({ threadId }).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        pause(threadId) {
            if (this.raw) {
                return this.raw.pause({ threadId }).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        terminateThreads(threadIds) {
            if (this.raw) {
                return this.raw.terminateThreads({ threadIds }).then(() => undefined);
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        setVariable(variablesReference, name, value) {
            if (this.raw) {
                return this.raw.setVariable({ variablesReference, name, value });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        loadSource(resource) {
            if (!this.raw) {
                return Promise.reject(new Error('no debug adapter'));
            }
            const source = this.getSourceForUri(resource);
            let rawSource;
            if (source) {
                rawSource = source.raw;
            }
            else {
                // create a Source
                let sourceRef;
                if (resource.query) {
                    const data = debugSource_1.Source.getEncodedDebugData(resource);
                    sourceRef = data.sourceReference;
                }
                rawSource = {
                    path: resource.with({ scheme: '', query: '' }).toString(true),
                    sourceReference: sourceRef
                };
            }
            return this.raw.source({ sourceReference: rawSource.sourceReference || 0, source: rawSource });
        }
        getLoadedSources() {
            if (this.raw) {
                return this.raw.loadedSources({}).then(response => {
                    if (response.body && response.body.sources) {
                        return response.body.sources.map(src => this.getSource(src));
                    }
                    else {
                        return [];
                    }
                }, () => {
                    return [];
                });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        completions(frameId, text, position, overwriteBefore) {
            if (this.raw) {
                return this.raw.completions({
                    frameId,
                    text,
                    column: position.column,
                    line: position.lineNumber
                }).then(response => {
                    const result = [];
                    if (response && response.body && response.body.targets) {
                        response.body.targets.forEach(item => {
                            if (item && item.label) {
                                result.push({
                                    label: item.label,
                                    insertText: item.text || item.label,
                                    kind: modes_1.completionKindFromString(item.type || 'property'),
                                    filterText: (item.start && item.length) ? text.substr(item.start, item.length).concat(item.label) : undefined,
                                    range: range_1.Range.fromPositions(position.delta(0, -(item.length || overwriteBefore)), position)
                                });
                            }
                        });
                    }
                    return result;
                });
            }
            return Promise.reject(new Error('no debug adapter'));
        }
        //---- threads
        getThread(threadId) {
            return this.threads.get(threadId);
        }
        getAllThreads() {
            const result = [];
            this.threads.forEach(t => result.push(t));
            return result;
        }
        clearThreads(removeThreads, reference = undefined) {
            if (reference !== undefined && reference !== null) {
                const thread = this.threads.get(reference);
                if (thread) {
                    thread.clearCallStack();
                    thread.stoppedDetails = undefined;
                    thread.stopped = false;
                    if (removeThreads) {
                        this.threads.delete(reference);
                    }
                }
            }
            else {
                this.threads.forEach(thread => {
                    thread.clearCallStack();
                    thread.stoppedDetails = undefined;
                    thread.stopped = false;
                });
                if (removeThreads) {
                    this.threads.clear();
                    debugModel_1.ExpressionContainer.allValues.clear();
                }
            }
        }
        rawUpdate(data) {
            if (data.thread && !this.threads.has(data.threadId)) {
                // A new thread came in, initialize it.
                this.threads.set(data.threadId, new debugModel_1.Thread(this, data.thread.name, data.thread.id));
            }
            else if (data.thread && data.thread.name) {
                // Just the thread name got updated #18244
                const thread = this.threads.get(data.threadId);
                if (thread) {
                    thread.name = data.thread.name;
                }
            }
            if (data.stoppedDetails) {
                // Set the availability of the threads' callstacks depending on
                // whether the thread is stopped or not
                if (data.stoppedDetails.allThreadsStopped) {
                    this.threads.forEach(thread => {
                        thread.stoppedDetails = thread.threadId === data.threadId ? data.stoppedDetails : { reason: undefined };
                        thread.stopped = true;
                        thread.clearCallStack();
                    });
                }
                else {
                    const thread = this.threads.get(data.threadId);
                    if (thread) {
                        // One thread is stopped, only update that thread.
                        thread.stoppedDetails = data.stoppedDetails;
                        thread.clearCallStack();
                        thread.stopped = true;
                    }
                }
            }
        }
        fetchThreads(stoppedDetails) {
            return this.raw ? this.raw.threads().then(response => {
                if (response && response.body && response.body.threads) {
                    response.body.threads.forEach(thread => {
                        this.model.rawUpdate({
                            sessionId: this.getId(),
                            threadId: thread.id,
                            thread,
                            stoppedDetails: stoppedDetails && thread.id === stoppedDetails.threadId ? stoppedDetails : undefined
                        });
                    });
                }
            }) : Promise.resolve(undefined);
        }
        //---- private
        registerListeners() {
            if (!this.raw) {
                return;
            }
            this.rawListeners.push(this.raw.onDidInitialize(() => {
                aria.status(nls.localize('debuggingStarted', "Debugging started."));
                const sendConfigurationDone = () => {
                    if (this.raw && this.raw.capabilities.supportsConfigurationDoneRequest) {
                        return this.raw.configurationDone().then(undefined, e => {
                            // Disconnect the debug session on configuration done error #10596
                            if (this.raw) {
                                this.raw.disconnect();
                            }
                            if (e.command !== 'canceled' && e.message !== 'canceled') {
                                this.notificationService.error(e);
                            }
                        });
                    }
                    return undefined;
                };
                // Send all breakpoints
                this.debugService.sendAllBreakpoints(this).then(sendConfigurationDone, sendConfigurationDone)
                    .then(() => this.fetchThreads());
            }));
            this.rawListeners.push(this.raw.onDidStop(event => {
                this.fetchThreads(event.body).then(() => {
                    const thread = typeof event.body.threadId === 'number' ? this.getThread(event.body.threadId) : undefined;
                    if (thread) {
                        // Call fetch call stack twice, the first only return the top stack frame.
                        // Second retrieves the rest of the call stack. For performance reasons #25605
                        const promises = this.model.fetchCallStack(thread);
                        const focus = () => {
                            if (!event.body.preserveFocusHint && thread.getCallStack().length) {
                                this.debugService.focusStackFrame(undefined, thread);
                                if (thread.stoppedDetails) {
                                    if (this.configurationService.getValue('debug').openDebug === 'openOnDebugBreak') {
                                        this.viewletService.openViewlet(debug_1.VIEWLET_ID);
                                    }
                                    this.windowService.focusWindow();
                                }
                            }
                        };
                        promises.topCallStack.then(focus);
                        promises.wholeCallStack.then(() => {
                            if (!this.debugService.getViewModel().focusedStackFrame) {
                                // The top stack frame can be deemphesized so try to focus again #68616
                                focus();
                            }
                        });
                    }
                }).then(() => this._onDidChangeState.fire());
            }));
            this.rawListeners.push(this.raw.onDidThread(event => {
                if (event.body.reason === 'started') {
                    // debounce to reduce threadsRequest frequency and improve performance
                    if (!this.fetchThreadsScheduler) {
                        this.fetchThreadsScheduler = new async_1.RunOnceScheduler(() => {
                            this.fetchThreads();
                        }, 100);
                        this.rawListeners.push(this.fetchThreadsScheduler);
                    }
                    if (!this.fetchThreadsScheduler.isScheduled()) {
                        this.fetchThreadsScheduler.schedule();
                    }
                }
                else if (event.body.reason === 'exited') {
                    this.model.clearThreads(this.getId(), true, event.body.threadId);
                }
            }));
            this.rawListeners.push(this.raw.onDidTerminateDebugee(event => {
                aria.status(nls.localize('debuggingStopped', "Debugging stopped."));
                if (event.body && event.body.restart) {
                    this.debugService.restartSession(this, event.body.restart).then(undefined, errors_1.onUnexpectedError);
                }
                else if (this.raw) {
                    this.raw.disconnect();
                }
            }));
            this.rawListeners.push(this.raw.onDidContinued(event => {
                const threadId = event.body.allThreadsContinued !== false ? undefined : event.body.threadId;
                this.model.clearThreads(this.getId(), false, threadId);
                this._onDidChangeState.fire();
            }));
            let outpuPromises = [];
            this.rawListeners.push(this.raw.onDidOutput(event => {
                if (!event.body || !this.raw) {
                    return;
                }
                const outputSeverity = event.body.category === 'stderr' ? severity_1.default.Error : event.body.category === 'console' ? severity_1.default.Warning : severity_1.default.Info;
                if (event.body.category === 'telemetry') {
                    // only log telemetry events from debug adapter if the debug extension provided the telemetry key
                    // and the user opted in telemetry
                    if (this.raw.customTelemetryService && this.telemetryService.isOptedIn) {
                        // __GDPR__TODO__ We're sending events in the name of the debug extension and we can not ensure that those are declared correctly.
                        this.raw.customTelemetryService.publicLog(event.body.output, event.body.data);
                    }
                    return;
                }
                // Make sure to append output in the correct order by properly waiting on preivous promises #33822
                const waitFor = outpuPromises.slice();
                const source = event.body.source && event.body.line ? {
                    lineNumber: event.body.line,
                    column: event.body.column ? event.body.column : 1,
                    source: this.getSource(event.body.source)
                } : undefined;
                if (event.body.variablesReference) {
                    const container = new debugModel_1.ExpressionContainer(this, event.body.variablesReference, uuid_1.generateUuid());
                    outpuPromises.push(container.getChildren().then(children => {
                        return Promise.all(waitFor).then(() => children.forEach(child => {
                            // Since we can not display multiple trees in a row, we are displaying these variables one after the other (ignoring their names)
                            child.name = null;
                            this.appendToRepl(child, outputSeverity, source);
                        }));
                    }));
                }
                else if (typeof event.body.output === 'string') {
                    Promise.all(waitFor).then(() => this.appendToRepl(event.body.output, outputSeverity, source));
                }
                Promise.all(outpuPromises).then(() => outpuPromises = []);
            }));
            this.rawListeners.push(this.raw.onDidBreakpoint(event => {
                const id = event.body && event.body.breakpoint ? event.body.breakpoint.id : undefined;
                const breakpoint = this.model.getBreakpoints().filter(bp => bp.idFromAdapter === id).pop();
                const functionBreakpoint = this.model.getFunctionBreakpoints().filter(bp => bp.idFromAdapter === id).pop();
                if (event.body.reason === 'new' && event.body.breakpoint.source && event.body.breakpoint.line) {
                    const source = this.getSource(event.body.breakpoint.source);
                    const bps = this.model.addBreakpoints(source.uri, [{
                            column: event.body.breakpoint.column,
                            enabled: true,
                            lineNumber: event.body.breakpoint.line,
                        }], false);
                    if (bps.length === 1) {
                        this.model.setBreakpointSessionData(this.getId(), { [bps[0].getId()]: event.body.breakpoint });
                    }
                }
                if (event.body.reason === 'removed') {
                    if (breakpoint) {
                        this.model.removeBreakpoints([breakpoint]);
                    }
                    if (functionBreakpoint) {
                        this.model.removeFunctionBreakpoints(functionBreakpoint.getId());
                    }
                }
                if (event.body.reason === 'changed') {
                    if (breakpoint) {
                        if (!breakpoint.column) {
                            event.body.breakpoint.column = undefined;
                        }
                        this.model.setBreakpointSessionData(this.getId(), { [breakpoint.getId()]: event.body.breakpoint });
                    }
                    if (functionBreakpoint) {
                        this.model.setBreakpointSessionData(this.getId(), { [functionBreakpoint.getId()]: event.body.breakpoint });
                    }
                }
            }));
            this.rawListeners.push(this.raw.onDidLoadedSource(event => {
                this._onDidLoadedSource.fire({
                    reason: event.body.reason,
                    source: this.getSource(event.body.source)
                });
            }));
            this.rawListeners.push(this.raw.onDidCustomEvent(event => {
                this._onDidCustomEvent.fire(event);
            }));
            this.rawListeners.push(this.raw.onDidExitAdapter(event => {
                this._onDidEndAdapter.fire(event);
            }));
        }
        shutdown() {
            lifecycle_1.dispose(this.rawListeners);
            if (this.raw) {
                this.raw.disconnect();
            }
            this.raw = undefined;
            this.model.clearThreads(this.getId(), true);
            this._onDidChangeState.fire();
        }
        //---- sources
        getSourceForUri(uri) {
            return this.sources.get(this.getUriKey(uri));
        }
        getSource(raw) {
            let source = new debugSource_1.Source(raw, this.getId());
            const uriKey = this.getUriKey(source.uri);
            const found = this.sources.get(uriKey);
            if (found) {
                source = found;
                // merge attributes of new into existing
                source.raw = objects_1.mixin(source.raw, raw);
                if (source.raw && raw) {
                    // Always take the latest presentation hint from adapter #42139
                    source.raw.presentationHint = raw.presentationHint;
                }
            }
            else {
                this.sources.set(uriKey, source);
            }
            return source;
        }
        getUriKey(uri) {
            // TODO: the following code does not make sense if uri originates from a different platform
            return platform.isLinux ? uri.toString() : uri.toString().toLowerCase();
        }
        // REPL
        getReplElements() {
            return this.repl.getReplElements();
        }
        removeReplExpressions() {
            this.repl.removeReplExpressions();
            this._onDidChangeREPLElements.fire();
        }
        addReplExpression(stackFrame, name) {
            const viewModel = this.debugService.getViewModel();
            return this.repl.addReplExpression(stackFrame, name)
                .then(() => this._onDidChangeREPLElements.fire())
                // Evaluate all watch expressions and fetch variables again since repl evaluation might have changed some.
                .then(() => this.debugService.focusStackFrame(viewModel.focusedStackFrame, viewModel.focusedThread, viewModel.focusedSession));
        }
        appendToRepl(data, severity, source) {
            this.repl.appendToRepl(data, severity, source);
            this._onDidChangeREPLElements.fire();
        }
        logToRepl(sev, args, frame) {
            this.repl.logToRepl(sev, args, frame);
            this._onDidChangeREPLElements.fire();
        }
    };
    DebugSession = __decorate([
        __param(3, debug_1.IDebugService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, output_1.IOutputService),
        __param(6, windows_1.IWindowService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, viewlet_1.IViewletService),
        __param(9, workspace_1.IWorkspaceContextService),
        __param(10, environment_1.IEnvironmentService),
        __param(11, notification_1.INotificationService)
    ], DebugSession);
    exports.DebugSession = DebugSession;
});
//# sourceMappingURL=debugSession.js.map