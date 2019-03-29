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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/platform", "vs/platform/windows/common/windows", "vs/workbench/services/backup/common/backup", "vs/workbench/services/textfile/common/textfiles", "vs/platform/lifecycle/common/lifecycle", "vs/platform/workspace/common/workspace", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/common/editor/untitledEditorModel", "vs/workbench/services/textfile/common/textFileEditorModelManager", "vs/platform/instantiation/common/instantiation", "vs/base/common/map", "vs/base/common/network", "vs/workbench/services/history/common/history", "vs/platform/contextkey/common/contextkey", "vs/editor/common/model/textModel", "vs/editor/common/services/modelService", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/platform/remote/common/remoteHosts", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/modeService", "vs/workbench/services/editor/common/editorService", "vs/base/common/arrays", "vs/base/common/strings", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, uri_1, errors, objects, event_1, platform, windows_1, backup_1, textfiles_1, lifecycle_1, workspace_1, files_1, configuration_1, lifecycle_2, environment_1, untitledEditorService_1, untitledEditorModel_1, textFileEditorModelManager_1, instantiation_1, map_1, network_1, history_1, contextkey_1, textModel_1, modelService_1, notification_1, resources_1, remoteHosts_1, dialogs_1, modeService_1, editorService_1, arrays_1, strings_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The workbench file service implementation implements the raw file service spec and adds additional methods on top.
     *
     * It also adds diagnostics and logging around file system operations.
     */
    let TextFileService = class TextFileService extends lifecycle_2.Disposable {
        constructor(contextService, fileService, untitledEditorService, lifecycleService, instantiationService, configurationService, modeService, modelService, windowService, environmentService, notificationService, backupFileService, windowsService, historyService, contextKeyService, dialogService, fileDialogService, editorService) {
            super();
            this.contextService = contextService;
            this.fileService = fileService;
            this.untitledEditorService = untitledEditorService;
            this.lifecycleService = lifecycleService;
            this.configurationService = configurationService;
            this.modeService = modeService;
            this.modelService = modelService;
            this.windowService = windowService;
            this.environmentService = environmentService;
            this.notificationService = notificationService;
            this.backupFileService = backupFileService;
            this.windowsService = windowsService;
            this.historyService = historyService;
            this.dialogService = dialogService;
            this.fileDialogService = fileDialogService;
            this.editorService = editorService;
            this._onAutoSaveConfigurationChange = this._register(new event_1.Emitter());
            this._onFilesAssociationChange = this._register(new event_1.Emitter());
            this._onWillMove = this._register(new event_1.Emitter());
            this._models = instantiationService.createInstance(textFileEditorModelManager_1.TextFileEditorModelManager);
            this.autoSaveContext = textfiles_1.AutoSaveContext.bindTo(contextKeyService);
            const configuration = configurationService.getValue();
            this.currentFilesAssociationConfig = configuration && configuration.files && configuration.files.associations;
            this.onFilesConfigurationChange(configuration);
            this.registerListeners();
        }
        get onAutoSaveConfigurationChange() { return this._onAutoSaveConfigurationChange.event; }
        get onFilesAssociationChange() { return this._onFilesAssociationChange.event; }
        get onWillMove() { return this._onWillMove.event; }
        get models() {
            return this._models;
        }
        resolveTextContent(resource, options) {
            return this.fileService.resolveStreamContent(resource, options).then(streamContent => {
                return textModel_1.createTextBufferFactoryFromStream(streamContent.value).then(res => {
                    const r = {
                        resource: streamContent.resource,
                        name: streamContent.name,
                        mtime: streamContent.mtime,
                        etag: streamContent.etag,
                        encoding: streamContent.encoding,
                        isReadonly: streamContent.isReadonly,
                        value: res
                    };
                    return r;
                });
            });
        }
        promptForPath(resource, defaultUri) {
            // Help user to find a name for the file by opening it first
            return this.editorService.openEditor({ resource, options: { revealIfOpened: true, preserveFocus: true, } }).then(() => {
                return this.fileDialogService.showSaveDialog(this.getSaveDialogOptions(defaultUri));
            });
        }
        getSaveDialogOptions(defaultUri) {
            const options = {
                defaultUri,
                title: nls.localize('saveAsTitle', "Save As")
            };
            // Filters are only enabled on Windows where they work properly
            if (!platform.isWindows) {
                return options;
            }
            // Build the file filter by using our known languages
            const ext = defaultUri ? resources_1.extname(defaultUri) : undefined;
            let matchingFilter;
            const filters = arrays_1.coalesce(this.modeService.getRegisteredLanguageNames().map(languageName => {
                const extensions = this.modeService.getExtensions(languageName);
                if (!extensions || !extensions.length) {
                    return null;
                }
                const filter = { name: languageName, extensions: extensions.slice(0, 10).map(e => strings_1.trim(e, '.')) };
                if (ext && extensions.indexOf(ext) >= 0) {
                    matchingFilter = filter;
                    return null; // matching filter will be added last to the top
                }
                return filter;
            }));
            // Filters are a bit weird on Windows, based on having a match or not:
            // Match: we put the matching filter first so that it shows up selected and the all files last
            // No match: we put the all files filter first
            const allFilesFilter = { name: nls.localize('allFiles', "All Files"), extensions: ['*'] };
            if (matchingFilter) {
                filters.unshift(matchingFilter);
                filters.unshift(allFilesFilter);
            }
            else {
                filters.unshift(allFilesFilter);
            }
            // Allow to save file without extension
            filters.push({ name: nls.localize('noExt', "No Extension"), extensions: [''] });
            options.filters = filters;
            return options;
        }
        confirmSave(resources) {
            if (this.environmentService.isExtensionDevelopment) {
                return Promise.resolve(1 /* DONT_SAVE */); // no veto when we are in extension dev mode because we cannot assum we run interactive (e.g. tests)
            }
            const resourcesToConfirm = this.getDirty(resources);
            if (resourcesToConfirm.length === 0) {
                return Promise.resolve(1 /* DONT_SAVE */);
            }
            const message = resourcesToConfirm.length === 1 ? nls.localize('saveChangesMessage', "Do you want to save the changes you made to {0}?", resources_1.basename(resourcesToConfirm[0]))
                : dialogs_1.getConfirmMessage(nls.localize('saveChangesMessages', "Do you want to save the changes to the following {0} files?", resourcesToConfirm.length), resourcesToConfirm);
            const buttons = [
                resourcesToConfirm.length > 1 ? nls.localize({ key: 'saveAll', comment: ['&& denotes a mnemonic'] }, "&&Save All") : nls.localize({ key: 'save', comment: ['&& denotes a mnemonic'] }, "&&Save"),
                nls.localize({ key: 'dontSave', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
                nls.localize('cancel', "Cancel")
            ];
            return this.dialogService.show(notification_1.Severity.Warning, message, buttons, {
                cancelId: 2,
                detail: nls.localize('saveChangesDetail', "Your changes will be lost if you don't save them.")
            }).then(index => {
                switch (index) {
                    case 0: return 0 /* SAVE */;
                    case 1: return 1 /* DONT_SAVE */;
                    default: return 2 /* CANCEL */;
                }
            });
        }
        confirmOverwrite(resource) {
            const confirm = {
                message: nls.localize('confirmOverwrite', "'{0}' already exists. Do you want to replace it?", resources_1.basename(resource)),
                detail: nls.localize('irreversible', "A file or folder with the same name already exists in the folder {0}. Replacing it will overwrite its current contents.", resources_1.basename(resources_1.dirname(resource))),
                primaryButton: nls.localize({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                type: 'warning'
            };
            return this.dialogService.confirm(confirm).then(result => result.confirmed);
        }
        registerListeners() {
            // Lifecycle
            this.lifecycleService.onBeforeShutdown(event => event.veto(this.beforeShutdown(event.reason)));
            this.lifecycleService.onShutdown(this.dispose, this);
            // Files configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('files')) {
                    this.onFilesConfigurationChange(this.configurationService.getValue());
                }
            }));
        }
        beforeShutdown(reason) {
            // Dirty files need treatment on shutdown
            const dirty = this.getDirty();
            if (dirty.length) {
                // If auto save is enabled, save all files and then check again for dirty files
                // We DO NOT run any save participant if we are in the shutdown phase for performance reasons
                if (this.getAutoSaveMode() !== 0 /* OFF */) {
                    return this.saveAll(false /* files only */, { skipSaveParticipants: true }).then(() => {
                        // If we still have dirty files, we either have untitled ones or files that cannot be saved
                        const remainingDirty = this.getDirty();
                        if (remainingDirty.length) {
                            return this.handleDirtyBeforeShutdown(remainingDirty, reason);
                        }
                        return false;
                    });
                }
                // Auto save is not enabled
                return this.handleDirtyBeforeShutdown(dirty, reason);
            }
            // No dirty files: no veto
            return this.noVeto({ cleanUpBackups: true });
        }
        handleDirtyBeforeShutdown(dirty, reason) {
            // If hot exit is enabled, backup dirty files and allow to exit without confirmation
            if (this.isHotExitEnabled) {
                return this.backupBeforeShutdown(dirty, this.models, reason).then(result => {
                    if (result.didBackup) {
                        return this.noVeto({ cleanUpBackups: false }); // no veto and no backup cleanup (since backup was successful)
                    }
                    // since a backup did not happen, we have to confirm for the dirty files now
                    return this.confirmBeforeShutdown();
                }, errors => {
                    const firstError = errors[0];
                    this.notificationService.error(nls.localize('files.backup.failSave', "Files that are dirty could not be written to the backup location (Error: {0}). Try saving your files first and then exit.", firstError.message));
                    return true; // veto, the backups failed
                });
            }
            // Otherwise just confirm from the user what to do with the dirty files
            return this.confirmBeforeShutdown();
        }
        backupBeforeShutdown(dirtyToBackup, textFileEditorModelManager, reason) {
            return this.windowsService.getWindowCount().then(windowCount => {
                // When quit is requested skip the confirm callback and attempt to backup all workspaces.
                // When quit is not requested the confirm callback should be shown when the window being
                // closed is the only VS Code window open, except for on Mac where hot exit is only
                // ever activated when quit is requested.
                let doBackup;
                switch (reason) {
                    case 1 /* CLOSE */:
                        if (this.contextService.getWorkbenchState() !== 1 /* EMPTY */ && this.configuredHotExit === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                            doBackup = true; // backup if a folder is open and onExitAndWindowClose is configured
                        }
                        else if (windowCount > 1 || platform.isMacintosh) {
                            doBackup = false; // do not backup if a window is closed that does not cause quitting of the application
                        }
                        else {
                            doBackup = true; // backup if last window is closed on win/linux where the application quits right after
                        }
                        break;
                    case 2 /* QUIT */:
                        doBackup = true; // backup because next start we restore all backups
                        break;
                    case 3 /* RELOAD */:
                        doBackup = true; // backup because after window reload, backups restore
                        break;
                    case 4 /* LOAD */:
                        if (this.contextService.getWorkbenchState() !== 1 /* EMPTY */ && this.configuredHotExit === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                            doBackup = true; // backup if a folder is open and onExitAndWindowClose is configured
                        }
                        else {
                            doBackup = false; // do not backup because we are switching contexts
                        }
                        break;
                }
                if (!doBackup) {
                    return { didBackup: false };
                }
                // Backup
                return this.backupAll(dirtyToBackup, textFileEditorModelManager).then(() => { return { didBackup: true }; });
            });
        }
        backupAll(dirtyToBackup, textFileEditorModelManager) {
            // split up between files and untitled
            const filesToBackup = [];
            const untitledToBackup = [];
            dirtyToBackup.forEach(s => {
                if (this.fileService.canHandleResource(s)) {
                    const model = textFileEditorModelManager.get(s);
                    if (model) {
                        filesToBackup.push(model);
                    }
                }
                else if (s.scheme === network_1.Schemas.untitled) {
                    untitledToBackup.push(s);
                }
            });
            return this.doBackupAll(filesToBackup, untitledToBackup);
        }
        doBackupAll(dirtyFileModels, untitledResources) {
            const promises = dirtyFileModels.map(model => {
                const snapshot = model.createSnapshot();
                if (snapshot) {
                    return this.backupFileService.backupResource(model.getResource(), snapshot, model.getVersionId());
                }
                return Promise.resolve();
            });
            // Handle file resources first
            return Promise.all(promises).then(results => {
                // Handle untitled resources
                const untitledModelPromises = untitledResources
                    .filter(untitled => this.untitledEditorService.exists(untitled))
                    .map(untitled => this.untitledEditorService.loadOrCreate({ resource: untitled }));
                return Promise.all(untitledModelPromises).then(untitledModels => {
                    const untitledBackupPromises = untitledModels.map(model => {
                        const snapshot = model.createSnapshot();
                        if (snapshot) {
                            return this.backupFileService.backupResource(model.getResource(), snapshot, model.getVersionId());
                        }
                        return Promise.resolve();
                    });
                    return Promise.all(untitledBackupPromises).then(() => undefined);
                });
            });
        }
        confirmBeforeShutdown() {
            return this.confirmSave().then(confirm => {
                // Save
                if (confirm === 0 /* SAVE */) {
                    return this.saveAll(true /* includeUntitled */, { skipSaveParticipants: true }).then(result => {
                        if (result.results.some(r => !r.success)) {
                            return true; // veto if some saves failed
                        }
                        return this.noVeto({ cleanUpBackups: true });
                    });
                }
                // Don't Save
                else if (confirm === 1 /* DONT_SAVE */) {
                    // Make sure to revert untitled so that they do not restore
                    // see https://github.com/Microsoft/vscode/issues/29572
                    this.untitledEditorService.revertAll();
                    return this.noVeto({ cleanUpBackups: true });
                }
                // Cancel
                else if (confirm === 2 /* CANCEL */) {
                    return true; // veto
                }
                return false;
            });
        }
        noVeto(options) {
            if (!options.cleanUpBackups) {
                return false;
            }
            if (this.lifecycleService.phase < 3 /* Restored */) {
                return false; // if editors have not restored, we are not up to speed with backups and thus should not clean them
            }
            return this.cleanupBackupsBeforeShutdown().then(() => false, () => false);
        }
        cleanupBackupsBeforeShutdown() {
            if (this.environmentService.isExtensionDevelopment) {
                return Promise.resolve(undefined);
            }
            return this.backupFileService.discardAllWorkspaceBackups();
        }
        onFilesConfigurationChange(configuration) {
            const wasAutoSaveEnabled = (this.getAutoSaveMode() !== 0 /* OFF */);
            const autoSaveMode = (configuration && configuration.files && configuration.files.autoSave) || files_1.AutoSaveConfiguration.OFF;
            this.autoSaveContext.set(autoSaveMode);
            switch (autoSaveMode) {
                case files_1.AutoSaveConfiguration.AFTER_DELAY:
                    this.configuredAutoSaveDelay = configuration && configuration.files && configuration.files.autoSaveDelay;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
                case files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = true;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
                case files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = true;
                    break;
                default:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
            }
            // Emit as event
            this._onAutoSaveConfigurationChange.fire(this.getAutoSaveConfiguration());
            // save all dirty when enabling auto save
            if (!wasAutoSaveEnabled && this.getAutoSaveMode() !== 0 /* OFF */) {
                this.saveAll();
            }
            // Check for change in files associations
            const filesAssociation = configuration && configuration.files && configuration.files.associations;
            if (!objects.equals(this.currentFilesAssociationConfig, filesAssociation)) {
                this.currentFilesAssociationConfig = filesAssociation;
                this._onFilesAssociationChange.fire();
            }
            // Hot exit
            const hotExitMode = configuration && configuration.files && configuration.files.hotExit;
            if (hotExitMode === files_1.HotExitConfiguration.OFF || hotExitMode === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                this.configuredHotExit = hotExitMode;
            }
            else {
                this.configuredHotExit = files_1.HotExitConfiguration.ON_EXIT;
            }
        }
        getDirty(resources) {
            // Collect files
            const dirty = this.getDirtyFileModels(resources).map(m => m.getResource());
            // Add untitled ones
            dirty.push(...this.untitledEditorService.getDirty(resources));
            return dirty;
        }
        isDirty(resource) {
            // Check for dirty file
            if (this._models.getAll(resource).some(model => model.isDirty())) {
                return true;
            }
            // Check for dirty untitled
            return this.untitledEditorService.getDirty().some(dirty => !resource || dirty.toString() === resource.toString());
        }
        save(resource, options) {
            // Run a forced save if we detect the file is not dirty so that save participants can still run
            if (options && options.force && this.fileService.canHandleResource(resource) && !this.isDirty(resource)) {
                const model = this._models.get(resource);
                if (model) {
                    options.reason = 1 /* EXPLICIT */;
                    return model.save(options).then(() => !model.isDirty());
                }
            }
            return this.saveAll([resource], options).then(result => result.results.length === 1 && !!result.results[0].success);
        }
        saveAll(arg1, options) {
            // get all dirty
            let toSave = [];
            if (Array.isArray(arg1)) {
                toSave = this.getDirty(arg1);
            }
            else {
                toSave = this.getDirty();
            }
            // split up between files and untitled
            const filesToSave = [];
            const untitledToSave = [];
            toSave.forEach(s => {
                if ((Array.isArray(arg1) || arg1 === true /* includeUntitled */) && s.scheme === network_1.Schemas.untitled) {
                    untitledToSave.push(s);
                }
                else {
                    filesToSave.push(s);
                }
            });
            return this.doSaveAll(filesToSave, untitledToSave, options);
        }
        doSaveAll(fileResources, untitledResources, options) {
            // Handle files first that can just be saved
            return this.doSaveAllFiles(fileResources, options).then((result) => __awaiter(this, void 0, void 0, function* () {
                // Preflight for untitled to handle cancellation from the dialog
                const targetsForUntitled = [];
                for (const untitled of untitledResources) {
                    if (this.untitledEditorService.exists(untitled)) {
                        let targetUri;
                        // Untitled with associated file path don't need to prompt
                        if (this.untitledEditorService.hasAssociatedFilePath(untitled)) {
                            targetUri = this.untitledToAssociatedFileResource(untitled);
                        }
                        // Otherwise ask user
                        else {
                            const targetPath = yield this.promptForPath(untitled, this.suggestFileName(untitled));
                            if (!targetPath) {
                                return Promise.resolve({
                                    results: [...fileResources, ...untitledResources].map(r => ({ source: r }))
                                });
                            }
                            targetUri = targetPath;
                        }
                        targetsForUntitled.push(targetUri);
                    }
                }
                // Handle untitled
                const untitledSaveAsPromises = [];
                targetsForUntitled.forEach((target, index) => {
                    const untitledSaveAsPromise = this.saveAs(untitledResources[index], target).then(uri => {
                        result.results.push({
                            source: untitledResources[index],
                            target: uri,
                            success: !!uri
                        });
                    });
                    untitledSaveAsPromises.push(untitledSaveAsPromise);
                });
                return Promise.all(untitledSaveAsPromises).then(() => result);
            }));
        }
        untitledToAssociatedFileResource(untitled) {
            const authority = this.windowService.getConfiguration().remoteAuthority;
            return authority ? untitled.with({ scheme: remoteHosts_1.REMOTE_HOST_SCHEME, authority }) : untitled.with({ scheme: network_1.Schemas.file });
        }
        doSaveAllFiles(resources, options = Object.create(null)) {
            const dirtyFileModels = this.getDirtyFileModels(Array.isArray(resources) ? resources : undefined /* Save All */)
                .filter(model => {
                if ((model.hasState(3 /* CONFLICT */) || model.hasState(5 /* ERROR */)) && (options.reason === 2 /* AUTO */ || options.reason === 3 /* FOCUS_CHANGE */ || options.reason === 4 /* WINDOW_CHANGE */)) {
                    return false; // if model is in save conflict or error, do not save unless save reason is explicit or not provided at all
                }
                return true;
            });
            const mapResourceToResult = new map_1.ResourceMap();
            dirtyFileModels.forEach(m => {
                mapResourceToResult.set(m.getResource(), {
                    source: m.getResource()
                });
            });
            return Promise.all(dirtyFileModels.map(model => {
                return model.save(options).then(() => {
                    if (!model.isDirty()) {
                        const result = mapResourceToResult.get(model.getResource());
                        if (result) {
                            result.success = true;
                        }
                    }
                });
            })).then(r => ({ results: mapResourceToResult.values() }));
        }
        getFileModels(arg1) {
            if (Array.isArray(arg1)) {
                const models = [];
                arg1.forEach(resource => {
                    models.push(...this.getFileModels(resource));
                });
                return models;
            }
            return this._models.getAll(arg1);
        }
        getDirtyFileModels(arg1) {
            return this.getFileModels(arg1).filter(model => model.isDirty());
        }
        saveAs(resource, target, options) {
            // Get to target resource
            let targetPromise;
            if (target) {
                targetPromise = Promise.resolve(target);
            }
            else {
                let dialogPath = resource;
                if (resource.scheme === network_1.Schemas.untitled) {
                    dialogPath = this.suggestFileName(resource);
                }
                targetPromise = this.promptForPath(resource, dialogPath);
            }
            return targetPromise.then(target => {
                if (!target) {
                    return undefined; // user canceled
                }
                // Just save if target is same as models own resource
                if (resource.toString() === target.toString()) {
                    return this.save(resource, options).then(() => resource);
                }
                // Do it
                return this.doSaveAs(resource, target, options);
            });
        }
        doSaveAs(resource, target, options) {
            // Retrieve text model from provided resource if any
            let modelPromise = Promise.resolve(undefined);
            if (this.fileService.canHandleResource(resource)) {
                modelPromise = Promise.resolve(this._models.get(resource));
            }
            else if (resource.scheme === network_1.Schemas.untitled && this.untitledEditorService.exists(resource)) {
                modelPromise = this.untitledEditorService.loadOrCreate({ resource });
            }
            return modelPromise.then(model => {
                // We have a model: Use it (can be null e.g. if this file is binary and not a text file or was never opened before)
                if (model) {
                    return this.doSaveTextFileAs(model, resource, target, options);
                }
                // Otherwise we can only copy
                return this.fileService.copyFile(resource, target).then(() => true);
            }).then(result => {
                // Return early if the operation was not running
                if (!result) {
                    return target;
                }
                // Revert the source
                return this.revert(resource).then(() => {
                    // Done: return target
                    return target;
                });
            });
        }
        doSaveTextFileAs(sourceModel, resource, target, options) {
            let targetModelResolver;
            let targetExists = false;
            // Prefer an existing model if it is already loaded for the given target resource
            const targetModel = this.models.get(target);
            if (targetModel && targetModel.isResolved()) {
                targetModelResolver = Promise.resolve(targetModel);
                targetExists = true;
            }
            // Otherwise create the target file empty if it does not exist already and resolve it from there
            else {
                targetModelResolver = this.fileService.existsFile(target).then(exists => {
                    targetExists = exists;
                    // create target model adhoc if file does not exist yet
                    if (!targetExists) {
                        return this.fileService.updateContent(target, '');
                    }
                    return undefined;
                }).then(() => this.models.loadOrCreate(target));
            }
            return targetModelResolver.then(targetModel => {
                // Confirm to overwrite if we have an untitled file with associated file where
                // the file actually exists on disk and we are instructed to save to that file
                // path. This can happen if the file was created after the untitled file was opened.
                // See https://github.com/Microsoft/vscode/issues/67946
                let confirmWrite;
                if (sourceModel instanceof untitledEditorModel_1.UntitledEditorModel && sourceModel.hasAssociatedFilePath && targetExists && resources_1.isEqual(target, this.untitledToAssociatedFileResource(sourceModel.getResource()))) {
                    confirmWrite = this.confirmOverwrite(target);
                }
                else {
                    confirmWrite = Promise.resolve(true);
                }
                return confirmWrite.then(write => {
                    if (!write) {
                        return false;
                    }
                    // take over encoding and model value from source model
                    targetModel.updatePreferredEncoding(sourceModel.getEncoding());
                    if (targetModel.textEditorModel) {
                        const snapshot = sourceModel.createSnapshot();
                        if (snapshot) {
                            this.modelService.updateModel(targetModel.textEditorModel, textModel_1.createTextBufferFactoryFromSnapshot(snapshot));
                        }
                    }
                    // save model
                    return targetModel.save(options).then(() => true);
                });
            }, error => {
                // binary model: delete the file and run the operation again
                if (error.fileOperationResult === 0 /* FILE_IS_BINARY */ || error.fileOperationResult === 8 /* FILE_TOO_LARGE */) {
                    return this.fileService.del(target).then(() => this.doSaveTextFileAs(sourceModel, resource, target, options));
                }
                return Promise.reject(error);
            });
        }
        suggestFileName(untitledResource) {
            const untitledFileName = this.untitledEditorService.suggestFileName(untitledResource);
            const remoteAuthority = this.windowService.getConfiguration().remoteAuthority;
            const schemeFilter = remoteAuthority ? remoteHosts_1.REMOTE_HOST_SCHEME : network_1.Schemas.file;
            const lastActiveFile = this.historyService.getLastActiveFile(schemeFilter);
            if (lastActiveFile) {
                const lastDir = resources_1.dirname(lastActiveFile);
                return resources_1.joinPath(lastDir, untitledFileName);
            }
            const lastActiveFolder = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            if (lastActiveFolder) {
                return resources_1.joinPath(lastActiveFolder, untitledFileName);
            }
            return schemeFilter === network_1.Schemas.file ? uri_1.URI.file(untitledFileName) : uri_1.URI.from({ scheme: schemeFilter, authority: remoteAuthority, path: '/' + untitledFileName });
        }
        revert(resource, options) {
            return this.revertAll([resource], options).then(result => result.results.length === 1 && !!result.results[0].success);
        }
        revertAll(resources, options) {
            // Revert files first
            return this.doRevertAllFiles(resources, options).then(operation => {
                // Revert untitled
                const reverted = this.untitledEditorService.revertAll(resources);
                reverted.forEach(res => operation.results.push({ source: res, success: true }));
                return operation;
            });
        }
        doRevertAllFiles(resources, options) {
            const fileModels = options && options.force ? this.getFileModels(resources) : this.getDirtyFileModels(resources);
            const mapResourceToResult = new map_1.ResourceMap();
            fileModels.forEach(m => {
                mapResourceToResult.set(m.getResource(), {
                    source: m.getResource()
                });
            });
            return Promise.all(fileModels.map(model => {
                return model.revert(options && options.soft).then(() => {
                    if (!model.isDirty()) {
                        const result = mapResourceToResult.get(model.getResource());
                        if (result) {
                            result.success = true;
                        }
                    }
                }, error => {
                    // FileNotFound means the file got deleted meanwhile, so still record as successful revert
                    if (error.fileOperationResult === 2 /* FILE_NOT_FOUND */) {
                        const result = mapResourceToResult.get(model.getResource());
                        if (result) {
                            result.success = true;
                        }
                    }
                    // Otherwise bubble up the error
                    else {
                        return Promise.reject(error);
                    }
                    return undefined;
                });
            })).then(r => ({ results: mapResourceToResult.values() }));
        }
        create(resource, contents, options) {
            const existingModel = this.models.get(resource);
            return this.fileService.createFile(resource, contents, options).then(() => {
                // If we had an existing model for the given resource, load
                // it again to make sure it is up to date with the contents
                // we just wrote into the underlying resource by calling
                // revert()
                if (existingModel && !existingModel.isDisposed()) {
                    return existingModel.revert();
                }
                return undefined;
            });
        }
        delete(resource, options) {
            const dirtyFiles = this.getDirty().filter(dirty => resources_1.isEqualOrParent(dirty, resource, !platform.isLinux /* ignorecase */));
            return this.revertAll(dirtyFiles, { soft: true }).then(() => this.fileService.del(resource, options));
        }
        move(source, target, overwrite) {
            const waitForPromises = [];
            // Event
            this._onWillMove.fire({
                oldResource: source,
                newResource: target,
                waitUntil(promise) {
                    waitForPromises.push(promise.then(undefined, errors.onUnexpectedError));
                }
            });
            // prevent async waitUntil-calls
            Object.freeze(waitForPromises);
            return Promise.all(waitForPromises).then(() => {
                // Handle target models if existing (if target URI is a folder, this can be multiple)
                let handleTargetModelPromise = Promise.resolve();
                const dirtyTargetModels = this.getDirtyFileModels().filter(model => resources_1.isEqualOrParent(model.getResource(), target, false /* do not ignorecase, see https://github.com/Microsoft/vscode/issues/56384 */));
                if (dirtyTargetModels.length) {
                    handleTargetModelPromise = this.revertAll(dirtyTargetModels.map(targetModel => targetModel.getResource()), { soft: true });
                }
                return handleTargetModelPromise.then(() => {
                    // Handle dirty source models if existing (if source URI is a folder, this can be multiple)
                    let handleDirtySourceModels;
                    const dirtySourceModels = this.getDirtyFileModels().filter(model => resources_1.isEqualOrParent(model.getResource(), source, !platform.isLinux /* ignorecase */));
                    const dirtyTargetModels = [];
                    if (dirtySourceModels.length) {
                        handleDirtySourceModels = Promise.all(dirtySourceModels.map(sourceModel => {
                            const sourceModelResource = sourceModel.getResource();
                            let targetModelResource;
                            // If the source is the actual model, just use target as new resource
                            if (resources_1.isEqual(sourceModelResource, source, !platform.isLinux /* ignorecase */)) {
                                targetModelResource = target;
                            }
                            // Otherwise a parent folder of the source is being moved, so we need
                            // to compute the target resource based on that
                            else {
                                targetModelResource = sourceModelResource.with({ path: resources_1.joinPath(target, sourceModelResource.path.substr(source.path.length + 1)).path });
                            }
                            // Remember as dirty target model to load after the operation
                            dirtyTargetModels.push(targetModelResource);
                            // Backup dirty source model to the target resource it will become later
                            const snapshot = sourceModel.createSnapshot();
                            if (snapshot) {
                                return this.backupFileService.backupResource(targetModelResource, snapshot, sourceModel.getVersionId());
                            }
                            return Promise.resolve();
                        }));
                    }
                    else {
                        handleDirtySourceModels = Promise.resolve();
                    }
                    return handleDirtySourceModels.then(() => {
                        // Soft revert the dirty source files if any
                        return this.revertAll(dirtySourceModels.map(dirtySourceModel => dirtySourceModel.getResource()), { soft: true }).then(() => {
                            // Rename to target
                            return this.fileService.moveFile(source, target, overwrite).then(() => {
                                // Load models that were dirty before
                                return Promise.all(dirtyTargetModels.map(dirtyTargetModel => this.models.loadOrCreate(dirtyTargetModel))).then(() => undefined);
                            }, error => {
                                // In case of an error, discard any dirty target backups that were made
                                return Promise.all(dirtyTargetModels.map(dirtyTargetModel => this.backupFileService.discardResourceBackup(dirtyTargetModel)))
                                    .then(() => Promise.reject(error));
                            });
                        });
                    });
                });
            });
        }
        getAutoSaveMode() {
            if (this.configuredAutoSaveOnFocusChange) {
                return 3 /* ON_FOCUS_CHANGE */;
            }
            if (this.configuredAutoSaveOnWindowChange) {
                return 4 /* ON_WINDOW_CHANGE */;
            }
            if (this.configuredAutoSaveDelay && this.configuredAutoSaveDelay > 0) {
                return this.configuredAutoSaveDelay <= 1000 ? 1 /* AFTER_SHORT_DELAY */ : 2 /* AFTER_LONG_DELAY */;
            }
            return 0 /* OFF */;
        }
        getAutoSaveConfiguration() {
            return {
                autoSaveDelay: this.configuredAutoSaveDelay && this.configuredAutoSaveDelay > 0 ? this.configuredAutoSaveDelay : undefined,
                autoSaveFocusChange: this.configuredAutoSaveOnFocusChange,
                autoSaveApplicationChange: this.configuredAutoSaveOnWindowChange
            };
        }
        get isHotExitEnabled() {
            return !this.environmentService.isExtensionDevelopment && this.configuredHotExit !== files_1.HotExitConfiguration.OFF;
        }
        dispose() {
            // Clear all caches
            this._models.clear();
            super.dispose();
        }
    };
    TextFileService = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, files_1.IFileService),
        __param(2, untitledEditorService_1.IUntitledEditorService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, modeService_1.IModeService),
        __param(7, modelService_1.IModelService),
        __param(8, windows_1.IWindowService),
        __param(9, environment_1.IEnvironmentService),
        __param(10, notification_1.INotificationService),
        __param(11, backup_1.IBackupFileService),
        __param(12, windows_1.IWindowsService),
        __param(13, history_1.IHistoryService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, dialogs_1.IDialogService),
        __param(16, dialogs_1.IFileDialogService),
        __param(17, editorService_1.IEditorService)
    ], TextFileService);
    exports.TextFileService = TextFileService;
    extensions_1.registerSingleton(textfiles_1.ITextFileService, TextFileService);
});
//# sourceMappingURL=textFileService.js.map