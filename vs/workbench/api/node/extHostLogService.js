/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/platform/log/common/log", "vs/platform/log/node/spdlogService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri"], function (require, exports, path_1, log_1, spdlogService_1, extensions_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostLogService extends log_1.DelegatedLogService {
        constructor(logLevel, logsPath) {
            super(spdlogService_1.createSpdLogService(extensions_1.ExtensionHostLogFileName, logLevel, logsPath));
            this._logsPath = logsPath;
            this.logFile = uri_1.URI.file(path_1.join(logsPath, `${extensions_1.ExtensionHostLogFileName}.log`));
        }
        $setLevel(level) {
            this.setLevel(level);
        }
        getLogDirectory(extensionID) {
            return path_1.join(this._logsPath, extensionID.value);
        }
    }
    exports.ExtHostLogService = ExtHostLogService;
});
//# sourceMappingURL=extHostLogService.js.map