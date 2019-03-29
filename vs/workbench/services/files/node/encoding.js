/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/workspaces/common/workspaces", "vs/base/node/encoding", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/platform", "vs/base/common/path", "vs/base/common/lifecycle", "vs/base/common/resources"], function (require, exports, workspaces_1, encoding, uri_1, files_1, platform_1, path_1, lifecycle_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO@Ben debt - encodings should move one layer up from the file service into the text file
    // service and then ideally be passed in as option to the file service
    // the file service should talk about string | Buffer for reading and writing and only convert
    // to strings if a encoding is provided
    class ResourceEncodings extends lifecycle_1.Disposable {
        constructor(textResourceConfigurationService, environmentService, contextService, encodingOverride) {
            super();
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.encodingOverride = encodingOverride || this.getEncodingOverrides();
            this.registerListeners();
        }
        registerListeners() {
            // Workspace Folder Change
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => {
                this.encodingOverride = this.getEncodingOverrides();
            }));
        }
        getReadEncoding(resource, options, detected) {
            let preferredEncoding;
            // Encoding passed in as option
            if (options && options.encoding) {
                if (detected.encoding === encoding.UTF8 && options.encoding === encoding.UTF8) {
                    preferredEncoding = encoding.UTF8_with_bom; // indicate the file has BOM if we are to resolve with UTF 8
                }
                else {
                    preferredEncoding = options.encoding; // give passed in encoding highest priority
                }
            }
            // Encoding detected
            else if (detected.encoding) {
                if (detected.encoding === encoding.UTF8) {
                    preferredEncoding = encoding.UTF8_with_bom; // if we detected UTF-8, it can only be because of a BOM
                }
                else {
                    preferredEncoding = detected.encoding;
                }
            }
            // Encoding configured
            else if (this.textResourceConfigurationService.getValue(resource, 'files.encoding') === encoding.UTF8_with_bom) {
                preferredEncoding = encoding.UTF8; // if we did not detect UTF 8 BOM before, this can only be UTF 8 then
            }
            return this.getEncodingForResource(resource, preferredEncoding);
        }
        getWriteEncoding(resource, preferredEncoding) {
            const resourceEncoding = this.getEncodingForResource(resource, preferredEncoding);
            return {
                encoding: resourceEncoding,
                hasBOM: resourceEncoding === encoding.UTF16be || resourceEncoding === encoding.UTF16le || resourceEncoding === encoding.UTF8_with_bom // enforce BOM for certain encodings
            };
        }
        getEncodingForResource(resource, preferredEncoding) {
            let fileEncoding;
            const override = this.getEncodingOverride(resource);
            if (override) {
                fileEncoding = override; // encoding override always wins
            }
            else if (preferredEncoding) {
                fileEncoding = preferredEncoding; // preferred encoding comes second
            }
            else {
                fileEncoding = this.textResourceConfigurationService.getValue(resource, 'files.encoding'); // and last we check for settings
            }
            if (!fileEncoding || !encoding.encodingExists(fileEncoding)) {
                fileEncoding = encoding.UTF8; // the default is UTF 8
            }
            return fileEncoding;
        }
        getEncodingOverrides() {
            const encodingOverride = [];
            // Global settings
            encodingOverride.push({ parent: uri_1.URI.file(this.environmentService.appSettingsHome), encoding: encoding.UTF8 });
            // Workspace files
            encodingOverride.push({ extension: workspaces_1.WORKSPACE_EXTENSION, encoding: encoding.UTF8 });
            // Folder Settings
            this.contextService.getWorkspace().folders.forEach(folder => {
                encodingOverride.push({ parent: resources_1.joinPath(folder.uri, '.vscode'), encoding: encoding.UTF8 });
            });
            return encodingOverride;
        }
        getEncodingOverride(resource) {
            if (resource && this.encodingOverride && this.encodingOverride.length) {
                for (const override of this.encodingOverride) {
                    // check if the resource is child of encoding override path
                    if (override.parent && files_1.isParent(resource.fsPath, override.parent.fsPath, !platform_1.isLinux /* ignorecase */)) {
                        return override.encoding;
                    }
                    // check if the resource extension is equal to encoding override
                    if (override.extension && path_1.extname(resource.fsPath) === `.${override.extension}`) {
                        return override.encoding;
                    }
                }
            }
            return null;
        }
    }
    exports.ResourceEncodings = ResourceEncodings;
});
//# sourceMappingURL=encoding.js.map