/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/actions", "vs/workbench/common/editor", "vs/workbench/contrib/webview/electron-browser/webviewEditorInputFactory", "./webviewCommands", "./webviewEditor", "./webviewEditorInput", "./webviewEditorService", "vs/platform/contextkey/common/contextkeys", "vs/base/common/platform"], function (require, exports, nls_1, actions_1, contextkey_1, descriptors_1, extensions_1, platform_1, editor_1, actions_2, editor_2, webviewEditorInputFactory_1, webviewCommands_1, webviewEditor_1, webviewEditorInput_1, webviewEditorService_1, contextkeys_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (platform_1.Registry.as(editor_1.Extensions.Editors)).registerEditor(new editor_1.EditorDescriptor(webviewEditor_1.WebviewEditor, webviewEditor_1.WebviewEditor.ID, nls_1.localize('webview.editor.label', "webview editor")), [new descriptors_1.SyncDescriptor(webviewEditorInput_1.WebviewEditorInput)]);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(webviewEditorInputFactory_1.WebviewEditorInputFactory.ID, webviewEditorInputFactory_1.WebviewEditorInputFactory);
    extensions_1.registerSingleton(webviewEditorService_1.IWebviewEditorService, webviewEditorService_1.WebviewEditorService, true);
    const webviewDeveloperCategory = nls_1.localize('developer', "Developer");
    const actionRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    function registerWebViewCommands(editorId) {
        const contextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', editorId), contextkey_1.ContextKeyExpr.not('editorFocus') /* https://github.com/Microsoft/vscode/issues/58668 */);
        const showNextFindWidgetCommand = new webviewCommands_1.ShowWebViewEditorFindWidgetCommand({
            id: webviewCommands_1.ShowWebViewEditorFindWidgetCommand.ID,
            precondition: contextKeyExpr,
            kbOpts: {
                primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
                weight: 100 /* EditorContrib */
            }
        });
        showNextFindWidgetCommand.register();
        (new webviewCommands_1.HideWebViewEditorFindCommand({
            id: webviewCommands_1.HideWebViewEditorFindCommand.ID,
            precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webviewEditor_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE),
            kbOpts: {
                primary: 9 /* Escape */,
                weight: 100 /* EditorContrib */
            }
        })).register();
        (new webviewCommands_1.SelectAllWebviewEditorCommand({
            id: webviewCommands_1.SelectAllWebviewEditorCommand.ID,
            precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
            kbOpts: {
                primary: 2048 /* CtrlCmd */ | 31 /* KEY_A */,
                weight: 100 /* EditorContrib */
            }
        })).register();
        // These commands are only needed on MacOS where we have to disable the menu bar commands
        if (platform_2.isMacintosh) {
            (new webviewCommands_1.CopyWebviewEditorCommand({
                id: webviewCommands_1.CopyWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
                    weight: 100 /* EditorContrib */
                }
            })).register();
            (new webviewCommands_1.PasteWebviewEditorCommand({
                id: webviewCommands_1.PasteWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
                    weight: 100 /* EditorContrib */
                }
            })).register();
            (new webviewCommands_1.CutWebviewEditorCommand({
                id: webviewCommands_1.CutWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
                    weight: 100 /* EditorContrib */
                }
            })).register();
            (new webviewCommands_1.UndoWebviewEditorCommand({
                id: webviewCommands_1.UndoWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 56 /* KEY_Z */,
                    weight: 100 /* EditorContrib */
                }
            })).register();
            (new webviewCommands_1.RedoWebviewEditorCommand({
                id: webviewCommands_1.RedoWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 55 /* KEY_Y */,
                    secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */],
                    mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */ },
                    weight: 100 /* EditorContrib */
                }
            })).register();
        }
    }
    exports.registerWebViewCommands = registerWebViewCommands;
    registerWebViewCommands(webviewEditor_1.WebviewEditor.ID);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(webviewCommands_1.OpenWebviewDeveloperToolsAction, webviewCommands_1.OpenWebviewDeveloperToolsAction.ID, webviewCommands_1.OpenWebviewDeveloperToolsAction.LABEL), 'Webview Tools', webviewDeveloperCategory);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(webviewCommands_1.ReloadWebviewAction, webviewCommands_1.ReloadWebviewAction.ID, webviewCommands_1.ReloadWebviewAction.LABEL), 'Reload Webview', webviewDeveloperCategory);
});
//# sourceMappingURL=webview.contribution.js.map