/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/arrays", "vs/platform/product/node/product"], function (require, exports, extensionManagementUtil_1, arrays_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isUIExtension(manifest, uiContributions, configurationService) {
        const extensionId = extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name);
        const configuredUIExtensions = configurationService.getValue('_workbench.uiExtensions') || [];
        if (configuredUIExtensions.length) {
            if (configuredUIExtensions.indexOf(extensionId) !== -1) {
                return true;
            }
            if (configuredUIExtensions.indexOf(`-${extensionId}`) !== -1) {
                return false;
            }
        }
        switch (manifest.extensionKind) {
            case 'ui': return true;
            case 'workspace': return false;
            default: {
                if (arrays_1.isNonEmptyArray(product_1.default.uiExtensions) && product_1.default.uiExtensions.some(id => extensionManagementUtil_1.areSameExtensions({ id }, { id: extensionId }))) {
                    return true;
                }
                if (manifest.main) {
                    return false;
                }
                if (manifest.contributes) {
                    if (!uiContributions.length || Object.keys(manifest.contributes).some(contribution => uiContributions.indexOf(contribution) === -1)) {
                        return false;
                    }
                }
                // Default is UI Extension
                return true;
            }
        }
    }
    exports.isUIExtension = isUIExtension;
});
//# sourceMappingURL=extensionsUtil.js.map