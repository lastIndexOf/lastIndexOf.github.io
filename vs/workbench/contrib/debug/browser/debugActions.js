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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/panel", "vs/platform/quickOpen/common/quickOpen", "vs/platform/notification/common/notification", "vs/workbench/browser/viewlet", "vs/base/common/arrays", "vs/workbench/services/history/common/history", "vs/base/common/decorators"], function (require, exports, nls, actions_1, lifecycle, keybinding_1, workspace_1, debug_1, debugModel_1, layoutService_1, panelService_1, editorService_1, panel_1, quickOpen_1, notification_1, viewlet_1, arrays_1, history_1, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let AbstractDebugAction = class AbstractDebugAction extends actions_1.Action {
        constructor(id, label, cssClass, debugService, keybindingService, weight) {
            super(id, label, cssClass, false);
            this.debugService = debugService;
            this.keybindingService = keybindingService;
            this.weight = weight;
            this.toDispose = [];
            this.toDispose.push(this.debugService.onDidChangeState(state => this.updateEnablement(state)));
            this.updateLabel(label);
            this.updateEnablement();
        }
        run(e) {
            throw new Error('implement me');
        }
        get tooltip() {
            const keybinding = this.keybindingService.lookupKeybinding(this.id);
            const keybindingLabel = keybinding && keybinding.getLabel();
            return keybindingLabel ? `${this.label} (${keybindingLabel})` : this.label;
        }
        updateLabel(newLabel) {
            this.label = newLabel;
        }
        updateEnablement(state = this.debugService.state) {
            this.enabled = this.isEnabled(state);
        }
        isEnabled(state) {
            return true;
        }
        dispose() {
            super.dispose();
            this.toDispose = lifecycle.dispose(this.toDispose);
        }
    };
    AbstractDebugAction = __decorate([
        __param(3, debug_1.IDebugService),
        __param(4, keybinding_1.IKeybindingService)
    ], AbstractDebugAction);
    exports.AbstractDebugAction = AbstractDebugAction;
    let ConfigureAction = class ConfigureAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, notificationService, contextService) {
            super(id, label, 'debug-action configure', debugService, keybindingService);
            this.notificationService = notificationService;
            this.contextService = contextService;
            this.toDispose.push(debugService.getConfigurationManager().onDidSelectConfiguration(() => this.updateClass()));
            this.updateClass();
        }
        get tooltip() {
            if (this.debugService.getConfigurationManager().selectedConfiguration.name) {
                return ConfigureAction.LABEL;
            }
            return nls.localize('launchJsonNeedsConfigurtion', "Configure or Fix 'launch.json'");
        }
        updateClass() {
            const configurationManager = this.debugService.getConfigurationManager();
            const configurationCount = configurationManager.getLaunches().map(l => l.getConfigurationNames().length).reduce((sum, current) => sum + current);
            this.class = configurationCount > 0 ? 'debug-action configure' : 'debug-action configure notification';
        }
        run(event) {
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                this.notificationService.info(nls.localize('noFolderDebugConfig', "Please first open a folder in order to do advanced debug configuration."));
                return Promise.resolve();
            }
            const sideBySide = !!(event && (event.ctrlKey || event.metaKey));
            const configurationManager = this.debugService.getConfigurationManager();
            if (!configurationManager.selectedConfiguration.launch) {
                configurationManager.selectConfiguration(configurationManager.getLaunches()[0]);
            }
            return configurationManager.selectedConfiguration.launch.openConfigFile(sideBySide, false);
        }
    };
    ConfigureAction.ID = 'workbench.action.debug.configure';
    ConfigureAction.LABEL = nls.localize('openLaunchJson', "Open {0}", 'launch.json');
    ConfigureAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, notification_1.INotificationService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], ConfigureAction);
    exports.ConfigureAction = ConfigureAction;
    let StartAction = class StartAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, contextService, historyService) {
            super(id, label, 'debug-action start', debugService, keybindingService);
            this.contextService = contextService;
            this.historyService = historyService;
            this.toDispose.push(this.debugService.getConfigurationManager().onDidSelectConfiguration(() => this.updateEnablement()));
            this.toDispose.push(this.debugService.onDidNewSession(() => this.updateEnablement()));
            this.toDispose.push(this.debugService.onDidEndSession(() => this.updateEnablement()));
            this.toDispose.push(this.contextService.onDidChangeWorkbenchState(() => this.updateEnablement()));
        }
        // Note: When this action is executed from the process explorer, a config is passed. For all
        // other cases it is run with no arguments.
        run() {
            const configurationManager = this.debugService.getConfigurationManager();
            let launch = configurationManager.selectedConfiguration.launch;
            if (!launch || launch.getConfigurationNames().length === 0) {
                const rootUri = this.historyService.getLastActiveWorkspaceRoot();
                launch = configurationManager.getLaunch(rootUri);
                if (!launch || launch.getConfigurationNames().length === 0) {
                    const launches = configurationManager.getLaunches();
                    launch = arrays_1.first(launches, l => !!(l && l.getConfigurationNames().length), launch);
                }
                configurationManager.selectConfiguration(launch);
            }
            return this.debugService.startDebugging(launch, undefined, this.isNoDebug());
        }
        isNoDebug() {
            return false;
        }
        static isEnabled(debugService) {
            const sessions = debugService.getModel().getSessions();
            if (debugService.state === 1 /* Initializing */) {
                return false;
            }
            if ((sessions.length > 0) && debugService.getConfigurationManager().getLaunches().every(l => l.getConfigurationNames().length === 0)) {
                // There is already a debug session running and we do not have any launch configuration selected
                return false;
            }
            return true;
        }
        // Disabled if the launch drop down shows the launch config that is already running.
        isEnabled() {
            return StartAction.isEnabled(this.debugService);
        }
    };
    StartAction.ID = 'workbench.action.debug.start';
    StartAction.LABEL = nls.localize('startDebug', "Start Debugging");
    StartAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, history_1.IHistoryService)
    ], StartAction);
    exports.StartAction = StartAction;
    class RunAction extends StartAction {
        isNoDebug() {
            return true;
        }
    }
    RunAction.ID = 'workbench.action.debug.run';
    RunAction.LABEL = nls.localize('startWithoutDebugging', "Start Without Debugging");
    exports.RunAction = RunAction;
    let SelectAndStartAction = class SelectAndStartAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, quickOpenService) {
            super(id, label, '', debugService, keybindingService);
            this.quickOpenService = quickOpenService;
        }
        run() {
            return this.quickOpenService.show('debug ');
        }
    };
    SelectAndStartAction.ID = 'workbench.action.debug.selectandstart';
    SelectAndStartAction.LABEL = nls.localize('selectAndStartDebugging', "Select and Start Debugging");
    SelectAndStartAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, quickOpen_1.IQuickOpenService)
    ], SelectAndStartAction);
    exports.SelectAndStartAction = SelectAndStartAction;
    let RestartAction = class RestartAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, contextService, historyService) {
            super(id, label, 'debug-action restart', debugService, keybindingService, 70);
            this.contextService = contextService;
            this.historyService = historyService;
            this.setLabel(this.debugService.getViewModel().focusedSession);
            this.toDispose.push(this.debugService.getViewModel().onDidFocusSession(() => this.setLabel(this.debugService.getViewModel().focusedSession)));
        }
        get startAction() {
            return new StartAction(StartAction.ID, StartAction.LABEL, this.debugService, this.keybindingService, this.contextService, this.historyService);
        }
        setLabel(session) {
            if (session) {
                this.updateLabel(session && session.configuration.request === 'attach' ? RestartAction.RECONNECT_LABEL : RestartAction.LABEL);
            }
        }
        run(session) {
            if (!session || !session.getId) {
                session = this.debugService.getViewModel().focusedSession;
            }
            if (!session) {
                return this.startAction.run();
            }
            session.removeReplExpressions();
            return this.debugService.restartSession(session);
        }
        isEnabled(state) {
            return super.isEnabled(state) && (state === 3 /* Running */ ||
                state === 2 /* Stopped */ ||
                StartAction.isEnabled(this.debugService));
        }
    };
    RestartAction.ID = 'workbench.action.debug.restart';
    RestartAction.LABEL = nls.localize('restartDebug', "Restart");
    RestartAction.RECONNECT_LABEL = nls.localize('reconnectDebug', "Reconnect");
    __decorate([
        decorators_1.memoize
    ], RestartAction.prototype, "startAction", null);
    RestartAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, history_1.IHistoryService)
    ], RestartAction);
    exports.RestartAction = RestartAction;
    let StepOverAction = class StepOverAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action step-over', debugService, keybindingService, 20);
        }
        run(thread) {
            if (!(thread instanceof debugModel_1.Thread)) {
                thread = this.debugService.getViewModel().focusedThread;
            }
            return thread ? thread.next() : Promise.resolve();
        }
        isEnabled(state) {
            return super.isEnabled(state) && state === 2 /* Stopped */;
        }
    };
    StepOverAction.ID = 'workbench.action.debug.stepOver';
    StepOverAction.LABEL = nls.localize('stepOverDebug', "Step Over");
    StepOverAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], StepOverAction);
    exports.StepOverAction = StepOverAction;
    let StepIntoAction = class StepIntoAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action step-into', debugService, keybindingService, 30);
        }
        run(thread) {
            if (!(thread instanceof debugModel_1.Thread)) {
                thread = this.debugService.getViewModel().focusedThread;
            }
            return thread ? thread.stepIn() : Promise.resolve();
        }
        isEnabled(state) {
            return super.isEnabled(state) && state === 2 /* Stopped */;
        }
    };
    StepIntoAction.ID = 'workbench.action.debug.stepInto';
    StepIntoAction.LABEL = nls.localize('stepIntoDebug', "Step Into");
    StepIntoAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], StepIntoAction);
    exports.StepIntoAction = StepIntoAction;
    let StepOutAction = class StepOutAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action step-out', debugService, keybindingService, 40);
        }
        run(thread) {
            if (!(thread instanceof debugModel_1.Thread)) {
                thread = this.debugService.getViewModel().focusedThread;
            }
            return thread ? thread.stepOut() : Promise.resolve();
        }
        isEnabled(state) {
            return super.isEnabled(state) && state === 2 /* Stopped */;
        }
    };
    StepOutAction.ID = 'workbench.action.debug.stepOut';
    StepOutAction.LABEL = nls.localize('stepOutDebug', "Step Out");
    StepOutAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], StepOutAction);
    exports.StepOutAction = StepOutAction;
    let StopAction = class StopAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action stop', debugService, keybindingService, 80);
        }
        run(session) {
            if (!session || !session.getId) {
                session = this.debugService.getViewModel().focusedSession;
            }
            return this.debugService.stopSession(session);
        }
        isEnabled(state) {
            return super.isEnabled(state) && (state !== 0 /* Inactive */);
        }
    };
    StopAction.ID = 'workbench.action.debug.stop';
    StopAction.LABEL = nls.localize('stopDebug', "Stop");
    StopAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], StopAction);
    exports.StopAction = StopAction;
    let DisconnectAction = class DisconnectAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action disconnect', debugService, keybindingService, 80);
        }
        run() {
            const session = this.debugService.getViewModel().focusedSession;
            return this.debugService.stopSession(session);
        }
        isEnabled(state) {
            return super.isEnabled(state) && (state === 3 /* Running */ || state === 2 /* Stopped */);
        }
    };
    DisconnectAction.ID = 'workbench.action.debug.disconnect';
    DisconnectAction.LABEL = nls.localize('disconnectDebug', "Disconnect");
    DisconnectAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], DisconnectAction);
    exports.DisconnectAction = DisconnectAction;
    let ContinueAction = class ContinueAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action continue', debugService, keybindingService, 10);
        }
        run(thread) {
            if (!(thread instanceof debugModel_1.Thread)) {
                thread = this.debugService.getViewModel().focusedThread;
            }
            return thread ? thread.continue() : Promise.resolve();
        }
        isEnabled(state) {
            return super.isEnabled(state) && state === 2 /* Stopped */;
        }
    };
    ContinueAction.ID = 'workbench.action.debug.continue';
    ContinueAction.LABEL = nls.localize('continueDebug', "Continue");
    ContinueAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], ContinueAction);
    exports.ContinueAction = ContinueAction;
    let PauseAction = class PauseAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action pause', debugService, keybindingService, 10);
        }
        run(thread) {
            if (!(thread instanceof debugModel_1.Thread)) {
                thread = this.debugService.getViewModel().focusedThread;
                if (!thread) {
                    const session = this.debugService.getViewModel().focusedSession;
                    const threads = session && session.getAllThreads();
                    thread = threads && threads.length ? threads[0] : undefined;
                }
            }
            return thread ? thread.pause() : Promise.resolve();
        }
        isEnabled(state) {
            return super.isEnabled(state) && state === 3 /* Running */;
        }
    };
    PauseAction.ID = 'workbench.action.debug.pause';
    PauseAction.LABEL = nls.localize('pauseDebug', "Pause");
    PauseAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], PauseAction);
    exports.PauseAction = PauseAction;
    let TerminateThreadAction = class TerminateThreadAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, '', debugService, keybindingService);
        }
        run(thread) {
            if (!(thread instanceof debugModel_1.Thread)) {
                thread = this.debugService.getViewModel().focusedThread;
            }
            return thread ? thread.terminate() : Promise.resolve();
        }
        isEnabled(state) {
            return super.isEnabled(state) && (state === 3 /* Running */ || state === 2 /* Stopped */);
        }
    };
    TerminateThreadAction.ID = 'workbench.action.debug.terminateThread';
    TerminateThreadAction.LABEL = nls.localize('terminateThread', "Terminate Thread");
    TerminateThreadAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], TerminateThreadAction);
    exports.TerminateThreadAction = TerminateThreadAction;
    let RestartFrameAction = class RestartFrameAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, '', debugService, keybindingService);
        }
        run(frame) {
            if (!frame) {
                frame = this.debugService.getViewModel().focusedStackFrame;
            }
            return frame.restart();
        }
    };
    RestartFrameAction.ID = 'workbench.action.debug.restartFrame';
    RestartFrameAction.LABEL = nls.localize('restartFrame', "Restart Frame");
    RestartFrameAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RestartFrameAction);
    exports.RestartFrameAction = RestartFrameAction;
    let RemoveBreakpointAction = class RemoveBreakpointAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action remove', debugService, keybindingService);
        }
        run(breakpoint) {
            return breakpoint instanceof debugModel_1.Breakpoint ? this.debugService.removeBreakpoints(breakpoint.getId())
                : this.debugService.removeFunctionBreakpoints(breakpoint.getId());
        }
    };
    RemoveBreakpointAction.ID = 'workbench.debug.viewlet.action.removeBreakpoint';
    RemoveBreakpointAction.LABEL = nls.localize('removeBreakpoint', "Remove Breakpoint");
    RemoveBreakpointAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveBreakpointAction);
    exports.RemoveBreakpointAction = RemoveBreakpointAction;
    let RemoveAllBreakpointsAction = class RemoveAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action remove-all', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return Promise.all([this.debugService.removeBreakpoints(), this.debugService.removeFunctionBreakpoints()]);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return super.isEnabled(state) && (model.getBreakpoints().length > 0 || model.getFunctionBreakpoints().length > 0);
        }
    };
    RemoveAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.removeAllBreakpoints';
    RemoveAllBreakpointsAction.LABEL = nls.localize('removeAllBreakpoints', "Remove All Breakpoints");
    RemoveAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveAllBreakpointsAction);
    exports.RemoveAllBreakpointsAction = RemoveAllBreakpointsAction;
    let EnableAllBreakpointsAction = class EnableAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action enable-all-breakpoints', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.enableOrDisableBreakpoints(true);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return super.isEnabled(state) && model.getBreakpoints().concat(model.getFunctionBreakpoints()).concat(model.getExceptionBreakpoints()).some(bp => !bp.enabled);
        }
    };
    EnableAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.enableAllBreakpoints';
    EnableAllBreakpointsAction.LABEL = nls.localize('enableAllBreakpoints', "Enable All Breakpoints");
    EnableAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], EnableAllBreakpointsAction);
    exports.EnableAllBreakpointsAction = EnableAllBreakpointsAction;
    let DisableAllBreakpointsAction = class DisableAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action disable-all-breakpoints', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.enableOrDisableBreakpoints(false);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return super.isEnabled(state) && model.getBreakpoints().concat(model.getFunctionBreakpoints()).concat(model.getExceptionBreakpoints()).some(bp => bp.enabled);
        }
    };
    DisableAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.disableAllBreakpoints';
    DisableAllBreakpointsAction.LABEL = nls.localize('disableAllBreakpoints', "Disable All Breakpoints");
    DisableAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], DisableAllBreakpointsAction);
    exports.DisableAllBreakpointsAction = DisableAllBreakpointsAction;
    let ToggleBreakpointsActivatedAction = class ToggleBreakpointsActivatedAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action breakpoints-activate', debugService, keybindingService);
            this.updateLabel(this.debugService.getModel().areBreakpointsActivated() ? ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL : ToggleBreakpointsActivatedAction.ACTIVATE_LABEL);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => {
                this.updateLabel(this.debugService.getModel().areBreakpointsActivated() ? ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL : ToggleBreakpointsActivatedAction.ACTIVATE_LABEL);
                this.updateEnablement();
            }));
        }
        run() {
            return this.debugService.setBreakpointsActivated(!this.debugService.getModel().areBreakpointsActivated());
        }
        isEnabled(state) {
            return (this.debugService.getModel().getFunctionBreakpoints().length + this.debugService.getModel().getBreakpoints().length) > 0;
        }
    };
    ToggleBreakpointsActivatedAction.ID = 'workbench.debug.viewlet.action.toggleBreakpointsActivatedAction';
    ToggleBreakpointsActivatedAction.ACTIVATE_LABEL = nls.localize('activateBreakpoints', "Activate Breakpoints");
    ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL = nls.localize('deactivateBreakpoints', "Deactivate Breakpoints");
    ToggleBreakpointsActivatedAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], ToggleBreakpointsActivatedAction);
    exports.ToggleBreakpointsActivatedAction = ToggleBreakpointsActivatedAction;
    let ReapplyBreakpointsAction = class ReapplyBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, '', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.setBreakpointsActivated(true);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return super.isEnabled(state) && (state === 3 /* Running */ || state === 2 /* Stopped */) &&
                (model.getFunctionBreakpoints().length + model.getBreakpoints().length + model.getExceptionBreakpoints().length > 0);
        }
    };
    ReapplyBreakpointsAction.ID = 'workbench.debug.viewlet.action.reapplyBreakpointsAction';
    ReapplyBreakpointsAction.LABEL = nls.localize('reapplyAllBreakpoints', "Reapply All Breakpoints");
    ReapplyBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], ReapplyBreakpointsAction);
    exports.ReapplyBreakpointsAction = ReapplyBreakpointsAction;
    let AddFunctionBreakpointAction = class AddFunctionBreakpointAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action add-function-breakpoint', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            this.debugService.addFunctionBreakpoint();
            return Promise.resolve();
        }
        isEnabled(state) {
            return !this.debugService.getViewModel().getSelectedFunctionBreakpoint()
                && this.debugService.getModel().getFunctionBreakpoints().every(fbp => !!fbp.name);
        }
    };
    AddFunctionBreakpointAction.ID = 'workbench.debug.viewlet.action.addFunctionBreakpointAction';
    AddFunctionBreakpointAction.LABEL = nls.localize('addFunctionBreakpoint', "Add Function Breakpoint");
    AddFunctionBreakpointAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], AddFunctionBreakpointAction);
    exports.AddFunctionBreakpointAction = AddFunctionBreakpointAction;
    let SetValueAction = class SetValueAction extends AbstractDebugAction {
        constructor(id, label, variable, debugService, keybindingService) {
            super(id, label, '', debugService, keybindingService);
            this.variable = variable;
        }
        run() {
            if (this.variable instanceof debugModel_1.Variable) {
                this.debugService.getViewModel().setSelectedExpression(this.variable);
            }
            return Promise.resolve();
        }
        isEnabled(state) {
            const session = this.debugService.getViewModel().focusedSession;
            return !!(super.isEnabled(state) && state === 2 /* Stopped */ && session && session.capabilities.supportsSetVariable);
        }
    };
    SetValueAction.ID = 'workbench.debug.viewlet.action.setValue';
    SetValueAction.LABEL = nls.localize('setValue', "Set Value");
    SetValueAction = __decorate([
        __param(3, debug_1.IDebugService), __param(4, keybinding_1.IKeybindingService)
    ], SetValueAction);
    exports.SetValueAction = SetValueAction;
    let AddWatchExpressionAction = class AddWatchExpressionAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action add-watch-expression', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeWatchExpressions(() => this.updateEnablement()));
        }
        run() {
            this.debugService.addWatchExpression();
            return Promise.resolve(undefined);
        }
        isEnabled(state) {
            return super.isEnabled(state) && this.debugService.getModel().getWatchExpressions().every(we => !!we.name);
        }
    };
    AddWatchExpressionAction.ID = 'workbench.debug.viewlet.action.addWatchExpression';
    AddWatchExpressionAction.LABEL = nls.localize('addWatchExpression', "Add Expression");
    AddWatchExpressionAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], AddWatchExpressionAction);
    exports.AddWatchExpressionAction = AddWatchExpressionAction;
    let EditWatchExpressionAction = class EditWatchExpressionAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, '', debugService, keybindingService);
        }
        run(expression) {
            this.debugService.getViewModel().setSelectedExpression(expression);
            return Promise.resolve();
        }
    };
    EditWatchExpressionAction.ID = 'workbench.debug.viewlet.action.editWatchExpression';
    EditWatchExpressionAction.LABEL = nls.localize('editWatchExpression', "Edit Expression");
    EditWatchExpressionAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], EditWatchExpressionAction);
    exports.EditWatchExpressionAction = EditWatchExpressionAction;
    let AddToWatchExpressionsAction = class AddToWatchExpressionsAction extends AbstractDebugAction {
        constructor(id, label, variable, debugService, keybindingService) {
            super(id, label, 'debug-action add-to-watch', debugService, keybindingService);
            this.variable = variable;
            this.updateEnablement();
        }
        run() {
            this.debugService.addWatchExpression(this.variable.evaluateName);
            return Promise.resolve(undefined);
        }
        isEnabled(state) {
            return super.isEnabled(state) && this.variable && !!this.variable.evaluateName;
        }
    };
    AddToWatchExpressionsAction.ID = 'workbench.debug.viewlet.action.addToWatchExpressions';
    AddToWatchExpressionsAction.LABEL = nls.localize('addToWatchExpressions', "Add to Watch");
    AddToWatchExpressionsAction = __decorate([
        __param(3, debug_1.IDebugService), __param(4, keybinding_1.IKeybindingService)
    ], AddToWatchExpressionsAction);
    exports.AddToWatchExpressionsAction = AddToWatchExpressionsAction;
    let RemoveWatchExpressionAction = class RemoveWatchExpressionAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, '', debugService, keybindingService);
        }
        run(expression) {
            this.debugService.removeWatchExpressions(expression.getId());
            return Promise.resolve();
        }
    };
    RemoveWatchExpressionAction.ID = 'workbench.debug.viewlet.action.removeWatchExpression';
    RemoveWatchExpressionAction.LABEL = nls.localize('removeWatchExpression', "Remove Expression");
    RemoveWatchExpressionAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveWatchExpressionAction);
    exports.RemoveWatchExpressionAction = RemoveWatchExpressionAction;
    let RemoveAllWatchExpressionsAction = class RemoveAllWatchExpressionsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action remove-all', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeWatchExpressions(() => this.updateEnablement()));
        }
        run() {
            this.debugService.removeWatchExpressions();
            return Promise.resolve();
        }
        isEnabled(state) {
            return super.isEnabled(state) && this.debugService.getModel().getWatchExpressions().length > 0;
        }
    };
    RemoveAllWatchExpressionsAction.ID = 'workbench.debug.viewlet.action.removeAllWatchExpressions';
    RemoveAllWatchExpressionsAction.LABEL = nls.localize('removeAllWatchExpressions', "Remove All Expressions");
    RemoveAllWatchExpressionsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveAllWatchExpressionsAction);
    exports.RemoveAllWatchExpressionsAction = RemoveAllWatchExpressionsAction;
    let ToggleReplAction = class ToggleReplAction extends panel_1.TogglePanelAction {
        constructor(id, label, layoutService, panelService) {
            super(id, label, debug_1.REPL_ID, panelService, layoutService, 'debug-action toggle-repl');
            this.toDispose = [];
            this.registerListeners();
        }
        registerListeners() {
            this.toDispose.push(this.panelService.onDidPanelOpen(({ panel }) => {
                if (panel.getId() === debug_1.REPL_ID) {
                    this.class = 'debug-action toggle-repl';
                    this.tooltip = ToggleReplAction.LABEL;
                }
            }));
        }
        dispose() {
            super.dispose();
            this.toDispose = lifecycle.dispose(this.toDispose);
        }
    };
    ToggleReplAction.ID = 'workbench.debug.action.toggleRepl';
    ToggleReplAction.LABEL = nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugConsoleAction' }, 'Debug Console');
    ToggleReplAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, panelService_1.IPanelService)
    ], ToggleReplAction);
    exports.ToggleReplAction = ToggleReplAction;
    let FocusReplAction = class FocusReplAction extends actions_1.Action {
        constructor(id, label, panelService) {
            super(id, label);
            this.panelService = panelService;
        }
        run() {
            this.panelService.openPanel(debug_1.REPL_ID, true);
            return Promise.resolve();
        }
    };
    FocusReplAction.ID = 'workbench.debug.action.focusRepl';
    FocusReplAction.LABEL = nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugFocusConsole' }, 'Focus on Debug Console View');
    FocusReplAction = __decorate([
        __param(2, panelService_1.IPanelService)
    ], FocusReplAction);
    exports.FocusReplAction = FocusReplAction;
    let FocusSessionAction = class FocusSessionAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, editorService) {
            super(id, label, '', debugService, keybindingService, 100);
            this.editorService = editorService;
        }
        run(sessionName) {
            const session = this.debugService.getModel().getSessions().filter(p => p.getLabel() === sessionName).pop();
            this.debugService.focusStackFrame(undefined, undefined, session, true);
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (stackFrame) {
                return stackFrame.openInEditor(this.editorService, true);
            }
            return Promise.resolve(undefined);
        }
    };
    FocusSessionAction.ID = 'workbench.action.debug.focusProcess';
    FocusSessionAction.LABEL = nls.localize('focusSession', "Focus Session");
    FocusSessionAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, editorService_1.IEditorService)
    ], FocusSessionAction);
    exports.FocusSessionAction = FocusSessionAction;
    // Actions used by the chakra debugger
    let StepBackAction = class StepBackAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action step-back', debugService, keybindingService, 50);
        }
        run(thread) {
            if (!(thread instanceof debugModel_1.Thread)) {
                thread = this.debugService.getViewModel().focusedThread;
            }
            return thread ? thread.stepBack() : Promise.resolve();
        }
        isEnabled(state) {
            const session = this.debugService.getViewModel().focusedSession;
            return !!(super.isEnabled(state) && state === 2 /* Stopped */ &&
                session && session.capabilities.supportsStepBack);
        }
    };
    StepBackAction.ID = 'workbench.action.debug.stepBack';
    StepBackAction.LABEL = nls.localize('stepBackDebug', "Step Back");
    StepBackAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], StepBackAction);
    exports.StepBackAction = StepBackAction;
    let ReverseContinueAction = class ReverseContinueAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action reverse-continue', debugService, keybindingService, 60);
        }
        run(thread) {
            if (!(thread instanceof debugModel_1.Thread)) {
                thread = this.debugService.getViewModel().focusedThread;
            }
            return thread ? thread.reverseContinue() : Promise.resolve();
        }
        isEnabled(state) {
            const session = this.debugService.getViewModel().focusedSession;
            return !!(super.isEnabled(state) && state === 2 /* Stopped */ &&
                session && session.capabilities.supportsStepBack);
        }
    };
    ReverseContinueAction.ID = 'workbench.action.debug.reverseContinue';
    ReverseContinueAction.LABEL = nls.localize('reverseContinue', "Reverse");
    ReverseContinueAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], ReverseContinueAction);
    exports.ReverseContinueAction = ReverseContinueAction;
    class ReplCollapseAllAction extends viewlet_1.CollapseAction {
        constructor(tree, toFocus) {
            super(tree, true, undefined);
            this.toFocus = toFocus;
        }
        run(event) {
            return super.run(event).then(() => {
                this.toFocus.focus();
            });
        }
    }
    exports.ReplCollapseAllAction = ReplCollapseAllAction;
});
//# sourceMappingURL=debugActions.js.map