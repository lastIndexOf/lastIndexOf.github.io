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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debug", "electron", "vs/base/common/platform"], function (require, exports, nls, actions_1, debugModel_1, debug_1, electron_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CopyValueAction = class CopyValueAction extends actions_1.Action {
        constructor(id, label, value, context, debugService) {
            super(id, label, 'debug-action copy-value');
            this.value = value;
            this.context = context;
            this.debugService = debugService;
            this._enabled = typeof this.value === 'string' || (this.value instanceof debugModel_1.Variable && !!this.value.evaluateName);
        }
        run() {
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            const session = this.debugService.getViewModel().focusedSession;
            if (this.value instanceof debugModel_1.Variable && stackFrame && session && this.value.evaluateName) {
                return session.evaluate(this.value.evaluateName, stackFrame.frameId, this.context).then(result => {
                    electron_1.clipboard.writeText(result.body.result);
                }, err => electron_1.clipboard.writeText(this.value.value));
            }
            electron_1.clipboard.writeText(this.value);
            return Promise.resolve(undefined);
        }
    };
    CopyValueAction.ID = 'workbench.debug.viewlet.action.copyValue';
    CopyValueAction.LABEL = nls.localize('copyValue', "Copy Value");
    CopyValueAction = __decorate([
        __param(4, debug_1.IDebugService)
    ], CopyValueAction);
    exports.CopyValueAction = CopyValueAction;
    class CopyEvaluatePathAction extends actions_1.Action {
        constructor(id, label, value) {
            super(id, label);
            this.value = value;
            this._enabled = this.value && !!this.value.evaluateName;
        }
        run() {
            electron_1.clipboard.writeText(this.value.evaluateName);
            return Promise.resolve(undefined);
        }
    }
    CopyEvaluatePathAction.ID = 'workbench.debug.viewlet.action.copyEvaluatePath';
    CopyEvaluatePathAction.LABEL = nls.localize('copyAsExpression', "Copy as Expression");
    exports.CopyEvaluatePathAction = CopyEvaluatePathAction;
    class CopyAction extends actions_1.Action {
        run() {
            electron_1.clipboard.writeText(window.getSelection().toString());
            return Promise.resolve(undefined);
        }
    }
    CopyAction.ID = 'workbench.debug.action.copy';
    CopyAction.LABEL = nls.localize('copy', "Copy");
    exports.CopyAction = CopyAction;
    const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
    class CopyStackTraceAction extends actions_1.Action {
        run(frame) {
            electron_1.clipboard.writeText(frame.thread.getCallStack().map(sf => sf.toString()).join(lineDelimiter));
            return Promise.resolve(undefined);
        }
    }
    CopyStackTraceAction.ID = 'workbench.action.debug.copyStackTrace';
    CopyStackTraceAction.LABEL = nls.localize('copyStackTrace', "Copy Call Stack");
    exports.CopyStackTraceAction = CopyStackTraceAction;
});
//# sourceMappingURL=electronDebugActions.js.map