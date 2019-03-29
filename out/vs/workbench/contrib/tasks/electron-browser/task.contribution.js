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
define(["require", "exports", "vs/nls", "semver", "vs/workbench/contrib/tasks/browser/taskQuickOpen", "vs/base/common/severity", "vs/base/common/objects", "vs/base/common/uri", "vs/base/common/actions", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/types", "vs/base/common/strings", "vs/base/common/parsers", "vs/base/common/uuid", "vs/base/common/platform", "vs/base/common/map", "vs/base/browser/ui/octiconLabel/octiconLabel", "vs/platform/registry/common/platform", "vs/platform/lifecycle/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/platform/markers/common/markers", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/storage/common/storage", "vs/platform/progress/common/progress", "vs/platform/opener/common/opener", "vs/platform/windows/common/windows", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/modelService", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/browser/parts/statusbar/statusbar", "vs/workbench/browser/quickopen", "vs/workbench/services/panel/common/panelService", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/contrib/output/common/output", "vs/workbench/browser/actions", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/tasks/common/taskSystem", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/tasks/common/taskTemplates", "vs/workbench/contrib/tasks/node/tasks", "../node/taskConfiguration", "vs/workbench/contrib/tasks/node/processTaskSystem", "./terminalTaskSystem", "vs/workbench/contrib/tasks/node/processRunnerDetector", "../browser/quickOpen", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contributions", "vs/workbench/common/actions", "vs/workbench/contrib/tasks/electron-browser/runAutomaticTasks", "./jsonSchema_v1", "./jsonSchema_v2", "vs/css!./media/task.contribution"], function (require, exports, nls, semver, taskQuickOpen_1, severity_1, Objects, uri_1, actions_1, Dom, lifecycle_1, event_1, Types, strings, parsers_1, UUID, Platform, map_1, octiconLabel_1, platform_1, lifecycle_2, actions_2, extensions_1, markers_1, telemetry_1, configuration_1, files_1, extensions_2, commands_1, keybindingsRegistry_1, problemMatcher_1, storage_1, progress_1, opener_1, windows_1, notification_1, dialogs_1, modelService_1, jsonContributionRegistry, statusbar_1, quickopen_1, panelService_1, constants_1, layoutService_1, editorService_1, configurationResolver_1, workspace_1, textfiles_1, output_1, actions_3, terminal_1, taskSystem_1, tasks_1, taskService_1, taskTemplates_1, tasks_2, TaskConfig, processTaskSystem_1, terminalTaskSystem_1, processRunnerDetector_1, quickOpen_1, theme_1, themeService_1, quickInput_1, taskDefinitionRegistry_1, contextkey_1, contributions_1, actions_4, runAutomaticTasks_1, jsonSchema_v1_1, jsonSchema_v2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let tasksCategory = nls.localize('tasksCategory', "Tasks");
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(runAutomaticTasks_1.RunAutomaticTasks, 4 /* Eventually */);
    const actionRegistry = platform_1.Registry.as(actions_4.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(runAutomaticTasks_1.AllowAutomaticTaskRunning, runAutomaticTasks_1.AllowAutomaticTaskRunning.ID, runAutomaticTasks_1.AllowAutomaticTaskRunning.LABEL), 'Tasks: Allow Automatic Tasks in Folder', tasksCategory);
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(runAutomaticTasks_1.DisallowAutomaticTaskRunning, runAutomaticTasks_1.DisallowAutomaticTaskRunning.ID, runAutomaticTasks_1.DisallowAutomaticTaskRunning.LABEL), 'Tasks: Disallow Automatic Tasks in Folder', tasksCategory);
    var ConfigureTaskAction;
    (function (ConfigureTaskAction) {
        ConfigureTaskAction.ID = 'workbench.action.tasks.configureTaskRunner';
        ConfigureTaskAction.TEXT = nls.localize('ConfigureTaskRunnerAction.label', "Configure Task");
    })(ConfigureTaskAction || (ConfigureTaskAction = {}));
    let BuildStatusBarItem = class BuildStatusBarItem extends theme_1.Themable {
        constructor(panelService, markerService, taskService, layoutService, themeService, contextService) {
            super(themeService);
            this.panelService = panelService;
            this.markerService = markerService;
            this.taskService = taskService;
            this.layoutService = layoutService;
            this.contextService = contextService;
            this.activeCount = 0;
            this.icons = [];
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateStyles()));
        }
        updateStyles() {
            super.updateStyles();
            this.icons.forEach(icon => {
                icon.style.backgroundColor = this.getColor(this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? theme_1.STATUS_BAR_FOREGROUND : theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND);
            });
        }
        render(container) {
            let callOnDispose = [];
            const element = document.createElement('div');
            const label = document.createElement('a');
            const errorIcon = document.createElement('div');
            const warningIcon = document.createElement('div');
            const infoIcon = document.createElement('div');
            const error = document.createElement('div');
            const warning = document.createElement('div');
            const info = document.createElement('div');
            const building = document.createElement('div');
            const errorTitle = n => nls.localize('totalErrors', "{0} Errors", n);
            const warningTitle = n => nls.localize('totalWarnings', "{0} Warnings", n);
            const infoTitle = n => nls.localize('totalInfos', "{0} Infos", n);
            Dom.addClass(element, 'task-statusbar-item');
            element.title = nls.localize('problems', "Problems");
            Dom.addClass(label, 'task-statusbar-item-label');
            element.appendChild(label);
            Dom.addClass(errorIcon, 'task-statusbar-item-label-error');
            Dom.addClass(errorIcon, 'mask-icon');
            label.appendChild(errorIcon);
            this.icons.push(errorIcon);
            Dom.addClass(error, 'task-statusbar-item-label-counter');
            error.innerHTML = '0';
            error.title = errorIcon.title = errorTitle(0);
            label.appendChild(error);
            Dom.addClass(warningIcon, 'task-statusbar-item-label-warning');
            Dom.addClass(warningIcon, 'mask-icon');
            label.appendChild(warningIcon);
            this.icons.push(warningIcon);
            Dom.addClass(warning, 'task-statusbar-item-label-counter');
            warning.innerHTML = '0';
            warning.title = warningIcon.title = warningTitle(0);
            label.appendChild(warning);
            Dom.addClass(infoIcon, 'task-statusbar-item-label-info');
            Dom.addClass(infoIcon, 'mask-icon');
            label.appendChild(infoIcon);
            this.icons.push(infoIcon);
            Dom.hide(infoIcon);
            Dom.addClass(info, 'task-statusbar-item-label-counter');
            label.appendChild(info);
            Dom.hide(info);
            Dom.addClass(building, 'task-statusbar-item-building');
            element.appendChild(building);
            building.innerHTML = nls.localize('building', 'Building...');
            Dom.hide(building);
            callOnDispose.push(Dom.addDisposableListener(label, 'click', (e) => {
                const panel = this.panelService.getActivePanel();
                if (panel && panel.getId() === constants_1.default.MARKERS_PANEL_ID) {
                    this.layoutService.setPanelHidden(true);
                }
                else {
                    this.panelService.openPanel(constants_1.default.MARKERS_PANEL_ID, true);
                }
            }));
            const manyProblems = nls.localize('manyProblems', "10K+");
            const packNumber = n => n > 9999 ? manyProblems : n > 999 ? n.toString().charAt(0) + 'K' : n.toString();
            let updateLabel = (stats) => {
                error.innerHTML = packNumber(stats.errors);
                error.title = errorIcon.title = errorTitle(stats.errors);
                warning.innerHTML = packNumber(stats.warnings);
                warning.title = warningIcon.title = warningTitle(stats.warnings);
                if (stats.infos > 0) {
                    info.innerHTML = packNumber(stats.infos);
                    info.title = infoIcon.title = infoTitle(stats.infos);
                    Dom.show(info);
                    Dom.show(infoIcon);
                }
                else {
                    Dom.hide(info);
                    Dom.hide(infoIcon);
                }
            };
            this.markerService.onMarkerChanged((changedResources) => {
                updateLabel(this.markerService.getStatistics());
            });
            callOnDispose.push(this.taskService.onDidStateChange((event) => {
                if (this.ignoreEvent(event)) {
                    return;
                }
                switch (event.kind) {
                    case "active" /* Active */:
                        this.activeCount++;
                        if (this.activeCount === 1) {
                            Dom.show(building);
                        }
                        break;
                    case "inactive" /* Inactive */:
                        // Since the exiting of the sub process is communicated async we can't order inactive and terminate events.
                        // So try to treat them accordingly.
                        if (this.activeCount > 0) {
                            this.activeCount--;
                            if (this.activeCount === 0) {
                                Dom.hide(building);
                            }
                        }
                        break;
                    case "terminated" /* Terminated */:
                        if (this.activeCount !== 0) {
                            Dom.hide(building);
                            this.activeCount = 0;
                        }
                        break;
                }
            }));
            container.appendChild(element);
            this.updateStyles();
            return lifecycle_1.toDisposable(() => {
                callOnDispose = lifecycle_1.dispose(callOnDispose);
            });
        }
        ignoreEvent(event) {
            if (!this.taskService.inTerminal()) {
                return false;
            }
            if (event.group !== tasks_1.TaskGroup.Build) {
                return true;
            }
            if (!event.__task) {
                return false;
            }
            return event.__task.configurationProperties.problemMatchers === undefined || event.__task.configurationProperties.problemMatchers.length === 0;
        }
    };
    BuildStatusBarItem = __decorate([
        __param(0, panelService_1.IPanelService),
        __param(1, markers_1.IMarkerService),
        __param(2, taskService_1.ITaskService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, themeService_1.IThemeService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], BuildStatusBarItem);
    let TaskStatusBarItem = class TaskStatusBarItem extends theme_1.Themable {
        constructor(taskService, themeService) {
            super(themeService);
            this.taskService = taskService;
        }
        updateStyles() {
            super.updateStyles();
        }
        render(container) {
            let callOnDispose = [];
            const element = document.createElement('a');
            Dom.addClass(element, 'task-statusbar-runningItem');
            let labelElement = document.createElement('div');
            Dom.addClass(labelElement, 'task-statusbar-runningItem-label');
            element.appendChild(labelElement);
            let label = new octiconLabel_1.OcticonLabel(labelElement);
            label.title = nls.localize('runningTasks', "Show Running Tasks");
            Dom.hide(element);
            callOnDispose.push(Dom.addDisposableListener(labelElement, 'click', (e) => {
                this.taskService.runShowTasks();
            }));
            let updateStatus = () => {
                this.taskService.getActiveTasks().then(tasks => {
                    if (tasks.length === 0) {
                        Dom.hide(element);
                    }
                    else {
                        label.text = `$(tools) ${tasks.length}`;
                        Dom.show(element);
                    }
                });
            };
            callOnDispose.push(this.taskService.onDidStateChange((event) => {
                if (event.kind === "changed" /* Changed */) {
                    updateStatus();
                }
            }));
            container.appendChild(element);
            this.updateStyles();
            updateStatus();
            return {
                dispose: () => {
                    callOnDispose = lifecycle_1.dispose(callOnDispose);
                }
            };
        }
    };
    TaskStatusBarItem = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, themeService_1.IThemeService)
    ], TaskStatusBarItem);
    class ProblemReporter {
        constructor(_outputChannel) {
            this._outputChannel = _outputChannel;
            this._validationStatus = new parsers_1.ValidationStatus();
        }
        info(message) {
            this._validationStatus.state = 1 /* Info */;
            this._outputChannel.append(message + '\n');
        }
        warn(message) {
            this._validationStatus.state = 2 /* Warning */;
            this._outputChannel.append(message + '\n');
        }
        error(message) {
            this._validationStatus.state = 3 /* Error */;
            this._outputChannel.append(message + '\n');
        }
        fatal(message) {
            this._validationStatus.state = 4 /* Fatal */;
            this._outputChannel.append(message + '\n');
        }
        get status() {
            return this._validationStatus;
        }
    }
    class TaskMap {
        constructor() {
            this._store = new Map();
        }
        forEach(callback) {
            this._store.forEach(callback);
        }
        get(workspaceFolder) {
            let result = Types.isString(workspaceFolder) ? this._store.get(workspaceFolder) : this._store.get(workspaceFolder.uri.toString());
            if (!result) {
                result = [];
                Types.isString(workspaceFolder) ? this._store.set(workspaceFolder, result) : this._store.set(workspaceFolder.uri.toString(), result);
            }
            return result;
        }
        add(workspaceFolder, ...task) {
            let values = Types.isString(workspaceFolder) ? this._store.get(workspaceFolder) : this._store.get(workspaceFolder.uri.toString());
            if (!values) {
                values = [];
                Types.isString(workspaceFolder) ? this._store.set(workspaceFolder, values) : this._store.set(workspaceFolder.uri.toString(), values);
            }
            values.push(...task);
        }
        all() {
            let result = [];
            this._store.forEach((values) => result.push(...values));
            return result;
        }
    }
    let TaskService = class TaskService extends lifecycle_1.Disposable {
        constructor(configurationService, markerService, outputService, editorService, fileService, contextService, telemetryService, textFileService, lifecycleService, modelService, extensionService, quickInputService, configurationResolverService, terminalService, storageService, progressService, openerService, _windowService, dialogService, notificationService, contextKeyService) {
            super();
            this.configurationService = configurationService;
            this.markerService = markerService;
            this.outputService = outputService;
            this.editorService = editorService;
            this.fileService = fileService;
            this.contextService = contextService;
            this.telemetryService = telemetryService;
            this.textFileService = textFileService;
            this.modelService = modelService;
            this.extensionService = extensionService;
            this.quickInputService = quickInputService;
            this.configurationResolverService = configurationResolverService;
            this.terminalService = terminalService;
            this.storageService = storageService;
            this.progressService = progressService;
            this.openerService = openerService;
            this._windowService = _windowService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this._configHasErrors = false;
            this._workspaceTasksPromise = undefined;
            this._taskSystem = undefined;
            this._taskSystemListener = undefined;
            this._outputChannel = this.outputService.getChannel(TaskService.OutputChannelId);
            this._providers = new Map();
            this._taskSystemInfos = new Map();
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => {
                if (!this._taskSystem && !this._workspaceTasksPromise) {
                    return;
                }
                let folderSetup = this.computeWorkspaceFolderSetup();
                if (this.executionEngine !== folderSetup[2]) {
                    if (this._taskSystem && this._taskSystem.getActiveTasks().length > 0) {
                        this.notificationService.prompt(severity_1.default.Info, nls.localize('TaskSystem.noHotSwap', 'Changing the task execution engine with an active task running requires to reload the Window'), [{
                                label: nls.localize('reloadWindow', "Reload Window"),
                                run: () => this._windowService.reloadWindow()
                            }], { sticky: true });
                        return;
                    }
                    else {
                        this.disposeTaskSystemListeners();
                        this._taskSystem = undefined;
                    }
                }
                this.updateSetup(folderSetup);
                this.updateWorkspaceTasks();
            }));
            this._register(this.configurationService.onDidChangeConfiguration(() => {
                if (!this._taskSystem && !this._workspaceTasksPromise) {
                    return;
                }
                if (!this._taskSystem || this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem) {
                    this._outputChannel.clear();
                }
                this.updateWorkspaceTasks(2 /* ConfigurationChange */);
            }));
            this._taskRunningState = tasks_1.TASK_RUNNING_STATE.bindTo(contextKeyService);
            this._register(lifecycleService.onBeforeShutdown(event => event.veto(this.beforeShutdown())));
            this._register(storageService.onWillSaveState(() => this.saveState()));
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.registerCommands();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        get supportsMultipleTaskExecutions() {
            return this.inTerminal();
        }
        registerCommands() {
            commands_1.CommandsRegistry.registerCommand({
                id: 'workbench.action.tasks.runTask',
                handler: (accessor, arg) => {
                    this.runTaskCommand(arg);
                },
                description: {
                    description: 'Run Task',
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'string',
                            }
                        }]
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.reRunTask', (accessor, arg) => {
                this.reRunTaskCommand(arg);
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.restartTask', (accessor, arg) => {
                this.runRestartTaskCommand(arg);
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.terminate', (accessor, arg) => {
                this.runTerminateCommand(arg);
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.showLog', () => {
                if (!this.canRunCommand()) {
                    return;
                }
                this.showOutput();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.build', () => {
                if (!this.canRunCommand()) {
                    return;
                }
                this.runBuildCommand();
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: 'workbench.action.tasks.build',
                weight: 200 /* WorkbenchContrib */,
                when: undefined,
                primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 32 /* KEY_B */
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.test', () => {
                if (!this.canRunCommand()) {
                    return;
                }
                this.runTestCommand();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureTaskRunner', () => {
                this.runConfigureTasks();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureDefaultBuildTask', () => {
                this.runConfigureDefaultBuildTask();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureDefaultTestTask', () => {
                this.runConfigureDefaultTestTask();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.showTasks', () => {
                this.runShowTasks();
            });
        }
        get workspaceFolders() {
            if (!this._workspaceFolders) {
                this.updateSetup();
            }
            return this._workspaceFolders;
        }
        get ignoredWorkspaceFolders() {
            if (!this._ignoredWorkspaceFolders) {
                this.updateSetup();
            }
            return this._ignoredWorkspaceFolders;
        }
        get executionEngine() {
            if (this._executionEngine === undefined) {
                this.updateSetup();
            }
            return this._executionEngine;
        }
        get schemaVersion() {
            if (this._schemaVersion === undefined) {
                this.updateSetup();
            }
            return this._schemaVersion;
        }
        get showIgnoreMessage() {
            if (this._showIgnoreMessage === undefined) {
                this._showIgnoreMessage = !this.storageService.getBoolean(TaskService.IgnoreTask010DonotShowAgain_key, 1 /* WORKSPACE */, false);
            }
            return this._showIgnoreMessage;
        }
        updateSetup(setup) {
            if (!setup) {
                setup = this.computeWorkspaceFolderSetup();
            }
            this._workspaceFolders = setup[0];
            if (this._ignoredWorkspaceFolders) {
                if (this._ignoredWorkspaceFolders.length !== setup[1].length) {
                    this._showIgnoreMessage = undefined;
                }
                else {
                    let set = new Set();
                    this._ignoredWorkspaceFolders.forEach(folder => set.add(folder.uri.toString()));
                    for (let folder of setup[1]) {
                        if (!set.has(folder.uri.toString())) {
                            this._showIgnoreMessage = undefined;
                            break;
                        }
                    }
                }
            }
            this._ignoredWorkspaceFolders = setup[1];
            this._executionEngine = setup[2];
            this._schemaVersion = setup[3];
        }
        showOutput(runSource = 0 /* User */) {
            if (runSource === 0 /* User */) {
                this.notificationService.prompt(severity_1.default.Warning, nls.localize('taskServiceOutputPrompt', 'There are task errors. See the output for details.'), [{
                        label: nls.localize('showOutput', "Show output"),
                        run: () => {
                            this.outputService.showChannel(this._outputChannel.id, true);
                        }
                    }]);
            }
        }
        disposeTaskSystemListeners() {
            if (this._taskSystemListener) {
                this._taskSystemListener.dispose();
            }
        }
        registerTaskProvider(provider) {
            if (!provider) {
                return {
                    dispose: () => { }
                };
            }
            let handle = TaskService.nextHandle++;
            this._providers.set(handle, provider);
            return {
                dispose: () => {
                    this._providers.delete(handle);
                }
            };
        }
        registerTaskSystem(key, info) {
            this._taskSystemInfos.set(key, info);
        }
        extensionCallbackTaskComplete(task, result) {
            if (!this._taskSystem) {
                return Promise.resolve();
            }
            return this._taskSystem.customExecutionComplete(task, result);
        }
        getTask(folder, identifier, compareId = false) {
            const name = Types.isString(folder) ? folder : folder.name;
            if (this.ignoredWorkspaceFolders.some(ignored => ignored.name === name)) {
                return Promise.reject(new Error(nls.localize('TaskServer.folderIgnored', 'The folder {0} is ignored since it uses task version 0.1.0', name)));
            }
            const key = !Types.isString(identifier)
                ? tasks_2.TaskDefinition.createTaskIdentifier(identifier, console)
                : identifier;
            if (key === undefined) {
                return Promise.resolve(undefined);
            }
            return this.getGroupedTasks().then((map) => {
                const values = map.get(folder);
                if (!values) {
                    return undefined;
                }
                for (const task of values) {
                    if (task.matches(key, compareId)) {
                        return task;
                    }
                }
                return undefined;
            });
        }
        tasks(filter) {
            let range = filter && filter.version ? filter.version : undefined;
            let engine = this.executionEngine;
            if (range && ((semver.satisfies('0.1.0', range) && engine === tasks_1.ExecutionEngine.Terminal) || (semver.satisfies('2.0.0', range) && engine === tasks_1.ExecutionEngine.Process))) {
                return Promise.resolve([]);
            }
            return this.getGroupedTasks().then((map) => {
                if (!filter || !filter.type) {
                    return map.all();
                }
                let result = [];
                map.forEach((tasks) => {
                    for (let task of tasks) {
                        if (tasks_1.ContributedTask.is(task) && task.defines.type === filter.type) {
                            result.push(task);
                        }
                        else if (tasks_1.CustomTask.is(task)) {
                            if (task.type === filter.type) {
                                result.push(task);
                            }
                            else {
                                let customizes = task.customizes();
                                if (customizes && customizes.type === filter.type) {
                                    result.push(task);
                                }
                            }
                        }
                    }
                });
                return result;
            });
        }
        createSorter() {
            return new tasks_1.TaskSorter(this.contextService.getWorkspace() ? this.contextService.getWorkspace().folders : []);
        }
        isActive() {
            if (!this._taskSystem) {
                return Promise.resolve(false);
            }
            return this._taskSystem.isActive();
        }
        getActiveTasks() {
            if (!this._taskSystem) {
                return Promise.resolve([]);
            }
            return Promise.resolve(this._taskSystem.getActiveTasks());
        }
        getRecentlyUsedTasks() {
            if (this._recentlyUsedTasks) {
                return this._recentlyUsedTasks;
            }
            this._recentlyUsedTasks = new map_1.LinkedMap();
            let storageValue = this.storageService.get(TaskService.RecentlyUsedTasks_Key, 1 /* WORKSPACE */);
            if (storageValue) {
                try {
                    let values = JSON.parse(storageValue);
                    if (Array.isArray(values)) {
                        for (let value of values) {
                            this._recentlyUsedTasks.set(value, value);
                        }
                    }
                }
                catch (error) {
                    // Ignore. We use the empty result
                }
            }
            return this._recentlyUsedTasks;
        }
        saveState() {
            if (!this._taskSystem || !this._recentlyUsedTasks) {
                return;
            }
            let values = this._recentlyUsedTasks.values();
            if (values.length > 30) {
                values = values.slice(0, 30);
            }
            this.storageService.store(TaskService.RecentlyUsedTasks_Key, JSON.stringify(values), 1 /* WORKSPACE */);
        }
        openDocumentation() {
            this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?LinkId=733558'));
        }
        build() {
            return this.getGroupedTasks().then((tasks) => {
                let runnable = this.createRunnableTask(tasks, tasks_1.TaskGroup.Build);
                if (!runnable || !runnable.task) {
                    if (this.schemaVersion === 1 /* V0_1_0 */) {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noBuildTask1', 'No build task defined. Mark a task with \'isBuildCommand\' in the tasks.json file.'), 2 /* NoBuildTask */);
                    }
                    else {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noBuildTask2', 'No build task defined. Mark a task with as a \'build\' group in the tasks.json file.'), 2 /* NoBuildTask */);
                    }
                }
                return this.executeTask(runnable.task, runnable.resolver);
            }).then(value => value, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        runTest() {
            return this.getGroupedTasks().then((tasks) => {
                let runnable = this.createRunnableTask(tasks, tasks_1.TaskGroup.Test);
                if (!runnable || !runnable.task) {
                    if (this.schemaVersion === 1 /* V0_1_0 */) {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noTestTask1', 'No test task defined. Mark a task with \'isTestCommand\' in the tasks.json file.'), 3 /* NoTestTask */);
                    }
                    else {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noTestTask2', 'No test task defined. Mark a task with as a \'test\' group in the tasks.json file.'), 3 /* NoTestTask */);
                    }
                }
                return this.executeTask(runnable.task, runnable.resolver);
            }).then(value => value, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        run(task, options) {
            if (!task) {
                throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskServer.noTask', 'Task to execute is undefined'), 5 /* TaskNotFound */);
            }
            return this.getGroupedTasks().then((grouped) => {
                let resolver = this.createResolver(grouped);
                if (options && options.attachProblemMatcher && this.shouldAttachProblemMatcher(task) && !tasks_1.InMemoryTask.is(task)) {
                    return this.attachProblemMatcher(task).then((toExecute) => {
                        if (toExecute) {
                            return this.executeTask(toExecute, resolver);
                        }
                        else {
                            return Promise.resolve(undefined);
                        }
                    });
                }
                return this.executeTask(task, resolver);
            }).then(value => value, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        shouldAttachProblemMatcher(task) {
            if (!this.canCustomize(task)) {
                return false;
            }
            if (task.configurationProperties.group !== undefined && task.configurationProperties.group !== tasks_1.TaskGroup.Build) {
                return false;
            }
            if (task.configurationProperties.problemMatchers !== undefined && task.configurationProperties.problemMatchers.length > 0) {
                return false;
            }
            if (tasks_1.ContributedTask.is(task)) {
                return !task.hasDefinedMatchers && !!task.configurationProperties.problemMatchers && (task.configurationProperties.problemMatchers.length === 0);
            }
            if (tasks_1.CustomTask.is(task)) {
                let configProperties = task._source.config.element;
                return configProperties.problemMatcher === undefined && !task.hasDefinedMatchers;
            }
            return false;
        }
        attachProblemMatcher(task) {
            let entries = [];
            for (let key of problemMatcher_1.ProblemMatcherRegistry.keys()) {
                let matcher = problemMatcher_1.ProblemMatcherRegistry.get(key);
                if (matcher.deprecated) {
                    continue;
                }
                if (matcher.name === matcher.label) {
                    entries.push({ label: matcher.name, matcher: matcher });
                }
                else {
                    entries.push({
                        label: matcher.label,
                        description: `$${matcher.name}`,
                        matcher: matcher
                    });
                }
            }
            if (entries.length > 0) {
                entries = entries.sort((a, b) => {
                    if (a.label && b.label) {
                        return a.label.localeCompare(b.label);
                    }
                    else {
                        return 0;
                    }
                });
                entries.unshift({ type: 'separator', label: nls.localize('TaskService.associate', 'associate') });
                entries.unshift({ label: nls.localize('TaskService.attachProblemMatcher.continueWithout', 'Continue without scanning the task output'), matcher: undefined }, { label: nls.localize('TaskService.attachProblemMatcher.never', 'Never scan the task output'), matcher: undefined, never: true }, { label: nls.localize('TaskService.attachProblemMatcher.learnMoreAbout', 'Learn more about scanning the task output'), matcher: undefined, learnMore: true });
                return this.quickInputService.pick(entries, {
                    placeHolder: nls.localize('selectProblemMatcher', 'Select for which kind of errors and warnings to scan the task output'),
                }).then((selected) => {
                    if (selected) {
                        if (selected.learnMore) {
                            this.openDocumentation();
                            return undefined;
                        }
                        else if (selected.never) {
                            this.customize(task, { problemMatcher: [] }, true);
                            return task;
                        }
                        else if (selected.matcher) {
                            let newTask = task.clone();
                            let matcherReference = `$${selected.matcher.name}`;
                            let properties = { problemMatcher: [matcherReference] };
                            newTask.configurationProperties.problemMatchers = [matcherReference];
                            let matcher = problemMatcher_1.ProblemMatcherRegistry.get(selected.matcher.name);
                            if (matcher && matcher.watching !== undefined) {
                                properties.isBackground = true;
                                newTask.configurationProperties.isBackground = true;
                            }
                            this.customize(task, properties, true);
                            return newTask;
                        }
                        else {
                            return task;
                        }
                    }
                    else {
                        return undefined;
                    }
                });
            }
            return Promise.resolve(task);
        }
        getTasksForGroup(group) {
            return this.getGroupedTasks().then((groups) => {
                let result = [];
                groups.forEach((tasks) => {
                    for (let task of tasks) {
                        if (task.configurationProperties.group === group) {
                            result.push(task);
                        }
                    }
                });
                return result;
            });
        }
        needsFolderQualification() {
            return this.contextService.getWorkbenchState() === 3 /* WORKSPACE */;
        }
        canCustomize(task) {
            if (this.schemaVersion !== 2 /* V2_0_0 */) {
                return false;
            }
            if (tasks_1.CustomTask.is(task)) {
                return true;
            }
            if (tasks_1.ContributedTask.is(task)) {
                return !!task.getWorkspaceFolder();
            }
            return false;
        }
        customize(task, properties, openConfig) {
            const workspaceFolder = task.getWorkspaceFolder();
            if (!workspaceFolder) {
                return Promise.resolve(undefined);
            }
            let configuration = this.getConfiguration(workspaceFolder);
            if (configuration.hasParseErrors) {
                this.notificationService.warn(nls.localize('customizeParseErrors', 'The current task configuration has errors. Please fix the errors first before customizing a task.'));
                return Promise.resolve(undefined);
            }
            let fileConfig = configuration.config;
            let index;
            let toCustomize;
            let taskConfig = tasks_1.CustomTask.is(task) ? task._source.config : undefined;
            if (taskConfig && taskConfig.element) {
                index = taskConfig.index;
                toCustomize = taskConfig.element;
            }
            else if (tasks_1.ContributedTask.is(task)) {
                toCustomize = {};
                let identifier = Objects.assign(Object.create(null), task.defines);
                delete identifier['_key'];
                Object.keys(identifier).forEach(key => toCustomize[key] = identifier[key]);
                if (task.configurationProperties.problemMatchers && task.configurationProperties.problemMatchers.length > 0 && Types.isStringArray(task.configurationProperties.problemMatchers)) {
                    toCustomize.problemMatcher = task.configurationProperties.problemMatchers;
                }
            }
            if (!toCustomize) {
                return Promise.resolve(undefined);
            }
            if (properties) {
                for (let property of Object.getOwnPropertyNames(properties)) {
                    let value = properties[property];
                    if (value !== undefined && value !== null) {
                        toCustomize[property] = value;
                    }
                }
            }
            else {
                if (toCustomize.problemMatcher === undefined && task.configurationProperties.problemMatchers === undefined || (task.configurationProperties.problemMatchers && task.configurationProperties.problemMatchers.length === 0)) {
                    toCustomize.problemMatcher = [];
                }
            }
            let promise;
            if (!fileConfig) {
                let value = {
                    version: '2.0.0',
                    tasks: [toCustomize]
                };
                let content = [
                    '{',
                    nls.localize('tasksJsonComment', '\t// See https://go.microsoft.com/fwlink/?LinkId=733558 \n\t// for the documentation about the tasks.json format'),
                ].join('\n') + JSON.stringify(value, null, '\t').substr(1);
                let editorConfig = this.configurationService.getValue();
                if (editorConfig.editor.insertSpaces) {
                    content = content.replace(/(\n)(\t+)/g, (_, s1, s2) => s1 + strings.repeat(' ', s2.length * editorConfig.editor.tabSize));
                }
                promise = this.fileService.createFile(workspaceFolder.toResource('.vscode/tasks.json'), content).then(() => { });
            }
            else {
                // We have a global task configuration
                if ((index === -1) && properties) {
                    if (properties.problemMatcher !== undefined) {
                        fileConfig.problemMatcher = properties.problemMatcher;
                        promise = this.writeConfiguration(workspaceFolder, 'tasks.problemMatchers', fileConfig.problemMatcher);
                    }
                    else if (properties.group !== undefined) {
                        fileConfig.group = properties.group;
                        promise = this.writeConfiguration(workspaceFolder, 'tasks.group', fileConfig.group);
                    }
                }
                else {
                    if (!Array.isArray(fileConfig.tasks)) {
                        fileConfig.tasks = [];
                    }
                    if (index === undefined) {
                        fileConfig.tasks.push(toCustomize);
                    }
                    else {
                        fileConfig.tasks[index] = toCustomize;
                    }
                    promise = this.writeConfiguration(workspaceFolder, 'tasks.tasks', fileConfig.tasks);
                }
            }
            if (!promise) {
                return Promise.resolve(undefined);
            }
            return promise.then(() => {
                let event = {
                    properties: properties ? Object.getOwnPropertyNames(properties) : []
                };
                /* __GDPR__
                    "taskService.customize" : {
                        "properties" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog(TaskService.CustomizationTelemetryEventName, event);
                if (openConfig) {
                    let resource = workspaceFolder.toResource('.vscode/tasks.json');
                    this.editorService.openEditor({
                        resource,
                        options: {
                            pinned: false,
                            forceReload: true // because content might have changed
                        }
                    });
                }
            });
        }
        writeConfiguration(workspaceFolder, key, value) {
            if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                return this.configurationService.updateValue(key, value, { resource: workspaceFolder.uri }, 2 /* WORKSPACE */);
            }
            else if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                return this.configurationService.updateValue(key, value, { resource: workspaceFolder.uri }, 3 /* WORKSPACE_FOLDER */);
            }
            else {
                return undefined;
            }
        }
        openConfig(task) {
            let resource;
            if (task) {
                resource = task.getWorkspaceFolder().toResource(task._source.config.file);
            }
            else {
                resource = (this._workspaceFolders && (this._workspaceFolders.length > 0)) ? this._workspaceFolders[0].toResource('.vscode/tasks.json') : undefined;
            }
            return this.editorService.openEditor({
                resource,
                options: {
                    pinned: false
                }
            }).then(() => undefined);
        }
        createRunnableTask(tasks, group) {
            let resolverData = new Map();
            let workspaceTasks = [];
            let extensionTasks = [];
            tasks.forEach((tasks, folder) => {
                let data = resolverData.get(folder);
                if (!data) {
                    data = {
                        id: new Map(),
                        label: new Map(),
                        identifier: new Map()
                    };
                    resolverData.set(folder, data);
                }
                for (let task of tasks) {
                    data.id.set(task._id, task);
                    data.label.set(task._label, task);
                    if (task.configurationProperties.identifier) {
                        data.identifier.set(task.configurationProperties.identifier, task);
                    }
                    if (group && task.configurationProperties.group === group) {
                        if (task._source.kind === tasks_1.TaskSourceKind.Workspace) {
                            workspaceTasks.push(task);
                        }
                        else {
                            extensionTasks.push(task);
                        }
                    }
                }
            });
            let resolver = {
                resolve: (workspaceFolder, alias) => {
                    let data = resolverData.get(workspaceFolder.uri.toString());
                    if (!data) {
                        return undefined;
                    }
                    return data.id.get(alias) || data.label.get(alias) || data.identifier.get(alias);
                }
            };
            if (workspaceTasks.length > 0) {
                if (workspaceTasks.length > 1) {
                    this._outputChannel.append(nls.localize('moreThanOneBuildTask', 'There are many build tasks defined in the tasks.json. Executing the first one.\n'));
                }
                return { task: workspaceTasks[0], resolver };
            }
            if (extensionTasks.length === 0) {
                return undefined;
            }
            // We can only have extension tasks if we are in version 2.0.0. Then we can even run
            // multiple build tasks.
            if (extensionTasks.length === 1) {
                return { task: extensionTasks[0], resolver };
            }
            else {
                let id = UUID.generateUuid();
                let task = new tasks_1.InMemoryTask(id, { kind: tasks_1.TaskSourceKind.InMemory, label: 'inMemory' }, id, 'inMemory', { reevaluateOnRerun: true }, {
                    identifier: id,
                    dependsOn: extensionTasks.map((extensionTask) => { return { workspaceFolder: extensionTask.getWorkspaceFolder(), task: extensionTask._id }; }),
                    name: id,
                });
                return { task, resolver };
            }
        }
        createResolver(grouped) {
            let resolverData = new Map();
            grouped.forEach((tasks, folder) => {
                let data = resolverData.get(folder);
                if (!data) {
                    data = { label: new Map(), identifier: new Map(), taskIdentifier: new Map() };
                    resolverData.set(folder, data);
                }
                for (let task of tasks) {
                    data.label.set(task._label, task);
                    if (task.configurationProperties.identifier) {
                        data.identifier.set(task.configurationProperties.identifier, task);
                    }
                    let keyedIdentifier = task.getDefinition(true);
                    if (keyedIdentifier !== undefined) {
                        data.taskIdentifier.set(keyedIdentifier._key, task);
                    }
                }
            });
            return {
                resolve: (workspaceFolder, identifier) => {
                    let data = resolverData.get(workspaceFolder.uri.toString());
                    if (!data || !identifier) {
                        return undefined;
                    }
                    if (Types.isString(identifier)) {
                        return data.label.get(identifier) || data.identifier.get(identifier);
                    }
                    else {
                        let key = tasks_2.TaskDefinition.createTaskIdentifier(identifier, console);
                        return key !== undefined ? data.taskIdentifier.get(key._key) : undefined;
                    }
                }
            };
        }
        executeTask(task, resolver) {
            return problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
                return this.textFileService.saveAll().then((value) => {
                    let executeResult = this.getTaskSystem().run(task, resolver);
                    return this.handleExecuteResult(executeResult);
                });
            });
        }
        handleExecuteResult(executeResult) {
            if (executeResult.task.taskLoadMessages && executeResult.task.taskLoadMessages.length > 0) {
                executeResult.task.taskLoadMessages.forEach(loadMessage => {
                    this._outputChannel.append(loadMessage + '\n');
                });
                this.showOutput();
            }
            let key = executeResult.task.getRecentlyUsedKey();
            if (key) {
                this.getRecentlyUsedTasks().set(key, key, 1 /* AsOld */);
            }
            if (executeResult.kind === 2 /* Active */) {
                let active = executeResult.active;
                if (active && active.same) {
                    let message;
                    if (active.background) {
                        message = nls.localize('TaskSystem.activeSame.background', 'The task \'{0}\' is already active and in background mode.', executeResult.task.getQualifiedLabel());
                    }
                    else {
                        message = nls.localize('TaskSystem.activeSame.noBackground', 'The task \'{0}\' is already active.', executeResult.task.getQualifiedLabel());
                    }
                    this.notificationService.prompt(severity_1.default.Info, message, [{
                            label: nls.localize('terminateTask', "Terminate Task"),
                            run: () => this.terminate(executeResult.task)
                        },
                        {
                            label: nls.localize('restartTask', "Restart Task"),
                            run: () => this.restart(executeResult.task)
                        }], { sticky: true });
                }
                else {
                    throw new taskSystem_1.TaskError(severity_1.default.Warning, nls.localize('TaskSystem.active', 'There is already a task running. Terminate it first before executing another task.'), 1 /* RunningTask */);
                }
            }
            return executeResult.promise;
        }
        restart(task) {
            if (!this._taskSystem) {
                return;
            }
            this._taskSystem.terminate(task).then((response) => {
                if (response.success) {
                    this.run(task).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                }
                else {
                    this.notificationService.warn(nls.localize('TaskSystem.restartFailed', 'Failed to terminate and restart task {0}', Types.isString(task) ? task : task.configurationProperties.name));
                }
                return response;
            });
        }
        terminate(task) {
            if (!this._taskSystem) {
                return Promise.resolve({ success: true, task: undefined });
            }
            return this._taskSystem.terminate(task);
        }
        terminateAll() {
            if (!this._taskSystem) {
                return Promise.resolve([]);
            }
            return this._taskSystem.terminateAll();
        }
        getTaskSystem() {
            if (this._taskSystem) {
                return this._taskSystem;
            }
            if (this.executionEngine === tasks_1.ExecutionEngine.Terminal) {
                this._taskSystem = new terminalTaskSystem_1.TerminalTaskSystem(this.terminalService, this.outputService, this.markerService, this.modelService, this.configurationResolverService, this.telemetryService, this.contextService, this._windowService, TaskService.OutputChannelId, (workspaceFolder) => {
                    if (!workspaceFolder) {
                        return undefined;
                    }
                    return this._taskSystemInfos.get(workspaceFolder.uri.scheme);
                });
            }
            else {
                let system = new processTaskSystem_1.ProcessTaskSystem(this.markerService, this.modelService, this.telemetryService, this.outputService, this.configurationResolverService, TaskService.OutputChannelId);
                system.hasErrors(this._configHasErrors);
                this._taskSystem = system;
            }
            this._taskSystemListener = this._taskSystem.onDidStateChange((event) => {
                if (this._taskSystem) {
                    this._taskRunningState.set(this._taskSystem.isActiveSync());
                }
                this._onDidStateChange.fire(event);
            });
            return this._taskSystem;
        }
        getGroupedTasks() {
            return Promise.all([this.extensionService.activateByEvent('onCommand:workbench.action.tasks.runTask'), taskDefinitionRegistry_1.TaskDefinitionRegistry.onReady()]).then(() => {
                let validTypes = Object.create(null);
                taskDefinitionRegistry_1.TaskDefinitionRegistry.all().forEach(definition => validTypes[definition.taskType] = true);
                return new Promise(resolve => {
                    let result = [];
                    let counter = 0;
                    let done = (value) => {
                        if (value) {
                            result.push(value);
                        }
                        if (--counter === 0) {
                            resolve(result);
                        }
                    };
                    let error = (error) => {
                        try {
                            if (error && Types.isString(error.message)) {
                                this._outputChannel.append('Error: ');
                                this._outputChannel.append(error.message);
                                this._outputChannel.append('\n');
                                this.showOutput();
                            }
                            else {
                                this._outputChannel.append('Unknown error received while collecting tasks from providers.\n');
                                this.showOutput();
                            }
                        }
                        finally {
                            if (--counter === 0) {
                                resolve(result);
                            }
                        }
                    };
                    if (this.schemaVersion === 2 /* V2_0_0 */ && this._providers.size > 0) {
                        this._providers.forEach((provider) => {
                            counter++;
                            provider.provideTasks(validTypes).then(done, error);
                        });
                    }
                    else {
                        resolve(result);
                    }
                });
            }).then((contributedTaskSets) => {
                let result = new TaskMap();
                let contributedTasks = new TaskMap();
                for (let set of contributedTaskSets) {
                    for (let task of set.tasks) {
                        let workspaceFolder = task.getWorkspaceFolder();
                        if (workspaceFolder) {
                            contributedTasks.add(workspaceFolder, task);
                        }
                    }
                }
                return this.getWorkspaceTasks().then((customTasks) => {
                    customTasks.forEach((folderTasks, key) => {
                        let contributed = contributedTasks.get(key);
                        if (!folderTasks.set) {
                            if (contributed) {
                                result.add(key, ...contributed);
                            }
                            return;
                        }
                        if (!contributed) {
                            result.add(key, ...folderTasks.set.tasks);
                        }
                        else {
                            let configurations = folderTasks.configurations;
                            let legacyTaskConfigurations = folderTasks.set ? this.getLegacyTaskConfigurations(folderTasks.set) : undefined;
                            let customTasksToDelete = [];
                            if (configurations || legacyTaskConfigurations) {
                                let unUsedConfigurations = new Set();
                                if (configurations) {
                                    Object.keys(configurations.byIdentifier).forEach(key => unUsedConfigurations.add(key));
                                }
                                for (let task of contributed) {
                                    if (!tasks_1.ContributedTask.is(task)) {
                                        continue;
                                    }
                                    if (configurations) {
                                        let configuringTask = configurations.byIdentifier[task.defines._key];
                                        if (configuringTask) {
                                            unUsedConfigurations.delete(task.defines._key);
                                            result.add(key, TaskConfig.createCustomTask(task, configuringTask));
                                        }
                                        else {
                                            result.add(key, task);
                                        }
                                    }
                                    else if (legacyTaskConfigurations) {
                                        let configuringTask = legacyTaskConfigurations[task.defines._key];
                                        if (configuringTask) {
                                            result.add(key, TaskConfig.createCustomTask(task, configuringTask));
                                            customTasksToDelete.push(configuringTask);
                                        }
                                        else {
                                            result.add(key, task);
                                        }
                                    }
                                    else {
                                        result.add(key, task);
                                    }
                                }
                                if (customTasksToDelete.length > 0) {
                                    let toDelete = customTasksToDelete.reduce((map, task) => {
                                        map[task._id] = true;
                                        return map;
                                    }, Object.create(null));
                                    for (let task of folderTasks.set.tasks) {
                                        if (toDelete[task._id]) {
                                            continue;
                                        }
                                        result.add(key, task);
                                    }
                                }
                                else {
                                    result.add(key, ...folderTasks.set.tasks);
                                }
                                unUsedConfigurations.forEach((value) => {
                                    let configuringTask = configurations.byIdentifier[value];
                                    this._outputChannel.append(nls.localize('TaskService.noConfiguration', 'Error: The {0} task detection didn\'t contribute a task for the following configuration:\n{1}\nThe task will be ignored.\n', configuringTask.configures.type, JSON.stringify(configuringTask._source.config.element, undefined, 4)));
                                    this.showOutput();
                                });
                            }
                            else {
                                result.add(key, ...folderTasks.set.tasks);
                                result.add(key, ...contributed);
                            }
                        }
                    });
                    return result;
                }, () => {
                    // If we can't read the tasks.json file provide at least the contributed tasks
                    let result = new TaskMap();
                    for (let set of contributedTaskSets) {
                        for (let task of set.tasks) {
                            const folder = task.getWorkspaceFolder();
                            if (folder) {
                                result.add(folder, task);
                            }
                        }
                    }
                    return result;
                });
            });
        }
        getLegacyTaskConfigurations(workspaceTasks) {
            let result;
            function getResult() {
                if (result) {
                    return result;
                }
                result = Object.create(null);
                return result;
            }
            for (let task of workspaceTasks.tasks) {
                if (tasks_1.CustomTask.is(task)) {
                    let commandName = task.command && task.command.name;
                    // This is for backwards compatibility with the 0.1.0 task annotation code
                    // if we had a gulp, jake or grunt command a task specification was a annotation
                    if (commandName === 'gulp' || commandName === 'grunt' || commandName === 'jake') {
                        let identifier = tasks_2.KeyedTaskIdentifier.create({
                            type: commandName,
                            task: task.configurationProperties.name
                        });
                        getResult()[identifier._key] = task;
                    }
                }
            }
            return result;
        }
        getWorkspaceTasks(runSource = 0 /* User */) {
            if (this._workspaceTasksPromise) {
                return this._workspaceTasksPromise;
            }
            this.updateWorkspaceTasks(runSource);
            if (runSource === 0 /* User */) {
                this._workspaceTasksPromise.then(workspaceFolderTasks => {
                    runAutomaticTasks_1.RunAutomaticTasks.promptForPermission(this, this.storageService, this.notificationService, workspaceFolderTasks);
                });
            }
            return this._workspaceTasksPromise;
        }
        updateWorkspaceTasks(runSource = 0 /* User */) {
            this._workspaceTasksPromise = this.computeWorkspaceTasks(runSource).then(value => {
                if (this.executionEngine === tasks_1.ExecutionEngine.Process && this._taskSystem instanceof processTaskSystem_1.ProcessTaskSystem) {
                    // We can only have a process engine if we have one folder.
                    value.forEach((value) => {
                        this._configHasErrors = value.hasErrors;
                        this._taskSystem.hasErrors(this._configHasErrors);
                    });
                }
                return value;
            });
        }
        computeWorkspaceTasks(runSource = 0 /* User */) {
            if (this.workspaceFolders.length === 0) {
                return Promise.resolve(new Map());
            }
            else {
                let promises = [];
                for (let folder of this.workspaceFolders) {
                    promises.push(this.computeWorkspaceFolderTasks(folder, runSource).then((value) => value, () => undefined));
                }
                return Promise.all(promises).then((values) => {
                    let result = new Map();
                    for (let value of values) {
                        if (value) {
                            result.set(value.workspaceFolder.uri.toString(), value);
                        }
                    }
                    return result;
                });
            }
        }
        computeWorkspaceFolderTasks(workspaceFolder, runSource = 0 /* User */) {
            return (this.executionEngine === tasks_1.ExecutionEngine.Process
                ? this.computeLegacyConfiguration(workspaceFolder)
                : this.computeConfiguration(workspaceFolder)).
                then((workspaceFolderConfiguration) => {
                if (!workspaceFolderConfiguration || !workspaceFolderConfiguration.config || workspaceFolderConfiguration.hasErrors) {
                    return Promise.resolve({ workspaceFolder, set: undefined, configurations: undefined, hasErrors: workspaceFolderConfiguration ? workspaceFolderConfiguration.hasErrors : false });
                }
                return problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
                    let taskSystemInfo = this._taskSystemInfos.get(workspaceFolder.uri.scheme);
                    let problemReporter = new ProblemReporter(this._outputChannel);
                    let parseResult = TaskConfig.parse(workspaceFolder, taskSystemInfo ? taskSystemInfo.platform : Platform.platform, workspaceFolderConfiguration.config, problemReporter);
                    let hasErrors = false;
                    if (!parseResult.validationStatus.isOK()) {
                        hasErrors = true;
                        this.showOutput(runSource);
                    }
                    if (problemReporter.status.isFatal()) {
                        problemReporter.fatal(nls.localize('TaskSystem.configurationErrors', 'Error: the provided task configuration has validation errors and can\'t not be used. Please correct the errors first.'));
                        return { workspaceFolder, set: undefined, configurations: undefined, hasErrors };
                    }
                    let customizedTasks;
                    if (parseResult.configured && parseResult.configured.length > 0) {
                        customizedTasks = {
                            byIdentifier: Object.create(null)
                        };
                        for (let task of parseResult.configured) {
                            customizedTasks.byIdentifier[task.configures._key] = task;
                        }
                    }
                    return { workspaceFolder, set: { tasks: parseResult.custom }, configurations: customizedTasks, hasErrors };
                });
            });
        }
        computeConfiguration(workspaceFolder) {
            let { config, hasParseErrors } = this.getConfiguration(workspaceFolder);
            return Promise.resolve({ workspaceFolder, config, hasErrors: hasParseErrors });
        }
        computeLegacyConfiguration(workspaceFolder) {
            let { config, hasParseErrors } = this.getConfiguration(workspaceFolder);
            if (hasParseErrors) {
                return Promise.resolve({ workspaceFolder: workspaceFolder, hasErrors: true, config: undefined });
            }
            if (config) {
                if (this.hasDetectorSupport(config)) {
                    return new processRunnerDetector_1.ProcessRunnerDetector(workspaceFolder, this.fileService, this.contextService, this.configurationResolverService, config).detect(true).then((value) => {
                        let hasErrors = this.printStderr(value.stderr);
                        let detectedConfig = value.config;
                        if (!detectedConfig) {
                            return { workspaceFolder, config, hasErrors };
                        }
                        let result = Objects.deepClone(config);
                        let configuredTasks = Object.create(null);
                        const resultTasks = result.tasks;
                        if (!resultTasks) {
                            if (detectedConfig.tasks) {
                                result.tasks = detectedConfig.tasks;
                            }
                        }
                        else {
                            resultTasks.forEach(task => {
                                if (task.taskName) {
                                    configuredTasks[task.taskName] = task;
                                }
                            });
                            if (detectedConfig.tasks) {
                                detectedConfig.tasks.forEach((task) => {
                                    if (task.taskName && !configuredTasks[task.taskName]) {
                                        resultTasks.push(task);
                                    }
                                });
                            }
                        }
                        return { workspaceFolder, config: result, hasErrors };
                    });
                }
                else {
                    return Promise.resolve({ workspaceFolder, config, hasErrors: false });
                }
            }
            else {
                return new processRunnerDetector_1.ProcessRunnerDetector(workspaceFolder, this.fileService, this.contextService, this.configurationResolverService).detect(true).then((value) => {
                    let hasErrors = this.printStderr(value.stderr);
                    return { workspaceFolder, config: value.config, hasErrors };
                });
            }
        }
        computeWorkspaceFolderSetup() {
            let workspaceFolders = [];
            let ignoredWorkspaceFolders = [];
            let executionEngine = tasks_1.ExecutionEngine.Terminal;
            let schemaVersion = 2 /* V2_0_0 */;
            if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                let workspaceFolder = this.contextService.getWorkspace().folders[0];
                workspaceFolders.push(workspaceFolder);
                executionEngine = this.computeExecutionEngine(workspaceFolder);
                schemaVersion = this.computeJsonSchemaVersion(workspaceFolder);
            }
            else if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                for (let workspaceFolder of this.contextService.getWorkspace().folders) {
                    if (schemaVersion === this.computeJsonSchemaVersion(workspaceFolder)) {
                        workspaceFolders.push(workspaceFolder);
                    }
                    else {
                        ignoredWorkspaceFolders.push(workspaceFolder);
                        this._outputChannel.append(nls.localize('taskService.ignoreingFolder', 'Ignoring task configurations for workspace folder {0}. Multi folder workspace task support requires that all folders use task version 2.0.0\n', workspaceFolder.uri.fsPath));
                    }
                }
            }
            return [workspaceFolders, ignoredWorkspaceFolders, executionEngine, schemaVersion];
        }
        computeExecutionEngine(workspaceFolder) {
            let { config } = this.getConfiguration(workspaceFolder);
            if (!config) {
                return tasks_1.ExecutionEngine._default;
            }
            return TaskConfig.ExecutionEngine.from(config);
        }
        computeJsonSchemaVersion(workspaceFolder) {
            let { config } = this.getConfiguration(workspaceFolder);
            if (!config) {
                return 2 /* V2_0_0 */;
            }
            return TaskConfig.JsonSchemaVersion.from(config);
        }
        getConfiguration(workspaceFolder) {
            let result = this.contextService.getWorkbenchState() !== 1 /* EMPTY */
                ? Objects.deepClone(this.configurationService.getValue('tasks', { resource: workspaceFolder.uri }))
                : undefined;
            if (!result) {
                return { config: undefined, hasParseErrors: false };
            }
            let parseErrors = result.$parseErrors;
            if (parseErrors) {
                let isAffected = false;
                for (const parseError of parseErrors) {
                    if (/tasks\.json$/.test(parseError)) {
                        isAffected = true;
                        break;
                    }
                }
                if (isAffected) {
                    this._outputChannel.append(nls.localize('TaskSystem.invalidTaskJson', 'Error: The content of the tasks.json file has syntax errors. Please correct them before executing a task.\n'));
                    this.showOutput();
                    return { config: undefined, hasParseErrors: true };
                }
            }
            return { config: result, hasParseErrors: false };
        }
        printStderr(stderr) {
            let result = false;
            if (stderr && stderr.length > 0) {
                stderr.forEach((line) => {
                    result = true;
                    this._outputChannel.append(line + '\n');
                });
                this.showOutput();
            }
            return result;
        }
        inTerminal() {
            if (this._taskSystem) {
                return this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem;
            }
            return this.executionEngine === tasks_1.ExecutionEngine.Terminal;
        }
        hasDetectorSupport(config) {
            if (!config.command || this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                return false;
            }
            return processRunnerDetector_1.ProcessRunnerDetector.supports(TaskConfig.CommandString.value(config.command));
        }
        configureAction() {
            let run = () => { this.runConfigureTasks(); return Promise.resolve(undefined); };
            return new class extends actions_1.Action {
                constructor() {
                    super(ConfigureTaskAction.ID, ConfigureTaskAction.TEXT, undefined, true, run);
                }
            };
        }
        beforeShutdown() {
            if (!this._taskSystem) {
                return false;
            }
            if (!this._taskSystem.isActiveSync()) {
                return false;
            }
            // The terminal service kills all terminal on shutdown. So there
            // is nothing we can do to prevent this here.
            if (this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem) {
                return false;
            }
            let terminatePromise;
            if (this._taskSystem.canAutoTerminate()) {
                terminatePromise = Promise.resolve({ confirmed: true });
            }
            else {
                terminatePromise = this.dialogService.confirm({
                    message: nls.localize('TaskSystem.runningTask', 'There is a task running. Do you want to terminate it?'),
                    primaryButton: nls.localize({ key: 'TaskSystem.terminateTask', comment: ['&& denotes a mnemonic'] }, "&&Terminate Task"),
                    type: 'question'
                });
            }
            return terminatePromise.then(res => {
                if (res.confirmed) {
                    return this._taskSystem.terminateAll().then((responses) => {
                        let success = true;
                        let code = undefined;
                        for (let response of responses) {
                            success = success && response.success;
                            // We only have a code in the old output runner which only has one task
                            // So we can use the first code.
                            if (code === undefined && response.code !== undefined) {
                                code = response.code;
                            }
                        }
                        if (success) {
                            this._taskSystem = undefined;
                            this.disposeTaskSystemListeners();
                            return false; // no veto
                        }
                        else if (code && code === 3 /* ProcessNotFound */) {
                            return this.dialogService.confirm({
                                message: nls.localize('TaskSystem.noProcess', 'The launched task doesn\'t exist anymore. If the task spawned background processes exiting VS Code might result in orphaned processes. To avoid this start the last background process with a wait flag.'),
                                primaryButton: nls.localize({ key: 'TaskSystem.exitAnyways', comment: ['&& denotes a mnemonic'] }, "&&Exit Anyways"),
                                type: 'info'
                            }).then(res => !res.confirmed);
                        }
                        return true; // veto
                    }, (err) => {
                        return true; // veto
                    });
                }
                return true; // veto
            });
        }
        handleError(err) {
            let showOutput = true;
            if (err instanceof taskSystem_1.TaskError) {
                let buildError = err;
                let needsConfig = buildError.code === 0 /* NotConfigured */ || buildError.code === 2 /* NoBuildTask */ || buildError.code === 3 /* NoTestTask */;
                let needsTerminate = buildError.code === 1 /* RunningTask */;
                if (needsConfig || needsTerminate) {
                    this.notificationService.prompt(buildError.severity, buildError.message, [{
                            label: needsConfig ? ConfigureTaskAction.TEXT : nls.localize('TerminateAction.label', "Terminate Task"),
                            run: () => {
                                if (needsConfig) {
                                    this.runConfigureTasks();
                                }
                                else {
                                    this.runTerminateCommand();
                                }
                            }
                        }]);
                }
                else {
                    this.notificationService.notify({ severity: buildError.severity, message: buildError.message });
                }
            }
            else if (err instanceof Error) {
                let error = err;
                this.notificationService.error(error.message);
                showOutput = false;
            }
            else if (Types.isString(err)) {
                this.notificationService.error(err);
            }
            else {
                this.notificationService.error(nls.localize('TaskSystem.unknownError', 'An error has occurred while running a task. See task log for details.'));
            }
            if (showOutput) {
                this.showOutput();
            }
        }
        canRunCommand() {
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                this.notificationService.info(nls.localize('TaskService.noWorkspace', 'Tasks are only available on a workspace folder.'));
                return false;
            }
            return true;
        }
        createTaskQuickPickEntries(tasks, group = false, sort = false, selectedEntry) {
            if (tasks === undefined || tasks === null || tasks.length === 0) {
                return [];
            }
            const TaskQuickPickEntry = (task) => {
                let description;
                if (this.needsFolderQualification()) {
                    let workspaceFolder = task.getWorkspaceFolder();
                    if (workspaceFolder) {
                        description = workspaceFolder.name;
                    }
                }
                return { label: task._label, description, task };
            };
            function fillEntries(entries, tasks, groupLabel) {
                if (tasks.length) {
                    entries.push({ type: 'separator', label: groupLabel });
                }
                for (let task of tasks) {
                    let entry = TaskQuickPickEntry(task);
                    entry.buttons = [{ iconClass: 'quick-open-task-configure', tooltip: nls.localize('configureTask', "Configure Task") }];
                    if (selectedEntry && (task === selectedEntry.task)) {
                        entries.unshift(selectedEntry);
                    }
                    else {
                        entries.push(entry);
                    }
                }
            }
            let entries;
            if (group) {
                entries = [];
                if (tasks.length === 1) {
                    entries.push(TaskQuickPickEntry(tasks[0]));
                }
                else {
                    let recentlyUsedTasks = this.getRecentlyUsedTasks();
                    let recent = [];
                    let configured = [];
                    let detected = [];
                    let taskMap = Object.create(null);
                    tasks.forEach(task => {
                        let key = task.getRecentlyUsedKey();
                        if (key) {
                            taskMap[key] = task;
                        }
                    });
                    recentlyUsedTasks.keys().forEach(key => {
                        let task = taskMap[key];
                        if (task) {
                            recent.push(task);
                        }
                    });
                    for (let task of tasks) {
                        let key = task.getRecentlyUsedKey();
                        if (!key || !recentlyUsedTasks.has(key)) {
                            if (task._source.kind === tasks_1.TaskSourceKind.Workspace) {
                                configured.push(task);
                            }
                            else {
                                detected.push(task);
                            }
                        }
                    }
                    const sorter = this.createSorter();
                    fillEntries(entries, recent, nls.localize('recentlyUsed', 'recently used tasks'));
                    configured = configured.sort((a, b) => sorter.compare(a, b));
                    fillEntries(entries, configured, nls.localize('configured', 'configured tasks'));
                    detected = detected.sort((a, b) => sorter.compare(a, b));
                    fillEntries(entries, detected, nls.localize('detected', 'detected tasks'));
                }
            }
            else {
                if (sort) {
                    const sorter = this.createSorter();
                    tasks = tasks.sort((a, b) => sorter.compare(a, b));
                }
                entries = tasks.map(task => TaskQuickPickEntry(task));
            }
            return entries;
        }
        showQuickPick(tasks, placeHolder, defaultEntry, group = false, sort = false, selectedEntry) {
            let _createEntries = () => {
                if (Array.isArray(tasks)) {
                    return Promise.resolve(this.createTaskQuickPickEntries(tasks, group, sort, selectedEntry));
                }
                else {
                    return tasks.then((tasks) => this.createTaskQuickPickEntries(tasks, group, sort, selectedEntry));
                }
            };
            return this.quickInputService.pick(_createEntries().then((entries) => {
                if ((entries.length === 0) && defaultEntry) {
                    entries.push(defaultEntry);
                }
                return entries;
            }), {
                placeHolder,
                matchOnDescription: true,
                onDidTriggerItemButton: context => {
                    let task = context.item.task;
                    this.quickInputService.cancel();
                    if (tasks_1.ContributedTask.is(task)) {
                        this.customize(task, undefined, true);
                    }
                    else if (tasks_1.CustomTask.is(task)) {
                        this.openConfig(task);
                    }
                }
            }).then(entry => entry ? entry.task : undefined);
        }
        showIgnoredFoldersMessage() {
            if (this.ignoredWorkspaceFolders.length === 0 || !this.showIgnoreMessage) {
                return Promise.resolve(undefined);
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('TaskService.ignoredFolder', 'The following workspace folders are ignored since they use task version 0.1.0: {0}', this.ignoredWorkspaceFolders.map(f => f.name).join(', ')), [{
                    label: nls.localize('TaskService.notAgain', 'Don\'t Show Again'),
                    isSecondary: true,
                    run: () => {
                        this.storageService.store(TaskService.IgnoreTask010DonotShowAgain_key, true, 1 /* WORKSPACE */);
                        this._showIgnoreMessage = false;
                    }
                }]);
            return Promise.resolve(undefined);
        }
        runTaskCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            let identifier = this.getTaskIdentifier(arg);
            if (identifier !== undefined) {
                this.getGroupedTasks().then((grouped) => {
                    let resolver = this.createResolver(grouped);
                    let folders = this.contextService.getWorkspace().folders;
                    for (let folder of folders) {
                        let task = resolver.resolve(folder, identifier);
                        if (task) {
                            this.run(task).then(undefined, reason => {
                                // eat the error, it has already been surfaced to the user and we don't care about it here
                            });
                            return;
                        }
                    }
                    this.doRunTaskCommand(grouped.all());
                }, () => {
                    this.doRunTaskCommand();
                });
            }
            else {
                this.doRunTaskCommand();
            }
        }
        doRunTaskCommand(tasks) {
            this.showIgnoredFoldersMessage().then(() => {
                this.showQuickPick(tasks ? tasks : this.tasks(), nls.localize('TaskService.pickRunTask', 'Select the task to run'), {
                    label: nls.localize('TaslService.noEntryToRun', 'No task to run found. Configure Tasks...'),
                    task: null
                }, true).
                    then((task) => {
                    if (task === undefined) {
                        return;
                    }
                    if (task === null) {
                        this.runConfigureTasks();
                    }
                    else {
                        this.run(task, { attachProblemMatcher: true }).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                    }
                });
            });
        }
        reRunTaskCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
                return this.textFileService.saveAll().then((value) => {
                    let executeResult = this.getTaskSystem().rerun();
                    if (executeResult) {
                        return this.handleExecuteResult(executeResult);
                    }
                    else {
                        this.doRunTaskCommand();
                        return Promise.resolve(undefined);
                    }
                });
            });
        }
        splitPerGroupType(tasks) {
            let none = [];
            let defaults = [];
            let users = [];
            for (let task of tasks) {
                if (task.configurationProperties.groupType === "default" /* default */) {
                    defaults.push(task);
                }
                else if (task.configurationProperties.groupType === "user" /* user */) {
                    users.push(task);
                }
                else {
                    none.push(task);
                }
            }
            return { none, defaults, users };
        }
        runBuildCommand() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 1 /* V0_1_0 */) {
                this.build();
                return;
            }
            let options = {
                location: 10 /* Window */,
                title: nls.localize('TaskService.fetchingBuildTasks', 'Fetching build tasks...')
            };
            let promise = this.getTasksForGroup(tasks_1.TaskGroup.Build).then((tasks) => {
                if (tasks.length > 0) {
                    let { defaults, users } = this.splitPerGroupType(tasks);
                    if (defaults.length === 1) {
                        this.run(defaults[0]).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                        return;
                    }
                    else if (defaults.length + users.length > 0) {
                        tasks = defaults.concat(users);
                    }
                }
                this.showIgnoredFoldersMessage().then(() => {
                    this.showQuickPick(tasks, nls.localize('TaskService.pickBuildTask', 'Select the build task to run'), {
                        label: nls.localize('TaskService.noBuildTask', 'No build task to run found. Configure Build Task...'),
                        task: null
                    }, true).then((task) => {
                        if (task === undefined) {
                            return;
                        }
                        if (task === null) {
                            this.runConfigureDefaultBuildTask();
                            return;
                        }
                        this.run(task, { attachProblemMatcher: true }).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                    });
                });
            });
            this.progressService.withProgress(options, () => promise);
        }
        runTestCommand() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 1 /* V0_1_0 */) {
                this.runTest();
                return;
            }
            let options = {
                location: 10 /* Window */,
                title: nls.localize('TaskService.fetchingTestTasks', 'Fetching test tasks...')
            };
            let promise = this.getTasksForGroup(tasks_1.TaskGroup.Test).then((tasks) => {
                if (tasks.length > 0) {
                    let { defaults, users } = this.splitPerGroupType(tasks);
                    if (defaults.length === 1) {
                        this.run(defaults[0]).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                        return;
                    }
                    else if (defaults.length + users.length > 0) {
                        tasks = defaults.concat(users);
                    }
                }
                this.showIgnoredFoldersMessage().then(() => {
                    this.showQuickPick(tasks, nls.localize('TaskService.pickTestTask', 'Select the test task to run'), {
                        label: nls.localize('TaskService.noTestTaskTerminal', 'No test task to run found. Configure Tasks...'),
                        task: null
                    }, true).then((task) => {
                        if (task === undefined) {
                            return;
                        }
                        if (task === null) {
                            this.runConfigureTasks();
                            return;
                        }
                        this.run(task).then(undefined, reason => {
                            // eat the error, it has already been surfaced to the user and we don't care about it here
                        });
                    });
                });
            });
            this.progressService.withProgress(options, () => promise);
        }
        runTerminateCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            let runQuickPick = (promise) => {
                this.showQuickPick(promise || this.getActiveTasks(), nls.localize('TaskService.tastToTerminate', 'Select task to terminate'), {
                    label: nls.localize('TaskService.noTaskRunning', 'No task is currently running'),
                    task: null
                }, false, true).then(task => {
                    if (task === undefined || task === null) {
                        return;
                    }
                    this.terminate(task);
                });
            };
            if (this.inTerminal()) {
                let identifier = this.getTaskIdentifier(arg);
                let promise;
                if (identifier !== undefined) {
                    promise = this.getActiveTasks();
                    promise.then((tasks) => {
                        for (let task of tasks) {
                            if (task.matches(identifier)) {
                                this.terminate(task);
                                return;
                            }
                        }
                        runQuickPick(promise);
                    });
                }
                else {
                    runQuickPick();
                }
            }
            else {
                this.isActive().then((active) => {
                    if (active) {
                        this.terminateAll().then((responses) => {
                            // the output runner has only one task
                            let response = responses[0];
                            if (response.success) {
                                return;
                            }
                            if (response.code && response.code === 3 /* ProcessNotFound */) {
                                this.notificationService.error(nls.localize('TerminateAction.noProcess', 'The launched process doesn\'t exist anymore. If the task spawned background tasks exiting VS Code might result in orphaned processes.'));
                            }
                            else {
                                this.notificationService.error(nls.localize('TerminateAction.failed', 'Failed to terminate running task'));
                            }
                        });
                    }
                });
            }
        }
        runRestartTaskCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            let runQuickPick = (promise) => {
                this.showQuickPick(promise || this.getActiveTasks(), nls.localize('TaskService.tastToRestart', 'Select the task to restart'), {
                    label: nls.localize('TaskService.noTaskToRestart', 'No task to restart'),
                    task: null
                }, false, true).then(task => {
                    if (task === undefined || task === null) {
                        return;
                    }
                    this.restart(task);
                });
            };
            if (this.inTerminal()) {
                let identifier = this.getTaskIdentifier(arg);
                let promise;
                if (identifier !== undefined) {
                    promise = this.getActiveTasks();
                    promise.then((tasks) => {
                        for (let task of tasks) {
                            if (task.matches(identifier)) {
                                this.restart(task);
                                return;
                            }
                        }
                        runQuickPick(promise);
                    });
                }
                else {
                    runQuickPick();
                }
            }
            else {
                this.getActiveTasks().then((activeTasks) => {
                    if (activeTasks.length === 0) {
                        return;
                    }
                    let task = activeTasks[0];
                    this.restart(task);
                });
            }
        }
        getTaskIdentifier(arg) {
            let result = undefined;
            if (Types.isString(arg)) {
                result = arg;
            }
            else if (arg && Types.isString(arg.type)) {
                result = tasks_2.TaskDefinition.createTaskIdentifier(arg, console);
            }
            return result;
        }
        runConfigureTasks() {
            if (!this.canRunCommand()) {
                return undefined;
            }
            let taskPromise;
            if (this.schemaVersion === 2 /* V2_0_0 */) {
                taskPromise = this.getGroupedTasks();
            }
            else {
                taskPromise = Promise.resolve(new TaskMap());
            }
            let openTaskFile = (workspaceFolder) => {
                let resource = workspaceFolder.toResource('.vscode/tasks.json');
                let configFileCreated = false;
                this.fileService.resolveFile(resource).then((stat) => stat, () => undefined).then((stat) => {
                    if (stat) {
                        return stat.resource;
                    }
                    return this.quickInputService.pick(taskTemplates_1.getTemplates(), { placeHolder: nls.localize('TaskService.template', 'Select a Task Template') }).then((selection) => {
                        if (!selection) {
                            return Promise.resolve(undefined);
                        }
                        let content = selection.content;
                        let editorConfig = this.configurationService.getValue();
                        if (editorConfig.editor.insertSpaces) {
                            content = content.replace(/(\n)(\t+)/g, (_, s1, s2) => s1 + strings.repeat(' ', s2.length * editorConfig.editor.tabSize));
                        }
                        configFileCreated = true;
                        /* __GDPR__
                            "taskService.template" : {
                                "templateId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                "autoDetect" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                            }
                        */
                        return this.fileService.createFile(resource, content).then((result) => {
                            this.telemetryService.publicLog(TaskService.TemplateTelemetryEventName, {
                                templateId: selection.id,
                                autoDetect: selection.autoDetect
                            });
                            return result.resource;
                        });
                    });
                }).then((resource) => {
                    if (!resource) {
                        return;
                    }
                    this.editorService.openEditor({
                        resource,
                        options: {
                            pinned: configFileCreated // pin only if config file is created #8727
                        }
                    });
                });
            };
            let configureTask = (task) => {
                if (tasks_1.ContributedTask.is(task)) {
                    this.customize(task, undefined, true);
                }
                else if (tasks_1.CustomTask.is(task)) {
                    this.openConfig(task);
                }
                else if (tasks_1.ConfiguringTask.is(task)) {
                    // Do nothing.
                }
            };
            function isTaskEntry(value) {
                let candidate = value;
                return candidate && !!candidate.task;
            }
            let stats = this.contextService.getWorkspace().folders.map((folder) => {
                return this.fileService.resolveFile(folder.toResource('.vscode/tasks.json')).then(stat => stat, () => undefined);
            });
            let createLabel = nls.localize('TaskService.createJsonFile', 'Create tasks.json file from template');
            let openLabel = nls.localize('TaskService.openJsonFile', 'Open tasks.json file');
            let entries = Promise.all(stats).then((stats) => {
                return taskPromise.then((taskMap) => {
                    let entries = [];
                    if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                        let tasks = taskMap.all();
                        let needsCreateOrOpen = true;
                        if (tasks.length > 0) {
                            tasks = tasks.sort((a, b) => a._label.localeCompare(b._label));
                            for (let task of tasks) {
                                entries.push({ label: task._label, task });
                                if (!tasks_1.ContributedTask.is(task)) {
                                    needsCreateOrOpen = false;
                                }
                            }
                        }
                        if (needsCreateOrOpen) {
                            let label = stats[0] !== undefined ? openLabel : createLabel;
                            if (entries.length) {
                                entries.push({ type: 'separator' });
                            }
                            entries.push({ label, folder: this.contextService.getWorkspace().folders[0] });
                        }
                    }
                    else {
                        let folders = this.contextService.getWorkspace().folders;
                        let index = 0;
                        for (let folder of folders) {
                            let tasks = taskMap.get(folder);
                            if (tasks.length > 0) {
                                tasks = tasks.slice().sort((a, b) => a._label.localeCompare(b._label));
                                for (let i = 0; i < tasks.length; i++) {
                                    let entry = { label: tasks[i]._label, task: tasks[i], description: folder.name };
                                    if (i === 0) {
                                        entries.push({ type: 'separator', label: folder.name });
                                    }
                                    entries.push(entry);
                                }
                            }
                            else {
                                let label = stats[index] !== undefined ? openLabel : createLabel;
                                let entry = { label, folder: folder };
                                entries.push({ type: 'separator', label: folder.name });
                                entries.push(entry);
                            }
                            index++;
                        }
                    }
                    return entries;
                });
            });
            this.quickInputService.pick(entries, { placeHolder: nls.localize('TaskService.pickTask', 'Select a task to configure') }).
                then((selection) => {
                if (!selection) {
                    return;
                }
                if (isTaskEntry(selection)) {
                    configureTask(selection.task);
                }
                else {
                    openTaskFile(selection.folder);
                }
            });
        }
        runConfigureDefaultBuildTask() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 2 /* V2_0_0 */) {
                this.tasks().then((tasks => {
                    if (tasks.length === 0) {
                        this.runConfigureTasks();
                        return;
                    }
                    let selectedTask;
                    let selectedEntry;
                    for (let task of tasks) {
                        if (task.configurationProperties.group === tasks_1.TaskGroup.Build && task.configurationProperties.groupType === "default" /* default */) {
                            selectedTask = task;
                            break;
                        }
                    }
                    if (selectedTask) {
                        selectedEntry = {
                            label: nls.localize('TaskService.defaultBuildTaskExists', '{0} is already marked as the default build task', selectedTask.getQualifiedLabel()),
                            task: selectedTask
                        };
                    }
                    this.showIgnoredFoldersMessage().then(() => {
                        this.showQuickPick(tasks, nls.localize('TaskService.pickDefaultBuildTask', 'Select the task to be used as the default build task'), undefined, true, false, selectedEntry).
                            then((task) => {
                            if ((task === undefined) || (task === null)) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'build', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'build' }, true);
                                    }
                                });
                            }
                        });
                    });
                }));
            }
            else {
                this.runConfigureTasks();
            }
        }
        runConfigureDefaultTestTask() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 2 /* V2_0_0 */) {
                this.tasks().then((tasks => {
                    if (tasks.length === 0) {
                        this.runConfigureTasks();
                        return;
                    }
                    let selectedTask;
                    let selectedEntry;
                    for (let task of tasks) {
                        if (task.configurationProperties.group === tasks_1.TaskGroup.Test && task.configurationProperties.groupType === "default" /* default */) {
                            selectedTask = task;
                            break;
                        }
                    }
                    if (selectedTask) {
                        selectedEntry = {
                            label: nls.localize('TaskService.defaultTestTaskExists', '{0} is already marked as the default test task.', selectedTask.getQualifiedLabel()),
                            task: selectedTask
                        };
                    }
                    this.showIgnoredFoldersMessage().then(() => {
                        this.showQuickPick(tasks, nls.localize('TaskService.pickDefaultTestTask', 'Select the task to be used as the default test task'), undefined, true, false, selectedEntry).then((task) => {
                            if (!task) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'test', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'test' }, true);
                                    }
                                });
                            }
                        });
                    });
                }));
            }
            else {
                this.runConfigureTasks();
            }
        }
        runShowTasks() {
            if (!this.canRunCommand()) {
                return;
            }
            this.showQuickPick(this.getActiveTasks(), nls.localize('TaskService.pickShowTask', 'Select the task to show its output'), {
                label: nls.localize('TaskService.noTaskIsRunning', 'No task is running'),
                task: null
            }, false, true).then((task) => {
                if (task === undefined || task === null) {
                    return;
                }
                this._taskSystem.revealTask(task);
            });
        }
    };
    // private static autoDetectTelemetryName: string = 'taskServer.autoDetect';
    TaskService.RecentlyUsedTasks_Key = 'workbench.tasks.recentlyUsedTasks';
    TaskService.IgnoreTask010DonotShowAgain_key = 'workbench.tasks.ignoreTask010Shown';
    TaskService.CustomizationTelemetryEventName = 'taskService.customize';
    TaskService.TemplateTelemetryEventName = 'taskService.template';
    TaskService.OutputChannelId = 'tasks';
    TaskService.OutputChannelLabel = nls.localize('tasks', "Tasks");
    TaskService.nextHandle = 0;
    TaskService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, markers_1.IMarkerService),
        __param(2, output_1.IOutputService),
        __param(3, editorService_1.IEditorService),
        __param(4, files_1.IFileService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, lifecycle_2.ILifecycleService),
        __param(9, modelService_1.IModelService),
        __param(10, extensions_2.IExtensionService),
        __param(11, quickInput_1.IQuickInputService),
        __param(12, configurationResolver_1.IConfigurationResolverService),
        __param(13, terminal_1.ITerminalService),
        __param(14, storage_1.IStorageService),
        __param(15, progress_1.IProgressService2),
        __param(16, opener_1.IOpenerService),
        __param(17, windows_1.IWindowService),
        __param(18, dialogs_1.IDialogService),
        __param(19, notification_1.INotificationService),
        __param(20, contextkey_1.IContextKeyService)
    ], TaskService);
    actions_2.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '2_run',
        command: {
            id: 'workbench.action.tasks.runTask',
            title: nls.localize({ key: 'miRunTask', comment: ['&& denotes a mnemonic'] }, "&&Run Task...")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '2_run',
        command: {
            id: 'workbench.action.tasks.build',
            title: nls.localize({ key: 'miBuildTask', comment: ['&& denotes a mnemonic'] }, "Run &&Build Task...")
        },
        order: 2
    });
    // Manage Tasks
    actions_2.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '3_manage',
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.showTasks',
            title: nls.localize({ key: 'miRunningTask', comment: ['&& denotes a mnemonic'] }, "Show Runnin&&g Tasks...")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '3_manage',
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.restartTask',
            title: nls.localize({ key: 'miRestartTask', comment: ['&& denotes a mnemonic'] }, "R&&estart Running Task...")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '3_manage',
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.terminate',
            title: nls.localize({ key: 'miTerminateTask', comment: ['&& denotes a mnemonic'] }, "&&Terminate Task...")
        },
        order: 3
    });
    // Configure Tasks
    actions_2.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '4_configure',
        command: {
            id: 'workbench.action.tasks.configureTaskRunner',
            title: nls.localize({ key: 'miConfigureTask', comment: ['&& denotes a mnemonic'] }, "&&Configure Tasks...")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '4_configure',
        command: {
            id: 'workbench.action.tasks.configureDefaultBuildTask',
            title: nls.localize({ key: 'miConfigureBuildTask', comment: ['&& denotes a mnemonic'] }, "Configure De&&fault Build Task...")
        },
        order: 2
    });
    actions_2.MenuRegistry.addCommand({ id: ConfigureTaskAction.ID, title: { value: ConfigureTaskAction.TEXT, original: 'Configure Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.showLog', title: { value: nls.localize('ShowLogAction.label', "Show Task Log"), original: 'Show Task Log' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.runTask', title: { value: nls.localize('RunTaskAction.label', "Run Task"), original: 'Run Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.reRunTask', title: { value: nls.localize('ReRunTaskAction.label', "Rerun Last Task"), original: 'Rerun Last Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.restartTask', title: { value: nls.localize('RestartTaskAction.label', "Restart Running Task"), original: 'Restart Running Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.showTasks', title: { value: nls.localize('ShowTasksAction.label', "Show Running Tasks"), original: 'Show Running Tasks' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.terminate', title: { value: nls.localize('TerminateAction.label', "Terminate Task"), original: 'Terminate Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.build', title: { value: nls.localize('BuildAction.label', "Run Build Task"), original: 'Run Build Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.test', title: { value: nls.localize('TestAction.label', "Run Test Task"), original: 'Run Test Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.configureDefaultBuildTask', title: { value: nls.localize('ConfigureDefaultBuildTask.label', "Configure Default Build Task"), original: 'Configure Default Build Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_2.MenuRegistry.addCommand({ id: 'workbench.action.tasks.configureDefaultTestTask', title: { value: nls.localize('ConfigureDefaultTestTask.label', "Configure Default Test Task"), original: 'Configure Default Test Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    // MenuRegistry.addCommand( { id: 'workbench.action.tasks.rebuild', title: nls.localize('RebuildAction.label', 'Run Rebuild Task'), category: tasksCategory });
    // MenuRegistry.addCommand( { id: 'workbench.action.tasks.clean', title: nls.localize('CleanAction.label', 'Run Clean Task'), category: tasksCategory });
    // Tasks Output channel. Register it before using it in Task Service.
    let outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
    outputChannelRegistry.registerChannel({ id: TaskService.OutputChannelId, label: TaskService.OutputChannelLabel, log: false });
    // Task Service
    extensions_1.registerSingleton(taskService_1.ITaskService, TaskService, true);
    // Register Quick Open
    const quickOpenRegistry = (platform_1.Registry.as(quickopen_1.Extensions.Quickopen));
    const tasksPickerContextKey = 'inTasksPicker';
    quickOpenRegistry.registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(taskQuickOpen_1.QuickOpenHandler, taskQuickOpen_1.QuickOpenHandler.ID, 'task ', tasksPickerContextKey, nls.localize('quickOpen.task', "Run Task")));
    const actionBarRegistry = platform_1.Registry.as(actions_3.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(actions_3.Scope.VIEWER, quickOpen_1.QuickOpenActionContributor);
    // Status bar
    let statusbarRegistry = platform_1.Registry.as(statusbar_1.Extensions.Statusbar);
    statusbarRegistry.registerStatusbarItem(new statusbar_1.StatusbarItemDescriptor(BuildStatusBarItem, 0 /* LEFT */, 50 /* Medium Priority */));
    statusbarRegistry.registerStatusbarItem(new statusbar_1.StatusbarItemDescriptor(TaskStatusBarItem, 0 /* LEFT */, 50 /* Medium Priority */));
    // tasks.json validation
    let schemaId = 'vscode://schemas/tasks';
    let schema = {
        id: schemaId,
        description: 'Task definition file',
        type: 'object',
        default: {
            version: '2.0.0',
            tasks: [
                {
                    label: 'My Task',
                    command: 'echo hello',
                    type: 'shell',
                    args: [],
                    problemMatcher: ['$tsc'],
                    presentation: {
                        reveal: 'always'
                    },
                    group: 'build'
                }
            ]
        }
    };
    schema.definitions = Object.assign({}, jsonSchema_v1_1.default.definitions, jsonSchema_v2_1.default.definitions);
    schema.oneOf = [...(jsonSchema_v2_1.default.oneOf || []), ...(jsonSchema_v1_1.default.oneOf || [])];
    let jsonRegistry = platform_1.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(schemaId, schema);
    problemMatcher_1.ProblemMatcherRegistry.onMatcherChanged(() => {
        jsonSchema_v2_1.updateProblemMatchers();
        jsonRegistry.notifySchemaChanged(schemaId);
    });
});
//# sourceMappingURL=task.contribution.js.map