/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IHistoryMainService = instantiation_1.createDecorator('historyMainService');
    function isRecentWorkspace(curr) {
        return !!curr['workspace'];
    }
    exports.isRecentWorkspace = isRecentWorkspace;
    function isRecentFolder(curr) {
        return !!curr['folderUri'];
    }
    exports.isRecentFolder = isRecentFolder;
    function isRecentFile(curr) {
        return !!curr['fileUri'];
    }
    exports.isRecentFile = isRecentFile;
});
//# sourceMappingURL=history.js.map