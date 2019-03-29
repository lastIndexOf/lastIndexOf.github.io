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
define(["require", "exports", "vs/base/common/path", "vs/nls", "vs/base/common/event", "vs/base/common/mime", "vs/base/common/errorMessage", "vs/base/common/uri", "vs/base/common/types", "vs/platform/workspace/common/workspace", "vs/platform/environment/common/environment", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/editor/textEditorModel", "vs/workbench/services/backup/common/backup", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/platform/telemetry/common/telemetry", "vs/base/common/async", "vs/workbench/services/hash/common/hashService", "vs/editor/common/model/textModel", "vs/platform/notification/common/notification", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/resources", "vs/base/common/errors"], function (require, exports, path_1, nls, event_1, mime_1, errorMessage_1, uri_1, types_1, workspace_1, environment_1, textfiles_1, textEditorModel_1, backup_1, files_1, instantiation_1, modeService_1, modelService_1, telemetry_1, async_1, hashService_1, textModel_1, notification_1, platform_1, lifecycle_1, log_1, resources_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The text file editor model listens to changes to its underlying code editor model and saves these changes through the file service back to the disk.
     */
    let TextFileEditorModel = class TextFileEditorModel extends textEditorModel_1.BaseTextEditorModel {
        constructor(resource, preferredEncoding, notificationService, modeService, modelService, fileService, instantiationService, telemetryService, textFileService, backupFileService, environmentService, contextService, hashService, logService) {
            super(modelService, modeService);
            this.notificationService = notificationService;
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this.telemetryService = telemetryService;
            this.textFileService = textFileService;
            this.backupFileService = backupFileService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.hashService = hashService;
            this.logService = logService;
            this._onDidContentChange = this._register(new event_1.Emitter());
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.resource = resource;
            this.preferredEncoding = preferredEncoding;
            this.inOrphanMode = false;
            this.dirty = false;
            this.versionId = 0;
            this.lastSaveAttemptTime = 0;
            this.saveSequentializer = new SaveSequentializer();
            this.contentChangeEventScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidContentChange.fire(6 /* CONTENT_CHANGE */), TextFileEditorModel.DEFAULT_CONTENT_CHANGE_BUFFER_DELAY));
            this.orphanedChangeEventScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidStateChange.fire(7 /* ORPHANED_CHANGE */), TextFileEditorModel.DEFAULT_ORPHANED_CHANGE_BUFFER_DELAY));
            this.updateAutoSaveConfiguration(textFileService.getAutoSaveConfiguration());
            this.registerListeners();
        }
        static setSaveErrorHandler(handler) { TextFileEditorModel.saveErrorHandler = handler; }
        static setSaveParticipant(handler) { TextFileEditorModel.saveParticipant = handler; }
        get onDidContentChange() { return this._onDidContentChange.event; }
        get onDidStateChange() { return this._onDidStateChange.event; }
        registerListeners() {
            this._register(this.fileService.onFileChanges(e => this.onFileChanges(e)));
            this._register(this.textFileService.onAutoSaveConfigurationChange(config => this.updateAutoSaveConfiguration(config)));
            this._register(this.textFileService.onFilesAssociationChange(e => this.onFilesAssociationChange()));
            this._register(this.onDidStateChange(e => this.onStateChange(e)));
        }
        onStateChange(e) {
            if (e === 4 /* REVERTED */) {
                // Cancel any content change event promises as they are no longer valid.
                this.contentChangeEventScheduler.cancel();
                // Refire state change reverted events as content change events
                this._onDidContentChange.fire(4 /* REVERTED */);
            }
        }
        onFileChanges(e) {
            let fileEventImpactsModel = false;
            let newInOrphanModeGuess;
            // If we are currently orphaned, we check if the model file was added back
            if (this.inOrphanMode) {
                const modelFileAdded = e.contains(this.resource, 1 /* ADDED */);
                if (modelFileAdded) {
                    newInOrphanModeGuess = false;
                    fileEventImpactsModel = true;
                }
            }
            // Otherwise we check if the model file was deleted
            else {
                const modelFileDeleted = e.contains(this.resource, 2 /* DELETED */);
                if (modelFileDeleted) {
                    newInOrphanModeGuess = true;
                    fileEventImpactsModel = true;
                }
            }
            if (fileEventImpactsModel && this.inOrphanMode !== newInOrphanModeGuess) {
                let checkOrphanedPromise;
                if (newInOrphanModeGuess) {
                    // We have received reports of users seeing delete events even though the file still
                    // exists (network shares issue: https://github.com/Microsoft/vscode/issues/13665).
                    // Since we do not want to mark the model as orphaned, we have to check if the
                    // file is really gone and not just a faulty file event.
                    checkOrphanedPromise = async_1.timeout(100).then(() => {
                        if (this.disposed) {
                            return true;
                        }
                        return this.fileService.existsFile(this.resource).then(exists => !exists);
                    });
                }
                else {
                    checkOrphanedPromise = Promise.resolve(false);
                }
                checkOrphanedPromise.then(newInOrphanModeValidated => {
                    if (this.inOrphanMode !== newInOrphanModeValidated && !this.disposed) {
                        this.setOrphaned(newInOrphanModeValidated);
                    }
                });
            }
        }
        setOrphaned(orphaned) {
            if (this.inOrphanMode !== orphaned) {
                this.inOrphanMode = orphaned;
                this.orphanedChangeEventScheduler.schedule();
            }
        }
        updateAutoSaveConfiguration(config) {
            const autoSaveAfterMilliesEnabled = (typeof config.autoSaveDelay === 'number') && config.autoSaveDelay > 0;
            this.autoSaveAfterMilliesEnabled = autoSaveAfterMilliesEnabled;
            this.autoSaveAfterMillies = autoSaveAfterMilliesEnabled ? config.autoSaveDelay : undefined;
        }
        onFilesAssociationChange() {
            if (!this.textEditorModel) {
                return;
            }
            const firstLineText = this.getFirstLineText(this.textEditorModel);
            const languageSelection = this.getOrCreateMode(this.modeService, undefined, firstLineText);
            this.modelService.setMode(this.textEditorModel, languageSelection);
        }
        getVersionId() {
            return this.versionId;
        }
        revert(soft) {
            if (!this.isResolved()) {
                return Promise.resolve(undefined);
            }
            // Cancel any running auto-save
            this.cancelPendingAutoSave();
            // Unset flags
            const undo = this.setDirty(false);
            let loadPromise;
            if (soft) {
                loadPromise = Promise.resolve();
            }
            else {
                loadPromise = this.load({ forceReadFromDisk: true });
            }
            return loadPromise.then(() => {
                // Emit file change event
                this._onDidStateChange.fire(4 /* REVERTED */);
            }, error => {
                // Set flags back to previous values, we are still dirty if revert failed
                undo();
                return Promise.reject(error);
            });
        }
        load(options) {
            this.logService.trace('load() - enter', this.resource);
            // It is very important to not reload the model when the model is dirty.
            // We also only want to reload the model from the disk if no save is pending
            // to avoid data loss.
            if (this.dirty || this.saveSequentializer.hasPendingSave()) {
                this.logService.trace('load() - exit - without loading because model is dirty or being saved', this.resource);
                return Promise.resolve(this);
            }
            // Only for new models we support to load from backup
            if (!this.textEditorModel && !this.createTextEditorModelPromise) {
                return this.loadFromBackup(options);
            }
            // Otherwise load from file resource
            return this.loadFromFile(options);
        }
        loadFromBackup(options) {
            return this.backupFileService.loadBackupResource(this.resource).then(backup => {
                // Make sure meanwhile someone else did not suceed or start loading
                if (this.createTextEditorModelPromise || this.textEditorModel) {
                    return this.createTextEditorModelPromise || this;
                }
                // If we have a backup, continue loading with it
                if (!!backup) {
                    const content = {
                        resource: this.resource,
                        name: resources_1.basename(this.resource),
                        mtime: Date.now(),
                        etag: undefined,
                        value: textModel_1.createTextBufferFactory(''),
                        encoding: this.fileService.encoding.getWriteEncoding(this.resource, this.preferredEncoding).encoding,
                        isReadonly: false
                    };
                    return this.loadWithContent(content, options, backup);
                }
                // Otherwise load from file
                return this.loadFromFile(options);
            });
        }
        loadFromFile(options) {
            const forceReadFromDisk = options && options.forceReadFromDisk;
            const allowBinary = this.isResolved() /* always allow if we resolved previously */ || (options && options.allowBinary);
            // Decide on etag
            let etag;
            if (forceReadFromDisk) {
                etag = undefined; // reset ETag if we enforce to read from disk
            }
            else if (this.lastResolvedDiskStat) {
                etag = this.lastResolvedDiskStat.etag; // otherwise respect etag to support caching
            }
            // Ensure to track the versionId before doing a long running operation
            // to make sure the model was not changed in the meantime which would
            // indicate that the user or program has made edits. If we would ignore
            // this, we could potentially loose the changes that were made because
            // after resolving the content we update the model and reset the dirty
            // flag.
            const currentVersionId = this.versionId;
            // Resolve Content
            return this.textFileService
                .resolveTextContent(this.resource, { acceptTextOnly: !allowBinary, etag, encoding: this.preferredEncoding })
                .then(content => {
                // Clear orphaned state when loading was successful
                this.setOrphaned(false);
                // Guard against the model having changed in the meantime
                if (currentVersionId === this.versionId) {
                    return this.loadWithContent(content, options);
                }
                return this;
            }, error => {
                const result = error.fileOperationResult;
                // Apply orphaned state based on error code
                this.setOrphaned(result === 2 /* FILE_NOT_FOUND */);
                // NotModified status is expected and can be handled gracefully
                if (result === 3 /* FILE_NOT_MODIFIED_SINCE */) {
                    // Guard against the model having changed in the meantime
                    if (currentVersionId === this.versionId) {
                        this.setDirty(false); // Ensure we are not tracking a stale state
                    }
                    return this;
                }
                // Ignore when a model has been resolved once and the file was deleted meanwhile. Since
                // we already have the model loaded, we can return to this state and update the orphaned
                // flag to indicate that this model has no version on disk anymore.
                if (this.isResolved() && result === 2 /* FILE_NOT_FOUND */) {
                    return this;
                }
                // Otherwise bubble up the error
                return Promise.reject(error);
            });
        }
        loadWithContent(content, options, backup) {
            return this.doLoadWithContent(content, backup).then(model => {
                // Telemetry: We log the fileGet telemetry event after the model has been loaded to ensure a good mimetype
                const settingsType = this.getTypeIfSettings();
                if (settingsType) {
                    /* __GDPR__
                        "settingsRead" : {
                            "settingsType": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('settingsRead', { settingsType }); // Do not log read to user settings.json and .vscode folder as a fileGet event as it ruins our JSON usage data
                }
                else {
                    /* __GDPR__
                        "fileGet" : {
                            "${include}": [
                                "${FileTelemetryData}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog('fileGet', this.getTelemetryData(options && options.reason ? options.reason : 3 /* OTHER */));
                }
                return model;
            });
        }
        doLoadWithContent(content, backup) {
            this.logService.trace('load() - resolved content', this.resource);
            // Update our resolved disk stat model
            this.updateLastResolvedDiskStat({
                resource: this.resource,
                name: content.name,
                mtime: content.mtime,
                etag: content.etag,
                isDirectory: false,
                isSymbolicLink: false,
                children: undefined,
                isReadonly: content.isReadonly
            });
            // Keep the original encoding to not loose it when saving
            const oldEncoding = this.contentEncoding;
            this.contentEncoding = content.encoding;
            // Handle events if encoding changed
            if (this.preferredEncoding) {
                this.updatePreferredEncoding(this.contentEncoding); // make sure to reflect the real encoding of the file (never out of sync)
            }
            else if (oldEncoding !== this.contentEncoding) {
                this._onDidStateChange.fire(5 /* ENCODING */);
            }
            // Update Existing Model
            if (this.textEditorModel) {
                this.doUpdateTextModel(content.value);
                return Promise.resolve(this);
            }
            // Join an existing request to create the editor model to avoid race conditions
            else if (this.createTextEditorModelPromise) {
                this.logService.trace('load() - join existing text editor model promise', this.resource);
                return this.createTextEditorModelPromise;
            }
            // Create New Model
            return this.doCreateTextModel(content.resource, content.value, backup);
        }
        doUpdateTextModel(value) {
            this.logService.trace('load() - updated text editor model', this.resource);
            // Ensure we are not tracking a stale state
            this.setDirty(false);
            // Update model value in a block that ignores model content change events
            this.blockModelContentChange = true;
            try {
                this.updateTextEditorModel(value);
            }
            finally {
                this.blockModelContentChange = false;
            }
            // Ensure we track the latest saved version ID given that the contents changed
            this.updateSavedVersionId();
        }
        doCreateTextModel(resource, value, backup) {
            this.logService.trace('load() - created text editor model', this.resource);
            this.createTextEditorModelPromise = this.doLoadBackup(backup).then(backupContent => {
                this.createTextEditorModelPromise = null;
                // Create model
                const hasBackupContent = !!backupContent;
                this.createTextEditorModel(backupContent ? backupContent : value, resource);
                // We restored a backup so we have to set the model as being dirty
                // We also want to trigger auto save if it is enabled to simulate the exact same behaviour
                // you would get if manually making the model dirty (fixes https://github.com/Microsoft/vscode/issues/16977)
                if (hasBackupContent) {
                    this.makeDirty();
                    if (this.autoSaveAfterMilliesEnabled) {
                        this.doAutoSave(this.versionId);
                    }
                }
                // Ensure we are not tracking a stale state
                else {
                    this.setDirty(false);
                }
                // Model Listeners
                this.installModelListeners();
                return this;
            }, error => {
                this.createTextEditorModelPromise = null;
                return Promise.reject(error);
            });
            return this.createTextEditorModelPromise;
        }
        installModelListeners() {
            // See https://github.com/Microsoft/vscode/issues/30189
            // This code has been extracted to a different method because it caused a memory leak
            // where `value` was captured in the content change listener closure scope.
            // Content Change
            if (this.textEditorModel) {
                this._register(this.textEditorModel.onDidChangeContent(() => this.onModelContentChanged()));
            }
        }
        doLoadBackup(backup) {
            if (!backup) {
                return Promise.resolve(null);
            }
            return this.backupFileService.resolveBackupContent(backup).then(backupContent => backupContent || null, error => null /* ignore errors */);
        }
        getOrCreateMode(modeService, preferredModeIds, firstLineText) {
            return modeService.createByFilepathOrFirstLine(this.resource.fsPath, firstLineText);
        }
        onModelContentChanged() {
            this.logService.trace(`onModelContentChanged() - enter`, this.resource);
            // In any case increment the version id because it tracks the textual content state of the model at all times
            this.versionId++;
            this.logService.trace(`onModelContentChanged() - new versionId ${this.versionId}`, this.resource);
            // Ignore if blocking model changes
            if (this.blockModelContentChange) {
                return;
            }
            // The contents changed as a matter of Undo and the version reached matches the saved one
            // In this case we clear the dirty flag and emit a SAVED event to indicate this state.
            // Note: we currently only do this check when auto-save is turned off because there you see
            // a dirty indicator that you want to get rid of when undoing to the saved version.
            if (!this.autoSaveAfterMilliesEnabled && this.textEditorModel && this.textEditorModel.getAlternativeVersionId() === this.bufferSavedVersionId) {
                this.logService.trace('onModelContentChanged() - model content changed back to last saved version', this.resource);
                // Clear flags
                const wasDirty = this.dirty;
                this.setDirty(false);
                // Emit event
                if (wasDirty) {
                    this._onDidStateChange.fire(4 /* REVERTED */);
                }
                return;
            }
            this.logService.trace('onModelContentChanged() - model content changed and marked as dirty', this.resource);
            // Mark as dirty
            this.makeDirty();
            // Start auto save process unless we are in conflict resolution mode and unless it is disabled
            if (this.autoSaveAfterMilliesEnabled) {
                if (!this.inConflictMode) {
                    this.doAutoSave(this.versionId);
                }
                else {
                    this.logService.trace('makeDirty() - prevented save because we are in conflict resolution mode', this.resource);
                }
            }
            // Handle content change events
            this.contentChangeEventScheduler.schedule();
        }
        makeDirty() {
            // Track dirty state and version id
            const wasDirty = this.dirty;
            this.setDirty(true);
            // Emit as Event if we turned dirty
            if (!wasDirty) {
                this._onDidStateChange.fire(0 /* DIRTY */);
            }
        }
        doAutoSave(versionId) {
            this.logService.trace(`doAutoSave() - enter for versionId ${versionId}`, this.resource);
            // Cancel any currently running auto saves to make this the one that succeeds
            this.cancelPendingAutoSave();
            // Create new save timer and store it for disposal as needed
            const handle = setTimeout(() => {
                // Only trigger save if the version id has not changed meanwhile
                if (versionId === this.versionId) {
                    this.doSave(versionId, { reason: 2 /* AUTO */ }); // Very important here to not return the promise because if the timeout promise is canceled it will bubble up the error otherwise - do not change
                }
            }, this.autoSaveAfterMillies);
            this.autoSaveDisposable = lifecycle_1.toDisposable(() => clearTimeout(handle));
        }
        cancelPendingAutoSave() {
            if (this.autoSaveDisposable) {
                this.autoSaveDisposable.dispose();
                this.autoSaveDisposable = undefined;
            }
        }
        save(options = Object.create(null)) {
            if (!this.isResolved()) {
                return Promise.resolve(undefined);
            }
            this.logService.trace('save() - enter', this.resource);
            // Cancel any currently running auto saves to make this the one that succeeds
            this.cancelPendingAutoSave();
            return this.doSave(this.versionId, options);
        }
        doSave(versionId, options) {
            if (types_1.isUndefinedOrNull(options.reason)) {
                options.reason = 1 /* EXPLICIT */;
            }
            this.logService.trace(`doSave(${versionId}) - enter with versionId ' + versionId`, this.resource);
            // Lookup any running pending save for this versionId and return it if found
            //
            // Scenario: user invoked the save action multiple times quickly for the same contents
            //           while the save was not yet finished to disk
            //
            if (this.saveSequentializer.hasPendingSave(versionId)) {
                this.logService.trace(`doSave(${versionId}) - exit - found a pending save for versionId ${versionId}`, this.resource);
                return this.saveSequentializer.pendingSave || Promise.resolve(undefined);
            }
            // Return early if not dirty (unless forced) or version changed meanwhile
            //
            // Scenario A: user invoked save action even though the model is not dirty
            // Scenario B: auto save was triggered for a certain change by the user but meanwhile the user changed
            //             the contents and the version for which auto save was started is no longer the latest.
            //             Thus we avoid spawning multiple auto saves and only take the latest.
            //
            if ((!options.force && !this.dirty) || versionId !== this.versionId) {
                this.logService.trace(`doSave(${versionId}) - exit - because not dirty and/or versionId is different (this.isDirty: ${this.dirty}, this.versionId: ${this.versionId})`, this.resource);
                return Promise.resolve(undefined);
            }
            // Return if currently saving by storing this save request as the next save that should happen.
            // Never ever must 2 saves execute at the same time because this can lead to dirty writes and race conditions.
            //
            // Scenario A: auto save was triggered and is currently busy saving to disk. this takes long enough that another auto save
            //             kicks in.
            // Scenario B: save is very slow (e.g. network share) and the user manages to change the buffer and trigger another save
            //             while the first save has not returned yet.
            //
            if (this.saveSequentializer.hasPendingSave()) {
                this.logService.trace(`doSave(${versionId}) - exit - because busy saving`, this.resource);
                // Register this as the next upcoming save and return
                return this.saveSequentializer.setNext(() => this.doSave(this.versionId /* make sure to use latest version id here */, options));
            }
            // Push all edit operations to the undo stack so that the user has a chance to
            // Ctrl+Z back to the saved version. We only do this when auto-save is turned off
            if (!this.autoSaveAfterMilliesEnabled && this.textEditorModel) {
                this.textEditorModel.pushStackElement();
            }
            // A save participant can still change the model now and since we are so close to saving
            // we do not want to trigger another auto save or similar, so we block this
            // In addition we update our version right after in case it changed because of a model change
            // Save participants can also be skipped through API.
            let saveParticipantPromise = Promise.resolve(versionId);
            if (TextFileEditorModel.saveParticipant && !options.skipSaveParticipants) {
                const onCompleteOrError = () => {
                    this.blockModelContentChange = false;
                    return this.versionId;
                };
                this.blockModelContentChange = true;
                saveParticipantPromise = TextFileEditorModel.saveParticipant.participate(this, { reason: options.reason }).then(onCompleteOrError, onCompleteOrError);
            }
            // mark the save participant as current pending save operation
            return this.saveSequentializer.setPending(versionId, saveParticipantPromise.then(newVersionId => {
                // We have to protect against being disposed at this point. It could be that the save() operation
                // was triggerd followed by a dispose() operation right after without waiting. Typically we cannot
                // be disposed if we are dirty, but if we are not dirty, save() and dispose() can still be triggered
                // one after the other without waiting for the save() to complete. If we are disposed(), we risk
                // saving contents to disk that are stale (see https://github.com/Microsoft/vscode/issues/50942).
                // To fix this issue, we will not store the contents to disk when we got disposed.
                if (this.disposed) {
                    return undefined;
                }
                // Under certain conditions we do a short-cut of flushing contents to disk when we can assume that
                // the file has not changed and as such was not dirty before.
                // The conditions are all of:
                // - a forced, explicit save (Ctrl+S)
                // - the model is not dirty (otherwise we know there are changed which needs to go to the file)
                // - the model is not in orphan mode (because in that case we know the file does not exist on disk)
                // - the model version did not change due to save participants running
                if (options.force && !this.dirty && !this.inOrphanMode && options.reason === 1 /* EXPLICIT */ && versionId === newVersionId) {
                    return this.doTouch(newVersionId);
                }
                // update versionId with its new value (if pre-save changes happened)
                versionId = newVersionId;
                // Clear error flag since we are trying to save again
                this.inErrorMode = false;
                // Remember when this model was saved last
                this.lastSaveAttemptTime = Date.now();
                // Save to Disk
                // mark the save operation as currently pending with the versionId (it might have changed from a save participant triggering)
                this.logService.trace(`doSave(${versionId}) - before updateContent()`, this.resource);
                const snapshot = this.createSnapshot();
                if (!snapshot) {
                    throw new Error('Invalid snapshot');
                }
                return this.saveSequentializer.setPending(newVersionId, this.fileService.updateContent(this.lastResolvedDiskStat.resource, snapshot, {
                    overwriteReadonly: options.overwriteReadonly,
                    overwriteEncoding: options.overwriteEncoding,
                    mtime: this.lastResolvedDiskStat.mtime,
                    encoding: this.getEncoding(),
                    etag: this.lastResolvedDiskStat.etag,
                    writeElevated: options.writeElevated
                }).then(stat => {
                    this.logService.trace(`doSave(${versionId}) - after updateContent()`, this.resource);
                    // Update dirty state unless model has changed meanwhile
                    if (versionId === this.versionId) {
                        this.logService.trace(`doSave(${versionId}) - setting dirty to false because versionId did not change`, this.resource);
                        this.setDirty(false);
                    }
                    else {
                        this.logService.trace(`doSave(${versionId}) - not setting dirty to false because versionId did change meanwhile`, this.resource);
                    }
                    // Updated resolved stat with updated stat
                    this.updateLastResolvedDiskStat(stat);
                    // Cancel any content change event promises as they are no longer valid
                    this.contentChangeEventScheduler.cancel();
                    // Emit File Saved Event
                    this._onDidStateChange.fire(3 /* SAVED */);
                    // Telemetry
                    let telemetryPromise;
                    const settingsType = this.getTypeIfSettings();
                    if (settingsType) {
                        /* __GDPR__
                            "settingsWritten" : {
                                "settingsType": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                            }
                        */
                        this.telemetryService.publicLog('settingsWritten', { settingsType }); // Do not log write to user settings.json and .vscode folder as a filePUT event as it ruins our JSON usage data
                        telemetryPromise = Promise.resolve();
                    }
                    else {
                        telemetryPromise = this.getTelemetryData(options.reason).then(data => {
                            /* __GDPR__
                                "filePUT" : {
                                    "${include}": [
                                        "${FileTelemetryData}"
                                    ]
                                }
                            */
                            this.telemetryService.publicLog('filePUT', data);
                        });
                    }
                    return telemetryPromise;
                }, error => {
                    if (!error) {
                        error = new Error('Unknown Save Error'); // TODO@remote we should never get null as error (https://github.com/Microsoft/vscode/issues/55051)
                    }
                    this.logService.error(`doSave(${versionId}) - exit - resulted in a save error: ${error.toString()}`, this.resource);
                    // Flag as error state in the model
                    this.inErrorMode = true;
                    // Look out for a save conflict
                    if (error.fileOperationResult === 4 /* FILE_MODIFIED_SINCE */) {
                        this.inConflictMode = true;
                    }
                    // Show to user
                    this.onSaveError(error);
                    // Emit as event
                    this._onDidStateChange.fire(2 /* SAVE_ERROR */);
                }));
            }));
        }
        getTypeIfSettings() {
            if (resources_1.extname(this.resource) !== '.json') {
                return '';
            }
            // Check for global settings file
            if (resources_1.isEqual(this.resource, uri_1.URI.file(this.environmentService.appSettingsPath), !platform_1.isLinux)) {
                return 'global-settings';
            }
            // Check for keybindings file
            if (resources_1.isEqual(this.resource, uri_1.URI.file(this.environmentService.appKeybindingsPath), !platform_1.isLinux)) {
                return 'keybindings';
            }
            // Check for locale file
            if (resources_1.isEqual(this.resource, uri_1.URI.file(path_1.join(this.environmentService.appSettingsHome, 'locale.json')), !platform_1.isLinux)) {
                return 'locale';
            }
            // Check for snippets
            if (resources_1.isEqualOrParent(this.resource, uri_1.URI.file(path_1.join(this.environmentService.appSettingsHome, 'snippets')))) {
                return 'snippets';
            }
            // Check for workspace settings file
            const folders = this.contextService.getWorkspace().folders;
            for (const folder of folders) {
                if (resources_1.isEqualOrParent(this.resource, folder.toResource('.vscode'))) {
                    const filename = resources_1.basename(this.resource);
                    if (TextFileEditorModel.WHITELIST_WORKSPACE_JSON.indexOf(filename) > -1) {
                        return `.vscode/${filename}`;
                    }
                }
            }
            return '';
        }
        getTelemetryData(reason) {
            return this.hashService.createSHA1(this.resource.fsPath).then(hashedPath => {
                const ext = resources_1.extname(this.resource);
                const fileName = resources_1.basename(this.resource);
                const telemetryData = {
                    mimeType: mime_1.guessMimeTypes(this.resource.fsPath).join(', '),
                    ext,
                    path: hashedPath,
                    reason
                };
                if (ext === '.json' && TextFileEditorModel.WHITELIST_JSON.indexOf(fileName) > -1) {
                    telemetryData['whitelistedjson'] = fileName;
                }
                /* __GDPR__FRAGMENT__
                    "FileTelemetryData" : {
                        "mimeType" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "ext": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "path": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "reason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                        "whitelistedjson": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                return telemetryData;
            });
        }
        doTouch(versionId) {
            const snapshot = this.createSnapshot();
            if (!snapshot) {
                throw new Error('invalid snapshot');
            }
            return this.saveSequentializer.setPending(versionId, this.fileService.updateContent(this.lastResolvedDiskStat.resource, snapshot, {
                mtime: this.lastResolvedDiskStat.mtime,
                encoding: this.getEncoding(),
                etag: this.lastResolvedDiskStat.etag
            }).then(stat => {
                // Updated resolved stat with updated stat since touching it might have changed mtime
                this.updateLastResolvedDiskStat(stat);
            }, error => errors_1.onUnexpectedError(error) /* just log any error but do not notify the user since the file was not dirty */));
        }
        setDirty(dirty) {
            const wasDirty = this.dirty;
            const wasInConflictMode = this.inConflictMode;
            const wasInErrorMode = this.inErrorMode;
            const oldBufferSavedVersionId = this.bufferSavedVersionId;
            if (!dirty) {
                this.dirty = false;
                this.inConflictMode = false;
                this.inErrorMode = false;
                this.updateSavedVersionId();
            }
            else {
                this.dirty = true;
            }
            // Return function to revert this call
            return () => {
                this.dirty = wasDirty;
                this.inConflictMode = wasInConflictMode;
                this.inErrorMode = wasInErrorMode;
                this.bufferSavedVersionId = oldBufferSavedVersionId;
            };
        }
        updateSavedVersionId() {
            // we remember the models alternate version id to remember when the version
            // of the model matches with the saved version on disk. we need to keep this
            // in order to find out if the model changed back to a saved version (e.g.
            // when undoing long enough to reach to a version that is saved and then to
            // clear the dirty flag)
            if (this.textEditorModel) {
                this.bufferSavedVersionId = this.textEditorModel.getAlternativeVersionId();
            }
        }
        updateLastResolvedDiskStat(newVersionOnDiskStat) {
            // First resolve - just take
            if (!this.lastResolvedDiskStat) {
                this.lastResolvedDiskStat = newVersionOnDiskStat;
            }
            // Subsequent resolve - make sure that we only assign it if the mtime is equal or has advanced.
            // This prevents race conditions from loading and saving. If a save comes in late after a revert
            // was called, the mtime could be out of sync.
            else if (this.lastResolvedDiskStat.mtime <= newVersionOnDiskStat.mtime) {
                this.lastResolvedDiskStat = newVersionOnDiskStat;
            }
        }
        onSaveError(error) {
            // Prepare handler
            if (!TextFileEditorModel.saveErrorHandler) {
                TextFileEditorModel.setSaveErrorHandler(this.instantiationService.createInstance(DefaultSaveErrorHandler));
            }
            // Handle
            TextFileEditorModel.saveErrorHandler.onSaveError(error, this);
        }
        isDirty() {
            return this.dirty;
        }
        getLastSaveAttemptTime() {
            return this.lastSaveAttemptTime;
        }
        getETag() {
            return this.lastResolvedDiskStat ? this.lastResolvedDiskStat.etag || null : null;
        }
        hasState(state) {
            switch (state) {
                case 3 /* CONFLICT */:
                    return this.inConflictMode;
                case 1 /* DIRTY */:
                    return this.dirty;
                case 5 /* ERROR */:
                    return this.inErrorMode;
                case 4 /* ORPHAN */:
                    return this.inOrphanMode;
                case 2 /* PENDING_SAVE */:
                    return this.saveSequentializer.hasPendingSave();
                case 0 /* SAVED */:
                    return !this.dirty;
            }
        }
        getEncoding() {
            return this.preferredEncoding || this.contentEncoding;
        }
        setEncoding(encoding, mode) {
            if (!this.isNewEncoding(encoding)) {
                return; // return early if the encoding is already the same
            }
            // Encode: Save with encoding
            if (mode === 0 /* Encode */) {
                this.updatePreferredEncoding(encoding);
                // Save
                if (!this.isDirty()) {
                    this.versionId++; // needs to increment because we change the model potentially
                    this.makeDirty();
                }
                if (!this.inConflictMode) {
                    this.save({ overwriteEncoding: true });
                }
            }
            // Decode: Load with encoding
            else {
                if (this.isDirty()) {
                    this.notificationService.info(nls.localize('saveFileFirst', "The file is dirty. Please save it first before reopening it with another encoding."));
                    return;
                }
                this.updatePreferredEncoding(encoding);
                // Load
                this.load({
                    forceReadFromDisk: true // because encoding has changed
                });
            }
        }
        updatePreferredEncoding(encoding) {
            if (!this.isNewEncoding(encoding)) {
                return;
            }
            this.preferredEncoding = encoding;
            // Emit
            this._onDidStateChange.fire(5 /* ENCODING */);
        }
        isNewEncoding(encoding) {
            if (this.preferredEncoding === encoding) {
                return false; // return early if the encoding is already the same
            }
            if (!this.preferredEncoding && this.contentEncoding === encoding) {
                return false; // also return if we don't have a preferred encoding but the content encoding is already the same
            }
            return true;
        }
        isResolved() {
            return !types_1.isUndefinedOrNull(this.lastResolvedDiskStat);
        }
        isReadonly() {
            return !!(this.lastResolvedDiskStat && this.lastResolvedDiskStat.isReadonly);
        }
        isDisposed() {
            return this.disposed;
        }
        getResource() {
            return this.resource;
        }
        getStat() {
            return this.lastResolvedDiskStat;
        }
        dispose() {
            this.disposed = true;
            this.inConflictMode = false;
            this.inOrphanMode = false;
            this.inErrorMode = false;
            this.createTextEditorModelPromise = null;
            this.cancelPendingAutoSave();
            super.dispose();
        }
    };
    TextFileEditorModel.DEFAULT_CONTENT_CHANGE_BUFFER_DELAY = files_1.CONTENT_CHANGE_EVENT_BUFFER_DELAY;
    TextFileEditorModel.DEFAULT_ORPHANED_CHANGE_BUFFER_DELAY = 100;
    TextFileEditorModel.WHITELIST_JSON = ['package.json', 'package-lock.json', 'tsconfig.json', 'jsconfig.json', 'bower.json', '.eslintrc.json', 'tslint.json', 'composer.json'];
    TextFileEditorModel.WHITELIST_WORKSPACE_JSON = ['settings.json', 'extensions.json', 'tasks.json', 'launch.json'];
    TextFileEditorModel = __decorate([
        __param(2, notification_1.INotificationService),
        __param(3, modeService_1.IModeService),
        __param(4, modelService_1.IModelService),
        __param(5, files_1.IFileService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, textfiles_1.ITextFileService),
        __param(9, backup_1.IBackupFileService),
        __param(10, environment_1.IEnvironmentService),
        __param(11, workspace_1.IWorkspaceContextService),
        __param(12, hashService_1.IHashService),
        __param(13, log_1.ILogService)
    ], TextFileEditorModel);
    exports.TextFileEditorModel = TextFileEditorModel;
    class SaveSequentializer {
        hasPendingSave(versionId) {
            if (!this._pendingSave) {
                return false;
            }
            if (typeof versionId === 'number') {
                return this._pendingSave.versionId === versionId;
            }
            return !!this._pendingSave;
        }
        get pendingSave() {
            return this._pendingSave ? this._pendingSave.promise : undefined;
        }
        setPending(versionId, promise) {
            this._pendingSave = { versionId, promise };
            promise.then(() => this.donePending(versionId), () => this.donePending(versionId));
            return promise;
        }
        donePending(versionId) {
            if (this._pendingSave && versionId === this._pendingSave.versionId) {
                // only set pending to done if the promise finished that is associated with that versionId
                this._pendingSave = undefined;
                // schedule the next save now that we are free if we have any
                this.triggerNextSave();
            }
        }
        triggerNextSave() {
            if (this._nextSave) {
                const saveOperation = this._nextSave;
                this._nextSave = undefined;
                // Run next save and complete on the associated promise
                saveOperation.run().then(saveOperation.promiseResolve, saveOperation.promiseReject);
            }
        }
        setNext(run) {
            // this is our first next save, so we create associated promise with it
            // so that we can return a promise that completes when the save operation
            // has completed.
            if (!this._nextSave) {
                let promiseResolve;
                let promiseReject;
                const promise = new Promise((resolve, reject) => {
                    promiseResolve = resolve;
                    promiseReject = reject;
                });
                this._nextSave = {
                    run,
                    promise,
                    promiseResolve: promiseResolve,
                    promiseReject: promiseReject
                };
            }
            // we have a previous next save, just overwrite it
            else {
                this._nextSave.run = run;
            }
            return this._nextSave.promise;
        }
    }
    exports.SaveSequentializer = SaveSequentializer;
    let DefaultSaveErrorHandler = class DefaultSaveErrorHandler {
        constructor(notificationService) {
            this.notificationService = notificationService;
        }
        onSaveError(error, model) {
            this.notificationService.error(nls.localize('genericSaveError', "Failed to save '{0}': {1}", resources_1.basename(model.getResource()), errorMessage_1.toErrorMessage(error, false)));
        }
    };
    DefaultSaveErrorHandler = __decorate([
        __param(0, notification_1.INotificationService)
    ], DefaultSaveErrorHandler);
});
//# sourceMappingURL=textFileEditorModel.js.map