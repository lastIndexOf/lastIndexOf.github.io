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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/common/editor/binaryEditorModel", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/workbench/browser/parts/editor/resourceViewer", "vs/base/browser/dom", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/storage/common/storage"], function (require, exports, nls, event_1, baseEditor_1, binaryEditorModel_1, scrollableElement_1, resourceViewer_1, dom_1, files_1, lifecycle_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /*
     * This class is only intended to be subclassed and not instantiated.
     */
    let BaseBinaryResourceEditor = class BaseBinaryResourceEditor extends baseEditor_1.BaseEditor {
        constructor(id, callbacks, telemetryService, themeService, _fileService, storageService) {
            super(id, telemetryService, themeService, storageService);
            this._fileService = _fileService;
            this._onMetadataChanged = this._register(new event_1.Emitter());
            this._onDidOpenInPlace = this._register(new event_1.Emitter());
            this.callbacks = callbacks;
        }
        get onMetadataChanged() { return this._onMetadataChanged.event; }
        get onDidOpenInPlace() { return this._onDidOpenInPlace.event; }
        getTitle() {
            return this.input ? this.input.getName() : nls.localize('binaryEditor', "Binary Viewer");
        }
        createEditor(parent) {
            // Container for Binary
            this.binaryContainer = document.createElement('div');
            this.binaryContainer.className = 'binary-container';
            this.binaryContainer.style.outline = 'none';
            this.binaryContainer.tabIndex = 0; // enable focus support from the editor part (do not remove)
            // Custom Scrollbars
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.binaryContainer, { horizontal: 1 /* Auto */, vertical: 1 /* Auto */ }));
            parent.appendChild(this.scrollbar.getDomNode());
        }
        setInput(input, options, token) {
            return super.setInput(input, options, token).then(() => {
                return input.resolve().then(model => {
                    // Check for cancellation
                    if (token.isCancellationRequested) {
                        return undefined;
                    }
                    // Assert Model instance
                    if (!(model instanceof binaryEditorModel_1.BinaryEditorModel)) {
                        return Promise.reject(new Error('Unable to open file as binary'));
                    }
                    // Render Input
                    this.resourceViewerContext = resourceViewer_1.ResourceViewer.show({ name: model.getName(), resource: model.getResource(), size: model.getSize(), etag: model.getETag(), mime: model.getMime() }, this._fileService, this.binaryContainer, this.scrollbar, resource => this.handleOpenInternalCallback(input, options), resource => this.callbacks.openExternal(resource), meta => this.handleMetadataChanged(meta));
                    return undefined;
                });
            });
        }
        handleOpenInternalCallback(input, options) {
            this.callbacks.openInternal(input, options).then(() => {
                // Signal to listeners that the binary editor has been opened in-place
                this._onDidOpenInPlace.fire();
            });
        }
        handleMetadataChanged(meta) {
            this.metadata = meta;
            this._onMetadataChanged.fire();
        }
        getMetadata() {
            return this.metadata;
        }
        clearInput() {
            // Clear Meta
            this.handleMetadataChanged(null);
            // Clear Resource Viewer
            dom_1.clearNode(this.binaryContainer);
            this.resourceViewerContext = lifecycle_1.dispose(this.resourceViewerContext);
            super.clearInput();
        }
        layout(dimension) {
            // Pass on to Binary Container
            dom_1.size(this.binaryContainer, dimension.width, dimension.height);
            this.scrollbar.scanDomNode();
            if (this.resourceViewerContext && this.resourceViewerContext.layout) {
                this.resourceViewerContext.layout(dimension);
            }
        }
        focus() {
            this.binaryContainer.focus();
        }
        dispose() {
            this.binaryContainer.remove();
            this.resourceViewerContext = lifecycle_1.dispose(this.resourceViewerContext);
            super.dispose();
        }
    };
    BaseBinaryResourceEditor = __decorate([
        __param(4, files_1.IFileService),
        __param(5, storage_1.IStorageService)
    ], BaseBinaryResourceEditor);
    exports.BaseBinaryResourceEditor = BaseBinaryResourceEditor;
});
//# sourceMappingURL=binaryEditor.js.map