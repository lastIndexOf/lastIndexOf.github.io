/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/base/common/platform"], function (require, exports, contextkey_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IsMacContext = new contextkey_1.RawContextKey('isMac', platform_1.isMacintosh);
    exports.IsLinuxContext = new contextkey_1.RawContextKey('isLinux', platform_1.isLinux);
    exports.IsWindowsContext = new contextkey_1.RawContextKey('isWindows', platform_1.isWindows);
    exports.HasMacNativeTabsContext = new contextkey_1.RawContextKey('hasMacNativeTabs', false);
    exports.SupportsWorkspacesContext = new contextkey_1.RawContextKey('supportsWorkspaces', true);
    exports.SupportsOpenFileFolderContext = new contextkey_1.RawContextKey('supportsOpenFileFolder', platform_1.isMacintosh);
    exports.IsDevelopmentContext = new contextkey_1.RawContextKey('isDevelopment', false);
    exports.WorkbenchStateContext = new contextkey_1.RawContextKey('workbenchState', undefined);
    exports.WorkspaceFolderCountContext = new contextkey_1.RawContextKey('workspaceFolderCount', 0);
});
//# sourceMappingURL=contextkeys.js.map