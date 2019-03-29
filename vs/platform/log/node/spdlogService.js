/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/platform/log/common/log"], function (require, exports, path, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createSpdLogService(processName, logLevel, logsFolder) {
        // Do not crash if spdlog cannot be loaded
        try {
            const _spdlog = require.__$__nodeRequire('spdlog');
            _spdlog.setAsyncMode(8192, 500);
            const logfilePath = path.join(logsFolder, `${processName}.log`);
            const logger = new _spdlog.RotatingLogger(processName, logfilePath, 1024 * 1024 * 5, 6);
            logger.setLevel(0);
            return new SpdLogService(logger, logLevel);
        }
        catch (e) {
            /** Desktop console.error(e); */
            return new log_1.NullLogService();
        }
        return new log_1.NullLogService();
    }
    exports.createSpdLogService = createSpdLogService;
    function createRotatingLogger(name, filename, filesize, filecount) {
        try {
            const _spdlog = require.__$__nodeRequire('spdlog');
            return new _spdlog.RotatingLogger(name, filename, filesize, filecount);
        }
        catch (e) {
            return {
                flush: function () { },
                critical: function (content) { },
                clearFormatters: function () { },
            };
        }
    }
    exports.createRotatingLogger = createRotatingLogger;
    class SpdLogService extends log_1.AbstractLogService {
        constructor(logger, level = log_1.LogLevel.Error) {
            super();
            this.logger = logger;
            this.setLevel(level);
        }
        trace() {
            if (this.getLevel() <= log_1.LogLevel.Trace) {
                this.logger.trace(this.format(arguments));
            }
        }
        debug() {
            if (this.getLevel() <= log_1.LogLevel.Debug) {
                this.logger.debug(this.format(arguments));
            }
        }
        info() {
            if (this.getLevel() <= log_1.LogLevel.Info) {
                this.logger.info(this.format(arguments));
            }
        }
        warn() {
            if (this.getLevel() <= log_1.LogLevel.Warning) {
                this.logger.warn(this.format(arguments));
            }
        }
        error() {
            if (this.getLevel() <= log_1.LogLevel.Error) {
                const arg = arguments[0];
                if (arg instanceof Error) {
                    const array = Array.prototype.slice.call(arguments);
                    array[0] = arg.stack;
                    this.logger.error(this.format(array));
                }
                else {
                    this.logger.error(this.format(arguments));
                }
            }
        }
        critical() {
            if (this.getLevel() <= log_1.LogLevel.Critical) {
                this.logger.critical(this.format(arguments));
            }
        }
        dispose() {
            this.logger.drop();
        }
        format(args) {
            let result = '';
            for (let i = 0; i < args.length; i++) {
                let a = args[i];
                if (typeof a === 'object') {
                    try {
                        a = JSON.stringify(a);
                    }
                    catch (e) { }
                }
                result += (i > 0 ? ' ' : '') + a;
            }
            return result;
        }
    }
});
//# sourceMappingURL=spdlogService.js.map