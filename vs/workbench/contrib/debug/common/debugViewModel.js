/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/contrib/debug/common/debug"], function (require, exports, event_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewModel {
        constructor(contextKeyService) {
            this.firstSessionStart = true;
            this._onDidFocusSession = new event_1.Emitter();
            this._onDidFocusStackFrame = new event_1.Emitter();
            this._onDidSelectExpression = new event_1.Emitter();
            this.multiSessionView = false;
            this.expressionSelectedContextKey = debug_1.CONTEXT_EXPRESSION_SELECTED.bindTo(contextKeyService);
            this.breakpointSelectedContextKey = debug_1.CONTEXT_BREAKPOINT_SELECTED.bindTo(contextKeyService);
            this.loadedScriptsSupportedContextKey = debug_1.CONTEXT_LOADED_SCRIPTS_SUPPORTED.bindTo(contextKeyService);
        }
        getId() {
            return 'root';
        }
        get focusedSession() {
            return this._focusedSession;
        }
        get focusedThread() {
            return this._focusedThread;
        }
        get focusedStackFrame() {
            return this._focusedStackFrame;
        }
        setFocus(stackFrame, thread, session, explicit) {
            const shouldEmitForStackFrame = this._focusedStackFrame !== stackFrame;
            const shouldEmitForSession = this._focusedSession !== session;
            this._focusedStackFrame = stackFrame;
            this._focusedThread = thread;
            this._focusedSession = session;
            this.loadedScriptsSupportedContextKey.set(session ? !!session.capabilities.supportsLoadedSourcesRequest : false);
            if (shouldEmitForSession) {
                this._onDidFocusSession.fire(session);
            }
            if (shouldEmitForStackFrame) {
                this._onDidFocusStackFrame.fire({ stackFrame, explicit });
            }
        }
        get onDidFocusSession() {
            return this._onDidFocusSession.event;
        }
        get onDidFocusStackFrame() {
            return this._onDidFocusStackFrame.event;
        }
        getSelectedExpression() {
            return this.selectedExpression;
        }
        setSelectedExpression(expression) {
            this.selectedExpression = expression;
            this.expressionSelectedContextKey.set(!!expression);
            this._onDidSelectExpression.fire(expression);
        }
        get onDidSelectExpression() {
            return this._onDidSelectExpression.event;
        }
        getSelectedFunctionBreakpoint() {
            return this.selectedFunctionBreakpoint;
        }
        setSelectedFunctionBreakpoint(functionBreakpoint) {
            this.selectedFunctionBreakpoint = functionBreakpoint;
            this.breakpointSelectedContextKey.set(!!functionBreakpoint);
        }
        isMultiSessionView() {
            return this.multiSessionView;
        }
        setMultiSessionView(isMultiSessionView) {
            this.multiSessionView = isMultiSessionView;
        }
    }
    exports.ViewModel = ViewModel;
});
//# sourceMappingURL=debugViewModel.js.map