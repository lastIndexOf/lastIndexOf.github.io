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
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/htmlContentRenderer", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/widget", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/toggleTabFocusMode/toggleTabFocusMode", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./accessibilityHelp"], function (require, exports, nls, browser, dom, fastDomNode_1, htmlContentRenderer_1, aria_1, widget_1, lifecycle_1, platform, strings, uri_1, editorExtensions_1, editorContextKeys_1, toggleTabFocusMode_1, contextkey_1, instantiation_1, keybinding_1, opener_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CONTEXT_ACCESSIBILITY_WIDGET_VISIBLE = new contextkey_1.RawContextKey('accessibilityHelpWidgetVisible', false);
    let AccessibilityHelpController = class AccessibilityHelpController extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this._editor = editor;
            this._widget = this._register(instantiationService.createInstance(AccessibilityHelpWidget, this._editor));
        }
        static get(editor) {
            return editor.getContribution(AccessibilityHelpController.ID);
        }
        getId() {
            return AccessibilityHelpController.ID;
        }
        show() {
            this._widget.show();
        }
        hide() {
            this._widget.hide();
        }
    };
    AccessibilityHelpController.ID = 'editor.contrib.accessibilityHelpController';
    AccessibilityHelpController = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], AccessibilityHelpController);
    const nlsNoSelection = nls.localize("noSelection", "No selection");
    const nlsSingleSelectionRange = nls.localize("singleSelectionRange", "Line {0}, Column {1} ({2} selected)");
    const nlsSingleSelection = nls.localize("singleSelection", "Line {0}, Column {1}");
    const nlsMultiSelectionRange = nls.localize("multiSelectionRange", "{0} selections ({1} characters selected)");
    const nlsMultiSelection = nls.localize("multiSelection", "{0} selections");
    function getSelectionLabel(selections, charactersSelected) {
        if (!selections || selections.length === 0) {
            return nlsNoSelection;
        }
        if (selections.length === 1) {
            if (charactersSelected) {
                return strings.format(nlsSingleSelectionRange, selections[0].positionLineNumber, selections[0].positionColumn, charactersSelected);
            }
            return strings.format(nlsSingleSelection, selections[0].positionLineNumber, selections[0].positionColumn);
        }
        if (charactersSelected) {
            return strings.format(nlsMultiSelectionRange, selections.length, charactersSelected);
        }
        if (selections.length > 0) {
            return strings.format(nlsMultiSelection, selections.length);
        }
        return '';
    }
    let AccessibilityHelpWidget = class AccessibilityHelpWidget extends widget_1.Widget {
        constructor(editor, _contextKeyService, _keybindingService, _openerService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._keybindingService = _keybindingService;
            this._openerService = _openerService;
            this._editor = editor;
            this._isVisibleKey = CONTEXT_ACCESSIBILITY_WIDGET_VISIBLE.bindTo(this._contextKeyService);
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._domNode.setClassName('accessibilityHelpWidget');
            this._domNode.setDisplay('none');
            this._domNode.setAttribute('role', 'dialog');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._contentDomNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._contentDomNode.setAttribute('role', 'document');
            this._domNode.appendChild(this._contentDomNode);
            this._isVisible = false;
            this._register(this._editor.onDidLayoutChange(() => {
                if (this._isVisible) {
                    this._layout();
                }
            }));
            // Intentionally not configurable!
            this._register(dom.addStandardDisposableListener(this._contentDomNode.domNode, 'keydown', (e) => {
                if (!this._isVisible) {
                    return;
                }
                if (e.equals(2048 /* CtrlCmd */ | 35 /* KEY_E */)) {
                    aria_1.alert(nls.localize("emergencyConfOn", "Now changing the setting `accessibilitySupport` to 'on'."));
                    this._editor.updateOptions({
                        accessibilitySupport: 'on'
                    });
                    dom.clearNode(this._contentDomNode.domNode);
                    this._buildContent();
                    this._contentDomNode.domNode.focus();
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (e.equals(2048 /* CtrlCmd */ | 38 /* KEY_H */)) {
                    aria_1.alert(nls.localize("openingDocs", "Now opening the Editor Accessibility documentation page."));
                    let url = this._editor.getRawConfiguration().accessibilityHelpUrl;
                    if (typeof url === 'undefined') {
                        url = 'https://go.microsoft.com/fwlink/?linkid=852450';
                    }
                    this._openerService.open(uri_1.URI.parse(url));
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
            this.onblur(this._contentDomNode.domNode, () => {
                this.hide();
            });
            this._editor.addOverlayWidget(this);
        }
        dispose() {
            this._editor.removeOverlayWidget(this);
            super.dispose();
        }
        getId() {
            return AccessibilityHelpWidget.ID;
        }
        getDomNode() {
            return this._domNode.domNode;
        }
        getPosition() {
            return {
                preference: null
            };
        }
        show() {
            if (this._isVisible) {
                return;
            }
            this._isVisible = true;
            this._isVisibleKey.set(true);
            this._layout();
            this._domNode.setDisplay('block');
            this._domNode.setAttribute('aria-hidden', 'false');
            this._contentDomNode.domNode.tabIndex = 0;
            this._buildContent();
            this._contentDomNode.domNode.focus();
        }
        _descriptionForCommand(commandId, msg, noKbMsg) {
            let kb = this._keybindingService.lookupKeybinding(commandId);
            if (kb) {
                return strings.format(msg, kb.getAriaLabel());
            }
            return strings.format(noKbMsg, commandId);
        }
        _buildContent() {
            let opts = this._editor.getConfiguration();
            const selections = this._editor.getSelections();
            let charactersSelected = 0;
            if (selections) {
                const model = this._editor.getModel();
                if (model) {
                    selections.forEach((selection) => {
                        charactersSelected += model.getValueLengthInRange(selection);
                    });
                }
            }
            let text = getSelectionLabel(selections, charactersSelected);
            if (opts.wrappingInfo.inDiffEditor) {
                if (opts.readOnly) {
                    text += nls.localize("readonlyDiffEditor", " in a read-only pane of a diff editor.");
                }
                else {
                    text += nls.localize("editableDiffEditor", " in a pane of a diff editor.");
                }
            }
            else {
                if (opts.readOnly) {
                    text += nls.localize("readonlyEditor", " in a read-only code editor");
                }
                else {
                    text += nls.localize("editableEditor", " in a code editor");
                }
            }
            const turnOnMessage = (platform.isMacintosh
                ? nls.localize("changeConfigToOnMac", "To configure the editor to be optimized for usage with a Screen Reader press Command+E now.")
                : nls.localize("changeConfigToOnWinLinux", "To configure the editor to be optimized for usage with a Screen Reader press Control+E now."));
            switch (opts.accessibilitySupport) {
                case 0 /* Unknown */:
                    text += '\n\n - ' + turnOnMessage;
                    break;
                case 2 /* Enabled */:
                    text += '\n\n - ' + nls.localize("auto_on", "The editor is configured to be optimized for usage with a Screen Reader.");
                    break;
                case 1 /* Disabled */:
                    text += '\n\n - ' + nls.localize("auto_off", "The editor is configured to never be optimized for usage with a Screen Reader, which is not the case at this time.");
                    text += ' ' + turnOnMessage;
                    break;
            }
            const NLS_TAB_FOCUS_MODE_ON = nls.localize("tabFocusModeOnMsg", "Pressing Tab in the current editor will move focus to the next focusable element. Toggle this behavior by pressing {0}.");
            const NLS_TAB_FOCUS_MODE_ON_NO_KB = nls.localize("tabFocusModeOnMsgNoKb", "Pressing Tab in the current editor will move focus to the next focusable element. The command {0} is currently not triggerable by a keybinding.");
            const NLS_TAB_FOCUS_MODE_OFF = nls.localize("tabFocusModeOffMsg", "Pressing Tab in the current editor will insert the tab character. Toggle this behavior by pressing {0}.");
            const NLS_TAB_FOCUS_MODE_OFF_NO_KB = nls.localize("tabFocusModeOffMsgNoKb", "Pressing Tab in the current editor will insert the tab character. The command {0} is currently not triggerable by a keybinding.");
            if (opts.tabFocusMode) {
                text += '\n\n - ' + this._descriptionForCommand(toggleTabFocusMode_1.ToggleTabFocusModeAction.ID, NLS_TAB_FOCUS_MODE_ON, NLS_TAB_FOCUS_MODE_ON_NO_KB);
            }
            else {
                text += '\n\n - ' + this._descriptionForCommand(toggleTabFocusMode_1.ToggleTabFocusModeAction.ID, NLS_TAB_FOCUS_MODE_OFF, NLS_TAB_FOCUS_MODE_OFF_NO_KB);
            }
            const openDocMessage = (platform.isMacintosh
                ? nls.localize("openDocMac", "Press Command+H now to open a browser window with more information related to editor accessibility.")
                : nls.localize("openDocWinLinux", "Press Control+H now to open a browser window with more information related to editor accessibility."));
            text += '\n\n - ' + openDocMessage;
            text += '\n\n' + nls.localize("outroMsg", "You can dismiss this tooltip and return to the editor by pressing Escape or Shift+Escape.");
            this._contentDomNode.domNode.appendChild(htmlContentRenderer_1.renderFormattedText(text));
            // Per https://www.w3.org/TR/wai-aria/roles#document, Authors SHOULD provide a title or label for documents
            this._contentDomNode.domNode.setAttribute('aria-label', text);
        }
        hide() {
            if (!this._isVisible) {
                return;
            }
            this._isVisible = false;
            this._isVisibleKey.reset();
            this._domNode.setDisplay('none');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._contentDomNode.domNode.tabIndex = -1;
            dom.clearNode(this._contentDomNode.domNode);
            this._editor.focus();
        }
        _layout() {
            let editorLayout = this._editor.getLayoutInfo();
            let w = Math.max(5, Math.min(AccessibilityHelpWidget.WIDTH, editorLayout.width - 40));
            let h = Math.max(5, Math.min(AccessibilityHelpWidget.HEIGHT, editorLayout.height - 40));
            this._domNode.setWidth(w);
            this._domNode.setHeight(h);
            let top = Math.round((editorLayout.height - h) / 2);
            this._domNode.setTop(top);
            let left = Math.round((editorLayout.width - w) / 2);
            this._domNode.setLeft(left);
        }
    };
    AccessibilityHelpWidget.ID = 'editor.contrib.accessibilityHelpWidget';
    AccessibilityHelpWidget.WIDTH = 500;
    AccessibilityHelpWidget.HEIGHT = 300;
    AccessibilityHelpWidget = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, opener_1.IOpenerService)
    ], AccessibilityHelpWidget);
    class ShowAccessibilityHelpAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showAccessibilityHelp',
                label: nls.localize("ShowAccessibilityHelpAction", "Show Accessibility Help"),
                alias: 'Show Accessibility Help',
                precondition: null,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: (browser.isIE ? 2048 /* CtrlCmd */ | 59 /* F1 */ : 512 /* Alt */ | 59 /* F1 */),
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            let controller = AccessibilityHelpController.get(editor);
            if (controller) {
                controller.show();
            }
        }
    }
    editorExtensions_1.registerEditorContribution(AccessibilityHelpController);
    editorExtensions_1.registerEditorAction(ShowAccessibilityHelpAction);
    const AccessibilityHelpCommand = editorExtensions_1.EditorCommand.bindToContribution(AccessibilityHelpController.get);
    editorExtensions_1.registerEditorCommand(new AccessibilityHelpCommand({
        id: 'closeAccessibilityHelp',
        precondition: CONTEXT_ACCESSIBILITY_WIDGET_VISIBLE,
        handler: x => x.hide(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 100,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const widgetBackground = theme.getColor(colorRegistry_1.editorWidgetBackground);
        if (widgetBackground) {
            collector.addRule(`.monaco-editor .accessibilityHelpWidget { background-color: ${widgetBackground}; }`);
        }
        const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
        if (widgetShadowColor) {
            collector.addRule(`.monaco-editor .accessibilityHelpWidget { box-shadow: 0 2px 8px ${widgetShadowColor}; }`);
        }
        const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
        if (hcBorder) {
            collector.addRule(`.monaco-editor .accessibilityHelpWidget { border: 2px solid ${hcBorder}; }`);
        }
    });
});
//# sourceMappingURL=accessibilityHelp.js.map