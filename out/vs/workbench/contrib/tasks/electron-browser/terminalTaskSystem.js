/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/async", "vs/base/common/collections", "vs/base/common/map", "vs/base/common/severity", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/extpath", "vs/base/node/processes", "vs/platform/markers/common/markers", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/workbench/contrib/tasks/common/problemCollectors", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskSystem", "vs/platform/remote/common/remoteHosts", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/contrib/terminal/node/terminal"], function (require, exports, path, nls, Objects, Types, Platform, Async, collections_1, map_1, severity_1, event_1, lifecycle_1, extpath_1, processes_1, markers_1, problemMatcher_1, problemCollectors_1, tasks_1, taskSystem_1, remoteHosts_1, uri_1, network_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class VariableResolver {
        constructor(workspaceFolder, taskSystemInfo, _values, _service) {
            this.workspaceFolder = workspaceFolder;
            this.taskSystemInfo = taskSystemInfo;
            this._values = _values;
            this._service = _service;
        }
        resolve(value) {
            return value.replace(/\$\{(.*?)\}/g, (match, variable) => {
                // Strip out the ${} because the map contains them variables without those characters.
                let result = this._values.get(match.substring(2, match.length - 1));
                if ((result !== undefined) && (result !== null)) {
                    return result;
                }
                if (this._service) {
                    return this._service.resolve(this.workspaceFolder, match);
                }
                return match;
            });
        }
    }
    class VerifiedTask {
        constructor(task, resolver, trigger) {
            this.task = task;
            this.resolver = resolver;
            this.trigger = trigger;
        }
        verify() {
            let verified = false;
            if (this.trigger && this.resolvedVariables && this.workspaceFolder && (this.shellLaunchConfig !== undefined)) {
                verified = true;
            }
            return verified;
        }
        getVerifiedTask() {
            if (this.verify()) {
                return { task: this.task, resolver: this.resolver, trigger: this.trigger, resolvedVariables: this.resolvedVariables, systemInfo: this.systemInfo, workspaceFolder: this.workspaceFolder, shellLaunchConfig: this.shellLaunchConfig };
            }
            else {
                throw new Error('VerifiedTask was not checked. verify must be checked before getVerifiedTask.');
            }
        }
    }
    exports.VerifiedTask = VerifiedTask;
    class TerminalTaskSystem {
        constructor(terminalService, outputService, markerService, modelService, configurationResolverService, telemetryService, contextService, windowService, outputChannelId, taskSystemInfoResolver) {
            this.terminalService = terminalService;
            this.outputService = outputService;
            this.markerService = markerService;
            this.modelService = modelService;
            this.configurationResolverService = configurationResolverService;
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this.windowService = windowService;
            this.outputChannelId = outputChannelId;
            this.activeTasks = Object.create(null);
            this.terminals = Object.create(null);
            this.idleTaskTerminals = new map_1.LinkedMap();
            this.sameTaskTerminals = Object.create(null);
            this._onDidStateChange = new event_1.Emitter();
            this.taskSystemInfoResolver = taskSystemInfoResolver;
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        log(value) {
            this.appendOutput(value + '\n');
        }
        showOutput() {
            this.outputService.showChannel(this.outputChannelId, true);
        }
        run(task, resolver, trigger = taskSystem_1.Triggers.command) {
            this.currentTask = new VerifiedTask(task, resolver, trigger);
            let terminalData = this.activeTasks[task.getMapKey()];
            if (terminalData && terminalData.promise) {
                let reveal = tasks_1.RevealKind.Always;
                let focus = false;
                if (tasks_1.CustomTask.is(task) || tasks_1.ContributedTask.is(task)) {
                    reveal = task.command.presentation.reveal;
                    focus = task.command.presentation.focus;
                }
                if (reveal === tasks_1.RevealKind.Always || focus) {
                    this.terminalService.setActiveInstance(terminalData.terminal);
                    this.terminalService.showPanel(focus);
                }
                this.lastTask = this.currentTask;
                return { kind: 2 /* Active */, task, active: { same: true, background: task.configurationProperties.isBackground }, promise: terminalData.promise };
            }
            try {
                const executeResult = { kind: 1 /* Started */, task, started: {}, promise: this.executeTask(task, resolver, trigger) };
                executeResult.promise.then(summary => {
                    this.lastTask = this.currentTask;
                });
                return executeResult;
            }
            catch (error) {
                if (error instanceof taskSystem_1.TaskError) {
                    throw error;
                }
                else if (error instanceof Error) {
                    this.log(error.message);
                    throw new taskSystem_1.TaskError(severity_1.default.Error, error.message, 7 /* UnknownError */);
                }
                else {
                    this.log(error.toString());
                    throw new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TerminalTaskSystem.unknownError', 'A unknown error has occurred while executing a task. See task output log for details.'), 7 /* UnknownError */);
                }
            }
        }
        rerun() {
            if (this.lastTask && this.lastTask.verify()) {
                if ((this.lastTask.task.runOptions.reevaluateOnRerun !== undefined) && !this.lastTask.task.runOptions.reevaluateOnRerun) {
                    this.isRerun = true;
                }
                const result = this.run(this.lastTask.task, this.lastTask.resolver);
                result.promise.then(summary => {
                    this.isRerun = false;
                });
                return result;
            }
            else {
                return undefined;
            }
        }
        revealTask(task) {
            let terminalData = this.activeTasks[task.getMapKey()];
            if (!terminalData) {
                return false;
            }
            this.terminalService.setActiveInstance(terminalData.terminal);
            if (tasks_1.CustomTask.is(task) || tasks_1.ContributedTask.is(task)) {
                this.terminalService.showPanel(task.command.presentation.focus);
            }
            return true;
        }
        isActive() {
            return Promise.resolve(this.isActiveSync());
        }
        isActiveSync() {
            return Object.keys(this.activeTasks).length > 0;
        }
        canAutoTerminate() {
            return Object.keys(this.activeTasks).every(key => !this.activeTasks[key].task.configurationProperties.promptOnClose);
        }
        getActiveTasks() {
            return Object.keys(this.activeTasks).map(key => this.activeTasks[key].task);
        }
        customExecutionComplete(task, result) {
            let activeTerminal = this.activeTasks[task.getMapKey()];
            if (!activeTerminal) {
                return Promise.reject(new Error('Expected to have a terminal for an custom execution task'));
            }
            return new Promise((resolve) => {
                activeTerminal.terminal.rendererExit(result);
                resolve();
            });
        }
        terminate(task) {
            let activeTerminal = this.activeTasks[task.getMapKey()];
            if (!activeTerminal) {
                return Promise.resolve({ success: false, task: undefined });
            }
            return new Promise((resolve, reject) => {
                let terminal = activeTerminal.terminal;
                const onExit = terminal.onExit(() => {
                    let task = activeTerminal.task;
                    try {
                        onExit.dispose();
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("terminated" /* Terminated */, task));
                    }
                    catch (error) {
                        // Do nothing.
                    }
                    resolve({ success: true, task: task });
                });
                terminal.dispose();
            });
        }
        terminateAll() {
            let promises = [];
            Object.keys(this.activeTasks).forEach((key) => {
                let terminalData = this.activeTasks[key];
                let terminal = terminalData.terminal;
                promises.push(new Promise((resolve, reject) => {
                    const onExit = terminal.onExit(() => {
                        let task = terminalData.task;
                        try {
                            onExit.dispose();
                            this._onDidStateChange.fire(tasks_1.TaskEvent.create("terminated" /* Terminated */, task));
                        }
                        catch (error) {
                            // Do nothing.
                        }
                        resolve({ success: true, task: terminalData.task });
                    });
                }));
                terminal.dispose();
            });
            this.activeTasks = Object.create(null);
            return Promise.all(promises);
        }
        executeTask(task, resolver, trigger) {
            let promises = [];
            if (task.configurationProperties.dependsOn) {
                task.configurationProperties.dependsOn.forEach((dependency) => {
                    let dependencyTask = resolver.resolve(dependency.workspaceFolder, dependency.task);
                    if (dependencyTask) {
                        let key = dependencyTask.getMapKey();
                        let promise = this.activeTasks[key] ? this.activeTasks[key].promise : undefined;
                        if (!promise) {
                            this._onDidStateChange.fire(tasks_1.TaskEvent.create("dependsOnStarted" /* DependsOnStarted */, task));
                            promise = this.executeTask(dependencyTask, resolver, trigger);
                        }
                        promises.push(promise);
                    }
                    else {
                        this.log(nls.localize('dependencyFailed', 'Couldn\'t resolve dependent task \'{0}\' in workspace folder \'{1}\'', Types.isString(dependency.task) ? dependency.task : JSON.stringify(dependency.task, undefined, 0), dependency.workspaceFolder.name));
                        this.showOutput();
                    }
                });
            }
            if ((tasks_1.ContributedTask.is(task) || tasks_1.CustomTask.is(task)) && (task.command)) {
                return Promise.all(promises).then((summaries) => {
                    for (let summary of summaries) {
                        if (summary.exitCode !== 0) {
                            return { exitCode: summary.exitCode };
                        }
                    }
                    if (this.isRerun) {
                        return this.reexecuteCommand(task, trigger);
                    }
                    else {
                        return this.executeCommand(task, trigger);
                    }
                });
            }
            else {
                return Promise.all(promises).then((summaries) => {
                    for (let summary of summaries) {
                        if (summary.exitCode !== 0) {
                            return { exitCode: summary.exitCode };
                        }
                    }
                    return { exitCode: 0 };
                });
            }
        }
        resolveVariablesFromSet(taskSystemInfo, workspaceFolder, task, variables) {
            let isProcess = task.command && task.command.runtime === tasks_1.RuntimeType.Process;
            let options = task.command && task.command.options ? task.command.options : undefined;
            let cwd = options ? options.cwd : undefined;
            let envPath = undefined;
            if (options && options.env) {
                for (let key of Object.keys(options.env)) {
                    if (key.toLowerCase() === 'path') {
                        if (Types.isString(options.env[key])) {
                            envPath = options.env[key];
                        }
                        break;
                    }
                }
            }
            let resolvedVariables;
            if (taskSystemInfo) {
                let resolveSet = {
                    variables
                };
                if (taskSystemInfo.platform === 3 /* Windows */ && isProcess) {
                    resolveSet.process = { name: tasks_1.CommandString.value(task.command.name) };
                    if (cwd) {
                        resolveSet.process.cwd = cwd;
                    }
                    if (envPath) {
                        resolveSet.process.path = envPath;
                    }
                }
                resolvedVariables = taskSystemInfo.resolveVariables(workspaceFolder, resolveSet).then(resolved => {
                    if ((taskSystemInfo.platform !== 3 /* Windows */) && isProcess) {
                        resolved.variables.set(TerminalTaskSystem.ProcessVarName, tasks_1.CommandString.value(task.command.name));
                    }
                    return Promise.resolve(resolved);
                });
                return resolvedVariables;
            }
            else {
                let variablesArray = new Array();
                variables.forEach(variable => variablesArray.push(variable));
                return new Promise((resolve, reject) => {
                    this.configurationResolverService.resolveWithInteraction(workspaceFolder, variablesArray, 'tasks').then(resolvedVariablesMap => {
                        if (resolvedVariablesMap) {
                            if (isProcess) {
                                let processVarValue;
                                if (Platform.isWindows) {
                                    processVarValue = processes_1.win32.findExecutable(this.configurationResolverService.resolve(workspaceFolder, tasks_1.CommandString.value(task.command.name)), cwd ? this.configurationResolverService.resolve(workspaceFolder, cwd) : undefined, envPath ? envPath.split(path.delimiter).map(p => this.configurationResolverService.resolve(workspaceFolder, p)) : undefined);
                                }
                                else {
                                    processVarValue = this.configurationResolverService.resolve(workspaceFolder, tasks_1.CommandString.value(task.command.name));
                                }
                                resolvedVariablesMap.set(TerminalTaskSystem.ProcessVarName, processVarValue);
                            }
                            let resolvedVariablesResult = {
                                variables: resolvedVariablesMap,
                            };
                            resolve(resolvedVariablesResult);
                        }
                        else {
                            resolve(undefined);
                        }
                    }, reason => {
                        reject(reason);
                    });
                });
            }
        }
        executeCommand(task, trigger) {
            this.currentTask.workspaceFolder = task.getWorkspaceFolder();
            if (this.currentTask.workspaceFolder) {
                this.currentTask.systemInfo = this.taskSystemInfoResolver(this.currentTask.workspaceFolder);
            }
            let variables = new Set();
            this.collectTaskVariables(variables, task);
            const resolvedVariables = this.resolveVariablesFromSet(this.currentTask.systemInfo, this.currentTask.workspaceFolder, task, variables);
            return resolvedVariables.then((resolvedVariables) => {
                if (resolvedVariables) {
                    this.currentTask.resolvedVariables = resolvedVariables;
                    return this.executeInTerminal(task, trigger, new VariableResolver(this.currentTask.workspaceFolder, this.currentTask.systemInfo, resolvedVariables.variables, this.configurationResolverService));
                }
                else {
                    return Promise.resolve({ exitCode: 0 });
                }
            }, reason => {
                return Promise.reject(reason);
            });
        }
        reexecuteCommand(task, trigger) {
            this.currentTask.workspaceFolder = this.lastTask.workspaceFolder;
            let variables = new Set();
            this.collectTaskVariables(variables, task);
            // Check that the task hasn't changed to include new variables
            let hasAllVariables = true;
            variables.forEach(value => {
                if (value.substring(2, value.length - 1) in this.lastTask.getVerifiedTask().resolvedVariables) {
                    hasAllVariables = false;
                }
            });
            if (!hasAllVariables) {
                return this.resolveVariablesFromSet(this.lastTask.getVerifiedTask().systemInfo, this.lastTask.getVerifiedTask().workspaceFolder, task, variables).then((resolvedVariables) => {
                    this.currentTask.resolvedVariables = resolvedVariables;
                    return this.executeInTerminal(task, trigger, new VariableResolver(this.lastTask.getVerifiedTask().workspaceFolder, this.lastTask.getVerifiedTask().systemInfo, resolvedVariables.variables, this.configurationResolverService));
                }, reason => {
                    return Promise.reject(reason);
                });
            }
            else {
                this.currentTask.resolvedVariables = this.lastTask.getVerifiedTask().resolvedVariables;
                return this.executeInTerminal(task, trigger, new VariableResolver(this.lastTask.getVerifiedTask().workspaceFolder, this.lastTask.getVerifiedTask().systemInfo, this.lastTask.getVerifiedTask().resolvedVariables.variables, this.configurationResolverService));
            }
        }
        executeInTerminal(task, trigger, resolver) {
            let terminal = undefined;
            let executedCommand = undefined;
            let error = undefined;
            let promise = undefined;
            if (task.configurationProperties.isBackground) {
                promise = new Promise((resolve, reject) => {
                    const problemMatchers = this.resolveMatchers(resolver, task.configurationProperties.problemMatchers);
                    let watchingProblemMatcher = new problemCollectors_1.WatchingProblemCollector(problemMatchers, this.markerService, this.modelService);
                    let toDispose = [];
                    let eventCounter = 0;
                    toDispose.push(watchingProblemMatcher.onDidStateChange((event) => {
                        if (event.kind === "backgroundProcessingBegins" /* BackgroundProcessingBegins */) {
                            eventCounter++;
                            this._onDidStateChange.fire(tasks_1.TaskEvent.create("active" /* Active */, task));
                        }
                        else if (event.kind === "backgroundProcessingEnds" /* BackgroundProcessingEnds */) {
                            eventCounter--;
                            this._onDidStateChange.fire(tasks_1.TaskEvent.create("inactive" /* Inactive */, task));
                            if (eventCounter === 0) {
                                let reveal = task.command.presentation.reveal;
                                if ((reveal === tasks_1.RevealKind.Silent) && (watchingProblemMatcher.numberOfMatches > 0) && watchingProblemMatcher.maxMarkerSeverity &&
                                    (watchingProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error)) {
                                    this.terminalService.setActiveInstance(terminal);
                                    this.terminalService.showPanel(false);
                                }
                            }
                        }
                    }));
                    watchingProblemMatcher.aboutToStart();
                    let delayer = undefined;
                    [terminal, executedCommand, error] = this.createTerminal(task, resolver);
                    if (error || !terminal) {
                        return;
                    }
                    let processStartedSignaled = false;
                    terminal.processReady.then(() => {
                        if (!processStartedSignaled) {
                            if (task.command.runtime !== tasks_1.RuntimeType.CustomExecution) {
                                this._onDidStateChange.fire(tasks_1.TaskEvent.create("processStarted" /* ProcessStarted */, task, terminal.processId));
                            }
                            processStartedSignaled = true;
                        }
                    }, (_error) => {
                        // The process never got ready. Need to think how to handle this.
                    });
                    this._onDidStateChange.fire(tasks_1.TaskEvent.create("start" /* Start */, task, terminal.id));
                    const registeredLinkMatchers = this.registerLinkMatchers(terminal, problemMatchers);
                    const onData = terminal.onLineData((line) => {
                        watchingProblemMatcher.processLine(line);
                        if (!delayer) {
                            delayer = new Async.Delayer(3000);
                        }
                        delayer.trigger(() => {
                            watchingProblemMatcher.forceDelivery();
                            delayer = undefined;
                        });
                    });
                    const onExit = terminal.onExit((exitCode) => {
                        onData.dispose();
                        onExit.dispose();
                        let key = task.getMapKey();
                        delete this.activeTasks[key];
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("changed" /* Changed */));
                        if (exitCode !== undefined) {
                            // Only keep a reference to the terminal if it is not being disposed.
                            switch (task.command.presentation.panel) {
                                case tasks_1.PanelKind.Dedicated:
                                    this.sameTaskTerminals[key] = terminal.id.toString();
                                    break;
                                case tasks_1.PanelKind.Shared:
                                    this.idleTaskTerminals.set(key, terminal.id.toString(), 1 /* AsOld */);
                                    break;
                            }
                        }
                        let reveal = task.command.presentation.reveal;
                        if ((reveal === tasks_1.RevealKind.Silent) && ((exitCode !== 0) || (watchingProblemMatcher.numberOfMatches > 0) && watchingProblemMatcher.maxMarkerSeverity &&
                            (watchingProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error))) {
                            this.terminalService.setActiveInstance(terminal);
                            this.terminalService.showPanel(false);
                        }
                        watchingProblemMatcher.done();
                        watchingProblemMatcher.dispose();
                        registeredLinkMatchers.forEach(handle => terminal.deregisterLinkMatcher(handle));
                        if (!processStartedSignaled) {
                            this._onDidStateChange.fire(tasks_1.TaskEvent.create("processStarted" /* ProcessStarted */, task, terminal.processId));
                            processStartedSignaled = true;
                        }
                        if (task.command.runtime !== tasks_1.RuntimeType.CustomExecution) {
                            this._onDidStateChange.fire(tasks_1.TaskEvent.create("processEnded" /* ProcessEnded */, task, exitCode));
                        }
                        for (let i = 0; i < eventCounter; i++) {
                            let event = tasks_1.TaskEvent.create("inactive" /* Inactive */, task);
                            this._onDidStateChange.fire(event);
                        }
                        eventCounter = 0;
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("end" /* End */, task));
                        toDispose = lifecycle_1.dispose(toDispose);
                        toDispose = undefined;
                        resolve({ exitCode });
                    });
                });
            }
            else {
                promise = new Promise((resolve, reject) => {
                    [terminal, executedCommand, error] = this.createTerminal(task, resolver);
                    if (!terminal || error) {
                        return;
                    }
                    let processStartedSignaled = false;
                    terminal.processReady.then(() => {
                        if (!processStartedSignaled) {
                            if (task.command.runtime !== tasks_1.RuntimeType.CustomExecution) {
                                this._onDidStateChange.fire(tasks_1.TaskEvent.create("processStarted" /* ProcessStarted */, task, terminal.processId));
                            }
                            processStartedSignaled = true;
                        }
                    }, (_error) => {
                        // The process never got ready. Need to think how to handle this.
                    });
                    this._onDidStateChange.fire(tasks_1.TaskEvent.create("start" /* Start */, task, terminal.id));
                    this._onDidStateChange.fire(tasks_1.TaskEvent.create("active" /* Active */, task));
                    let problemMatchers = this.resolveMatchers(resolver, task.configurationProperties.problemMatchers);
                    let startStopProblemMatcher = new problemCollectors_1.StartStopProblemCollector(problemMatchers, this.markerService, this.modelService);
                    const registeredLinkMatchers = this.registerLinkMatchers(terminal, problemMatchers);
                    const onData = terminal.onLineData((line) => {
                        startStopProblemMatcher.processLine(line);
                    });
                    const onExit = terminal.onExit((exitCode) => {
                        onData.dispose();
                        onExit.dispose();
                        let key = task.getMapKey();
                        delete this.activeTasks[key];
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("changed" /* Changed */));
                        if (exitCode !== undefined) {
                            // Only keep a reference to the terminal if it is not being disposed.
                            switch (task.command.presentation.panel) {
                                case tasks_1.PanelKind.Dedicated:
                                    this.sameTaskTerminals[key] = terminal.id.toString();
                                    break;
                                case tasks_1.PanelKind.Shared:
                                    this.idleTaskTerminals.set(key, terminal.id.toString(), 1 /* AsOld */);
                                    break;
                            }
                        }
                        let reveal = task.command.presentation.reveal;
                        if (terminal && (reveal === tasks_1.RevealKind.Silent) && ((exitCode !== 0) || (startStopProblemMatcher.numberOfMatches > 0) && startStopProblemMatcher.maxMarkerSeverity &&
                            (startStopProblemMatcher.maxMarkerSeverity >= markers_1.MarkerSeverity.Error))) {
                            this.terminalService.setActiveInstance(terminal);
                            this.terminalService.showPanel(false);
                        }
                        startStopProblemMatcher.done();
                        startStopProblemMatcher.dispose();
                        registeredLinkMatchers.forEach(handle => {
                            if (terminal) {
                                terminal.deregisterLinkMatcher(handle);
                            }
                        });
                        if (!processStartedSignaled && terminal) {
                            this._onDidStateChange.fire(tasks_1.TaskEvent.create("processStarted" /* ProcessStarted */, task, terminal.processId));
                            processStartedSignaled = true;
                        }
                        if (task.command.runtime !== tasks_1.RuntimeType.CustomExecution) {
                            this._onDidStateChange.fire(tasks_1.TaskEvent.create("processEnded" /* ProcessEnded */, task, exitCode));
                        }
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("inactive" /* Inactive */, task));
                        this._onDidStateChange.fire(tasks_1.TaskEvent.create("end" /* End */, task));
                        resolve({ exitCode });
                    });
                });
            }
            if (error) {
                return Promise.reject(new Error(error.message));
            }
            if (!terminal) {
                return Promise.reject(new Error(`Failed to create terminal for task ${task._label}`));
            }
            if (task.command.presentation && (task.command.presentation.reveal === tasks_1.RevealKind.Always)) {
                this.terminalService.setActiveInstance(terminal);
                this.terminalService.showPanel(task.command.presentation.focus);
            }
            this.activeTasks[task.getMapKey()] = { terminal, task, promise };
            this._onDidStateChange.fire(tasks_1.TaskEvent.create("changed" /* Changed */));
            return promise.then((summary) => {
                try {
                    let telemetryEvent = {
                        trigger: trigger,
                        runner: 'terminal',
                        taskKind: task.getTelemetryKind(),
                        command: this.getSanitizedCommand(executedCommand),
                        success: true,
                        exitCode: summary.exitCode
                    };
                    /* __GDPR__
                        "taskService" : {
                            "${include}": [
                                "${TelemetryEvent}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog(TerminalTaskSystem.TelemetryEventName, telemetryEvent);
                }
                catch (error) {
                }
                return summary;
            }, (error) => {
                try {
                    let telemetryEvent = {
                        trigger: trigger,
                        runner: 'terminal',
                        taskKind: task.getTelemetryKind(),
                        command: this.getSanitizedCommand(executedCommand),
                        success: false
                    };
                    /* __GDPR__
                        "taskService" : {
                            "${include}": [
                                "${TelemetryEvent}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog(TerminalTaskSystem.TelemetryEventName, telemetryEvent);
                }
                catch (error) {
                }
                return Promise.reject(error);
            });
        }
        createTerminalName(task) {
            const needsFolderQualification = this.currentTask.workspaceFolder && this.contextService.getWorkbenchState() === 3 /* WORKSPACE */;
            return nls.localize('TerminalTaskSystem.terminalName', 'Task - {0}', needsFolderQualification ? task.getQualifiedLabel() : task.configurationProperties.name);
        }
        createShellLaunchConfig(task, variableResolver, platform, options, command, args, waitOnExit) {
            let shellLaunchConfig;
            let isShellCommand = task.command.runtime === tasks_1.RuntimeType.Shell;
            let needsFolderQualification = this.currentTask.workspaceFolder && this.contextService.getWorkbenchState() === 3 /* WORKSPACE */;
            let terminalName = this.createTerminalName(task);
            let originalCommand = task.command.name;
            if (isShellCommand) {
                shellLaunchConfig = { name: terminalName, executable: undefined, args: undefined, waitOnExit };
                this.terminalService.configHelper.mergeDefaultShellPathAndArgs(shellLaunchConfig, platform);
                let shellSpecified = false;
                let shellOptions = task.command.options && task.command.options.shell;
                if (shellOptions) {
                    if (shellOptions.executable) {
                        shellLaunchConfig.executable = this.resolveVariable(variableResolver, shellOptions.executable);
                        shellSpecified = true;
                    }
                    if (shellOptions.args) {
                        shellLaunchConfig.args = this.resolveVariables(variableResolver, shellOptions.args.slice());
                    }
                    else {
                        shellLaunchConfig.args = [];
                    }
                }
                let shellArgs = shellLaunchConfig.args.slice(0);
                let toAdd = [];
                let commandLine = this.buildShellCommandLine(platform, shellLaunchConfig.executable, shellOptions, command, originalCommand, args);
                let windowsShellArgs = false;
                if (platform === 3 /* Windows */) {
                    // Change Sysnative to System32 if the OS is Windows but NOT WoW64. It's
                    // safe to assume that this was used by accident as Sysnative does not
                    // exist and will break the terminal in non-WoW64 environments.
                    if (!process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) {
                        const sysnativePath = path.join(process.env.windir, 'Sysnative').toLowerCase();
                        if (shellLaunchConfig.executable.toLowerCase().indexOf(sysnativePath) === 0) {
                            shellLaunchConfig.executable = path.join(process.env.windir, 'System32', shellLaunchConfig.executable.substr(sysnativePath.length));
                        }
                    }
                    windowsShellArgs = true;
                    let basename = path.basename(shellLaunchConfig.executable).toLowerCase();
                    if (basename === 'cmd.exe' && ((options.cwd && extpath_1.isUNC(options.cwd)) || (!options.cwd && extpath_1.isUNC(process.cwd())))) {
                        return undefined;
                    }
                    if ((basename === 'powershell.exe') || (basename === 'pwsh.exe')) {
                        if (!shellSpecified) {
                            toAdd.push('-Command');
                        }
                    }
                    else if ((basename === 'bash.exe') || (basename === 'zsh.exe')) {
                        windowsShellArgs = false;
                        if (!shellSpecified) {
                            toAdd.push('-c');
                        }
                    }
                    else if (basename === 'wsl.exe') {
                        if (!shellSpecified && (terminal_1.getWindowsBuildNumber() >= 17763)) { // See https://github.com/Microsoft/vscode/issues/67855
                            toAdd.push('-e');
                        }
                    }
                    else {
                        if (!shellSpecified) {
                            toAdd.push('/d', '/c');
                        }
                    }
                }
                else {
                    if (!shellSpecified) {
                        // Under Mac remove -l to not start it as a login shell.
                        if (platform === 1 /* Mac */) {
                            let index = shellArgs.indexOf('-l');
                            if (index !== -1) {
                                shellArgs.splice(index, 1);
                            }
                        }
                        toAdd.push('-c');
                    }
                }
                toAdd.forEach(element => {
                    if (!shellArgs.some(arg => arg.toLowerCase() === element)) {
                        shellArgs.push(element);
                    }
                });
                shellArgs.push(commandLine);
                shellLaunchConfig.args = windowsShellArgs ? shellArgs.join(' ') : shellArgs;
                if (task.command.presentation && task.command.presentation.echo) {
                    if (needsFolderQualification) {
                        shellLaunchConfig.initialText = `\x1b[1m> Executing task in folder ${this.currentTask.workspaceFolder.name}: ${commandLine} <\x1b[0m\n`;
                    }
                    else {
                        shellLaunchConfig.initialText = `\x1b[1m> Executing task: ${commandLine} <\x1b[0m\n`;
                    }
                }
            }
            else {
                let commandExecutable = task.command.runtime !== tasks_1.RuntimeType.CustomExecution ? tasks_1.CommandString.value(command) : undefined;
                let executable = !isShellCommand
                    ? this.resolveVariable(variableResolver, '${' + TerminalTaskSystem.ProcessVarName + '}')
                    : commandExecutable;
                // When we have a process task there is no need to quote arguments. So we go ahead and take the string value.
                shellLaunchConfig = {
                    name: terminalName,
                    executable: executable,
                    args: args.map(a => Types.isString(a) ? a : a.value),
                    waitOnExit
                };
                if (task.command.presentation && task.command.presentation.echo) {
                    let getArgsToEcho = (args) => {
                        if (!args || args.length === 0) {
                            return '';
                        }
                        if (Types.isString(args)) {
                            return args;
                        }
                        return args.join(' ');
                    };
                    if (needsFolderQualification) {
                        shellLaunchConfig.initialText = `\x1b[1m> Executing task in folder ${this.currentTask.workspaceFolder.name}: ${shellLaunchConfig.executable} ${getArgsToEcho(shellLaunchConfig.args)} <\x1b[0m\n`;
                    }
                    else {
                        shellLaunchConfig.initialText = `\x1b[1m> Executing task: ${shellLaunchConfig.executable} ${getArgsToEcho(shellLaunchConfig.args)} <\x1b[0m\n`;
                    }
                }
            }
            if (options.cwd) {
                let cwd = options.cwd;
                if (!path.isAbsolute(cwd)) {
                    let workspaceFolder = task.getWorkspaceFolder();
                    if (workspaceFolder && (workspaceFolder.uri.scheme === 'file')) {
                        cwd = path.join(workspaceFolder.uri.fsPath, cwd);
                    }
                }
                // This must be normalized to the OS
                const authority = this.windowService.getConfiguration().remoteAuthority;
                shellLaunchConfig.cwd = uri_1.URI.from({ scheme: authority ? remoteHosts_1.REMOTE_HOST_SCHEME : network_1.Schemas.file, authority: authority, path: cwd });
            }
            if (options.env) {
                shellLaunchConfig.env = options.env;
            }
            return shellLaunchConfig;
        }
        createTerminal(task, resolver) {
            let platform = resolver.taskSystemInfo ? resolver.taskSystemInfo.platform : Platform.platform;
            let options = this.resolveOptions(resolver, task.command.options);
            let waitOnExit = false;
            const presentationOptions = task.command.presentation;
            if (!presentationOptions) {
                throw new Error('Task presentation options should not be undefined here.');
            }
            if (presentationOptions.reveal !== tasks_1.RevealKind.Never || !task.configurationProperties.isBackground) {
                if (presentationOptions.panel === tasks_1.PanelKind.New) {
                    waitOnExit = nls.localize('closeTerminal', 'Press any key to close the terminal.');
                }
                else if (presentationOptions.showReuseMessage) {
                    waitOnExit = nls.localize('reuseTerminal', 'Terminal will be reused by tasks, press any key to close it.');
                }
                else {
                    waitOnExit = true;
                }
            }
            let commandExecutable;
            let command;
            let args;
            if (task.command.runtime === tasks_1.RuntimeType.CustomExecution) {
                this.currentTask.shellLaunchConfig = {
                    isRendererOnly: true,
                    waitOnExit,
                    name: this.createTerminalName(task)
                };
            }
            else {
                let resolvedResult = this.resolveCommandAndArgs(resolver, task.command);
                command = resolvedResult.command;
                args = resolvedResult.args;
                commandExecutable = tasks_1.CommandString.value(command);
                this.currentTask.shellLaunchConfig = this.isRerun ? this.lastTask.getVerifiedTask().shellLaunchConfig : this.createShellLaunchConfig(task, resolver, platform, options, command, args, waitOnExit);
                if (this.currentTask.shellLaunchConfig === undefined) {
                    return [undefined, undefined, new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TerminalTaskSystem', 'Can\'t execute a shell command on an UNC drive using cmd.exe.'), 7 /* UnknownError */)];
                }
            }
            let prefersSameTerminal = presentationOptions.panel === tasks_1.PanelKind.Dedicated;
            let allowsSharedTerminal = presentationOptions.panel === tasks_1.PanelKind.Shared;
            let group = presentationOptions.group;
            let taskKey = task.getMapKey();
            let terminalToReuse;
            if (prefersSameTerminal) {
                let terminalId = this.sameTaskTerminals[taskKey];
                if (terminalId) {
                    terminalToReuse = this.terminals[terminalId];
                    delete this.sameTaskTerminals[taskKey];
                }
            }
            else if (allowsSharedTerminal) {
                // Always allow to reuse the terminal previously used by the same task.
                let terminalId = this.idleTaskTerminals.remove(taskKey);
                if (!terminalId) {
                    // There is no idle terminal which was used by the same task.
                    // Search for any idle terminal used previously by a task of the same group
                    // (or, if the task has no group, a terminal used by a task without group).
                    for (const taskId of this.idleTaskTerminals.keys()) {
                        const idleTerminalId = this.idleTaskTerminals.get(taskId);
                        if (idleTerminalId && this.terminals[idleTerminalId].group === group) {
                            terminalId = this.idleTaskTerminals.remove(taskId);
                            break;
                        }
                    }
                }
                if (terminalId) {
                    terminalToReuse = this.terminals[terminalId];
                }
            }
            if (terminalToReuse) {
                if (!this.currentTask.shellLaunchConfig) {
                    throw new Error('Task shell launch configuration should not be undefined here.');
                }
                terminalToReuse.terminal.reuseTerminal(this.currentTask.shellLaunchConfig);
                if (task.command.presentation && task.command.presentation.clear) {
                    terminalToReuse.terminal.clear();
                }
                this.terminals[terminalToReuse.terminal.id.toString()].lastTask = taskKey;
                return [terminalToReuse.terminal, commandExecutable, undefined];
            }
            let result = null;
            if (group) {
                // Try to find an existing terminal to split.
                // Even if an existing terminal is found, the split can fail if the terminal width is too small.
                for (const terminal of collections_1.values(this.terminals)) {
                    if (terminal.group === group) {
                        const originalInstance = terminal.terminal;
                        const config = this.currentTask.shellLaunchConfig;
                        result = this.terminalService.splitInstance(originalInstance, config);
                        if (result) {
                            break;
                        }
                    }
                }
            }
            if (!result) {
                // Either no group is used, no terminal with the group exists or splitting an existing terminal failed.
                result = this.terminalService.createTerminal(this.currentTask.shellLaunchConfig);
            }
            const terminalKey = result.id.toString();
            result.onDisposed((terminal) => {
                let terminalData = this.terminals[terminalKey];
                if (terminalData) {
                    delete this.terminals[terminalKey];
                    delete this.sameTaskTerminals[terminalData.lastTask];
                    this.idleTaskTerminals.delete(terminalData.lastTask);
                    // Delete the task now as a work around for cases when the onExit isn't fired.
                    // This can happen if the terminal wasn't shutdown with an "immediate" flag and is expected.
                    // For correct terminal re-use, the task needs to be deleted immediately.
                    // Note that this shouldn't be a problem anymore since user initiated terminal kills are now immediate.
                    delete this.activeTasks[task.getMapKey()];
                }
            });
            this.terminals[terminalKey] = { terminal: result, lastTask: taskKey, group };
            return [result, commandExecutable, undefined];
        }
        buildShellCommandLine(platform, shellExecutable, shellOptions, command, originalCommand, args) {
            let basename = path.parse(shellExecutable).name.toLowerCase();
            let shellQuoteOptions = this.getQuotingOptions(basename, shellOptions);
            function needsQuotes(value) {
                if (value.length >= 2) {
                    let first = value[0] === shellQuoteOptions.strong ? shellQuoteOptions.strong : value[0] === shellQuoteOptions.weak ? shellQuoteOptions.weak : undefined;
                    if (first === value[value.length - 1]) {
                        return false;
                    }
                }
                let quote;
                for (let i = 0; i < value.length; i++) {
                    // We found the end quote.
                    let ch = value[i];
                    if (ch === quote) {
                        quote = undefined;
                    }
                    else if (quote !== undefined) {
                        // skip the character. We are quoted.
                        continue;
                    }
                    else if (ch === shellQuoteOptions.escape) {
                        // Skip the next character
                        i++;
                    }
                    else if (ch === shellQuoteOptions.strong || ch === shellQuoteOptions.weak) {
                        quote = ch;
                    }
                    else if (ch === ' ') {
                        return true;
                    }
                }
                return false;
            }
            function quote(value, kind) {
                if (kind === tasks_1.ShellQuoting.Strong && shellQuoteOptions.strong) {
                    return [shellQuoteOptions.strong + value + shellQuoteOptions.strong, true];
                }
                else if (kind === tasks_1.ShellQuoting.Weak && shellQuoteOptions.weak) {
                    return [shellQuoteOptions.weak + value + shellQuoteOptions.weak, true];
                }
                else if (kind === tasks_1.ShellQuoting.Escape && shellQuoteOptions.escape) {
                    if (Types.isString(shellQuoteOptions.escape)) {
                        return [value.replace(/ /g, shellQuoteOptions.escape + ' '), true];
                    }
                    else {
                        let buffer = [];
                        for (let ch of shellQuoteOptions.escape.charsToEscape) {
                            buffer.push(`\\${ch}`);
                        }
                        let regexp = new RegExp('[' + buffer.join(',') + ']', 'g');
                        let escapeChar = shellQuoteOptions.escape.escapeChar;
                        return [value.replace(regexp, (match) => escapeChar + match), true];
                    }
                }
                return [value, false];
            }
            function quoteIfNecessary(value) {
                if (Types.isString(value)) {
                    if (needsQuotes(value)) {
                        return quote(value, tasks_1.ShellQuoting.Strong);
                    }
                    else {
                        return [value, false];
                    }
                }
                else {
                    return quote(value.value, value.quoting);
                }
            }
            // If we have no args and the command is a string then use the command to stay backwards compatible with the old command line
            // model. To allow variable resolving with spaces we do continue if the resolved value is different than the original one
            // and the resolved one needs quoting.
            if ((!args || args.length === 0) && Types.isString(command) && (command === originalCommand || needsQuotes(originalCommand))) {
                return command;
            }
            let result = [];
            let commandQuoted = false;
            let argQuoted = false;
            let value;
            let quoted;
            [value, quoted] = quoteIfNecessary(command);
            result.push(value);
            commandQuoted = quoted;
            for (let arg of args) {
                [value, quoted] = quoteIfNecessary(arg);
                result.push(value);
                argQuoted = argQuoted || quoted;
            }
            let commandLine = result.join(' ');
            // There are special rules quoted command line in cmd.exe
            if (platform === 3 /* Windows */) {
                if (basename === 'cmd' && commandQuoted && argQuoted) {
                    commandLine = '"' + commandLine + '"';
                }
                else if (basename === 'powershell' && commandQuoted) {
                    commandLine = '& ' + commandLine;
                }
            }
            if (basename === 'cmd' && platform === 3 /* Windows */ && commandQuoted && argQuoted) {
                commandLine = '"' + commandLine + '"';
            }
            return commandLine;
        }
        getQuotingOptions(shellBasename, shellOptions) {
            if (shellOptions && shellOptions.quoting) {
                return shellOptions.quoting;
            }
            return TerminalTaskSystem.shellQuotes[shellBasename] || TerminalTaskSystem.osShellQuotes[process.platform];
        }
        collectTaskVariables(variables, task) {
            if (task.command) {
                this.collectCommandVariables(variables, task.command, task);
            }
            this.collectMatcherVariables(variables, task.configurationProperties.problemMatchers);
        }
        collectCommandVariables(variables, command, task) {
            // The custom execution should have everything it needs already as it provided
            // the callback.
            if (command.runtime === tasks_1.RuntimeType.CustomExecution) {
                return;
            }
            if (command.name === undefined) {
                throw new Error('Command name should never be undefined here.');
            }
            this.collectVariables(variables, command.name);
            if (command.args) {
                command.args.forEach(arg => this.collectVariables(variables, arg));
            }
            // Try to get a scope.
            const scope = task._source.scope;
            if (scope !== 1 /* Global */) {
                variables.add('${workspaceFolder}');
            }
            if (command.options) {
                let options = command.options;
                if (options.cwd) {
                    this.collectVariables(variables, options.cwd);
                }
                const optionsEnv = options.env;
                if (optionsEnv) {
                    Object.keys(optionsEnv).forEach((key) => {
                        let value = optionsEnv[key];
                        if (Types.isString(value)) {
                            this.collectVariables(variables, value);
                        }
                    });
                }
                if (options.shell) {
                    if (options.shell.executable) {
                        this.collectVariables(variables, options.shell.executable);
                    }
                    if (options.shell.args) {
                        options.shell.args.forEach(arg => this.collectVariables(variables, arg));
                    }
                }
            }
        }
        collectMatcherVariables(variables, values) {
            if (values === undefined || values === null || values.length === 0) {
                return;
            }
            values.forEach((value) => {
                let matcher;
                if (Types.isString(value)) {
                    if (value[0] === '$') {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value.substring(1));
                    }
                    else {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value);
                    }
                }
                else {
                    matcher = value;
                }
                if (matcher && matcher.filePrefix) {
                    this.collectVariables(variables, matcher.filePrefix);
                }
            });
        }
        collectVariables(variables, value) {
            let string = Types.isString(value) ? value : value.value;
            let r = /\$\{(.*?)\}/g;
            let matches;
            do {
                matches = r.exec(string);
                if (matches) {
                    variables.add(matches[0]);
                }
            } while (matches);
        }
        resolveCommandAndArgs(resolver, commandConfig) {
            // First we need to use the command args:
            let args = commandConfig.args ? commandConfig.args.slice() : [];
            args = this.resolveVariables(resolver, args);
            let command = this.resolveVariable(resolver, commandConfig.name);
            return { command, args };
        }
        resolveVariables(resolver, value) {
            return value.map(s => this.resolveVariable(resolver, s));
        }
        resolveMatchers(resolver, values) {
            if (values === undefined || values === null || values.length === 0) {
                return [];
            }
            let result = [];
            values.forEach((value) => {
                let matcher;
                if (Types.isString(value)) {
                    if (value[0] === '$') {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value.substring(1));
                    }
                    else {
                        matcher = problemMatcher_1.ProblemMatcherRegistry.get(value);
                    }
                }
                else {
                    matcher = value;
                }
                if (!matcher) {
                    this.appendOutput(nls.localize('unkownProblemMatcher', 'Problem matcher {0} can\'t be resolved. The matcher will be ignored'));
                    return;
                }
                let taskSystemInfo = resolver.taskSystemInfo;
                let hasFilePrefix = matcher.filePrefix !== undefined;
                let hasUriProvider = taskSystemInfo !== undefined && taskSystemInfo.uriProvider !== undefined;
                if (!hasFilePrefix && !hasUriProvider) {
                    result.push(matcher);
                }
                else {
                    let copy = Objects.deepClone(matcher);
                    if (hasUriProvider && (taskSystemInfo !== undefined)) {
                        copy.uriProvider = taskSystemInfo.uriProvider;
                    }
                    if (hasFilePrefix) {
                        copy.filePrefix = this.resolveVariable(resolver, copy.filePrefix);
                    }
                    result.push(copy);
                }
            });
            return result;
        }
        resolveVariable(resolver, value) {
            // TODO@Dirk Task.getWorkspaceFolder should return a WorkspaceFolder that is defined in workspace.ts
            if (Types.isString(value)) {
                return resolver.resolve(value);
            }
            else if (value !== undefined) {
                return {
                    value: resolver.resolve(value.value),
                    quoting: value.quoting
                };
            }
            else { // This should never happen
                throw new Error('Should never try to resolve undefined.');
            }
        }
        resolveOptions(resolver, options) {
            if (options === undefined || options === null) {
                return { cwd: this.resolveVariable(resolver, '${workspaceFolder}') };
            }
            let result = Types.isString(options.cwd)
                ? { cwd: this.resolveVariable(resolver, options.cwd) }
                : { cwd: this.resolveVariable(resolver, '${workspaceFolder}') };
            if (options.env) {
                result.env = Object.create(null);
                Object.keys(options.env).forEach((key) => {
                    let value = options.env[key];
                    if (Types.isString(value)) {
                        result.env[key] = this.resolveVariable(resolver, value);
                    }
                    else {
                        result.env[key] = value.toString();
                    }
                });
            }
            return result;
        }
        registerLinkMatchers(terminal, problemMatchers) {
            let result = [];
            /*
            let handlePattern = (matcher: ProblemMatcher, pattern: ProblemPattern): void => {
                if (pattern.regexp instanceof RegExp && Types.isNumber(pattern.file)) {
                    result.push(terminal.registerLinkMatcher(pattern.regexp, (match: string) => {
                        let resource: URI = getResource(match, matcher);
                        if (resource) {
                            this.workbenchEditorService.openEditor({
                                resource: resource
                            });
                        }
                    }, 0));
                }
            };
    
            for (let problemMatcher of problemMatchers) {
                if (Array.isArray(problemMatcher.pattern)) {
                    for (let pattern of problemMatcher.pattern) {
                        handlePattern(problemMatcher, pattern);
                    }
                } else if (problemMatcher.pattern) {
                    handlePattern(problemMatcher, problemMatcher.pattern);
                }
            }
            */
            return result;
        }
        getSanitizedCommand(cmd) {
            let result = cmd.toLowerCase();
            let index = result.lastIndexOf(path.sep);
            if (index !== -1) {
                result = result.substring(index + 1);
            }
            if (TerminalTaskSystem.WellKnowCommands[result]) {
                return result;
            }
            return 'other';
        }
        appendOutput(output) {
            const outputChannel = this.outputService.getChannel(this.outputChannelId);
            if (outputChannel) {
                outputChannel.append(output);
            }
        }
    }
    TerminalTaskSystem.TelemetryEventName = 'taskService';
    TerminalTaskSystem.ProcessVarName = '__process__';
    TerminalTaskSystem.shellQuotes = {
        'cmd': {
            strong: '"'
        },
        'powershell': {
            escape: {
                escapeChar: '`',
                charsToEscape: ' "\'()'
            },
            strong: '\'',
            weak: '"'
        },
        'bash': {
            escape: {
                escapeChar: '\\',
                charsToEscape: ' "\''
            },
            strong: '\'',
            weak: '"'
        },
        'zsh': {
            escape: {
                escapeChar: '\\',
                charsToEscape: ' "\''
            },
            strong: '\'',
            weak: '"'
        }
    };
    TerminalTaskSystem.osShellQuotes = {
        'linux': TerminalTaskSystem.shellQuotes['bash'],
        'darwin': TerminalTaskSystem.shellQuotes['bash'],
        'win32': TerminalTaskSystem.shellQuotes['powershell']
    };
    TerminalTaskSystem.WellKnowCommands = {
        'ant': true,
        'cmake': true,
        'eslint': true,
        'gradle': true,
        'grunt': true,
        'gulp': true,
        'jake': true,
        'jenkins': true,
        'jshint': true,
        'make': true,
        'maven': true,
        'msbuild': true,
        'msc': true,
        'nmake': true,
        'npm': true,
        'rake': true,
        'tsc': true,
        'xbuild': true
    };
    exports.TerminalTaskSystem = TerminalTaskSystem;
});
//# sourceMappingURL=terminalTaskSystem.js.map