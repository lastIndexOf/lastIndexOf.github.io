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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/extensions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/actions", "vs/workbench/browser/viewlet", "vs/workbench/browser/panel", "vs/workbench/browser/parts/statusbar/statusbar", "vs/workbench/contrib/debug/electron-browser/variablesView", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/workbench/contrib/debug/electron-browser/watchExpressionsView", "vs/workbench/contrib/debug/electron-browser/callStackView", "vs/workbench/common/contributions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panel/common/panelService", "vs/workbench/contrib/debug/browser/debugEditorModelManager", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/browser/debugToolbar", "vs/workbench/contrib/debug/electron-browser/debugService", "vs/workbench/contrib/debug/browser/debugContentProvider", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/browser/quickopen", "vs/workbench/contrib/debug/browser/statusbarColorProvider", "vs/workbench/common/views", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/contrib/debug/browser/debugViewlet", "vs/workbench/contrib/debug/electron-browser/repl", "vs/workbench/contrib/debug/browser/debugQuickOpen", "vs/workbench/contrib/debug/browser/debugStatus", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/debug/browser/loadedScriptsView", "vs/workbench/contrib/debug/browser/debugEditorActions", "vs/css!../browser/media/debug.contribution", "vs/css!../browser/media/debugHover", "vs/workbench/contrib/debug/electron-browser/debugEditorContribution"], function (require, exports, nls, actions_1, platform_1, extensions_1, configurationRegistry_1, actions_2, viewlet_1, panel_1, statusbar_1, variablesView_1, breakpointsView_1, watchExpressionsView_1, callStackView_1, contributions_1, debug_1, layoutService_1, panelService_1, debugEditorModelManager_1, debugActions_1, debugToolbar_1, service, debugContentProvider_1, viewlet_2, debugCommands_1, quickopen_1, statusbarColorProvider_1, views_1, platform_2, contextkey_1, uri_1, debugViewlet_1, repl_1, debugQuickOpen_1, debugStatus_1, configuration_1, editorGroupsService_1, loadedScriptsView_1, debugEditorActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenDebugViewletAction = class OpenDebugViewletAction extends viewlet_1.ShowViewletAction {
        constructor(id, label, viewletService, editorGroupService, layoutService) {
            super(id, label, debug_1.VIEWLET_ID, viewletService, editorGroupService, layoutService);
        }
    };
    OpenDebugViewletAction.ID = debug_1.VIEWLET_ID;
    OpenDebugViewletAction.LABEL = nls.localize('toggleDebugViewlet', "Show Debug");
    OpenDebugViewletAction = __decorate([
        __param(2, viewlet_2.IViewletService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], OpenDebugViewletAction);
    let OpenDebugPanelAction = class OpenDebugPanelAction extends panel_1.TogglePanelAction {
        constructor(id, label, panelService, layoutService) {
            super(id, label, debug_1.REPL_ID, panelService, layoutService);
        }
    };
    OpenDebugPanelAction.ID = 'workbench.debug.action.toggleRepl';
    OpenDebugPanelAction.LABEL = nls.localize('toggleDebugPanel', "Debug Console");
    OpenDebugPanelAction = __decorate([
        __param(2, panelService_1.IPanelService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], OpenDebugPanelAction);
    // register viewlet
    platform_1.Registry.as(viewlet_1.Extensions.Viewlets).registerViewlet(new viewlet_1.ViewletDescriptor(debugViewlet_1.DebugViewlet, debug_1.VIEWLET_ID, nls.localize('debug', "Debug"), 'debug', 3));
    const openViewletKb = {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 34 /* KEY_D */
    };
    const openPanelKb = {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 55 /* KEY_Y */
    };
    // register repl panel
    platform_1.Registry.as(panel_1.Extensions.Panels).registerPanel(new panel_1.PanelDescriptor(repl_1.Repl, debug_1.REPL_ID, nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugPanel' }, 'Debug Console'), 'repl', 30, OpenDebugPanelAction.ID));
    platform_1.Registry.as(panel_1.Extensions.Panels).setDefaultPanelId(debug_1.REPL_ID);
    // Register default debug views
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViews([{ id: debug_1.VARIABLES_VIEW_ID, name: nls.localize('variables', "Variables"), ctorDescriptor: { ctor: variablesView_1.VariablesView }, order: 10, weight: 40, canToggleVisibility: true, focusCommand: { id: 'workbench.debug.action.focusVariablesView' } }], debug_1.VIEW_CONTAINER);
    viewsRegistry.registerViews([{ id: debug_1.WATCH_VIEW_ID, name: nls.localize('watch', "Watch"), ctorDescriptor: { ctor: watchExpressionsView_1.WatchExpressionsView }, order: 20, weight: 10, canToggleVisibility: true, focusCommand: { id: 'workbench.debug.action.focusWatchView' } }], debug_1.VIEW_CONTAINER);
    viewsRegistry.registerViews([{ id: debug_1.CALLSTACK_VIEW_ID, name: nls.localize('callStack', "Call Stack"), ctorDescriptor: { ctor: callStackView_1.CallStackView }, order: 30, weight: 30, canToggleVisibility: true, focusCommand: { id: 'workbench.debug.action.focusCallStackView' } }], debug_1.VIEW_CONTAINER);
    viewsRegistry.registerViews([{ id: debug_1.BREAKPOINTS_VIEW_ID, name: nls.localize('breakpoints', "Breakpoints"), ctorDescriptor: { ctor: breakpointsView_1.BreakpointsView }, order: 40, weight: 20, canToggleVisibility: true, focusCommand: { id: 'workbench.debug.action.focusBreakpointsView' } }], debug_1.VIEW_CONTAINER);
    viewsRegistry.registerViews([{ id: debug_1.LOADED_SCRIPTS_VIEW_ID, name: nls.localize('loadedScripts', "Loaded Scripts"), ctorDescriptor: { ctor: loadedScriptsView_1.LoadedScriptsView }, order: 35, weight: 5, canToggleVisibility: true, collapsed: true, when: debug_1.CONTEXT_LOADED_SCRIPTS_SUPPORTED }], debug_1.VIEW_CONTAINER);
    // register action to open viewlet
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(OpenDebugPanelAction, OpenDebugPanelAction.ID, OpenDebugPanelAction.LABEL, openPanelKb), 'View: Debug Console', nls.localize('view', "View"));
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(OpenDebugViewletAction, OpenDebugViewletAction.ID, OpenDebugViewletAction.LABEL, openViewletKb), 'View: Show Debug', nls.localize('view', "View"));
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugEditorModelManager_1.DebugEditorModelManager, 3 /* Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugToolbar_1.DebugToolbar, 3 /* Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugContentProvider_1.DebugContentProvider, 4 /* Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(statusbarColorProvider_1.StatusBarColorProvider, 4 /* Eventually */);
    const debugCategory = nls.localize('debugCategory', "Debug");
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.StartAction, debugActions_1.StartAction.ID, debugActions_1.StartAction.LABEL, { primary: 63 /* F5 */ }, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated()), 'Debug: Start Debugging', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.StepOverAction, debugActions_1.StepOverAction.ID, debugActions_1.StepOverAction.LABEL, { primary: 68 /* F10 */ }, debug_1.CONTEXT_IN_DEBUG_MODE), 'Debug: Step Over', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.StepIntoAction, debugActions_1.StepIntoAction.ID, debugActions_1.StepIntoAction.LABEL, { primary: 69 /* F11 */ }, debug_1.CONTEXT_IN_DEBUG_MODE, 200 /* WorkbenchContrib */ + 1), 'Debug: Step Into', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.StepOutAction, debugActions_1.StepOutAction.ID, debugActions_1.StepOutAction.LABEL, { primary: 1024 /* Shift */ | 69 /* F11 */ }, debug_1.CONTEXT_IN_DEBUG_MODE), 'Debug: Step Out', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.RestartAction, debugActions_1.RestartAction.ID, debugActions_1.RestartAction.LABEL, { primary: 1024 /* Shift */ | 2048 /* CtrlCmd */ | 63 /* F5 */ }, debug_1.CONTEXT_IN_DEBUG_MODE), 'Debug: Restart', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.StopAction, debugActions_1.StopAction.ID, debugActions_1.StopAction.LABEL, { primary: 1024 /* Shift */ | 63 /* F5 */ }, debug_1.CONTEXT_IN_DEBUG_MODE), 'Debug: Stop', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.DisconnectAction, debugActions_1.DisconnectAction.ID, debugActions_1.DisconnectAction.LABEL), 'Debug: Disconnect', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.ContinueAction, debugActions_1.ContinueAction.ID, debugActions_1.ContinueAction.LABEL, { primary: 63 /* F5 */ }, debug_1.CONTEXT_IN_DEBUG_MODE), 'Debug: Continue', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.PauseAction, debugActions_1.PauseAction.ID, debugActions_1.PauseAction.LABEL, { primary: 64 /* F6 */ }, debug_1.CONTEXT_IN_DEBUG_MODE), 'Debug: Pause', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.TerminateThreadAction, debugActions_1.TerminateThreadAction.ID, debugActions_1.TerminateThreadAction.LABEL, undefined, debug_1.CONTEXT_IN_DEBUG_MODE), 'Debug: Terminate Thread', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.ConfigureAction, debugActions_1.ConfigureAction.ID, debugActions_1.ConfigureAction.LABEL), 'Debug: Open launch.json', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.AddFunctionBreakpointAction, debugActions_1.AddFunctionBreakpointAction.ID, debugActions_1.AddFunctionBreakpointAction.LABEL), 'Debug: Add Function Breakpoint', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.ReapplyBreakpointsAction, debugActions_1.ReapplyBreakpointsAction.ID, debugActions_1.ReapplyBreakpointsAction.LABEL), 'Debug: Reapply All Breakpoints', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.RunAction, debugActions_1.RunAction.ID, debugActions_1.RunAction.LABEL, { primary: 2048 /* CtrlCmd */ | 63 /* F5 */, mac: { primary: 256 /* WinCtrl */ | 63 /* F5 */ } }, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated()), 'Debug: Start Without Debugging', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.RemoveAllBreakpointsAction, debugActions_1.RemoveAllBreakpointsAction.ID, debugActions_1.RemoveAllBreakpointsAction.LABEL), 'Debug: Remove All Breakpoints', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.EnableAllBreakpointsAction, debugActions_1.EnableAllBreakpointsAction.ID, debugActions_1.EnableAllBreakpointsAction.LABEL), 'Debug: Enable All Breakpoints', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.DisableAllBreakpointsAction, debugActions_1.DisableAllBreakpointsAction.ID, debugActions_1.DisableAllBreakpointsAction.LABEL), 'Debug: Disable All Breakpoints', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.FocusReplAction, debugActions_1.FocusReplAction.ID, debugActions_1.FocusReplAction.LABEL), 'Debug: Focus on Debug Console View', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(debugActions_1.SelectAndStartAction, debugActions_1.SelectAndStartAction.ID, debugActions_1.SelectAndStartAction.LABEL), 'Debug: Select and Start Debugging', debugCategory);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(repl_1.ClearReplAction, repl_1.ClearReplAction.ID, repl_1.ClearReplAction.LABEL), 'Debug: Clear Console', debugCategory);
    // Register Quick Open
    (platform_1.Registry.as(quickopen_1.Extensions.Quickopen)).registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(debugQuickOpen_1.DebugQuickOpenHandler, debugQuickOpen_1.DebugQuickOpenHandler.ID, 'debug ', 'inLaunchConfigurationsPicker', nls.localize('debugCommands', "Debug Configuration")));
    // register service
    extensions_1.registerSingleton(debug_1.IDebugService, service.DebugService);
    // Register configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'debug',
        order: 20,
        title: nls.localize('debugConfigurationTitle', "Debug"),
        type: 'object',
        properties: {
            'debug.allowBreakpointsEverywhere': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'allowBreakpointsEverywhere' }, "Allow setting breakpoints in any file."),
                default: false
            },
            'debug.openExplorerOnEnd': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'openExplorerOnEnd' }, "Automatically open the explorer view at the end of a debug session."),
                default: false
            },
            'debug.inlineValues': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'inlineValues' }, "Show variable values inline in editor while debugging."),
                default: false
            },
            'debug.toolBarLocation': {
                enum: ['floating', 'docked', 'hidden'],
                markdownDescription: nls.localize({ comment: ['This is the description for a setting'], key: 'toolBarLocation' }, "Controls the location of the debug toolbar. Either `floating` in all views, `docked` in the debug view, or `hidden`."),
                default: 'floating'
            },
            'debug.showInStatusBar': {
                enum: ['never', 'always', 'onFirstSessionStart'],
                enumDescriptions: [nls.localize('never', "Never show debug in status bar"), nls.localize('always', "Always show debug in status bar"), nls.localize('onFirstSessionStart', "Show debug in status bar only after debug was started for the first time")],
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showInStatusBar' }, "Controls when the debug status bar should be visible."),
                default: 'onFirstSessionStart'
            },
            'debug.internalConsoleOptions': debug_1.INTERNAL_CONSOLE_OPTIONS_SCHEMA,
            'debug.openDebug': {
                enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart', 'openOnDebugBreak'],
                default: 'openOnSessionStart',
                description: nls.localize('openDebug', "Controls when the debug view should open.")
            },
            'debug.enableAllHovers': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'enableAllHovers' }, "Controls whether the non-debug hovers should be enabled while debugging. When enabled the hover providers will be called to provide a hover. Regular hovers will not be shown even if this setting is enabled."),
                default: false
            },
            'debug.console.fontSize': {
                type: 'number',
                description: nls.localize('debug.console.fontSize', "Controls the font size in pixels in the debug console."),
                default: platform_2.isMacintosh ? 12 : 14,
            },
            'debug.console.fontFamily': {
                type: 'string',
                description: nls.localize('debug.console.fontFamily', "Controls the font family in the debug console."),
                default: 'default'
            },
            'debug.console.lineHeight': {
                type: 'number',
                description: nls.localize('debug.console.lineHeight', "Controls the line height in pixels in the debug console. Use 0 to compute the line height from the font size."),
                default: 0
            },
            'launch': {
                type: 'object',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'launch' }, "Global debug launch configuration. Should be used as an alternative to 'launch.json' that is shared across workspaces."),
                default: { configurations: [], compounds: [] },
                $ref: configuration_1.launchSchemaId
            }
        }
    });
    debugCommands_1.registerCommands();
    // Register Debug Status
    const statusBar = platform_1.Registry.as(statusbar_1.Extensions.Statusbar);
    statusBar.registerStatusbarItem(new statusbar_1.StatusbarItemDescriptor(debugStatus_1.DebugStatus, 0 /* LEFT */, 30 /* Low Priority */));
    // View menu
    actions_1.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '3_views',
        command: {
            id: debug_1.VIEWLET_ID,
            title: nls.localize({ key: 'miViewDebug', comment: ['&& denotes a mnemonic'] }, "&&Debug")
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '4_panels',
        command: {
            id: OpenDebugPanelAction.ID,
            title: nls.localize({ key: 'miToggleDebugConsole', comment: ['&& denotes a mnemonic'] }, "De&&bug Console")
        },
        order: 2
    });
    // Debug menu
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '1_debug',
        command: {
            id: debugActions_1.StartAction.ID,
            title: nls.localize({ key: 'miStartDebugging', comment: ['&& denotes a mnemonic'] }, "&&Start Debugging")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '1_debug',
        command: {
            id: debugActions_1.RunAction.ID,
            title: nls.localize({ key: 'miStartWithoutDebugging', comment: ['&& denotes a mnemonic'] }, "Start &&Without Debugging")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '1_debug',
        command: {
            id: debugActions_1.StopAction.ID,
            title: nls.localize({ key: 'miStopDebugging', comment: ['&& denotes a mnemonic'] }, "&&Stop Debugging"),
            precondition: debug_1.CONTEXT_IN_DEBUG_MODE
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '1_debug',
        command: {
            id: debugActions_1.RestartAction.ID,
            title: nls.localize({ key: 'miRestart Debugging', comment: ['&& denotes a mnemonic'] }, "&&Restart Debugging"),
            precondition: debug_1.CONTEXT_IN_DEBUG_MODE
        },
        order: 4
    });
    // Configuration
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '2_configuration',
        command: {
            id: debugActions_1.ConfigureAction.ID,
            title: nls.localize({ key: 'miOpenConfigurations', comment: ['&& denotes a mnemonic'] }, "Open &&Configurations")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '2_configuration',
        command: {
            id: debugCommands_1.ADD_CONFIGURATION_ID,
            title: nls.localize({ key: 'miAddConfiguration', comment: ['&& denotes a mnemonic'] }, "A&&dd Configuration...")
        },
        order: 2
    });
    // Step Commands
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '3_step',
        command: {
            id: debugActions_1.StepOverAction.ID,
            title: nls.localize({ key: 'miStepOver', comment: ['&& denotes a mnemonic'] }, "Step &&Over"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '3_step',
        command: {
            id: debugActions_1.StepIntoAction.ID,
            title: nls.localize({ key: 'miStepInto', comment: ['&& denotes a mnemonic'] }, "Step &&Into"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '3_step',
        command: {
            id: debugActions_1.StepOutAction.ID,
            title: nls.localize({ key: 'miStepOut', comment: ['&& denotes a mnemonic'] }, "Step O&&ut"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '3_step',
        command: {
            id: debugActions_1.ContinueAction.ID,
            title: nls.localize({ key: 'miContinue', comment: ['&& denotes a mnemonic'] }, "&&Continue"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 4
    });
    // New Breakpoints
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '4_new_breakpoint',
        command: {
            id: debugEditorActions_1.TOGGLE_BREAKPOINT_ID,
            title: nls.localize({ key: 'miToggleBreakpoint', comment: ['&& denotes a mnemonic'] }, "Toggle &&Breakpoint")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(19 /* MenubarNewBreakpointMenu */, {
        group: '1_breakpoints',
        command: {
            id: debugEditorActions_1.TOGGLE_CONDITIONAL_BREAKPOINT_ID,
            title: nls.localize({ key: 'miConditionalBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Conditional Breakpoint...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(19 /* MenubarNewBreakpointMenu */, {
        group: '1_breakpoints',
        command: {
            id: debugCommands_1.TOGGLE_INLINE_BREAKPOINT_ID,
            title: nls.localize({ key: 'miInlineBreakpoint', comment: ['&& denotes a mnemonic'] }, "Inline Breakp&&oint")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(19 /* MenubarNewBreakpointMenu */, {
        group: '1_breakpoints',
        command: {
            id: debugActions_1.AddFunctionBreakpointAction.ID,
            title: nls.localize({ key: 'miFunctionBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Function Breakpoint...")
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(19 /* MenubarNewBreakpointMenu */, {
        group: '1_breakpoints',
        command: {
            id: debugEditorActions_1.TOGGLE_LOG_POINT_ID,
            title: nls.localize({ key: 'miLogPoint', comment: ['&& denotes a mnemonic'] }, "&&Logpoint...")
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '4_new_breakpoint',
        title: nls.localize({ key: 'miNewBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&New Breakpoint"),
        submenu: 19 /* MenubarNewBreakpointMenu */,
        order: 2
    });
    // Modify Breakpoints
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '5_breakpoints',
        command: {
            id: debugActions_1.EnableAllBreakpointsAction.ID,
            title: nls.localize({ key: 'miEnableAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "&&Enable All Breakpoints")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '5_breakpoints',
        command: {
            id: debugActions_1.DisableAllBreakpointsAction.ID,
            title: nls.localize({ key: 'miDisableAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "Disable A&&ll Breakpoints")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: '5_breakpoints',
        command: {
            id: debugActions_1.RemoveAllBreakpointsAction.ID,
            title: nls.localize({ key: 'miRemoveAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "Remove &&All Breakpoints")
        },
        order: 3
    });
    // Install Debuggers
    actions_1.MenuRegistry.appendMenuItem(13 /* MenubarDebugMenu */, {
        group: 'z_install',
        command: {
            id: 'debug.installAdditionalDebuggers',
            title: nls.localize({ key: 'miInstallAdditionalDebuggers', comment: ['&& denotes a mnemonic'] }, "&&Install Additional Debuggers...")
        },
        order: 1
    });
    // Touch Bar
    if (platform_2.isMacintosh) {
        const registerTouchBarEntry = (id, title, order, when, icon) => {
            actions_1.MenuRegistry.appendMenuItem(35 /* TouchBarContext */, {
                command: {
                    id, title, iconLocation: { dark: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/debug/electron-browser/media/${icon}`)) }
                },
                when,
                group: '9_debug',
                order
            });
        };
        registerTouchBarEntry(debugActions_1.StartAction.ID, debugActions_1.StartAction.LABEL, 0, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated(), 'continue-tb.png');
        registerTouchBarEntry(debugActions_1.RunAction.ID, debugActions_1.RunAction.LABEL, 1, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated(), 'continue-without-debugging-tb.png');
        registerTouchBarEntry(debugActions_1.ContinueAction.ID, debugActions_1.ContinueAction.LABEL, 0, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), 'continue-tb.png');
        registerTouchBarEntry(debugActions_1.PauseAction.ID, debugActions_1.PauseAction.LABEL, 1, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, contextkey_1.ContextKeyExpr.notEquals('debugState', 'stopped')), 'pause-tb.png');
        registerTouchBarEntry(debugActions_1.StepOverAction.ID, debugActions_1.StepOverAction.LABEL, 2, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), 'stepover-tb.png');
        registerTouchBarEntry(debugActions_1.StepIntoAction.ID, debugActions_1.StepIntoAction.LABEL, 3, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), 'stepinto-tb.png');
        registerTouchBarEntry(debugActions_1.StepOutAction.ID, debugActions_1.StepOutAction.LABEL, 4, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), 'stepout-tb.png');
        registerTouchBarEntry(debugActions_1.RestartAction.ID, debugActions_1.RestartAction.LABEL, 5, debug_1.CONTEXT_IN_DEBUG_MODE, 'restart-tb.png');
        registerTouchBarEntry(debugActions_1.StopAction.ID, debugActions_1.StopAction.LABEL, 6, debug_1.CONTEXT_IN_DEBUG_MODE, 'stop-tb.png');
    }
});
//# sourceMappingURL=debug.contribution.js.map