/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/editor/common/modes/modesRegistry", "vs/platform/files/common/files"], function (require, exports, network_1, resources_1, modesRegistry_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getIconClasses(modelService, modeService, resource, fileKind) {
        // we always set these base classes even if we do not have a path
        const classes = fileKind === files_1.FileKind.ROOT_FOLDER ? ['rootfolder-icon'] : fileKind === files_1.FileKind.FOLDER ? ['folder-icon'] : ['file-icon'];
        if (resource) {
            // Get the path and name of the resource. For data-URIs, we need to parse specially
            let name;
            let path;
            if (resource.scheme === network_1.Schemas.data) {
                const metadata = resources_1.DataUri.parseMetaData(resource);
                name = metadata.get(resources_1.DataUri.META_DATA_LABEL);
                path = name;
            }
            else {
                name = cssEscape(resources_1.basenameOrAuthority(resource).toLowerCase());
                path = resource.path.toLowerCase();
            }
            // Folders
            if (fileKind === files_1.FileKind.FOLDER) {
                classes.push(`${name}-name-folder-icon`);
            }
            // Files
            else {
                // Name & Extension(s)
                if (name) {
                    classes.push(`${name}-name-file-icon`);
                    const dotSegments = name.split('.');
                    for (let i = 1; i < dotSegments.length; i++) {
                        classes.push(`${dotSegments.slice(i).join('.')}-ext-file-icon`); // add each combination of all found extensions if more than one
                    }
                    classes.push(`ext-file-icon`); // extra segment to increase file-ext score
                }
                // Configured Language
                let configuredLangId = getConfiguredLangId(modelService, modeService, resource);
                configuredLangId = configuredLangId || (path ? modeService.getModeIdByFilepathOrFirstLine(path) : null);
                if (configuredLangId) {
                    classes.push(`${cssEscape(configuredLangId)}-lang-file-icon`);
                }
            }
        }
        return classes;
    }
    exports.getIconClasses = getIconClasses;
    function getConfiguredLangId(modelService, modeService, resource) {
        let configuredLangId = null;
        if (resource) {
            let modeId = null;
            // Data URI: check for encoded metadata
            if (resource.scheme === network_1.Schemas.data) {
                const metadata = resources_1.DataUri.parseMetaData(resource);
                const mime = metadata.get(resources_1.DataUri.META_DATA_MIME);
                if (mime) {
                    modeId = modeService.getModeId(mime);
                }
            }
            // Any other URI: check for model if existing
            else {
                const model = modelService.getModel(resource);
                if (model) {
                    modeId = model.getLanguageIdentifier().language;
                }
            }
            if (modeId && modeId !== modesRegistry_1.PLAINTEXT_MODE_ID) {
                configuredLangId = modeId; // only take if the mode is specific (aka no just plain text)
            }
        }
        return configuredLangId;
    }
    exports.getConfiguredLangId = getConfiguredLangId;
    function cssEscape(val) {
        return val.replace(/\s/g, '\\$&'); // make sure to not introduce CSS classes from files that contain whitespace
    }
    exports.cssEscape = cssEscape;
});
//# sourceMappingURL=getIconClasses.js.map