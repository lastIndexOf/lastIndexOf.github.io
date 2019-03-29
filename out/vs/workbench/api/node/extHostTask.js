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
define(["require", "exports", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/objects", "vs/base/common/async", "vs/base/common/event", "vs/base/node/processes", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/node/extHostTypes", "vs/workbench/api/node/extHostDebugService", "vs/workbench/api/node/extHostTerminalService", "vs/base/common/cancellation", "vs/base/common/lifecycle"], function (require, exports, path, uri_1, Objects, async_1, event_1, processes_1, extHost_protocol_1, types, extHostDebugService_1, extHostTerminalService_1, cancellation_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TaskDefinitionDTO;
    (function (TaskDefinitionDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskDefinitionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskDefinitionDTO.to = to;
    })(TaskDefinitionDTO || (TaskDefinitionDTO = {}));
    var TaskPresentationOptionsDTO;
    (function (TaskPresentationOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskPresentationOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskPresentationOptionsDTO.to = to;
    })(TaskPresentationOptionsDTO || (TaskPresentationOptionsDTO = {}));
    var ProcessExecutionOptionsDTO;
    (function (ProcessExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ProcessExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ProcessExecutionOptionsDTO.to = to;
    })(ProcessExecutionOptionsDTO || (ProcessExecutionOptionsDTO = {}));
    var ProcessExecutionDTO;
    (function (ProcessExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && !!candidate.process;
        }
        ProcessExecutionDTO.is = is;
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                process: value.process,
                args: value.args
            };
            if (value.options) {
                result.options = ProcessExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ProcessExecutionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return new types.ProcessExecution(value.process, value.args, value.options);
        }
        ProcessExecutionDTO.to = to;
    })(ProcessExecutionDTO || (ProcessExecutionDTO = {}));
    var ShellExecutionOptionsDTO;
    (function (ShellExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ShellExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ShellExecutionOptionsDTO.to = to;
    })(ShellExecutionOptionsDTO || (ShellExecutionOptionsDTO = {}));
    var ShellExecutionDTO;
    (function (ShellExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && (!!candidate.commandLine || !!candidate.command);
        }
        ShellExecutionDTO.is = is;
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {};
            if (value.commandLine !== undefined) {
                result.commandLine = value.commandLine;
            }
            else {
                result.command = value.command;
                result.args = value.args;
            }
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ShellExecutionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            if (value.commandLine) {
                return new types.ShellExecution(value.commandLine, value.options);
            }
            else {
                return new types.ShellExecution(value.command, value.args ? value.args : [], value.options);
            }
        }
        ShellExecutionDTO.to = to;
    })(ShellExecutionDTO || (ShellExecutionDTO = {}));
    var CustomExecutionDTO;
    (function (CustomExecutionDTO) {
        function is(value) {
            let candidate = value;
            return candidate && candidate.customExecution === 'customExecution';
        }
        CustomExecutionDTO.is = is;
        function from(value) {
            return {
                customExecution: 'customExecution'
            };
        }
        CustomExecutionDTO.from = from;
    })(CustomExecutionDTO || (CustomExecutionDTO = {}));
    var TaskHandleDTO;
    (function (TaskHandleDTO) {
        function from(value) {
            let folder;
            if (value.scope !== undefined && typeof value.scope !== 'number') {
                folder = value.scope.uri;
            }
            return {
                id: value._id,
                workspaceFolder: folder
            };
        }
        TaskHandleDTO.from = from;
    })(TaskHandleDTO || (TaskHandleDTO = {}));
    var TaskDTO;
    (function (TaskDTO) {
        function fromMany(tasks, extension) {
            if (tasks === undefined || tasks === null) {
                return [];
            }
            const result = [];
            for (let task of tasks) {
                const converted = from(task, extension);
                if (converted) {
                    result.push(converted);
                }
            }
            return result;
        }
        TaskDTO.fromMany = fromMany;
        function from(value, extension) {
            if (value === undefined || value === null) {
                return undefined;
            }
            let execution;
            if (value.execution instanceof types.ProcessExecution) {
                execution = ProcessExecutionDTO.from(value.execution);
            }
            else if (value.execution instanceof types.ShellExecution) {
                execution = ShellExecutionDTO.from(value.execution);
            }
            else if (value.execution2 && value.execution2 instanceof types.CustomExecution) {
                execution = CustomExecutionDTO.from(value.execution2);
            }
            const definition = TaskDefinitionDTO.from(value.definition);
            let scope;
            if (value.scope) {
                if (typeof value.scope === 'number') {
                    scope = value.scope;
                }
                else {
                    scope = value.scope.uri;
                }
            }
            else {
                // To continue to support the deprecated task constructor that doesn't take a scope, we must add a scope here:
                scope = types.TaskScope.Workspace;
            }
            if (!definition || !scope) {
                return undefined;
            }
            const group = value.group ? value.group.id : undefined;
            const result = {
                _id: value._id,
                definition,
                name: value.name,
                source: {
                    extensionId: extension.identifier.value,
                    label: value.source,
                    scope: scope
                },
                execution,
                isBackground: value.isBackground,
                group: group,
                presentationOptions: TaskPresentationOptionsDTO.from(value.presentationOptions),
                problemMatchers: value.problemMatchers,
                hasDefinedMatchers: value.hasDefinedMatchers,
                runOptions: value.runOptions ? value.runOptions : { reevaluateOnRerun: true },
            };
            return result;
        }
        TaskDTO.from = from;
        function to(value, workspace) {
            return __awaiter(this, void 0, void 0, function* () {
                if (value === undefined || value === null) {
                    return undefined;
                }
                let execution;
                if (ProcessExecutionDTO.is(value.execution)) {
                    execution = ProcessExecutionDTO.to(value.execution);
                }
                else if (ShellExecutionDTO.is(value.execution)) {
                    execution = ShellExecutionDTO.to(value.execution);
                }
                const definition = TaskDefinitionDTO.to(value.definition);
                let scope;
                if (value.source) {
                    if (value.source.scope !== undefined) {
                        if (typeof value.source.scope === 'number') {
                            scope = value.source.scope;
                        }
                        else {
                            scope = yield workspace.resolveWorkspaceFolder(uri_1.URI.revive(value.source.scope));
                        }
                    }
                    else {
                        scope = types.TaskScope.Workspace;
                    }
                }
                if (!definition || !scope) {
                    return undefined;
                }
                const result = new types.Task(definition, scope, value.name, value.source.label, execution, value.problemMatchers);
                if (value.isBackground !== undefined) {
                    result.isBackground = value.isBackground;
                }
                if (value.group !== undefined) {
                    result.group = types.TaskGroup.from(value.group);
                }
                if (value.presentationOptions) {
                    result.presentationOptions = TaskPresentationOptionsDTO.to(value.presentationOptions);
                }
                if (value._id) {
                    result._id = value._id;
                }
                return result;
            });
        }
        TaskDTO.to = to;
    })(TaskDTO || (TaskDTO = {}));
    var TaskFilterDTO;
    (function (TaskFilterDTO) {
        function from(value) {
            return value;
        }
        TaskFilterDTO.from = from;
        function to(value) {
            if (!value) {
                return undefined;
            }
            return Objects.assign(Object.create(null), value);
        }
        TaskFilterDTO.to = to;
    })(TaskFilterDTO || (TaskFilterDTO = {}));
    class TaskExecutionImpl {
        constructor(_tasks, _id, _task) {
            this._tasks = _tasks;
            this._id = _id;
            this._task = _task;
        }
        get task() {
            return this._task;
        }
        terminate() {
            this._tasks.terminateTask(this);
        }
        fireDidStartProcess(value) {
        }
        fireDidEndProcess(value) {
        }
    }
    var TaskExecutionDTO;
    (function (TaskExecutionDTO) {
        function to(value, tasks, workspaceProvider) {
            return __awaiter(this, void 0, void 0, function* () {
                return new TaskExecutionImpl(tasks, value.id, yield TaskDTO.to(value.task, workspaceProvider));
            });
        }
        TaskExecutionDTO.to = to;
        function from(value) {
            return {
                id: value._id,
                task: undefined
            };
        }
        TaskExecutionDTO.from = from;
    })(TaskExecutionDTO || (TaskExecutionDTO = {}));
    class CustomExecutionData {
        constructor(customExecution, terminalService) {
            this.customExecution = customExecution;
            this.terminalService = terminalService;
            this._onTaskExecutionComplete = new event_1.Emitter();
            this._disposables = [];
        }
        dispose() {
            lifecycle_1.dispose(this._disposables);
        }
        get onTaskExecutionComplete() {
            return this._onTaskExecutionComplete.event;
        }
        onDidCloseTerminal(terminal) {
            if (this.terminal === terminal) {
                this._cancellationSource.cancel();
            }
        }
        onDidOpenTerminal(terminal) {
            if (!(terminal instanceof extHostTerminalService_1.ExtHostTerminal)) {
                throw new Error('How could this not be a extension host terminal?');
            }
            if (this.terminalId && terminal._id === this.terminalId) {
                this.startCallback(this.terminalId);
            }
        }
        startCallback(terminalId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.terminalId = terminalId;
                // If we have already started the extension task callback, then
                // do not start it again.
                // It is completely valid for multiple terminals to be opened
                // before the one for our task.
                if (this._cancellationSource) {
                    return undefined;
                }
                const callbackTerminals = this.terminalService.terminals.filter((terminal) => terminal._id === terminalId);
                if (!callbackTerminals || callbackTerminals.length === 0) {
                    this._disposables.push(this.terminalService.onDidOpenTerminal(this.onDidOpenTerminal.bind(this)));
                    return;
                }
                if (callbackTerminals.length !== 1) {
                    throw new Error(`Expected to only have one terminal at this point`);
                }
                this.terminal = callbackTerminals[0];
                const terminalRenderer = yield this.terminalService.resolveTerminalRenderer(terminalId);
                // If we don't have the maximum dimensions yet, then we need to wait for them (but not indefinitely).
                // Custom executions will expect the dimensions to be set properly before they are launched.
                // BUT, due to the API contract VSCode has for terminals and dimensions, they are still responsible for
                // handling cases where they are not set.
                if (!terminalRenderer.maximumDimensions) {
                    const dimensionTimeout = new Promise((resolve) => {
                        setTimeout(() => {
                            resolve();
                        }, CustomExecutionData.waitForDimensionsTimeoutInMs);
                    });
                    let dimensionsRegistration;
                    const dimensionsPromise = new Promise((resolve) => {
                        dimensionsRegistration = terminalRenderer.onDidChangeMaximumDimensions((newDimensions) => {
                            resolve();
                        });
                    });
                    yield Promise.race([dimensionTimeout, dimensionsPromise]);
                    if (dimensionsRegistration) {
                        dimensionsRegistration.dispose();
                    }
                }
                this._cancellationSource = new cancellation_1.CancellationTokenSource();
                this._disposables.push(this._cancellationSource);
                this._disposables.push(this.terminalService.onDidCloseTerminal(this.onDidCloseTerminal.bind(this)));
                // Regardless of how the task completes, we are done with this custom execution task.
                this.customExecution.callback(terminalRenderer, this._cancellationSource.token).then((success) => {
                    this.result = success;
                    this._onTaskExecutionComplete.fire(this);
                }, (rejected) => {
                    this._onTaskExecutionComplete.fire(this);
                });
            });
        }
    }
    CustomExecutionData.waitForDimensionsTimeoutInMs = 5000;
    class ExtHostTask {
        constructor(mainContext, workspaceService, editorService, configurationService, extHostTerminalService) {
            this._onDidExecuteTask = new event_1.Emitter();
            this._onDidTerminateTask = new event_1.Emitter();
            this._onDidTaskProcessStarted = new event_1.Emitter();
            this._onDidTaskProcessEnded = new event_1.Emitter();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTask);
            this._workspaceProvider = workspaceService;
            this._editorService = editorService;
            this._configurationService = configurationService;
            this._terminalService = extHostTerminalService;
            this._handleCounter = 0;
            this._handlers = new Map();
            this._taskExecutions = new Map();
            this._providedCustomExecutions = new Map();
            this._activeCustomExecutions = new Map();
        }
        registerTaskProvider(extension, provider) {
            if (!provider) {
                return new types.Disposable(() => { });
            }
            const handle = this.nextHandle();
            this._handlers.set(handle, { provider, extension });
            this._proxy.$registerTaskProvider(handle);
            return new types.Disposable(() => {
                this._handlers.delete(handle);
                this._proxy.$unregisterTaskProvider(handle);
            });
        }
        registerTaskSystem(scheme, info) {
            this._proxy.$registerTaskSystem(scheme, info);
        }
        fetchTasks(filter) {
            return this._proxy.$fetchTasks(TaskFilterDTO.from(filter)).then((values) => __awaiter(this, void 0, void 0, function* () {
                const result = [];
                for (let value of values) {
                    const task = yield TaskDTO.to(value, this._workspaceProvider);
                    if (task) {
                        result.push(task);
                    }
                }
                return result;
            }));
        }
        executeTask(extension, task) {
            return __awaiter(this, void 0, void 0, function* () {
                const tTask = task;
                // We have a preserved ID. So the task didn't change.
                if (tTask._id !== undefined) {
                    return this._proxy.$executeTask(TaskHandleDTO.from(tTask)).then(value => this.getTaskExecution(value, task));
                }
                else {
                    const dto = TaskDTO.from(task, extension);
                    if (dto === undefined) {
                        return Promise.reject(new Error('Task is not valid'));
                    }
                    return this._proxy.$executeTask(dto).then(value => this.getTaskExecution(value, task));
                }
            });
        }
        get taskExecutions() {
            const result = [];
            this._taskExecutions.forEach(value => result.push(value));
            return result;
        }
        terminateTask(execution) {
            if (!(execution instanceof TaskExecutionImpl)) {
                throw new Error('No valid task execution provided');
            }
            return this._proxy.$terminateTask(execution._id);
        }
        get onDidStartTask() {
            return this._onDidExecuteTask.event;
        }
        $onDidStartTask(execution, terminalId) {
            return __awaiter(this, void 0, void 0, function* () {
                // Once a terminal is spun up for the custom execution task this event will be fired.
                // At that point, we need to actually start the callback, but
                // only if it hasn't already begun.
                const extensionCallback = this._providedCustomExecutions.get(execution.id);
                if (extensionCallback) {
                    if (this._activeCustomExecutions.get(execution.id) !== undefined) {
                        throw new Error('We should not be trying to start the same custom task executions twice.');
                    }
                    this._activeCustomExecutions.set(execution.id, extensionCallback);
                    const taskExecutionComplete = extensionCallback.onTaskExecutionComplete(() => {
                        this.customExecutionComplete(execution);
                        taskExecutionComplete.dispose();
                    });
                    extensionCallback.startCallback(terminalId);
                }
                this._onDidExecuteTask.fire({
                    execution: yield this.getTaskExecution(execution)
                });
            });
        }
        get onDidEndTask() {
            return this._onDidTerminateTask.event;
        }
        $OnDidEndTask(execution) {
            return __awaiter(this, void 0, void 0, function* () {
                const _execution = yield this.getTaskExecution(execution);
                this._taskExecutions.delete(execution.id);
                this.customExecutionComplete(execution);
                this._onDidTerminateTask.fire({
                    execution: _execution
                });
            });
        }
        get onDidStartTaskProcess() {
            return this._onDidTaskProcessStarted.event;
        }
        $onDidStartTaskProcess(value) {
            return __awaiter(this, void 0, void 0, function* () {
                const execution = yield this.getTaskExecution(value.id);
                if (execution) {
                    this._onDidTaskProcessStarted.fire({
                        execution: execution,
                        processId: value.processId
                    });
                }
            });
        }
        get onDidEndTaskProcess() {
            return this._onDidTaskProcessEnded.event;
        }
        $onDidEndTaskProcess(value) {
            return __awaiter(this, void 0, void 0, function* () {
                const execution = yield this.getTaskExecution(value.id);
                if (execution) {
                    this._onDidTaskProcessEnded.fire({
                        execution: execution,
                        exitCode: value.exitCode
                    });
                }
            });
        }
        $provideTasks(handle, validTypes) {
            const handler = this._handlers.get(handle);
            if (!handler) {
                return Promise.reject(new Error('no handler found'));
            }
            // For custom execution tasks, we need to store the execution objects locally
            // since we obviously cannot send callback functions through the proxy.
            // So, clear out any existing ones.
            this._providedCustomExecutions.clear();
            // Set up a list of task ID promises that we can wait on
            // before returning the provided tasks. The ensures that
            // our task IDs are calculated for any custom execution tasks.
            // Knowing this ID ahead of time is needed because when a task
            // start event is fired this is when the custom execution is called.
            // The task start event is also the first time we see the ID from the main
            // thread, which is too late for us because we need to save an map
            // from an ID to the custom execution function. (Kind of a cart before the horse problem).
            const taskIdPromises = [];
            const fetchPromise = async_1.asPromise(() => handler.provider.provideTasks(cancellation_1.CancellationToken.None)).then(value => {
                const taskDTOs = [];
                for (let task of value) {
                    if (!task.definition || !validTypes[task.definition.type]) {
                        console.warn(`The task [${task.source}, ${task.name}] uses an undefined task type. The task will be ignored in the future.`);
                    }
                    const taskDTO = TaskDTO.from(task, handler.extension);
                    taskDTOs.push(taskDTO);
                    if (CustomExecutionDTO.is(taskDTO.execution)) {
                        taskIdPromises.push(new Promise((resolve) => {
                            // The ID is calculated on the main thread task side, so, let's call into it here.
                            // We need the task id's pre-computed for custom task executions because when OnDidStartTask
                            // is invoked, we have to be able to map it back to our data.
                            this._proxy.$createTaskId(taskDTO).then((taskId) => {
                                this._providedCustomExecutions.set(taskId, new CustomExecutionData(task.execution2, this._terminalService));
                                resolve();
                            });
                        }));
                    }
                }
                return {
                    tasks: taskDTOs,
                    extension: handler.extension
                };
            });
            return new Promise((resolve) => {
                fetchPromise.then((result) => {
                    Promise.all(taskIdPromises).then(() => {
                        resolve(result);
                    });
                });
            });
        }
        $resolveVariables(uriComponents, toResolve) {
            return __awaiter(this, void 0, void 0, function* () {
                const configProvider = yield this._configurationService.getConfigProvider();
                const uri = uri_1.URI.revive(uriComponents);
                const result = {
                    process: undefined,
                    variables: Object.create(null)
                };
                const workspaceFolder = yield this._workspaceProvider.resolveWorkspaceFolder(uri);
                const workspaceFolders = yield this._workspaceProvider.getWorkspaceFolders2();
                const resolver = new extHostDebugService_1.ExtHostVariableResolverService(workspaceFolders, this._editorService, configProvider);
                const ws = {
                    uri: workspaceFolder.uri,
                    name: workspaceFolder.name,
                    index: workspaceFolder.index,
                    toResource: () => {
                        throw new Error('Not implemented');
                    }
                };
                for (let variable of toResolve.variables) {
                    result.variables[variable] = resolver.resolve(ws, variable);
                }
                if (toResolve.process !== undefined) {
                    let paths = undefined;
                    if (toResolve.process.path !== undefined) {
                        paths = toResolve.process.path.split(path.delimiter);
                        for (let i = 0; i < paths.length; i++) {
                            paths[i] = resolver.resolve(ws, paths[i]);
                        }
                    }
                    result.process = processes_1.win32.findExecutable(resolver.resolve(ws, toResolve.process.name), toResolve.process.cwd !== undefined ? resolver.resolve(ws, toResolve.process.cwd) : undefined, paths);
                }
                return result;
            });
        }
        nextHandle() {
            return this._handleCounter++;
        }
        getTaskExecution(execution, task) {
            return __awaiter(this, void 0, void 0, function* () {
                if (typeof execution === 'string') {
                    return this._taskExecutions.get(execution);
                }
                let result = this._taskExecutions.get(execution.id);
                if (result) {
                    return result;
                }
                result = new TaskExecutionImpl(this, execution.id, task ? task : yield TaskDTO.to(execution.task, this._workspaceProvider));
                this._taskExecutions.set(execution.id, result);
                return result;
            });
        }
        customExecutionComplete(execution) {
            const extensionCallback = this._activeCustomExecutions.get(execution.id);
            if (extensionCallback) {
                this._activeCustomExecutions.delete(execution.id);
                this._proxy.$customExecutionComplete(execution.id, extensionCallback.result);
                extensionCallback.dispose();
            }
        }
    }
    exports.ExtHostTask = ExtHostTask;
});
//# sourceMappingURL=extHostTask.js.map