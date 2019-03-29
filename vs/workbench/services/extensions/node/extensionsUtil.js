/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/extensions/node/extensionsUtil"], function (require, exports, extensionsRegistry_1, extensionsUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isUIExtension(manifest, configurationService) {
        const uiExtensionPoints = extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints().filter(e => e.defaultExtensionKind !== 'workspace').map(e => e.name);
        return extensionsUtil_1.isUIExtension(manifest, uiExtensionPoints, configurationService);
    }
    exports.isUIExtension = isUIExtension;
});
//# sourceMappingURL=extensionsUtil.js.map