/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/cancellation", "vs/base/common/lifecycle"], function (require, exports, instantiation_1, cancellation_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IProgressService = instantiation_1.createDecorator('progressService');
    var ProgressLocation;
    (function (ProgressLocation) {
        ProgressLocation[ProgressLocation["Explorer"] = 1] = "Explorer";
        ProgressLocation[ProgressLocation["Scm"] = 3] = "Scm";
        ProgressLocation[ProgressLocation["Extensions"] = 5] = "Extensions";
        ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
        ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
    })(ProgressLocation = exports.ProgressLocation || (exports.ProgressLocation = {}));
    exports.IProgressService2 = instantiation_1.createDecorator('progressService2');
    exports.emptyProgressRunner = Object.freeze({
        total() { },
        worked() { },
        done() { }
    });
    exports.emptyProgress = Object.freeze({ report() { } });
    class Progress {
        constructor(callback) {
            this._callback = callback;
        }
        get value() {
            return this._value;
        }
        report(item) {
            this._value = item;
            this._callback(this._value);
        }
    }
    exports.Progress = Progress;
    class LongRunningOperation {
        constructor(progressService) {
            this.progressService = progressService;
            this.currentOperationId = 0;
            this.currentOperationDisposables = [];
        }
        start(progressDelay) {
            // Stop any previous operation
            this.stop();
            // Start new
            const newOperationId = ++this.currentOperationId;
            const newOperationToken = new cancellation_1.CancellationTokenSource();
            this.currentProgressTimeout = setTimeout(() => {
                if (newOperationId === this.currentOperationId) {
                    this.currentProgressRunner = this.progressService.show(true);
                }
            }, progressDelay);
            this.currentOperationDisposables.push(lifecycle_1.toDisposable(() => clearTimeout(this.currentProgressTimeout)), lifecycle_1.toDisposable(() => newOperationToken.cancel()), lifecycle_1.toDisposable(() => this.currentProgressRunner ? this.currentProgressRunner.done() : undefined));
            return {
                id: newOperationId,
                token: newOperationToken.token,
                stop: () => this.doStop(newOperationId),
                isCurrent: () => this.currentOperationId === newOperationId
            };
        }
        stop() {
            this.doStop(this.currentOperationId);
        }
        doStop(operationId) {
            if (this.currentOperationId === operationId) {
                this.currentOperationDisposables = lifecycle_1.dispose(this.currentOperationDisposables);
            }
        }
        dispose() {
            this.currentOperationDisposables = lifecycle_1.dispose(this.currentOperationDisposables);
        }
    }
    exports.LongRunningOperation = LongRunningOperation;
});
//# sourceMappingURL=progress.js.map