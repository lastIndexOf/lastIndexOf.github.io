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
define(["require", "exports", "vs/nls", "vs/base/common/decorators", "vs/base/common/path", "vs/base/common/resources", "vs/workbench/common/editor", "vs/workbench/common/editor/binaryEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/resolverService", "vs/workbench/contrib/files/common/files", "vs/platform/label/common/label"], function (require, exports, nls_1, decorators_1, path_1, resources_1, editor_1, binaryEditorModel_1, textfiles_1, instantiation_1, resolverService_1, files_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A file editor input is the input type for the file editor of file system resources.
     */
    let FileEditorInput = class FileEditorInput extends editor_1.EditorInput {
        /**
         * An editor input who's contents are retrieved from file services.
         */
        constructor(resource, preferredEncoding, instantiationService, textFileService, textModelResolverService, labelService) {
            super();
            this.resource = resource;
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.textModelResolverService = textModelResolverService;
            this.labelService = labelService;
            if (preferredEncoding) {
                this.setPreferredEncoding(preferredEncoding);
            }
            this.registerListeners();
        }
        registerListeners() {
            // Model changes
            this._register(this.textFileService.models.onModelDirty(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelSaveError(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelSaved(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelReverted(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelOrphanedChanged(e => this.onModelOrphanedChanged(e)));
        }
        onDirtyStateChange(e) {
            if (e.resource.toString() === this.resource.toString()) {
                this._onDidChangeDirty.fire();
            }
        }
        onModelOrphanedChanged(e) {
            if (e.resource.toString() === this.resource.toString()) {
                this._onDidChangeLabel.fire();
            }
        }
        getResource() {
            return this.resource;
        }
        getEncoding() {
            const textModel = this.textFileService.models.get(this.resource);
            if (textModel) {
                return textModel.getEncoding();
            }
            return this.preferredEncoding;
        }
        getPreferredEncoding() {
            return this.preferredEncoding;
        }
        setEncoding(encoding, mode) {
            this.preferredEncoding = encoding;
            const textModel = this.textFileService.models.get(this.resource);
            if (textModel) {
                textModel.setEncoding(encoding, mode);
            }
        }
        setPreferredEncoding(encoding) {
            this.preferredEncoding = encoding;
            this.forceOpenAsText = true; // encoding is a good hint to open the file as text
        }
        setForceOpenAsText() {
            this.forceOpenAsText = true;
            this.forceOpenAsBinary = false;
        }
        setForceOpenAsBinary() {
            this.forceOpenAsBinary = true;
            this.forceOpenAsText = false;
        }
        getTypeId() {
            return files_1.FILE_EDITOR_INPUT_ID;
        }
        getName() {
            if (!this.name) {
                this.name = resources_1.basenameOrAuthority(this.resource);
            }
            return this.decorateLabel(this.name);
        }
        get shortDescription() {
            return path_1.basename(this.labelService.getUriLabel(resources_1.dirname(this.resource)));
        }
        get mediumDescription() {
            return this.labelService.getUriLabel(resources_1.dirname(this.resource), { relative: true });
        }
        get longDescription() {
            return this.labelService.getUriLabel(resources_1.dirname(this.resource));
        }
        getDescription(verbosity = 1 /* MEDIUM */) {
            let description;
            switch (verbosity) {
                case 0 /* SHORT */:
                    description = this.shortDescription;
                    break;
                case 2 /* LONG */:
                    description = this.longDescription;
                    break;
                case 1 /* MEDIUM */:
                default:
                    description = this.mediumDescription;
                    break;
            }
            return description;
        }
        get shortTitle() {
            return this.getName();
        }
        get mediumTitle() {
            return this.labelService.getUriLabel(this.resource, { relative: true });
        }
        get longTitle() {
            return this.labelService.getUriLabel(this.resource);
        }
        getTitle(verbosity) {
            let title;
            switch (verbosity) {
                case 0 /* SHORT */:
                    title = this.shortTitle;
                    break;
                default:
                case 1 /* MEDIUM */:
                    title = this.mediumTitle;
                    break;
                case 2 /* LONG */:
                    title = this.longTitle;
                    break;
            }
            return this.decorateLabel(title);
        }
        decorateLabel(label) {
            const model = this.textFileService.models.get(this.resource);
            if (model && model.hasState(4 /* ORPHAN */)) {
                return nls_1.localize('orphanedFile', "{0} (deleted from disk)", label);
            }
            if (model && model.isReadonly()) {
                return nls_1.localize('readonlyFile', "{0} (read-only)", label);
            }
            return label;
        }
        isDirty() {
            const model = this.textFileService.models.get(this.resource);
            if (!model) {
                return false;
            }
            if (model.hasState(3 /* CONFLICT */) || model.hasState(5 /* ERROR */)) {
                return true; // always indicate dirty state if we are in conflict or error state
            }
            if (this.textFileService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                return false; // fast auto save enabled so we do not declare dirty
            }
            return model.isDirty();
        }
        confirmSave() {
            return this.textFileService.confirmSave([this.resource]);
        }
        save() {
            return this.textFileService.save(this.resource);
        }
        revert(options) {
            return this.textFileService.revert(this.resource, options);
        }
        getPreferredEditorId(candidates) {
            return this.forceOpenAsBinary ? files_1.BINARY_FILE_EDITOR_ID : files_1.TEXT_FILE_EDITOR_ID;
        }
        resolve() {
            // Resolve as binary
            if (this.forceOpenAsBinary) {
                return this.doResolveAsBinary();
            }
            // Resolve as text
            return this.doResolveAsText();
        }
        doResolveAsText() {
            // Resolve as text
            return this.textFileService.models.loadOrCreate(this.resource, {
                encoding: this.preferredEncoding,
                reload: { async: true },
                allowBinary: this.forceOpenAsText,
                reason: 1 /* EDITOR */
            }).then(model => {
                // This is a bit ugly, because we first resolve the model and then resolve a model reference. the reason being that binary
                // or very large files do not resolve to a text file model but should be opened as binary files without text. First calling into
                // loadOrCreate ensures we are not creating model references for these kind of resources.
                // In addition we have a bit of payload to take into account (encoding, reload) that the text resolver does not handle yet.
                if (!this.textModelReference) {
                    this.textModelReference = this.textModelResolverService.createModelReference(this.resource);
                }
                return this.textModelReference.then(ref => ref.object);
            }, error => {
                // In case of an error that indicates that the file is binary or too large, just return with the binary editor model
                if (error.fileOperationResult === 0 /* FILE_IS_BINARY */ || error.fileOperationResult === 8 /* FILE_TOO_LARGE */) {
                    return this.doResolveAsBinary();
                }
                // Bubble any other error up
                return Promise.reject(error);
            });
        }
        doResolveAsBinary() {
            return this.instantiationService.createInstance(binaryEditorModel_1.BinaryEditorModel, this.resource, this.getName()).load().then(m => m);
        }
        isResolved() {
            return !!this.textFileService.models.get(this.resource);
        }
        dispose() {
            // Model reference
            if (this.textModelReference) {
                this.textModelReference.then(ref => ref.dispose());
                this.textModelReference = null;
            }
            super.dispose();
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            if (otherInput) {
                return otherInput instanceof FileEditorInput && otherInput.resource.toString() === this.resource.toString();
            }
            return false;
        }
    };
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "shortDescription", null);
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "mediumDescription", null);
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "longDescription", null);
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "shortTitle", null);
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "mediumTitle", null);
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "longTitle", null);
    FileEditorInput = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, label_1.ILabelService)
    ], FileEditorInput);
    exports.FileEditorInput = FileEditorInput;
});
//# sourceMappingURL=fileEditorInput.js.map