/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/base/common/objects"], function (require, exports, arrays_1, platform_1, lifecycle_1, Errors, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ErrorEvent;
    (function (ErrorEvent) {
        function compare(a, b) {
            if (a.callstack < b.callstack) {
                return -1;
            }
            else if (a.callstack > b.callstack) {
                return 1;
            }
            return 0;
        }
        ErrorEvent.compare = compare;
    })(ErrorEvent || (ErrorEvent = {}));
    class ErrorTelemetry {
        constructor(telemetryService, flushDelay = ErrorTelemetry.ERROR_FLUSH_TIMEOUT) {
            this._flushHandle = -1;
            this._buffer = [];
            this._disposables = [];
            this._telemetryService = telemetryService;
            this._flushDelay = flushDelay;
            // (1) check for unexpected but handled errors
            const unbind = Errors.errorHandler.addListener((err) => this._onErrorEvent(err));
            this._disposables.push(lifecycle_1.toDisposable(unbind));
            // (2) check for uncaught global errors
            let oldOnError;
            let that = this;
            if (typeof platform_1.globals.onerror === 'function') {
                oldOnError = platform_1.globals.onerror;
            }
            platform_1.globals.onerror = function (message, filename, line, column, e) {
                that._onUncaughtError(message, filename, line, column, e);
                if (oldOnError) {
                    oldOnError.apply(this, arguments);
                }
            };
            this._disposables.push(lifecycle_1.toDisposable(function () {
                if (oldOnError) {
                    platform_1.globals.onerror = oldOnError;
                }
            }));
        }
        dispose() {
            clearTimeout(this._flushHandle);
            this._flushBuffer();
            this._disposables = lifecycle_1.dispose(this._disposables);
        }
        _onErrorEvent(err) {
            if (!err) {
                return;
            }
            // unwrap nested errors from loader
            if (err.detail && err.detail.stack) {
                err = err.detail;
            }
            // work around behavior in workerServer.ts that breaks up Error.stack
            let callstack = Array.isArray(err.stack) ? err.stack.join('\n') : err.stack;
            let msg = err.message ? err.message : objects_1.safeStringify(err);
            // errors without a stack are not useful telemetry
            if (!callstack) {
                return;
            }
            this._enqueue({ msg, callstack });
        }
        _onUncaughtError(msg, file, line, column, err) {
            let data = {
                callstack: msg,
                msg,
                file,
                line,
                column
            };
            if (err) {
                let { name, message, stack } = err;
                data.uncaught_error_name = name;
                if (message) {
                    data.uncaught_error_msg = message;
                }
                if (stack) {
                    data.callstack = Array.isArray(err.stack)
                        ? err.stack = err.stack.join('\n')
                        : err.stack;
                }
            }
            this._enqueue(data);
        }
        _enqueue(e) {
            const idx = arrays_1.binarySearch(this._buffer, e, ErrorEvent.compare);
            if (idx < 0) {
                e.count = 1;
                this._buffer.splice(~idx, 0, e);
            }
            else {
                if (!this._buffer[idx].count) {
                    this._buffer[idx].count = 0;
                }
                this._buffer[idx].count += 1;
            }
            if (this._flushHandle === -1) {
                this._flushHandle = setTimeout(() => {
                    this._flushBuffer();
                    this._flushHandle = -1;
                }, this._flushDelay);
            }
        }
        _flushBuffer() {
            for (let error of this._buffer) {
                /* __GDPR__
                "UnhandledError" : {
                        "${include}": [ "${ErrorEvent}" ]
                    }
                */
                this._telemetryService.publicLog('UnhandledError', error, true);
            }
            this._buffer.length = 0;
        }
    }
    ErrorTelemetry.ERROR_FLUSH_TIMEOUT = 5 * 1000;
    exports.default = ErrorTelemetry;
});
//# sourceMappingURL=errorTelemetry.js.map