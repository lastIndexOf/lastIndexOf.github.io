/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CodeEditorStateFlag;
    (function (CodeEditorStateFlag) {
        CodeEditorStateFlag[CodeEditorStateFlag["Value"] = 1] = "Value";
        CodeEditorStateFlag[CodeEditorStateFlag["Selection"] = 2] = "Selection";
        CodeEditorStateFlag[CodeEditorStateFlag["Position"] = 4] = "Position";
        CodeEditorStateFlag[CodeEditorStateFlag["Scroll"] = 8] = "Scroll";
    })(CodeEditorStateFlag = exports.CodeEditorStateFlag || (exports.CodeEditorStateFlag = {}));
    class EditorState {
        constructor(editor, flags) {
            this.flags = flags;
            if ((this.flags & 1 /* Value */) !== 0) {
                const model = editor.getModel();
                this.modelVersionId = model ? strings.format('{0}#{1}', model.uri.toString(), model.getVersionId()) : null;
            }
            if ((this.flags & 4 /* Position */) !== 0) {
                this.position = editor.getPosition();
            }
            if ((this.flags & 2 /* Selection */) !== 0) {
                this.selection = editor.getSelection();
            }
            if ((this.flags & 8 /* Scroll */) !== 0) {
                this.scrollLeft = editor.getScrollLeft();
                this.scrollTop = editor.getScrollTop();
            }
        }
        _equals(other) {
            if (!(other instanceof EditorState)) {
                return false;
            }
            const state = other;
            if (this.modelVersionId !== state.modelVersionId) {
                return false;
            }
            if (this.scrollLeft !== state.scrollLeft || this.scrollTop !== state.scrollTop) {
                return false;
            }
            if (!this.position && state.position || this.position && !state.position || this.position && state.position && !this.position.equals(state.position)) {
                return false;
            }
            if (!this.selection && state.selection || this.selection && !state.selection || this.selection && state.selection && !this.selection.equalsRange(state.selection)) {
                return false;
            }
            return true;
        }
        validate(editor) {
            return this._equals(new EditorState(editor, this.flags));
        }
    }
    exports.EditorState = EditorState;
    class StableEditorScrollState {
        constructor(_visiblePosition, _visiblePositionScrollDelta) {
            this._visiblePosition = _visiblePosition;
            this._visiblePositionScrollDelta = _visiblePositionScrollDelta;
        }
        static capture(editor) {
            let visiblePosition = null;
            let visiblePositionScrollDelta = 0;
            if (editor.getScrollTop() !== 0) {
                const visibleRanges = editor.getVisibleRanges();
                if (visibleRanges.length > 0) {
                    visiblePosition = visibleRanges[0].getStartPosition();
                    const visiblePositionScrollTop = editor.getTopForPosition(visiblePosition.lineNumber, visiblePosition.column);
                    visiblePositionScrollDelta = editor.getScrollTop() - visiblePositionScrollTop;
                }
            }
            return new StableEditorScrollState(visiblePosition, visiblePositionScrollDelta);
        }
        restore(editor) {
            if (this._visiblePosition) {
                const visiblePositionScrollTop = editor.getTopForPosition(this._visiblePosition.lineNumber, this._visiblePosition.column);
                editor.setScrollTop(visiblePositionScrollTop + this._visiblePositionScrollDelta);
            }
        }
    }
    exports.StableEditorScrollState = StableEditorScrollState;
});
//# sourceMappingURL=editorState.js.map