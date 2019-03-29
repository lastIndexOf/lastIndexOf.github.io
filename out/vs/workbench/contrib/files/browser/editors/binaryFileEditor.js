/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/workbench/browser/parts/editor/binaryEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/windows/common/windows", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/contrib/files/common/files", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/platform/storage/common/storage"], function (require, exports, nls, binaryEditor_1, telemetry_1, themeService_1, windows_1, fileEditorInput_1, files_1, files_2, editorService_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An implementation of editor for binary files like images.
     */
    let BinaryFileEditor = class BinaryFileEditor extends binaryEditor_1.BaseBinaryResourceEditor {
        constructor(telemetryService, themeService, fileService, windowsService, editorService, storageService) {
            super(BinaryFileEditor.ID, {
                openInternal: (input, options) => this.openInternal(input, options),
                openExternal: resource => this.openExternal(resource)
            }, telemetryService, themeService, fileService, storageService);
            this.windowsService = windowsService;
            this.editorService = editorService;
        }
        openInternal(input, options) {
            if (input instanceof fileEditorInput_1.FileEditorInput) {
                input.setForceOpenAsText();
                return this.editorService.openEditor(input, options, this.group).then(() => undefined);
            }
            return Promise.resolve();
        }
        openExternal(resource) {
            this.windowsService.openExternal(resource.toString()).then(didOpen => {
                if (!didOpen) {
                    return this.windowsService.showItemInFolder(resource);
                }
                return undefined;
            });
        }
        getTitle() {
            return this.input ? this.input.getName() : nls.localize('binaryFileEditor', "Binary File Viewer");
        }
    };
    BinaryFileEditor.ID = files_1.BINARY_FILE_EDITOR_ID;
    BinaryFileEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, files_2.IFileService),
        __param(3, windows_1.IWindowsService),
        __param(4, editorService_1.IEditorService),
        __param(5, storage_1.IStorageService)
    ], BinaryFileEditor);
    exports.BinaryFileEditor = BinaryFileEditor;
});
//# sourceMappingURL=binaryFileEditor.js.map