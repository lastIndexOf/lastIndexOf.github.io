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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/event", "vs/editor/common/core/position"], function (require, exports, dom_1, actions_1, errors_1, event_1, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeActionContextMenu {
        constructor(_editor, _contextMenuService, _onApplyCodeAction) {
            this._editor = _editor;
            this._contextMenuService = _contextMenuService;
            this._onApplyCodeAction = _onApplyCodeAction;
            this._onDidExecuteCodeAction = new event_1.Emitter();
            this.onDidExecuteCodeAction = this._onDidExecuteCodeAction.event;
        }
        show(actionsToShow, at) {
            return __awaiter(this, void 0, void 0, function* () {
                const codeActions = yield actionsToShow;
                if (!this._editor.getDomNode()) {
                    // cancel when editor went off-dom
                    return Promise.reject(errors_1.canceled());
                }
                this._visible = true;
                const actions = codeActions.actions.map(action => this.codeActionToAction(action));
                this._contextMenuService.showContextMenu({
                    getAnchor: () => {
                        if (position_1.Position.isIPosition(at)) {
                            at = this._toCoords(at);
                        }
                        return at || { x: 0, y: 0 };
                    },
                    getActions: () => actions,
                    onHide: () => {
                        this._visible = false;
                        this._editor.focus();
                    },
                    autoSelectFirstItem: true
                });
            });
        }
        codeActionToAction(action) {
            const id = action.command ? action.command.id : action.title;
            const title = action.title;
            return new actions_1.Action(id, title, undefined, true, () => this._onApplyCodeAction(action)
                .finally(() => this._onDidExecuteCodeAction.fire(undefined)));
        }
        get isVisible() {
            return this._visible;
        }
        _toCoords(position) {
            if (!this._editor.hasModel()) {
                return { x: 0, y: 0 };
            }
            this._editor.revealPosition(position, 1 /* Immediate */);
            this._editor.render();
            // Translate to absolute editor position
            const cursorCoords = this._editor.getScrolledVisiblePosition(position);
            const editorCoords = dom_1.getDomNodePagePosition(this._editor.getDomNode());
            const x = editorCoords.left + cursorCoords.left;
            const y = editorCoords.top + cursorCoords.top + cursorCoords.height;
            return { x, y };
        }
    }
    exports.CodeActionContextMenu = CodeActionContextMenu;
});
//# sourceMappingURL=codeActionWidget.js.map