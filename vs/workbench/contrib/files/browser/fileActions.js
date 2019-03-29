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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/extpath", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/errorMessage", "vs/base/common/strings", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/quickOpen/common/quickOpen", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/instantiation/common/instantiation", "vs/platform/windows/common/windows", "vs/workbench/contrib/files/browser/fileCommands", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/clipboard/common/clipboardService", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/platform/commands/common/commands", "vs/platform/list/browser/listService", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/arrays", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/errors", "vs/base/common/async", "vs/css!./media/fileactions"], function (require, exports, nls, types, platform_1, extpath, resources, uri_1, errorMessage_1, strings, actions_1, lifecycle_1, files_1, textfiles_1, files_2, editor_1, untitledEditorService_1, quickOpen_1, viewlet_1, instantiation_1, windows_1, fileCommands_1, resolverService_1, configuration_1, clipboardService_1, modeService_1, modelService_1, commands_1, listService_1, contextkey_1, network_1, dialogs_1, notification_1, editorService_1, editorCommands_1, arrays_1, explorerModel_1, errors_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NEW_FILE_COMMAND_ID = 'explorer.newFile';
    exports.NEW_FILE_LABEL = nls.localize('newFile', "New File");
    exports.NEW_FOLDER_COMMAND_ID = 'explorer.newFolder';
    exports.NEW_FOLDER_LABEL = nls.localize('newFolder', "New Folder");
    exports.TRIGGER_RENAME_LABEL = nls.localize('rename', "Rename");
    exports.MOVE_FILE_TO_TRASH_LABEL = nls.localize('delete', "Delete");
    exports.COPY_FILE_LABEL = nls.localize('copyFile', "Copy");
    exports.PASTE_FILE_LABEL = nls.localize('pasteFile', "Paste");
    exports.FileCopiedContext = new contextkey_1.RawContextKey('fileCopied', false);
    class BaseErrorReportingAction extends actions_1.Action {
        constructor(id, label, _notificationService) {
            super(id, label);
            this._notificationService = _notificationService;
        }
        get notificationService() {
            return this._notificationService;
        }
        onError(error) {
            if (error.message === 'string') {
                error = error.message;
            }
            this._notificationService.error(errorMessage_1.toErrorMessage(error, false));
        }
        onErrorWithRetry(error, retry) {
            this._notificationService.prompt(notification_1.Severity.Error, errorMessage_1.toErrorMessage(error, false), [{
                    label: nls.localize('retry', "Retry"),
                    run: () => retry()
                }]);
        }
    }
    exports.BaseErrorReportingAction = BaseErrorReportingAction;
    const PLACEHOLDER_URI = uri_1.URI.file('');
    function refreshIfSeparator(value, explorerService) {
        if (value && ((value.indexOf('/') >= 0) || (value.indexOf('\\') >= 0))) {
            // New input contains separator, multiple resources will get created workaround for #68204
            explorerService.refresh();
        }
    }
    /* New File */
    let NewFileAction = class NewFileAction extends BaseErrorReportingAction {
        constructor(getElement, notificationService, explorerService, fileService, editorService) {
            super('explorer.newFile', exports.NEW_FILE_LABEL, notificationService);
            this.getElement = getElement;
            this.explorerService = explorerService;
            this.fileService = fileService;
            this.editorService = editorService;
            this.toDispose = [];
            this.class = 'explorer-action new-file';
            this.toDispose.push(this.explorerService.onDidChangeEditable(e => {
                const elementIsBeingEdited = this.explorerService.isEditable(e);
                this.enabled = !elementIsBeingEdited;
            }));
        }
        run() {
            let folder;
            const element = this.getElement();
            if (element) {
                folder = element.isDirectory ? element : element.parent;
            }
            else {
                folder = this.explorerService.roots[0];
            }
            if (folder.isReadonly) {
                return Promise.reject(new Error('Parent folder is readonly.'));
            }
            const stat = new explorerModel_1.ExplorerItem(PLACEHOLDER_URI, folder, false);
            return folder.fetchChildren(this.fileService).then(() => {
                folder.addChild(stat);
                const onSuccess = (value) => {
                    return this.fileService.createFile(resources.joinPath(folder.resource, value)).then(stat => {
                        refreshIfSeparator(value, this.explorerService);
                        return this.editorService.openEditor({ resource: stat.resource, options: { pinned: true } });
                    }, (error) => {
                        this.onErrorWithRetry(error, () => onSuccess(value));
                    });
                };
                this.explorerService.setEditable(stat, {
                    validationMessage: value => validateFileName(stat, value),
                    onFinish: (value, success) => {
                        folder.removeChild(stat);
                        this.explorerService.setEditable(stat, null);
                        if (success) {
                            onSuccess(value);
                        }
                        else {
                            this.explorerService.select(folder.resource).then(undefined, errors_1.onUnexpectedError);
                        }
                    }
                });
            });
        }
        dispose() {
            super.dispose();
            lifecycle_1.dispose(this.toDispose);
        }
    };
    NewFileAction.ID = 'workbench.files.action.createFileFromExplorer';
    NewFileAction.LABEL = nls.localize('createNewFile', "New File");
    NewFileAction = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, files_1.IExplorerService),
        __param(3, files_2.IFileService),
        __param(4, editorService_1.IEditorService)
    ], NewFileAction);
    exports.NewFileAction = NewFileAction;
    /* New Folder */
    let NewFolderAction = class NewFolderAction extends BaseErrorReportingAction {
        constructor(getElement, notificationService, fileService, explorerService) {
            super('explorer.newFolder', exports.NEW_FOLDER_LABEL, notificationService);
            this.getElement = getElement;
            this.fileService = fileService;
            this.explorerService = explorerService;
            this.toDispose = [];
            this.class = 'explorer-action new-folder';
            this.toDispose.push(this.explorerService.onDidChangeEditable(e => {
                const elementIsBeingEdited = this.explorerService.isEditable(e);
                this.enabled = !elementIsBeingEdited;
            }));
        }
        run() {
            let folder;
            const element = this.getElement();
            if (element) {
                folder = element.isDirectory ? element : element.parent;
            }
            else {
                folder = this.explorerService.roots[0];
            }
            if (folder.isReadonly) {
                return Promise.reject(new Error('Parent folder is readonly.'));
            }
            const stat = new explorerModel_1.ExplorerItem(PLACEHOLDER_URI, folder, true);
            return folder.fetchChildren(this.fileService).then(() => {
                folder.addChild(stat);
                const onSuccess = (value) => {
                    return this.fileService.createFolder(resources.joinPath(folder.resource, value)).then(stat => {
                        refreshIfSeparator(value, this.explorerService);
                        return this.explorerService.select(stat.resource, true);
                    }, (error) => {
                        this.onErrorWithRetry(error, () => onSuccess(value));
                    });
                };
                this.explorerService.setEditable(stat, {
                    validationMessage: value => validateFileName(stat, value),
                    onFinish: (value, success) => {
                        folder.removeChild(stat);
                        this.explorerService.setEditable(stat, null);
                        if (success) {
                            onSuccess(value);
                        }
                        else {
                            this.explorerService.select(folder.resource).then(undefined, errors_1.onUnexpectedError);
                        }
                    }
                });
            });
        }
        dispose() {
            super.dispose();
            lifecycle_1.dispose(this.toDispose);
        }
    };
    NewFolderAction.ID = 'workbench.files.action.createFolderFromExplorer';
    NewFolderAction.LABEL = nls.localize('createNewFolder', "New Folder");
    NewFolderAction = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, files_2.IFileService),
        __param(3, files_1.IExplorerService)
    ], NewFolderAction);
    exports.NewFolderAction = NewFolderAction;
    /* Create new file from anywhere: Open untitled */
    let GlobalNewUntitledFileAction = class GlobalNewUntitledFileAction extends actions_1.Action {
        constructor(id, label, editorService) {
            super(id, label);
            this.editorService = editorService;
        }
        run() {
            return this.editorService.openEditor({ options: { pinned: true } }); // untitled are always pinned
        }
    };
    GlobalNewUntitledFileAction.ID = 'workbench.action.files.newUntitledFile';
    GlobalNewUntitledFileAction.LABEL = nls.localize('newUntitledFile', "New Untitled File");
    GlobalNewUntitledFileAction = __decorate([
        __param(2, editorService_1.IEditorService)
    ], GlobalNewUntitledFileAction);
    exports.GlobalNewUntitledFileAction = GlobalNewUntitledFileAction;
    let BaseDeleteFileAction = class BaseDeleteFileAction extends BaseErrorReportingAction {
        constructor(elements, useTrash, fileService, notificationService, dialogService, textFileService, configurationService) {
            super('moveFileToTrash', exports.MOVE_FILE_TO_TRASH_LABEL, notificationService);
            this.elements = elements;
            this.useTrash = useTrash;
            this.fileService = fileService;
            this.dialogService = dialogService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.useTrash = useTrash && elements.every(e => !extpath.isUNC(e.resource.fsPath)); // on UNC shares there is no trash
            this.enabled = this.elements && this.elements.every(e => !e.isReadonly);
        }
        run() {
            let primaryButton;
            if (this.useTrash) {
                primaryButton = platform_1.isWindows ? nls.localize('deleteButtonLabelRecycleBin', "&&Move to Recycle Bin") : nls.localize({ key: 'deleteButtonLabelTrash', comment: ['&& denotes a mnemonic'] }, "&&Move to Trash");
            }
            else {
                primaryButton = nls.localize({ key: 'deleteButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete");
            }
            const distinctElements = resources.distinctParents(this.elements, e => e.resource);
            // Handle dirty
            let confirmDirtyPromise = Promise.resolve(true);
            const dirty = this.textFileService.getDirty().filter(d => distinctElements.some(e => resources.isEqualOrParent(d, e.resource, !platform_1.isLinux /* ignorecase */)));
            if (dirty.length) {
                let message;
                if (distinctElements.length > 1) {
                    message = nls.localize('dirtyMessageFilesDelete', "You are deleting files with unsaved changes. Do you want to continue?");
                }
                else if (distinctElements[0].isDirectory) {
                    if (dirty.length === 1) {
                        message = nls.localize('dirtyMessageFolderOneDelete', "You are deleting a folder with unsaved changes in 1 file. Do you want to continue?");
                    }
                    else {
                        message = nls.localize('dirtyMessageFolderDelete', "You are deleting a folder with unsaved changes in {0} files. Do you want to continue?", dirty.length);
                    }
                }
                else {
                    message = nls.localize('dirtyMessageFileDelete', "You are deleting a file with unsaved changes. Do you want to continue?");
                }
                confirmDirtyPromise = this.dialogService.confirm({
                    message,
                    type: 'warning',
                    detail: nls.localize('dirtyWarning', "Your changes will be lost if you don't save them."),
                    primaryButton
                }).then(res => {
                    if (!res.confirmed) {
                        return false;
                    }
                    this.skipConfirm = true; // since we already asked for confirmation
                    return this.textFileService.revertAll(dirty).then(() => true);
                });
            }
            // Check if file is dirty in editor and save it to avoid data loss
            return confirmDirtyPromise.then(confirmed => {
                if (!confirmed) {
                    return null;
                }
                let confirmDeletePromise;
                // Check if we need to ask for confirmation at all
                if (process.env.isBrowser ? true : this.skipConfirm || (this.useTrash && this.configurationService.getValue(BaseDeleteFileAction.CONFIRM_DELETE_SETTING_KEY) === false)) {
                    confirmDeletePromise = Promise.resolve({ confirmed: true });
                }
                // Confirm for moving to trash
                else if (this.useTrash) {
                    const message = this.getMoveToTrashMessage(distinctElements);
                    confirmDeletePromise = this.dialogService.confirm({
                        message,
                        detail: platform_1.isWindows ? nls.localize('undoBin', "You can restore from the Recycle Bin.") : nls.localize('undoTrash', "You can restore from the Trash."),
                        primaryButton,
                        checkbox: {
                            label: nls.localize('doNotAskAgain', "Do not ask me again")
                        },
                        type: 'question'
                    });
                }
                // Confirm for deleting permanently
                else {
                    const message = this.getDeleteMessage(distinctElements);
                    confirmDeletePromise = this.dialogService.confirm({
                        message,
                        detail: nls.localize('irreversible', "This action is irreversible!"),
                        primaryButton,
                        type: 'warning'
                    });
                }
                return confirmDeletePromise.then(confirmation => {
                    // Check for confirmation checkbox
                    let updateConfirmSettingsPromise = Promise.resolve(undefined);
                    if (confirmation.confirmed && confirmation.checkboxChecked === true) {
                        updateConfirmSettingsPromise = this.configurationService.updateValue(BaseDeleteFileAction.CONFIRM_DELETE_SETTING_KEY, false, 1 /* USER */);
                    }
                    return updateConfirmSettingsPromise.then(() => {
                        // Check for confirmation
                        if (!confirmation.confirmed) {
                            return Promise.resolve(null);
                        }
                        // Call function
                        const servicePromise = Promise.all(distinctElements.map(e => this.fileService.del(e.resource, { useTrash: process.env.isBrowser ? false : this.useTrash, recursive: true })))
                            .then(undefined, (error) => {
                            // Handle error to delete file(s) from a modal confirmation dialog
                            let errorMessage;
                            let detailMessage;
                            let primaryButton;
                            if (this.useTrash) {
                                errorMessage = platform_1.isWindows ? nls.localize('binFailed', "Failed to delete using the Recycle Bin. Do you want to permanently delete instead?") : nls.localize('trashFailed', "Failed to delete using the Trash. Do you want to permanently delete instead?");
                                detailMessage = nls.localize('irreversible', "This action is irreversible!");
                                primaryButton = nls.localize({ key: 'deletePermanentlyButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete Permanently");
                            }
                            else {
                                errorMessage = errorMessage_1.toErrorMessage(error, false);
                                primaryButton = nls.localize({ key: 'retryButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Retry");
                            }
                            return this.dialogService.confirm({
                                message: errorMessage,
                                detail: detailMessage,
                                type: 'warning',
                                primaryButton
                            }).then(res => {
                                if (res.confirmed) {
                                    if (this.useTrash) {
                                        this.useTrash = false; // Delete Permanently
                                    }
                                    this.skipConfirm = true;
                                    return this.run();
                                }
                                return Promise.resolve(undefined);
                            });
                        });
                        return servicePromise;
                    });
                });
            });
        }
        getMoveToTrashMessage(distinctElements) {
            if (this.containsBothDirectoryAndFile(distinctElements)) {
                return dialogs_1.getConfirmMessage(nls.localize('confirmMoveTrashMessageFilesAndDirectories', "Are you sure you want to delete the following {0} files/directories and their contents?", distinctElements.length), distinctElements.map(e => e.resource));
            }
            if (distinctElements.length > 1) {
                if (distinctElements[0].isDirectory) {
                    return dialogs_1.getConfirmMessage(nls.localize('confirmMoveTrashMessageMultipleDirectories', "Are you sure you want to delete the following {0} directories and their contents?", distinctElements.length), distinctElements.map(e => e.resource));
                }
                return dialogs_1.getConfirmMessage(nls.localize('confirmMoveTrashMessageMultiple', "Are you sure you want to delete the following {0} files?", distinctElements.length), distinctElements.map(e => e.resource));
            }
            if (distinctElements[0].isDirectory) {
                return nls.localize('confirmMoveTrashMessageFolder', "Are you sure you want to delete '{0}' and its contents?", distinctElements[0].name);
            }
            return nls.localize('confirmMoveTrashMessageFile', "Are you sure you want to delete '{0}'?", distinctElements[0].name);
        }
        getDeleteMessage(distinctElements) {
            if (this.containsBothDirectoryAndFile(distinctElements)) {
                return dialogs_1.getConfirmMessage(nls.localize('confirmDeleteMessageFilesAndDirectories', "Are you sure you want to permanently delete the following {0} files/directories and their contents?", distinctElements.length), distinctElements.map(e => e.resource));
            }
            if (distinctElements.length > 1) {
                if (distinctElements[0].isDirectory) {
                    return dialogs_1.getConfirmMessage(nls.localize('confirmDeleteMessageMultipleDirectories', "Are you sure you want to permanently delete the following {0} directories and their contents?", distinctElements.length), distinctElements.map(e => e.resource));
                }
                return dialogs_1.getConfirmMessage(nls.localize('confirmDeleteMessageMultiple', "Are you sure you want to permanently delete the following {0} files?", distinctElements.length), distinctElements.map(e => e.resource));
            }
            if (distinctElements[0].isDirectory) {
                return nls.localize('confirmDeleteMessageFolder', "Are you sure you want to permanently delete '{0}' and its contents?", distinctElements[0].name);
            }
            return nls.localize('confirmDeleteMessageFile', "Are you sure you want to permanently delete '{0}'?", distinctElements[0].name);
        }
        containsBothDirectoryAndFile(distinctElements) {
            const directories = distinctElements.filter(element => element.isDirectory);
            const files = distinctElements.filter(element => !element.isDirectory);
            return directories.length > 0 && files.length > 0;
        }
    };
    BaseDeleteFileAction.CONFIRM_DELETE_SETTING_KEY = 'explorer.confirmDelete';
    BaseDeleteFileAction = __decorate([
        __param(2, files_2.IFileService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, textfiles_1.ITextFileService),
        __param(6, configuration_1.IConfigurationService)
    ], BaseDeleteFileAction);
    let pasteShouldMove = false;
    // Paste File/Folder
    let PasteFileAction = class PasteFileAction extends BaseErrorReportingAction {
        constructor(element, fileService, notificationService, editorService, explorerService) {
            super(PasteFileAction.ID, exports.PASTE_FILE_LABEL, notificationService);
            this.element = element;
            this.fileService = fileService;
            this.editorService = editorService;
            this.explorerService = explorerService;
            if (!this.element) {
                this.element = this.explorerService.roots[0];
            }
        }
        run(fileToPaste) {
            // Check if target is ancestor of pasted folder
            if (this.element.resource.toString() !== fileToPaste.toString() && resources.isEqualOrParent(this.element.resource, fileToPaste, !platform_1.isLinux /* ignorecase */)) {
                throw new Error(nls.localize('fileIsAncestor', "File to paste is an ancestor of the destination folder"));
            }
            return this.fileService.resolveFile(fileToPaste).then(fileToPasteStat => {
                // Find target
                let target;
                if (this.element.resource.toString() === fileToPaste.toString()) {
                    target = this.element.parent;
                }
                else {
                    target = this.element.isDirectory ? this.element : this.element.parent;
                }
                const targetFile = findValidPasteFileTarget(target, { resource: fileToPaste, isDirectory: fileToPasteStat.isDirectory, allowOverwirte: pasteShouldMove });
                // Copy File
                const promise = pasteShouldMove ? this.fileService.moveFile(fileToPaste, targetFile) : this.fileService.copyFile(fileToPaste, targetFile);
                return promise.then(stat => {
                    if (pasteShouldMove) {
                        // Cut is done. Make sure to clear cut state.
                        this.explorerService.setToCopy([], false);
                    }
                    if (!stat.isDirectory) {
                        return this.editorService.openEditor({ resource: stat.resource, options: { pinned: true, preserveFocus: true } })
                            .then(types.withNullAsUndefined);
                    }
                    return undefined;
                }, e => this.onError(e));
            }, error => {
                this.onError(new Error(nls.localize('fileDeleted', "File to paste was deleted or moved meanwhile")));
            });
        }
    };
    PasteFileAction.ID = 'filesExplorer.paste';
    PasteFileAction = __decorate([
        __param(1, files_2.IFileService),
        __param(2, notification_1.INotificationService),
        __param(3, editorService_1.IEditorService),
        __param(4, files_1.IExplorerService)
    ], PasteFileAction);
    function findValidPasteFileTarget(targetFolder, fileToPaste) {
        let name = resources.basenameOrAuthority(fileToPaste.resource);
        let candidate = resources.joinPath(targetFolder.resource, name);
        while (true && !fileToPaste.allowOverwirte) {
            if (!targetFolder.root.find(candidate)) {
                break;
            }
            name = incrementFileName(name, !!fileToPaste.isDirectory);
            candidate = resources.joinPath(targetFolder.resource, name);
        }
        return candidate;
    }
    exports.findValidPasteFileTarget = findValidPasteFileTarget;
    function incrementFileName(name, isFolder) {
        const separators = '[\\.\\-_]';
        const maxNumber = 1073741824 /* MAX_SAFE_SMALL_INTEGER */;
        // file.1.txt=>file.2.txt
        let suffixFileRegex = RegExp('(.*' + separators + ')(\\d+)(\\..*)$');
        if (!isFolder && name.match(suffixFileRegex)) {
            return name.replace(suffixFileRegex, (match, g1, g2, g3) => {
                let number = parseInt(g2);
                return number < maxNumber
                    ? g1 + strings.pad(number + 1, g2.length) + g3
                    : strings.format('{0}{1}.1{2}', g1, g2, g3);
            });
        }
        // 1.file.txt=>2.file.txt
        let prefixFileRegex = RegExp('(\\d+)(' + separators + '.*)(\\..*)$');
        if (!isFolder && name.match(prefixFileRegex)) {
            return name.replace(prefixFileRegex, (match, g1, g2, g3) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? strings.pad(number + 1, g1.length) + g2 + g3
                    : strings.format('{0}{1}.1{2}', g1, g2, g3);
            });
        }
        // 1.txt=>2.txt
        let prefixFileNoNameRegex = RegExp('(\\d+)(\\..*)$');
        if (!isFolder && name.match(prefixFileNoNameRegex)) {
            return name.replace(prefixFileNoNameRegex, (match, g1, g2) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? strings.pad(number + 1, g1.length) + g2
                    : strings.format('{0}.1{1}', g1, g2);
            });
        }
        // file.txt=>file.1.txt
        const lastIndexOfDot = name.lastIndexOf('.');
        if (!isFolder && lastIndexOfDot >= 0) {
            return strings.format('{0}.1{1}', name.substr(0, lastIndexOfDot), name.substr(lastIndexOfDot));
        }
        // folder.1=>folder.2
        if (isFolder && name.match(/(\d+)$/)) {
            return name.replace(/(\d+)$/, (match, ...groups) => {
                let number = parseInt(groups[0]);
                return number < maxNumber
                    ? strings.pad(number + 1, groups[0].length)
                    : strings.format('{0}.1', groups[0]);
            });
        }
        // 1.folder=>2.folder
        if (isFolder && name.match(/^(\d+)/)) {
            return name.replace(/^(\d+)(.*)$/, (match, ...groups) => {
                let number = parseInt(groups[0]);
                return number < maxNumber
                    ? strings.pad(number + 1, groups[0].length) + groups[1]
                    : strings.format('{0}{1}.1', groups[0], groups[1]);
            });
        }
        // file/folder=>file.1/folder.1
        return strings.format('{0}.1', name);
    }
    exports.incrementFileName = incrementFileName;
    // Global Compare with
    let GlobalCompareResourcesAction = class GlobalCompareResourcesAction extends actions_1.Action {
        constructor(id, label, quickOpenService, editorService, notificationService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
            this.editorService = editorService;
            this.notificationService = notificationService;
        }
        run() {
            const activeInput = this.editorService.activeEditor;
            const activeResource = activeInput ? activeInput.getResource() : undefined;
            if (activeResource) {
                // Compare with next editor that opens
                const toDispose = this.editorService.overrideOpenEditor(editor => {
                    // Only once!
                    toDispose.dispose();
                    // Open editor as diff
                    const resource = editor.getResource();
                    if (resource) {
                        return {
                            override: this.editorService.openEditor({
                                leftResource: activeResource,
                                rightResource: resource
                            }).then(() => undefined)
                        };
                    }
                    return undefined;
                });
                // Bring up quick open
                this.quickOpenService.show('', { autoFocus: { autoFocusSecondEntry: true } }).then(() => {
                    toDispose.dispose(); // make sure to unbind if quick open is closing
                });
            }
            else {
                this.notificationService.info(nls.localize('openFileToCompare', "Open a file first to compare it with another file."));
            }
            return Promise.resolve(true);
        }
    };
    GlobalCompareResourcesAction.ID = 'workbench.files.action.compareFileWith';
    GlobalCompareResourcesAction.LABEL = nls.localize('globalCompareFile', "Compare Active File With...");
    GlobalCompareResourcesAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, editorService_1.IEditorService),
        __param(4, notification_1.INotificationService)
    ], GlobalCompareResourcesAction);
    exports.GlobalCompareResourcesAction = GlobalCompareResourcesAction;
    let ToggleAutoSaveAction = class ToggleAutoSaveAction extends actions_1.Action {
        constructor(id, label, configurationService) {
            super(id, label);
            this.configurationService = configurationService;
        }
        run() {
            const setting = this.configurationService.inspect('files.autoSave');
            let userAutoSaveConfig = setting.user;
            if (types.isUndefinedOrNull(userAutoSaveConfig)) {
                userAutoSaveConfig = setting.default; // use default if setting not defined
            }
            let newAutoSaveValue;
            if ([files_2.AutoSaveConfiguration.AFTER_DELAY, files_2.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_2.AutoSaveConfiguration.ON_WINDOW_CHANGE].some(s => s === userAutoSaveConfig)) {
                newAutoSaveValue = files_2.AutoSaveConfiguration.OFF;
            }
            else {
                newAutoSaveValue = files_2.AutoSaveConfiguration.AFTER_DELAY;
            }
            return this.configurationService.updateValue('files.autoSave', newAutoSaveValue, 1 /* USER */);
        }
    };
    ToggleAutoSaveAction.ID = 'workbench.action.toggleAutoSave';
    ToggleAutoSaveAction.LABEL = nls.localize('toggleAutoSave', "Toggle Auto Save");
    ToggleAutoSaveAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ToggleAutoSaveAction);
    exports.ToggleAutoSaveAction = ToggleAutoSaveAction;
    let BaseSaveAllAction = class BaseSaveAllAction extends BaseErrorReportingAction {
        constructor(id, label, textFileService, untitledEditorService, commandService, notificationService) {
            super(id, label, notificationService);
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
            this.commandService = commandService;
            this.toDispose = [];
            this.lastIsDirty = this.textFileService.isDirty();
            this.enabled = this.lastIsDirty;
            this.registerListeners();
        }
        registerListeners() {
            // listen to files being changed locally
            this.toDispose.push(this.textFileService.models.onModelsDirty(e => this.updateEnablement(true)));
            this.toDispose.push(this.textFileService.models.onModelsSaved(e => this.updateEnablement(false)));
            this.toDispose.push(this.textFileService.models.onModelsReverted(e => this.updateEnablement(false)));
            this.toDispose.push(this.textFileService.models.onModelsSaveError(e => this.updateEnablement(true)));
            if (this.includeUntitled()) {
                this.toDispose.push(this.untitledEditorService.onDidChangeDirty(resource => this.updateEnablement(this.untitledEditorService.isDirty(resource))));
            }
        }
        updateEnablement(isDirty) {
            if (this.lastIsDirty !== isDirty) {
                this.enabled = this.textFileService.isDirty();
                this.lastIsDirty = this.enabled;
            }
        }
        run(context) {
            return this.doRun(context).then(() => true, error => {
                this.onError(error);
                return false;
            });
        }
        dispose() {
            this.toDispose = lifecycle_1.dispose(this.toDispose);
            super.dispose();
        }
    };
    BaseSaveAllAction = __decorate([
        __param(2, textfiles_1.ITextFileService),
        __param(3, untitledEditorService_1.IUntitledEditorService),
        __param(4, commands_1.ICommandService),
        __param(5, notification_1.INotificationService)
    ], BaseSaveAllAction);
    exports.BaseSaveAllAction = BaseSaveAllAction;
    class SaveAllAction extends BaseSaveAllAction {
        get class() {
            return 'explorer-action save-all';
        }
        doRun(context) {
            return this.commandService.executeCommand(fileCommands_1.SAVE_ALL_COMMAND_ID);
        }
        includeUntitled() {
            return true;
        }
    }
    SaveAllAction.ID = 'workbench.action.files.saveAll';
    SaveAllAction.LABEL = fileCommands_1.SAVE_ALL_LABEL;
    exports.SaveAllAction = SaveAllAction;
    class SaveAllInGroupAction extends BaseSaveAllAction {
        get class() {
            return 'explorer-action save-all';
        }
        doRun(context) {
            return this.commandService.executeCommand(fileCommands_1.SAVE_ALL_IN_GROUP_COMMAND_ID, {}, context);
        }
        includeUntitled() {
            return true;
        }
    }
    SaveAllInGroupAction.ID = 'workbench.files.action.saveAllInGroup';
    SaveAllInGroupAction.LABEL = nls.localize('saveAllInGroup', "Save All in Group");
    exports.SaveAllInGroupAction = SaveAllInGroupAction;
    let CloseGroupAction = class CloseGroupAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, 'action-close-all-files');
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, {}, context);
        }
    };
    CloseGroupAction.ID = 'workbench.files.action.closeGroup';
    CloseGroupAction.LABEL = nls.localize('closeGroup', "Close Group");
    CloseGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CloseGroupAction);
    exports.CloseGroupAction = CloseGroupAction;
    let FocusFilesExplorer = class FocusFilesExplorer extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(files_1.VIEWLET_ID, true);
        }
    };
    FocusFilesExplorer.ID = 'workbench.files.action.focusFilesExplorer';
    FocusFilesExplorer.LABEL = nls.localize('focusFilesExplorer', "Focus on Files Explorer");
    FocusFilesExplorer = __decorate([
        __param(2, viewlet_1.IViewletService)
    ], FocusFilesExplorer);
    exports.FocusFilesExplorer = FocusFilesExplorer;
    let ShowActiveFileInExplorer = class ShowActiveFileInExplorer extends actions_1.Action {
        constructor(id, label, editorService, notificationService, commandService) {
            super(id, label);
            this.editorService = editorService;
            this.notificationService = notificationService;
            this.commandService = commandService;
        }
        run() {
            const resource = editor_1.toResource(this.editorService.activeEditor || null, { supportSideBySide: true });
            if (resource) {
                this.commandService.executeCommand(fileCommands_1.REVEAL_IN_EXPLORER_COMMAND_ID, resource);
            }
            else {
                this.notificationService.info(nls.localize('openFileToShow', "Open a file first to show it in the explorer"));
            }
            return Promise.resolve(true);
        }
    };
    ShowActiveFileInExplorer.ID = 'workbench.files.action.showActiveFileInExplorer';
    ShowActiveFileInExplorer.LABEL = nls.localize('showInExplorer', "Reveal Active File in Side Bar");
    ShowActiveFileInExplorer = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, notification_1.INotificationService),
        __param(4, commands_1.ICommandService)
    ], ShowActiveFileInExplorer);
    exports.ShowActiveFileInExplorer = ShowActiveFileInExplorer;
    let CollapseExplorerView = class CollapseExplorerView extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(files_1.VIEWLET_ID).then((viewlet) => {
                const explorerView = viewlet.getExplorerView();
                if (explorerView) {
                    explorerView.collapseAll();
                }
            });
        }
    };
    CollapseExplorerView.ID = 'workbench.files.action.collapseExplorerFolders';
    CollapseExplorerView.LABEL = nls.localize('collapseExplorerFolders', "Collapse Folders in Explorer");
    CollapseExplorerView = __decorate([
        __param(2, viewlet_1.IViewletService)
    ], CollapseExplorerView);
    exports.CollapseExplorerView = CollapseExplorerView;
    let RefreshExplorerView = class RefreshExplorerView extends actions_1.Action {
        constructor(id, label, viewletService, explorerService) {
            super(id, label, 'explorer-action refresh-explorer');
            this.viewletService = viewletService;
            this.explorerService = explorerService;
        }
        run() {
            return this.viewletService.openViewlet(files_1.VIEWLET_ID).then(() => this.explorerService.refresh());
        }
    };
    RefreshExplorerView.ID = 'workbench.files.action.refreshFilesExplorer';
    RefreshExplorerView.LABEL = nls.localize('refreshExplorer', "Refresh Explorer");
    RefreshExplorerView = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, files_1.IExplorerService)
    ], RefreshExplorerView);
    exports.RefreshExplorerView = RefreshExplorerView;
    let ShowOpenedFileInNewWindow = class ShowOpenedFileInNewWindow extends actions_1.Action {
        constructor(id, label, editorService, windowService, notificationService, fileService) {
            super(id, label);
            this.editorService = editorService;
            this.windowService = windowService;
            this.notificationService = notificationService;
            this.fileService = fileService;
        }
        run() {
            const fileResource = editor_1.toResource(this.editorService.activeEditor || null, { supportSideBySide: true });
            if (fileResource) {
                if (this.fileService.canHandleResource(fileResource)) {
                    this.windowService.openWindow([{ uri: fileResource, typeHint: 'file' }], { forceNewWindow: true, forceOpenWorkspaceAsFile: true });
                }
                else {
                    this.notificationService.info(nls.localize('openFileToShowInNewWindow.unsupportedschema', "The active editor must contain an openable resource."));
                }
            }
            else {
                this.notificationService.info(nls.localize('openFileToShowInNewWindow.nofile', "Open a file first to open in new window"));
            }
            return Promise.resolve(true);
        }
    };
    ShowOpenedFileInNewWindow.ID = 'workbench.action.files.showOpenedFileInNewWindow';
    ShowOpenedFileInNewWindow.LABEL = nls.localize('openFileInNewWindow', "Open Active File in New Window");
    ShowOpenedFileInNewWindow = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, windows_1.IWindowService),
        __param(4, notification_1.INotificationService),
        __param(5, files_2.IFileService)
    ], ShowOpenedFileInNewWindow);
    exports.ShowOpenedFileInNewWindow = ShowOpenedFileInNewWindow;
    function validateFileName(item, name) {
        // Produce a well formed file name
        name = getWellFormedFileName(name);
        // Name not provided
        if (!name || name.length === 0 || /^\s+$/.test(name)) {
            return nls.localize('emptyFileNameError', "A file or folder name must be provided.");
        }
        // Relative paths only
        if (name[0] === '/' || name[0] === '\\') {
            return nls.localize('fileNameStartsWithSlashError', "A file or folder name cannot start with a slash.");
        }
        const names = arrays_1.coalesce(name.split(/[\\/]/));
        const parent = item.parent;
        if (name !== item.name) {
            // Do not allow to overwrite existing file
            const child = parent && parent.getChild(name);
            if (child && child !== item) {
                return nls.localize('fileNameExistsError', "A file or folder **{0}** already exists at this location. Please choose a different name.", name);
            }
        }
        // Invalid File name
        if (names.some((folderName) => !extpath.isValidBasename(folderName))) {
            return nls.localize('invalidFileNameError', "The name **{0}** is not valid as a file or folder name. Please choose a different name.", trimLongName(name));
        }
        // Max length restriction (on Windows)
        if (platform_1.isWindows) {
            const fullPathLength = item.resource.fsPath.length + 1 /* path segment */;
            if (fullPathLength > 255) {
                return nls.localize('filePathTooLongError', "The name **{0}** results in a path that is too long. Please choose a shorter name.", trimLongName(name));
            }
        }
        return null;
    }
    exports.validateFileName = validateFileName;
    function trimLongName(name) {
        if (name && name.length > 255) {
            return `${name.substr(0, 255)}...`;
        }
        return name;
    }
    function getWellFormedFileName(filename) {
        if (!filename) {
            return filename;
        }
        // Trim tabs
        filename = strings.trim(filename, '\t');
        // Remove trailing dots, slashes, and spaces
        filename = strings.rtrim(filename, '.');
        filename = strings.rtrim(filename, '/');
        filename = strings.rtrim(filename, '\\');
        return filename;
    }
    exports.getWellFormedFileName = getWellFormedFileName;
    let CompareWithClipboardAction = class CompareWithClipboardAction extends actions_1.Action {
        constructor(id, label, editorService, instantiationService, textModelService, fileService) {
            super(id, label);
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.textModelService = textModelService;
            this.fileService = fileService;
            this.enabled = true;
        }
        run() {
            const resource = editor_1.toResource(this.editorService.activeEditor || null, { supportSideBySide: true });
            if (resource && (this.fileService.canHandleResource(resource) || resource.scheme === network_1.Schemas.untitled)) {
                if (!this.registrationDisposal) {
                    const provider = this.instantiationService.createInstance(ClipboardContentProvider);
                    this.registrationDisposal = this.textModelService.registerTextModelContentProvider(CompareWithClipboardAction.SCHEME, provider);
                }
                const name = resources.basename(resource);
                const editorLabel = nls.localize('clipboardComparisonLabel', "Clipboard ↔ {0}", name);
                return this.editorService.openEditor({ leftResource: resource.with({ scheme: CompareWithClipboardAction.SCHEME }), rightResource: resource, label: editorLabel }).finally(() => {
                    this.registrationDisposal = lifecycle_1.dispose(this.registrationDisposal);
                });
            }
            return Promise.resolve(true);
        }
        dispose() {
            super.dispose();
            this.registrationDisposal = lifecycle_1.dispose(this.registrationDisposal);
        }
    };
    CompareWithClipboardAction.ID = 'workbench.files.action.compareWithClipboard';
    CompareWithClipboardAction.LABEL = nls.localize('compareWithClipboard', "Compare Active File with Clipboard");
    CompareWithClipboardAction.SCHEME = 'clipboardCompare';
    CompareWithClipboardAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, files_2.IFileService)
    ], CompareWithClipboardAction);
    exports.CompareWithClipboardAction = CompareWithClipboardAction;
    let ClipboardContentProvider = class ClipboardContentProvider {
        constructor(clipboardService, modeService, modelService) {
            this.clipboardService = clipboardService;
            this.modeService = modeService;
            this.modelService = modelService;
        }
        provideTextContent(resource) {
            const model = this.modelService.createModel(this.clipboardService.readText(), this.modeService.create('text/plain'), resource);
            return Promise.resolve(model);
        }
    };
    ClipboardContentProvider = __decorate([
        __param(0, clipboardService_1.IClipboardService),
        __param(1, modeService_1.IModeService),
        __param(2, modelService_1.IModelService)
    ], ClipboardContentProvider);
    function getContext(listWidget) {
        // These commands can only be triggered when explorer viewlet is visible so get it using the active viewlet
        const tree = listWidget;
        const focus = tree.getFocus();
        const stat = focus.length ? focus[0] : undefined;
        const selection = tree.getSelection();
        // Only respect the selection if user clicked inside it (focus belongs to it)
        return { stat, selection: selection && typeof stat !== 'undefined' && selection.indexOf(stat) >= 0 ? selection : [] };
    }
    // TODO@isidor these commands are calling into actions due to the complex inheritance action structure.
    // It should be the other way around, that actions call into commands.
    function openExplorerAndRunAction(accessor, constructor) {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const listService = accessor.get(listService_1.IListService);
        const viewletService = accessor.get(viewlet_1.IViewletService);
        const activeViewlet = viewletService.getActiveViewlet();
        let explorerPromise = Promise.resolve(activeViewlet);
        if (!activeViewlet || activeViewlet.getId() !== files_1.VIEWLET_ID) {
            explorerPromise = viewletService.openViewlet(files_1.VIEWLET_ID, true);
        }
        return explorerPromise.then((explorer) => {
            const explorerView = explorer.getExplorerView();
            if (explorerView && explorerView.isBodyVisible() && listService.lastFocusedList) {
                explorerView.focus();
                const { stat } = getContext(listService.lastFocusedList);
                const action = instantiationService.createInstance(constructor, () => stat);
                return action.run();
            }
            return undefined;
        });
    }
    commands_1.CommandsRegistry.registerCommand({
        id: exports.NEW_FILE_COMMAND_ID,
        handler: (accessor) => {
            return openExplorerAndRunAction(accessor, NewFileAction);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.NEW_FOLDER_COMMAND_ID,
        handler: (accessor) => {
            return openExplorerAndRunAction(accessor, NewFolderAction);
        }
    });
    exports.renameHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        const explorerService = accessor.get(files_1.IExplorerService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        if (!listService.lastFocusedList) {
            return;
        }
        const { stat } = getContext(listService.lastFocusedList);
        if (!stat) {
            return;
        }
        explorerService.setEditable(stat, {
            validationMessage: value => validateFileName(stat, value),
            onFinish: (value, success) => {
                if (success) {
                    const parentResource = stat.parent.resource;
                    const targetResource = resources.joinPath(parentResource, value);
                    textFileService.move(stat.resource, targetResource).then(() => refreshIfSeparator(value, explorerService), errors_1.onUnexpectedError);
                }
                explorerService.setEditable(stat, null);
            }
        });
    };
    exports.moveFileToTrashHandler = (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return Promise.resolve();
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
        const moveFileToTrashAction = instantiationService.createInstance(BaseDeleteFileAction, stats, true);
        return moveFileToTrashAction.run();
    };
    exports.deleteFileHandler = (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return Promise.resolve();
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
        const deleteFileAction = instantiationService.createInstance(BaseDeleteFileAction, stats, false);
        return deleteFileAction.run();
    };
    exports.copyFileHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return;
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const explorerService = accessor.get(files_1.IExplorerService);
        if (explorerContext.stat) {
            const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
            explorerService.setToCopy(stats, false);
            pasteShouldMove = false;
        }
    };
    exports.cutFileHandler = (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        if (!listService.lastFocusedList) {
            return;
        }
        const explorerContext = getContext(listService.lastFocusedList);
        const explorerService = accessor.get(files_1.IExplorerService);
        if (explorerContext.stat) {
            const stats = explorerContext.selection.length > 1 ? explorerContext.selection : [explorerContext.stat];
            explorerService.setToCopy(stats, true);
            pasteShouldMove = true;
        }
    };
    exports.pasteFileHandler = (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const listService = accessor.get(listService_1.IListService);
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        if (!listService.lastFocusedList) {
            return Promise.resolve();
        }
        const explorerContext = getContext(listService.lastFocusedList);
        return async_1.sequence(resources.distinctParents(clipboardService.readResources(), r => r).map(toCopy => {
            const pasteFileAction = instantiationService.createInstance(PasteFileAction, explorerContext.stat);
            return () => pasteFileAction.run(toCopy);
        }));
    };
});
//# sourceMappingURL=fileActions.js.map