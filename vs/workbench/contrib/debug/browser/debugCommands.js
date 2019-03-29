/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/ui/list/listWidget", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/viewlet/browser/viewlet", "vs/editor/browser/editorBrowser", "vs/platform/actions/common/actions", "vs/workbench/services/editor/common/editorService", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/panel", "vs/platform/commands/common/commands", "vs/base/common/errors"], function (require, exports, nls, listWidget_1, keybindingsRegistry_1, listService_1, workspace_1, debug_1, debugModel_1, extensions_1, viewlet_1, editorBrowser_1, actions_1, editorService_1, editorContextKeys_1, contextkey_1, breakpointsView_1, notification_1, contextkeys_1, panel_1, commands_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ADD_CONFIGURATION_ID = 'debug.addConfiguration';
    exports.TOGGLE_INLINE_BREAKPOINT_ID = 'editor.debug.action.toggleInlineBreakpoint';
    function registerCommands() {
        commands_1.CommandsRegistry.registerCommand({
            id: 'debug.startFromConfig',
            handler: (accessor, config) => {
                const debugService = accessor.get(debug_1.IDebugService);
                debugService.startDebugging(undefined, config).then(undefined, errors_1.onUnexpectedError);
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.toggleBreakpoint',
            weight: 200 /* WorkbenchContrib */ + 5,
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
            primary: 10 /* Space */,
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const list = listService.lastFocusedList;
                if (list instanceof listWidget_1.List) {
                    const focused = list.getFocusedElements();
                    if (focused && focused.length) {
                        debugService.enableOrDisableBreakpoints(!focused[0].enabled, focused[0]);
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.enableOrDisableBreakpoint',
            weight: 200 /* WorkbenchContrib */,
            primary: undefined,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            handler: (accessor) => {
                const debugService = accessor.get(debug_1.IDebugService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const widget = editorService.activeTextEditorWidget;
                if (editorBrowser_1.isCodeEditor(widget)) {
                    const model = widget.getModel();
                    if (model) {
                        const position = widget.getPosition();
                        if (position) {
                            const bps = debugService.getModel().getBreakpoints({ uri: model.uri, lineNumber: position.lineNumber });
                            if (bps.length) {
                                debugService.enableOrDisableBreakpoints(!bps[0].enabled, bps[0]);
                            }
                        }
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.renameWatchExpression',
            weight: 200 /* WorkbenchContrib */ + 5,
            when: debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED,
            primary: 60 /* F2 */,
            mac: { primary: 3 /* Enter */ },
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const focused = listService.lastFocusedList;
                if (focused) {
                    const elements = focused.getFocus();
                    if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Expression) {
                        debugService.getViewModel().setSelectedExpression(elements[0]);
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.setVariable',
            weight: 200 /* WorkbenchContrib */ + 5,
            when: debug_1.CONTEXT_VARIABLES_FOCUSED,
            primary: 60 /* F2 */,
            mac: { primary: 3 /* Enter */ },
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const focused = listService.lastFocusedList;
                if (focused) {
                    const elements = focused.getFocus();
                    if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Variable) {
                        debugService.getViewModel().setSelectedExpression(elements[0]);
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.removeWatchExpression',
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED, debug_1.CONTEXT_EXPRESSION_SELECTED.toNegated()),
            primary: 20 /* Delete */,
            mac: { primary: 2048 /* CtrlCmd */ | 1 /* Backspace */ },
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const focused = listService.lastFocusedList;
                if (focused) {
                    const elements = focused.getFocus();
                    if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Expression) {
                        debugService.removeWatchExpressions(elements[0].getId());
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.removeBreakpoint',
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_FOCUSED, debug_1.CONTEXT_BREAKPOINT_SELECTED.toNegated()),
            primary: 20 /* Delete */,
            mac: { primary: 2048 /* CtrlCmd */ | 1 /* Backspace */ },
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const list = listService.lastFocusedList;
                if (list instanceof listWidget_1.List) {
                    const focused = list.getFocusedElements();
                    const element = focused.length ? focused[0] : undefined;
                    if (element instanceof debugModel_1.Breakpoint) {
                        debugService.removeBreakpoints(element.getId());
                    }
                    else if (element instanceof debugModel_1.FunctionBreakpoint) {
                        debugService.removeFunctionBreakpoints(element.getId());
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.installAdditionalDebuggers',
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: (accessor) => {
                const viewletService = accessor.get(viewlet_1.IViewletService);
                return viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                    .then(viewlet => viewlet)
                    .then(viewlet => {
                    viewlet.search('tag:debuggers @sort:installs');
                    viewlet.focus();
                });
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.ADD_CONFIGURATION_ID,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: (accessor, launchUri) => {
                const manager = accessor.get(debug_1.IDebugService).getConfigurationManager();
                if (accessor.get(workspace_1.IWorkspaceContextService).getWorkbenchState() === 1 /* EMPTY */) {
                    accessor.get(notification_1.INotificationService).info(nls.localize('noFolderDebugConfig', "Please first open a folder in order to do advanced debug configuration."));
                    return undefined;
                }
                const launch = manager.getLaunches().filter(l => l.uri.toString() === launchUri).pop() || manager.selectedConfiguration.launch;
                return launch.openConfigFile(false, false).then(({ editor, created }) => {
                    if (editor && !created) {
                        const codeEditor = editor.getControl();
                        if (codeEditor) {
                            return codeEditor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID).addLaunchConfiguration();
                        }
                    }
                    return undefined;
                });
            }
        });
        const inlineBreakpointHandler = (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const widget = editorService.activeTextEditorWidget;
            if (editorBrowser_1.isCodeEditor(widget)) {
                const position = widget.getPosition();
                if (!position || !widget.hasModel()) {
                    return undefined;
                }
                const modelUri = widget.getModel().uri;
                const bp = debugService.getModel().getBreakpoints({ lineNumber: position.lineNumber, uri: modelUri })
                    .filter(bp => (bp.column === position.column || !bp.column && position.column <= 1)).pop();
                if (bp) {
                    return undefined;
                }
                if (debugService.getConfigurationManager().canSetBreakpointsIn(widget.getModel())) {
                    return debugService.addBreakpoints(modelUri, [{ lineNumber: position.lineNumber, column: position.column > 1 ? position.column : undefined }], 'debugCommands.inlineBreakpointCommand');
                }
            }
            return undefined;
        };
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            weight: 200 /* WorkbenchContrib */,
            primary: 1024 /* Shift */ | 67 /* F9 */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
            handler: inlineBreakpointHandler
        });
        actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
            command: {
                id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
                title: { value: nls.localize('inlineBreakpoint', "Inline Breakpoint"), original: 'Debug: Inline Breakpoint' },
                category: nls.localize('debug', "Debug")
            }
        });
        actions_1.MenuRegistry.appendMenuItem(7 /* EditorContext */, {
            command: {
                id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
                title: nls.localize('addInlineBreakpoint', "Add Inline Breakpoint")
            },
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, panel_1.PanelFocusContext.toNegated(), editorContextKeys_1.EditorContextKeys.editorTextFocus),
            group: 'debug',
            order: 1
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.openBreakpointToSide',
            weight: 200 /* WorkbenchContrib */,
            when: debug_1.CONTEXT_BREAKPOINTS_FOCUSED,
            primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
            secondary: [512 /* Alt */ | 3 /* Enter */],
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const list = listService.lastFocusedList;
                if (list instanceof listWidget_1.List) {
                    const focus = list.getFocusedElements();
                    if (focus.length && focus[0] instanceof debugModel_1.Breakpoint) {
                        return breakpointsView_1.openBreakpointSource(focus[0], true, false, accessor.get(debug_1.IDebugService), accessor.get(editorService_1.IEditorService));
                    }
                }
                return undefined;
            }
        });
    }
    exports.registerCommands = registerCommands;
});
//# sourceMappingURL=debugCommands.js.map