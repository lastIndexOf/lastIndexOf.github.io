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
define(["require", "exports", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/contextkey/common/contextkeys", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/base/common/network", "vs/platform/instantiation/common/instantiation"], function (require, exports, editor_1, files_1, contextkey_1, lifecycle_1, modelService_1, modeService_1, textfiles_1, contextkeys_1, platform_1, views_1, network_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Explorer viewlet id.
     */
    exports.VIEWLET_ID = 'workbench.view.explorer';
    /**
     * Explorer viewlet container.
     */
    exports.VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer(exports.VIEWLET_ID);
    exports.IExplorerService = instantiation_1.createDecorator('explorerService');
    /**
     * Context Keys to use with keybindings for the Explorer and Open Editors view
     */
    const explorerViewletVisibleId = 'explorerViewletVisible';
    const filesExplorerFocusId = 'filesExplorerFocus';
    const openEditorsVisibleId = 'openEditorsVisible';
    const openEditorsFocusId = 'openEditorsFocus';
    const explorerViewletFocusId = 'explorerViewletFocus';
    const explorerResourceIsFolderId = 'explorerResourceIsFolder';
    const explorerResourceReadonly = 'explorerResourceReadonly';
    const explorerResourceIsRootId = 'explorerResourceIsRoot';
    const explorerResourceCutId = 'explorerResourceCut';
    exports.ExplorerViewletVisibleContext = new contextkey_1.RawContextKey(explorerViewletVisibleId, true);
    exports.ExplorerFolderContext = new contextkey_1.RawContextKey(explorerResourceIsFolderId, false);
    exports.ExplorerResourceReadonlyContext = new contextkey_1.RawContextKey(explorerResourceReadonly, false);
    exports.ExplorerResourceNotReadonlyContext = exports.ExplorerResourceReadonlyContext.toNegated();
    exports.ExplorerRootContext = new contextkey_1.RawContextKey(explorerResourceIsRootId, false);
    exports.ExplorerResourceCut = new contextkey_1.RawContextKey(explorerResourceCutId, false);
    exports.FilesExplorerFocusedContext = new contextkey_1.RawContextKey(filesExplorerFocusId, true);
    exports.OpenEditorsVisibleContext = new contextkey_1.RawContextKey(openEditorsVisibleId, false);
    exports.OpenEditorsFocusedContext = new contextkey_1.RawContextKey(openEditorsFocusId, true);
    exports.ExplorerFocusedContext = new contextkey_1.RawContextKey(explorerViewletFocusId, true);
    exports.OpenEditorsVisibleCondition = contextkey_1.ContextKeyExpr.has(openEditorsVisibleId);
    exports.FilesExplorerFocusCondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(explorerViewletVisibleId), contextkey_1.ContextKeyExpr.has(filesExplorerFocusId), contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    exports.ExplorerFocusCondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(explorerViewletVisibleId), contextkey_1.ContextKeyExpr.has(explorerViewletFocusId), contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    /**
     * Text file editor id.
     */
    exports.TEXT_FILE_EDITOR_ID = 'workbench.editors.files.textFileEditor';
    /**
     * File editor input id.
     */
    exports.FILE_EDITOR_INPUT_ID = 'workbench.editors.files.fileEditorInput';
    /**
     * Binary file editor id.
     */
    exports.BINARY_FILE_EDITOR_ID = 'workbench.editors.files.binaryFileEditor';
    exports.SortOrderConfiguration = {
        DEFAULT: 'default',
        MIXED: 'mixed',
        FILES_FIRST: 'filesFirst',
        TYPE: 'type',
        MODIFIED: 'modified'
    };
    let FileOnDiskContentProvider = class FileOnDiskContentProvider {
        constructor(textFileService, fileService, modeService, modelService) {
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.modeService = modeService;
            this.modelService = modelService;
        }
        provideTextContent(resource) {
            const fileOnDiskResource = resource.with({ scheme: network_1.Schemas.file });
            // Make sure our file from disk is resolved up to date
            return this.resolveEditorModel(resource).then(codeEditorModel => {
                // Make sure to keep contents on disk up to date when it changes
                if (!this.fileWatcher) {
                    this.fileWatcher = this.fileService.onFileChanges(changes => {
                        if (changes.contains(fileOnDiskResource, 0 /* UPDATED */)) {
                            this.resolveEditorModel(resource, false /* do not create if missing */); // update model when resource changes
                        }
                    });
                    if (codeEditorModel) {
                        const disposeListener = codeEditorModel.onWillDispose(() => {
                            disposeListener.dispose();
                            this.fileWatcher = lifecycle_1.dispose(this.fileWatcher);
                        });
                    }
                }
                return codeEditorModel;
            });
        }
        resolveEditorModel(resource, createAsNeeded = true) {
            const fileOnDiskResource = resource.with({ scheme: network_1.Schemas.file });
            return this.textFileService.resolveTextContent(fileOnDiskResource).then(content => {
                let codeEditorModel = this.modelService.getModel(resource);
                if (codeEditorModel) {
                    this.modelService.updateModel(codeEditorModel, content.value);
                }
                else if (createAsNeeded) {
                    const fileOnDiskModel = this.modelService.getModel(fileOnDiskResource);
                    let languageSelector;
                    if (fileOnDiskModel) {
                        languageSelector = this.modeService.create(fileOnDiskModel.getModeId());
                    }
                    else {
                        languageSelector = this.modeService.createByFilepathOrFirstLine(fileOnDiskResource.fsPath);
                    }
                    codeEditorModel = this.modelService.createModel(content.value, languageSelector, resource);
                }
                return codeEditorModel;
            });
        }
        dispose() {
            this.fileWatcher = lifecycle_1.dispose(this.fileWatcher);
        }
    };
    FileOnDiskContentProvider = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, files_1.IFileService),
        __param(2, modeService_1.IModeService),
        __param(3, modelService_1.IModelService)
    ], FileOnDiskContentProvider);
    exports.FileOnDiskContentProvider = FileOnDiskContentProvider;
    class OpenEditor {
        constructor(_editor, _group) {
            this._editor = _editor;
            this._group = _group;
            // noop
        }
        get editor() {
            return this._editor;
        }
        get editorIndex() {
            return this._group.getIndexOfEditor(this.editor);
        }
        get group() {
            return this._group;
        }
        get groupId() {
            return this._group.id;
        }
        getId() {
            return `openeditor:${this.groupId}:${this.editorIndex}:${this.editor.getName()}:${this.editor.getDescription()}`;
        }
        isPreview() {
            return this._group.previewEditor === this.editor;
        }
        isUntitled() {
            return !!editor_1.toResource(this.editor, { supportSideBySide: true, filter: network_1.Schemas.untitled });
        }
        isDirty() {
            return this.editor.isDirty();
        }
        getResource() {
            return editor_1.toResource(this.editor, { supportSideBySide: true });
        }
    }
    exports.OpenEditor = OpenEditor;
});
//# sourceMappingURL=files.js.map