/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/platform/contextkey/common/contextkey", "./codeAction"], function (require, exports, async_1, event_1, lifecycle_1, range_1, modes_1, contextkey_1, codeAction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SUPPORTED_CODE_ACTIONS = new contextkey_1.RawContextKey('supportedCodeAction', '');
    class CodeActionOracle {
        constructor(_editor, _markerService, _signalChange, _delay = 250, _progressService) {
            this._editor = _editor;
            this._markerService = _markerService;
            this._signalChange = _signalChange;
            this._delay = _delay;
            this._progressService = _progressService;
            this._disposables = [];
            this._autoTriggerTimer = new async_1.TimeoutTimer();
            this._disposables.push(this._markerService.onMarkerChanged(e => this._onMarkerChanges(e)), this._editor.onDidChangeCursorPosition(() => this._onCursorChange()));
        }
        dispose() {
            this._disposables = lifecycle_1.dispose(this._disposables);
            this._autoTriggerTimer.cancel();
        }
        trigger(trigger) {
            const selection = this._getRangeOfSelectionUnlessWhitespaceEnclosed(trigger);
            return this._createEventAndSignalChange(trigger, selection);
        }
        _onMarkerChanges(resources) {
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            if (resources.some(resource => resource.toString() === model.uri.toString())) {
                this._autoTriggerTimer.cancelAndSet(() => {
                    this.trigger({ type: 'auto' });
                }, this._delay);
            }
        }
        _onCursorChange() {
            this._autoTriggerTimer.cancelAndSet(() => {
                this.trigger({ type: 'auto' });
            }, this._delay);
        }
        _getRangeOfMarker(selection) {
            const model = this._editor.getModel();
            if (!model) {
                return undefined;
            }
            for (const marker of this._markerService.read({ resource: model.uri })) {
                if (range_1.Range.intersectRanges(marker, selection)) {
                    return range_1.Range.lift(marker);
                }
            }
            return undefined;
        }
        _getRangeOfSelectionUnlessWhitespaceEnclosed(trigger) {
            if (!this._editor.hasModel()) {
                return undefined;
            }
            const model = this._editor.getModel();
            const selection = this._editor.getSelection();
            if (selection.isEmpty() && trigger.type === 'auto') {
                const { lineNumber, column } = selection.getPosition();
                const line = model.getLineContent(lineNumber);
                if (line.length === 0) {
                    // empty line
                    return undefined;
                }
                else if (column === 1) {
                    // look only right
                    if (/\s/.test(line[0])) {
                        return undefined;
                    }
                }
                else if (column === model.getLineMaxColumn(lineNumber)) {
                    // look only left
                    if (/\s/.test(line[line.length - 1])) {
                        return undefined;
                    }
                }
                else {
                    // look left and right
                    if (/\s/.test(line[column - 2]) && /\s/.test(line[column - 1])) {
                        return undefined;
                    }
                }
            }
            return selection ? selection : undefined;
        }
        _createEventAndSignalChange(trigger, selection) {
            if (!selection) {
                // cancel
                this._signalChange(CodeActionsState.Empty);
                return Promise.resolve(undefined);
            }
            else {
                const model = this._editor.getModel();
                if (!model) {
                    // cancel
                    this._signalChange(CodeActionsState.Empty);
                    return Promise.resolve(undefined);
                }
                const markerRange = this._getRangeOfMarker(selection);
                const position = markerRange ? markerRange.getStartPosition() : selection.getStartPosition();
                const actions = async_1.createCancelablePromise(token => codeAction_1.getCodeActions(model, selection, trigger, token));
                if (this._progressService && trigger.type === 'manual') {
                    this._progressService.showWhile(actions, 250);
                }
                this._signalChange(new CodeActionsState.Triggered(trigger, selection, position, actions));
                return actions;
            }
        }
    }
    exports.CodeActionOracle = CodeActionOracle;
    var CodeActionsState;
    (function (CodeActionsState) {
        let Type;
        (function (Type) {
            Type[Type["Empty"] = 0] = "Empty";
            Type[Type["Triggered"] = 1] = "Triggered";
        })(Type = CodeActionsState.Type || (CodeActionsState.Type = {}));
        CodeActionsState.Empty = new class {
            constructor() {
                this.type = 0 /* Empty */;
            }
        };
        class Triggered {
            constructor(trigger, rangeOrSelection, position, actions) {
                this.trigger = trigger;
                this.rangeOrSelection = rangeOrSelection;
                this.position = position;
                this.actions = actions;
                this.type = 1 /* Triggered */;
            }
        }
        CodeActionsState.Triggered = Triggered;
    })(CodeActionsState = exports.CodeActionsState || (exports.CodeActionsState = {}));
    class CodeActionModel {
        constructor(_editor, _markerService, contextKeyService, _progressService) {
            this._editor = _editor;
            this._markerService = _markerService;
            this._progressService = _progressService;
            this._state = CodeActionsState.Empty;
            this._onDidChangeState = new event_1.Emitter();
            this._disposables = [];
            this._supportedCodeActions = exports.SUPPORTED_CODE_ACTIONS.bindTo(contextKeyService);
            this._disposables.push(this._editor.onDidChangeModel(() => this._update()));
            this._disposables.push(this._editor.onDidChangeModelLanguage(() => this._update()));
            this._disposables.push(modes_1.CodeActionProviderRegistry.onDidChange(() => this._update()));
            this._update();
        }
        dispose() {
            this._disposables = lifecycle_1.dispose(this._disposables);
            lifecycle_1.dispose(this._codeActionOracle);
        }
        get onDidChangeState() {
            return this._onDidChangeState.event;
        }
        _update() {
            if (this._codeActionOracle) {
                this._codeActionOracle.dispose();
                this._codeActionOracle = undefined;
            }
            if (this._state.type === 1 /* Triggered */) {
                this._state.actions.cancel();
            }
            this.setState(CodeActionsState.Empty);
            const model = this._editor.getModel();
            if (model
                && modes_1.CodeActionProviderRegistry.has(model)
                && !this._editor.getConfiguration().readOnly) {
                const supportedActions = [];
                for (const provider of modes_1.CodeActionProviderRegistry.all(model)) {
                    if (Array.isArray(provider.providedCodeActionKinds)) {
                        supportedActions.push(...provider.providedCodeActionKinds);
                    }
                }
                this._supportedCodeActions.set(supportedActions.join(' '));
                this._codeActionOracle = new CodeActionOracle(this._editor, this._markerService, newState => this.setState(newState), undefined, this._progressService);
                this._codeActionOracle.trigger({ type: 'auto' });
            }
            else {
                this._supportedCodeActions.reset();
            }
        }
        trigger(trigger) {
            if (this._codeActionOracle) {
                return this._codeActionOracle.trigger(trigger);
            }
            return Promise.resolve(undefined);
        }
        setState(newState) {
            if (newState === this._state) {
                return;
            }
            this._state = newState;
            this._onDidChangeState.fire(newState);
        }
    }
    exports.CodeActionModel = CodeActionModel;
});
//# sourceMappingURL=codeActionModel.js.map