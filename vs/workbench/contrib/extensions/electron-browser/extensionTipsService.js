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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/collections", "vs/base/common/lifecycle", "vs/base/common/glob", "vs/base/common/json", "vs/platform/extensionManagement/common/extensionManagement", "vs/editor/common/services/modelService", "vs/platform/storage/common/storage", "vs/platform/product/node/product", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/electron-browser/extensionsActions", "vs/base/common/severity", "vs/platform/workspace/common/workspace", "vs/platform/files/common/files", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/base/node/pfs", "os", "vs/base/common/arrays", "vs/platform/environment/common/environment", "vs/base/common/mime", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/stats/node/workspaceStats", "vs/platform/request/node/request", "vs/base/node/request", "vs/base/common/types", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/experiments/node/experimentService", "vs/base/common/cancellation", "vs/base/common/resources"], function (require, exports, nls_1, path_1, collections_1, lifecycle_1, glob_1, json, extensionManagement_1, modelService_1, storage_1, product_1, instantiation_1, extensionsActions_1, severity_1, workspace_1, files_1, extensions_1, configuration_1, telemetry_1, pfs, os, arrays_1, environment_1, mime_1, extensions_2, workspaceStats_1, request_1, request_2, types_1, viewlet_1, notification_1, event_1, objects_1, uri_1, extensionManagementUtil_1, experimentService_1, cancellation_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const milliSecondsInADay = 1000 * 60 * 60 * 24;
    const choiceNever = nls_1.localize('neverShowAgain', "Don't Show Again");
    const searchMarketplace = nls_1.localize('searchMarketplace', "Search Marketplace");
    const processedFileExtensions = [];
    function caseInsensitiveGet(obj, key) {
        if (!obj) {
            return undefined;
        }
        for (const _key in obj) {
            if (Object.hasOwnProperty.call(obj, _key) && _key.toLowerCase() === key.toLowerCase()) {
                return obj[_key];
            }
        }
        return undefined;
    }
    let ExtensionTipsService = class ExtensionTipsService extends lifecycle_1.Disposable {
        constructor(_galleryService, _modelService, storageService, extensionsService, instantiationService, fileService, contextService, configurationService, telemetryService, environmentService, extensionService, requestService, viewletService, notificationService, extensionManagementService, extensionWorkbenchService, experimentService) {
            super();
            this._galleryService = _galleryService;
            this._modelService = _modelService;
            this.storageService = storageService;
            this.extensionsService = extensionsService;
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.extensionService = extensionService;
            this.requestService = requestService;
            this.viewletService = viewletService;
            this.notificationService = notificationService;
            this.extensionManagementService = extensionManagementService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.experimentService = experimentService;
            this._fileBasedRecommendations = Object.create(null);
            this._exeBasedRecommendations = Object.create(null);
            this._availableRecommendations = Object.create(null);
            this._allWorkspaceRecommendedExtensions = [];
            this._dynamicWorkspaceRecommendations = [];
            this._experimentalRecommendations = Object.create(null);
            this._allIgnoredRecommendations = [];
            this._globallyIgnoredRecommendations = [];
            this._workspaceIgnoredRecommendations = [];
            this._disposables = [];
            this.proactiveRecommendationsFetched = false;
            this._onRecommendationChange = new event_1.Emitter();
            this.onRecommendationChange = this._onRecommendationChange.event;
            if (!this.isEnabled()) {
                return;
            }
            if (product_1.default.extensionsGallery && product_1.default.extensionsGallery.recommendationsUrl) {
                this._extensionsRecommendationsUrl = product_1.default.extensionsGallery.recommendationsUrl;
            }
            this.sessionSeed = +new Date();
            let globallyIgnored = JSON.parse(this.storageService.get('extensionsAssistant/ignored_recommendations', 0 /* GLOBAL */, '[]'));
            this._globallyIgnoredRecommendations = globallyIgnored.map(id => id.toLowerCase());
            this.fetchCachedDynamicWorkspaceRecommendations();
            this.fetchFileBasedRecommendations();
            this.fetchExperimentalRecommendations();
            if (!this.configurationService.getValue(extensions_1.ShowRecommendationsOnlyOnDemandKey)) {
                this.fetchProactiveRecommendations(true);
            }
            this.loadWorkspaceConfigPromise = this.getWorkspaceRecommendations().then(() => {
                this.promptWorkspaceRecommendations();
                this._modelService.onModelAdded(this.promptFiletypeBasedRecommendations, this, this._disposables);
                this._modelService.getModels().forEach(model => this.promptFiletypeBasedRecommendations(model));
            });
            this._register(this.contextService.onDidChangeWorkspaceFolders(e => this.onWorkspaceFoldersChanged(e)));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (!this.proactiveRecommendationsFetched && !this.configurationService.getValue(extensions_1.ShowRecommendationsOnlyOnDemandKey)) {
                    this.fetchProactiveRecommendations();
                }
            }));
            this._register(this.extensionManagementService.onDidInstallExtension(e => {
                if (e.gallery && e.operation === 1 /* Install */) {
                    const extRecommendations = this.getAllRecommendationsWithReason() || {};
                    const recommendationReason = extRecommendations[e.gallery.identifier.id.toLowerCase()];
                    if (recommendationReason) {
                        /* __GDPR__
                            "extensionGallery:install:recommendations" : {
                                "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                                "${include}": [
                                    "${GalleryExtensionTelemetryData}"
                                ]
                            }
                        */
                        this.telemetryService.publicLog('extensionGallery:install:recommendations', objects_1.assign(e.gallery.telemetryData, { recommendationReason: recommendationReason.reasonId }));
                    }
                }
            }));
        }
        isEnabled() {
            return this._galleryService.isEnabled() && !this.environmentService.extensionDevelopmentLocationURI;
        }
        getAllRecommendationsWithReason() {
            let output = Object.create(null);
            if (!this.proactiveRecommendationsFetched) {
                return output;
            }
            collections_1.forEach(this._experimentalRecommendations, entry => output[entry.key.toLowerCase()] = {
                reasonId: 4 /* Experimental */,
                reasonText: entry.value
            });
            if (this.contextService.getWorkspace().folders && this.contextService.getWorkspace().folders.length === 1) {
                const currentRepo = this.contextService.getWorkspace().folders[0].name;
                this._dynamicWorkspaceRecommendations.forEach(id => output[id.toLowerCase()] = {
                    reasonId: 3 /* DynamicWorkspace */,
                    reasonText: nls_1.localize('dynamicWorkspaceRecommendation', "This extension may interest you because it's popular among users of the {0} repository.", currentRepo)
                });
            }
            collections_1.forEach(this._exeBasedRecommendations, entry => output[entry.key.toLowerCase()] = {
                reasonId: 2 /* Executable */,
                reasonText: nls_1.localize('exeBasedRecommendation', "This extension is recommended because you have {0} installed.", entry.value)
            });
            collections_1.forEach(this._fileBasedRecommendations, entry => output[entry.key.toLowerCase()] = {
                reasonId: 1 /* File */,
                reasonText: nls_1.localize('fileBasedRecommendation', "This extension is recommended based on the files you recently opened.")
            });
            this._allWorkspaceRecommendedExtensions.forEach(({ extensionId }) => output[extensionId.toLowerCase()] = {
                reasonId: 0 /* Workspace */,
                reasonText: nls_1.localize('workspaceRecommendation', "This extension is recommended by users of the current workspace.")
            });
            for (const id of this._allIgnoredRecommendations) {
                delete output[id];
            }
            return output;
        }
        getAllIgnoredRecommendations() {
            return {
                global: this._globallyIgnoredRecommendations,
                workspace: this._workspaceIgnoredRecommendations
            };
        }
        toggleIgnoredRecommendation(extensionId, shouldIgnore) {
            const lowerId = extensionId.toLowerCase();
            if (shouldIgnore) {
                const reason = this.getAllRecommendationsWithReason()[lowerId];
                if (reason && reason.reasonId) {
                    /* __GDPR__
                        "extensionsRecommendations:ignoreRecommendation" : {
                            "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                            "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('extensionsRecommendations:ignoreRecommendation', { id: extensionId, recommendationReason: reason.reasonId });
                }
            }
            this._globallyIgnoredRecommendations = shouldIgnore ?
                arrays_1.distinct([...this._globallyIgnoredRecommendations, lowerId].map(id => id.toLowerCase())) :
                this._globallyIgnoredRecommendations.filter(id => id !== lowerId);
            this.storageService.store('extensionsAssistant/ignored_recommendations', JSON.stringify(this._globallyIgnoredRecommendations), 0 /* GLOBAL */);
            this._allIgnoredRecommendations = arrays_1.distinct([...this._globallyIgnoredRecommendations, ...this._workspaceIgnoredRecommendations]);
            this._onRecommendationChange.fire({ extensionId: extensionId, isRecommended: !shouldIgnore });
        }
        getKeymapRecommendations() {
            return (product_1.default.keymapExtensionTips || [])
                .filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId))
                .map(extensionId => ({ extensionId, sources: ['application'] }));
        }
        //#region workspaceRecommendations
        getWorkspaceRecommendations() {
            if (!this.isEnabled()) {
                return Promise.resolve([]);
            }
            return this.fetchWorkspaceRecommendations()
                .then(() => this._allWorkspaceRecommendedExtensions.filter(rec => this.isExtensionAllowedToBeRecommended(rec.extensionId)));
        }
        /**
         * Parse all extensions.json files, fetch workspace recommendations, filter out invalid and unwanted ones
         */
        fetchWorkspaceRecommendations() {
            if (!this.isEnabled) {
                return Promise.resolve(undefined);
            }
            return this.fetchExtensionRecommendationContents()
                .then(result => this.validateExtensions(result.map(({ contents }) => contents))
                .then(({ invalidExtensions, message }) => {
                if (invalidExtensions.length > 0 && this.notificationService) {
                    this.notificationService.warn(`The below ${invalidExtensions.length} extension(s) in workspace recommendations have issues:\n${message}`);
                }
                const seenUnWantedRecommendations = {};
                this._allWorkspaceRecommendedExtensions = [];
                this._workspaceIgnoredRecommendations = [];
                for (const contentsBySource of result) {
                    if (contentsBySource.contents.unwantedRecommendations) {
                        for (const r of contentsBySource.contents.unwantedRecommendations) {
                            const unwantedRecommendation = r.toLowerCase();
                            if (!seenUnWantedRecommendations[unwantedRecommendation] && invalidExtensions.indexOf(unwantedRecommendation) === -1) {
                                this._workspaceIgnoredRecommendations.push(unwantedRecommendation);
                                seenUnWantedRecommendations[unwantedRecommendation] = true;
                            }
                        }
                    }
                    if (contentsBySource.contents.recommendations) {
                        for (const r of contentsBySource.contents.recommendations) {
                            const extensionId = r.toLowerCase();
                            if (invalidExtensions.indexOf(extensionId) === -1) {
                                let recommendation = this._allWorkspaceRecommendedExtensions.filter(r => r.extensionId === extensionId)[0];
                                if (!recommendation) {
                                    recommendation = { extensionId, sources: [] };
                                    this._allWorkspaceRecommendedExtensions.push(recommendation);
                                }
                                if (recommendation.sources.indexOf(contentsBySource.source) === -1) {
                                    recommendation.sources.push(contentsBySource.source);
                                }
                            }
                        }
                    }
                }
                this._allIgnoredRecommendations = arrays_1.distinct([...this._globallyIgnoredRecommendations, ...this._workspaceIgnoredRecommendations]);
            }));
        }
        /**
         * Parse all extensions.json files, fetch workspace recommendations
         */
        fetchExtensionRecommendationContents() {
            const workspace = this.contextService.getWorkspace();
            return Promise.all([
                this.resolveWorkspaceExtensionConfig(workspace).then(contents => contents ? { contents, source: workspace } : null),
                ...workspace.folders.map(workspaceFolder => this.resolveWorkspaceFolderExtensionConfig(workspaceFolder).then(contents => contents ? { contents, source: workspaceFolder } : null))
            ]).then(contents => arrays_1.coalesce(contents));
        }
        /**
         * Parse the extensions.json file for given workspace and return the recommendations
         */
        resolveWorkspaceExtensionConfig(workspace) {
            if (!workspace.configuration) {
                return Promise.resolve(null);
            }
            return Promise.resolve(this.fileService.resolveContent(workspace.configuration)
                .then(content => (json.parse(content.value)['extensions']), err => null));
        }
        /**
         * Parse the extensions.json files for given workspace folder and return the recommendations
         */
        resolveWorkspaceFolderExtensionConfig(workspaceFolder) {
            const extensionsJsonUri = workspaceFolder.toResource(extensions_1.EXTENSIONS_CONFIG);
            return Promise.resolve(this.fileService.resolveFile(extensionsJsonUri)
                .then(() => this.fileService.resolveContent(extensionsJsonUri))
                .then(content => json.parse(content.value), err => null));
        }
        /**
         * Validate the extensions.json file contents using regex and querying the gallery
         */
        validateExtensions(contents) {
            return __awaiter(this, void 0, void 0, function* () {
                const extensionsContent = {
                    recommendations: arrays_1.distinct(arrays_1.flatten(contents.map(content => content.recommendations || []))),
                    unwantedRecommendations: arrays_1.distinct(arrays_1.flatten(contents.map(content => content.unwantedRecommendations || [])))
                };
                const regEx = new RegExp(extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN);
                const invalidExtensions = [];
                let message = '';
                const regexFilter = (ids) => {
                    return ids.filter((element, position) => {
                        if (ids.indexOf(element) !== position) {
                            // This is a duplicate entry, it doesn't hurt anybody
                            // but it shouldn't be sent in the gallery query
                            return false;
                        }
                        else if (!regEx.test(element)) {
                            invalidExtensions.push(element.toLowerCase());
                            message += `${element} (bad format) Expected: <provider>.<name>\n`;
                            return false;
                        }
                        return true;
                    });
                };
                const filteredWanted = regexFilter(extensionsContent.recommendations || []).map(x => x.toLowerCase());
                if (filteredWanted.length) {
                    try {
                        let validRecommendations = (yield this._galleryService.query({ names: filteredWanted, pageSize: filteredWanted.length })).firstPage
                            .map(extension => extension.identifier.id.toLowerCase());
                        if (validRecommendations.length !== filteredWanted.length) {
                            filteredWanted.forEach(element => {
                                if (validRecommendations.indexOf(element.toLowerCase()) === -1) {
                                    invalidExtensions.push(element.toLowerCase());
                                    message += `${element} (not found in marketplace)\n`;
                                }
                            });
                        }
                    }
                    catch (e) {
                        console.warn('Error querying extensions gallery', e);
                    }
                }
                return { invalidExtensions, message };
            });
        }
        onWorkspaceFoldersChanged(event) {
            if (event.added.length) {
                const oldWorkspaceRecommended = this._allWorkspaceRecommendedExtensions;
                this.getWorkspaceRecommendations()
                    .then(currentWorkspaceRecommended => {
                    // Suggest only if at least one of the newly added recommendations was not suggested before
                    if (currentWorkspaceRecommended.some(current => oldWorkspaceRecommended.every(old => current.extensionId !== old.extensionId))) {
                        this.promptWorkspaceRecommendations();
                    }
                });
            }
            this._dynamicWorkspaceRecommendations = [];
        }
        /**
         * Prompt the user to install workspace recommendations if there are any not already installed
         */
        promptWorkspaceRecommendations() {
            const storageKey = 'extensionsAssistant/workspaceRecommendationsIgnore';
            const config = this.configurationService.getValue(extensions_1.ConfigurationKey);
            const filteredRecs = this._allWorkspaceRecommendedExtensions.filter(rec => this.isExtensionAllowedToBeRecommended(rec.extensionId));
            if (filteredRecs.length === 0
                || config.ignoreRecommendations
                || config.showRecommendationsOnlyOnDemand
                || this.storageService.getBoolean(storageKey, 1 /* WORKSPACE */, false)) {
                return;
            }
            this.extensionsService.getInstalled(1 /* User */).then(local => {
                const recommendations = filteredRecs.filter(({ extensionId }) => local.every(local => !extensionManagementUtil_1.areSameExtensions({ id: extensionId }, local.identifier)));
                if (!recommendations.length) {
                    return Promise.resolve(undefined);
                }
                return new Promise(c => {
                    this.notificationService.prompt(severity_1.default.Info, nls_1.localize('workspaceRecommended', "This workspace has extension recommendations."), [{
                            label: nls_1.localize('installAll', "Install All"),
                            run: () => {
                                /* __GDPR__
                                "extensionWorkspaceRecommendations:popup" : {
                                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                }
                                */
                                this.telemetryService.publicLog('extensionWorkspaceRecommendations:popup', { userReaction: 'install' });
                                const installAllAction = this.instantiationService.createInstance(extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction, extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction.ID, nls_1.localize('installAll', "Install All"), recommendations);
                                installAllAction.run();
                                installAllAction.dispose();
                                c(undefined);
                            }
                        }, {
                            label: nls_1.localize('showRecommendations', "Show Recommendations"),
                            run: () => {
                                /* __GDPR__
                                    "extensionWorkspaceRecommendations:popup" : {
                                        "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                    }
                                */
                                this.telemetryService.publicLog('extensionWorkspaceRecommendations:popup', { userReaction: 'show' });
                                const showAction = this.instantiationService.createInstance(extensionsActions_1.ShowRecommendedExtensionsAction, extensionsActions_1.ShowRecommendedExtensionsAction.ID, nls_1.localize('showRecommendations', "Show Recommendations"));
                                showAction.run();
                                showAction.dispose();
                                c(undefined);
                            }
                        }, {
                            label: choiceNever,
                            isSecondary: true,
                            run: () => {
                                /* __GDPR__
                                    "extensionWorkspaceRecommendations:popup" : {
                                        "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                    }
                                */
                                this.telemetryService.publicLog('extensionWorkspaceRecommendations:popup', { userReaction: 'neverShowAgain' });
                                this.storageService.store(storageKey, true, 1 /* WORKSPACE */);
                                c(undefined);
                            }
                        }], {
                        sticky: true,
                        onCancel: () => {
                            /* __GDPR__
                                "extensionWorkspaceRecommendations:popup" : {
                                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                }
                            */
                            this.telemetryService.publicLog('extensionWorkspaceRecommendations:popup', { userReaction: 'cancelled' });
                            c(undefined);
                        }
                    });
                });
            });
        }
        //#endregion
        //#region fileBasedRecommendations
        getFileBasedRecommendations() {
            return Object.keys(this._fileBasedRecommendations)
                .sort((a, b) => {
                if (this._fileBasedRecommendations[a].recommendedTime === this._fileBasedRecommendations[b].recommendedTime) {
                    if (!product_1.default.extensionImportantTips || caseInsensitiveGet(product_1.default.extensionImportantTips, a)) {
                        return -1;
                    }
                    if (caseInsensitiveGet(product_1.default.extensionImportantTips, b)) {
                        return 1;
                    }
                }
                return this._fileBasedRecommendations[a].recommendedTime > this._fileBasedRecommendations[b].recommendedTime ? -1 : 1;
            })
                .filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId))
                .map(extensionId => ({ extensionId, sources: this._fileBasedRecommendations[extensionId].sources }));
        }
        /**
         * Parse all file based recommendations from product.extensionTips
         * Retire existing recommendations if they are older than a week or are not part of product.extensionTips anymore
         */
        fetchFileBasedRecommendations() {
            const extensionTips = product_1.default.extensionTips;
            if (!extensionTips) {
                return;
            }
            // group ids by pattern, like {**/*.md} -> [ext.foo1, ext.bar2]
            this._availableRecommendations = Object.create(null);
            collections_1.forEach(extensionTips, entry => {
                let { key: id, value: pattern } = entry;
                let ids = this._availableRecommendations[pattern];
                if (!ids) {
                    this._availableRecommendations[pattern] = [id.toLowerCase()];
                }
                else {
                    ids.push(id.toLowerCase());
                }
            });
            collections_1.forEach(product_1.default.extensionImportantTips, entry => {
                let { key: id, value } = entry;
                const { pattern } = value;
                let ids = this._availableRecommendations[pattern];
                if (!ids) {
                    this._availableRecommendations[pattern] = [id.toLowerCase()];
                }
                else {
                    ids.push(id.toLowerCase());
                }
            });
            const allRecommendations = arrays_1.flatten((Object.keys(this._availableRecommendations).map(key => this._availableRecommendations[key])));
            // retrieve ids of previous recommendations
            const storedRecommendationsJson = JSON.parse(this.storageService.get('extensionsAssistant/recommendations', 0 /* GLOBAL */, '[]'));
            if (Array.isArray(storedRecommendationsJson)) {
                for (let id of storedRecommendationsJson) {
                    if (allRecommendations.indexOf(id) > -1) {
                        this._fileBasedRecommendations[id.toLowerCase()] = { recommendedTime: Date.now(), sources: ['cached'] };
                    }
                }
            }
            else {
                const now = Date.now();
                collections_1.forEach(storedRecommendationsJson, entry => {
                    if (typeof entry.value === 'number') {
                        const diff = (now - entry.value) / milliSecondsInADay;
                        if (diff <= 7 && allRecommendations.indexOf(entry.key) > -1) {
                            this._fileBasedRecommendations[entry.key.toLowerCase()] = { recommendedTime: entry.value, sources: ['cached'] };
                        }
                    }
                });
            }
        }
        /**
         * Prompt the user to either install the recommended extension for the file type in the current editor model
         * or prompt to search the marketplace if it has extensions that can support the file type
         */
        promptFiletypeBasedRecommendations(model) {
            let hasSuggestion = false;
            const uri = model.uri;
            if (!uri || !this.fileService.canHandleResource(uri)) {
                return;
            }
            let fileExtension = resources_1.extname(uri);
            if (fileExtension) {
                if (processedFileExtensions.indexOf(fileExtension) > -1) {
                    return;
                }
                processedFileExtensions.push(fileExtension);
            }
            // re-schedule this bit of the operation to be off
            // the critical path - in case glob-match is slow
            setImmediate(() => {
                let recommendationsToSuggest = [];
                const now = Date.now();
                collections_1.forEach(this._availableRecommendations, entry => {
                    let { key: pattern, value: ids } = entry;
                    if (glob_1.match(pattern, uri.path)) {
                        for (let id of ids) {
                            if (caseInsensitiveGet(product_1.default.extensionImportantTips, id)) {
                                recommendationsToSuggest.push(id);
                            }
                            const filedBasedRecommendation = this._fileBasedRecommendations[id.toLowerCase()] || { recommendedTime: now, sources: [] };
                            filedBasedRecommendation.recommendedTime = now;
                            if (!filedBasedRecommendation.sources.some(s => s instanceof uri_1.URI && s.toString() === uri.toString())) {
                                filedBasedRecommendation.sources.push(uri);
                            }
                            this._fileBasedRecommendations[id.toLowerCase()] = filedBasedRecommendation;
                        }
                    }
                });
                this.storageService.store('extensionsAssistant/recommendations', JSON.stringify(Object.keys(this._fileBasedRecommendations).reduce((result, key) => { result[key] = this._fileBasedRecommendations[key].recommendedTime; return result; }, {})), 0 /* GLOBAL */);
                const config = this.configurationService.getValue(extensions_1.ConfigurationKey);
                if (config.ignoreRecommendations || config.showRecommendationsOnlyOnDemand) {
                    return;
                }
                const importantRecommendationsIgnoreList = JSON.parse(this.storageService.get('extensionsAssistant/importantRecommendationsIgnore', 0 /* GLOBAL */, '[]'));
                recommendationsToSuggest = recommendationsToSuggest.filter(id => importantRecommendationsIgnoreList.indexOf(id) === -1 && this.isExtensionAllowedToBeRecommended(id));
                const importantTipsPromise = recommendationsToSuggest.length === 0 ? Promise.resolve(null) : this.extensionWorkbenchService.queryLocal().then(local => {
                    const localExtensions = local.map(e => e.identifier);
                    recommendationsToSuggest = recommendationsToSuggest.filter(id => localExtensions.every(local => !extensionManagementUtil_1.areSameExtensions(local, { id })));
                    if (!recommendationsToSuggest.length) {
                        return;
                    }
                    const id = recommendationsToSuggest[0];
                    const entry = caseInsensitiveGet(product_1.default.extensionImportantTips, id);
                    if (!entry) {
                        return;
                    }
                    const name = entry['name'];
                    // Indicates we have a suggested extension via the whitelist
                    hasSuggestion = true;
                    let message = nls_1.localize('reallyRecommended2', "The '{0}' extension is recommended for this file type.", name);
                    // Temporary fix for the only extension pack we recommend. See https://github.com/Microsoft/vscode/issues/35364
                    if (id === 'vscjava.vscode-java-pack') {
                        message = nls_1.localize('reallyRecommendedExtensionPack', "The '{0}' extension pack is recommended for this file type.", name);
                    }
                    const setIgnoreRecommendationsConfig = (configVal) => {
                        this.configurationService.updateValue('extensions.ignoreRecommendations', configVal, 1 /* USER */);
                        if (configVal) {
                            const ignoreWorkspaceRecommendationsStorageKey = 'extensionsAssistant/workspaceRecommendationsIgnore';
                            this.storageService.store(ignoreWorkspaceRecommendationsStorageKey, true, 1 /* WORKSPACE */);
                        }
                    };
                    this.notificationService.prompt(severity_1.default.Info, message, [{
                            label: nls_1.localize('install', 'Install'),
                            run: () => {
                                /* __GDPR__
                                "extensionRecommendations:popup" : {
                                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                    "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                                }
                                */
                                this.telemetryService.publicLog('extensionRecommendations:popup', { userReaction: 'install', extensionId: name });
                                this.instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, id).run();
                            }
                        }, {
                            label: nls_1.localize('showRecommendations', "Show Recommendations"),
                            run: () => {
                                /* __GDPR__
                                    "extensionRecommendations:popup" : {
                                        "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                        "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                                    }
                                */
                                this.telemetryService.publicLog('extensionRecommendations:popup', { userReaction: 'show', extensionId: name });
                                const recommendationsAction = this.instantiationService.createInstance(extensionsActions_1.ShowRecommendedExtensionsAction, extensionsActions_1.ShowRecommendedExtensionsAction.ID, nls_1.localize('showRecommendations', "Show Recommendations"));
                                recommendationsAction.run();
                                recommendationsAction.dispose();
                            }
                        }, {
                            label: choiceNever,
                            isSecondary: true,
                            run: () => {
                                importantRecommendationsIgnoreList.push(id);
                                this.storageService.store('extensionsAssistant/importantRecommendationsIgnore', JSON.stringify(importantRecommendationsIgnoreList), 0 /* GLOBAL */);
                                /* __GDPR__
                                    "extensionRecommendations:popup" : {
                                        "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                        "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                                    }
                                */
                                this.telemetryService.publicLog('extensionRecommendations:popup', { userReaction: 'neverShowAgain', extensionId: name });
                                this.notificationService.prompt(severity_1.default.Info, nls_1.localize('ignoreExtensionRecommendations', "Do you want to ignore all extension recommendations?"), [{
                                        label: nls_1.localize('ignoreAll', "Yes, Ignore All"),
                                        run: () => setIgnoreRecommendationsConfig(true)
                                    }, {
                                        label: nls_1.localize('no', "No"),
                                        run: () => setIgnoreRecommendationsConfig(false)
                                    }]);
                            }
                        }], {
                        sticky: true,
                        onCancel: () => {
                            /* __GDPR__
                                "extensionRecommendations:popup" : {
                                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                    "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                                }
                            */
                            this.telemetryService.publicLog('extensionRecommendations:popup', { userReaction: 'cancelled', extensionId: name });
                        }
                    });
                });
                const mimeTypesPromise = this.extensionService.whenInstalledExtensionsRegistered()
                    .then(() => {
                    return mime_1.guessMimeTypes(uri.fsPath);
                });
                Promise.all([importantTipsPromise, mimeTypesPromise]).then(result => {
                    const fileExtensionSuggestionIgnoreList = JSON.parse(this.storageService.get('extensionsAssistant/fileExtensionsSuggestionIgnore', 0 /* GLOBAL */, '[]'));
                    const mimeTypes = result[1];
                    if (fileExtension) {
                        fileExtension = fileExtension.substr(1); // Strip the dot
                    }
                    if (hasSuggestion ||
                        !fileExtension ||
                        mimeTypes.length !== 1 ||
                        mimeTypes[0] !== mime_1.MIME_UNKNOWN ||
                        fileExtensionSuggestionIgnoreList.indexOf(fileExtension) > -1) {
                        return;
                    }
                    const lookup = product_1.default.extensionKeywords || {};
                    const keywords = lookup[fileExtension] || [];
                    this._galleryService.query({ text: `tag:"__ext_${fileExtension}" ${keywords.map(tag => `tag:"${tag}"`)}` }).then(pager => {
                        if (!pager || !pager.firstPage || !pager.firstPage.length) {
                            return;
                        }
                        this.notificationService.prompt(severity_1.default.Info, nls_1.localize('showLanguageExtensions', "The Marketplace has extensions that can help with '.{0}' files", fileExtension), [{
                                label: searchMarketplace,
                                run: () => {
                                    /* __GDPR__
                                        "fileExtensionSuggestion:popup" : {
                                            "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                            "fileExtension": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                                        }
                                    */
                                    this.telemetryService.publicLog('fileExtensionSuggestion:popup', { userReaction: 'ok', fileExtension: fileExtension });
                                    this.viewletService.openViewlet('workbench.view.extensions', true)
                                        .then(viewlet => viewlet)
                                        .then(viewlet => {
                                        viewlet.search(`ext:${fileExtension}`);
                                        viewlet.focus();
                                    });
                                }
                            }, {
                                label: nls_1.localize('dontShowAgainExtension', "Don't Show Again for '.{0}' files", fileExtension),
                                run: () => {
                                    fileExtensionSuggestionIgnoreList.push(fileExtension);
                                    this.storageService.store('extensionsAssistant/fileExtensionsSuggestionIgnore', JSON.stringify(fileExtensionSuggestionIgnoreList), 0 /* GLOBAL */);
                                    /* __GDPR__
                                        "fileExtensionSuggestion:popup" : {
                                            "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                            "fileExtension": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                                        }
                                    */
                                    this.telemetryService.publicLog('fileExtensionSuggestion:popup', { userReaction: 'neverShowAgain', fileExtension: fileExtension });
                                }
                            }], {
                            sticky: true,
                            onCancel: () => {
                                /* __GDPR__
                                    "fileExtensionSuggestion:popup" : {
                                        "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                        "fileExtension": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                                    }
                                */
                                this.telemetryService.publicLog('fileExtensionSuggestion:popup', { userReaction: 'cancelled', fileExtension: fileExtension });
                            }
                        });
                    });
                });
            });
        }
        //#endregion
        //#region otherRecommendations
        getOtherRecommendations() {
            return this.fetchProactiveRecommendations().then(() => {
                const others = arrays_1.distinct([
                    ...Object.keys(this._exeBasedRecommendations),
                    ...this._dynamicWorkspaceRecommendations,
                    ...Object.keys(this._experimentalRecommendations),
                ]).filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId));
                arrays_1.shuffle(others, this.sessionSeed);
                return others.map(extensionId => {
                    const sources = [];
                    if (this._exeBasedRecommendations[extensionId]) {
                        sources.push('executable');
                    }
                    if (this._dynamicWorkspaceRecommendations.indexOf(extensionId) !== -1) {
                        sources.push('dynamic');
                    }
                    return { extensionId, sources };
                });
            });
        }
        fetchProactiveRecommendations(calledDuringStartup) {
            let fetchPromise = Promise.resolve(undefined);
            if (!this.proactiveRecommendationsFetched) {
                this.proactiveRecommendationsFetched = true;
                // Executable based recommendations carry out a lot of file stats, so run them after 10 secs
                // So that the startup is not affected
                fetchPromise = new Promise((c, e) => {
                    setTimeout(() => {
                        Promise.all([this.fetchExecutableRecommendations(), this.fetchDynamicWorkspaceRecommendations()]).then(() => c(undefined));
                    }, calledDuringStartup ? 10000 : 0);
                });
            }
            return fetchPromise;
        }
        /**
         * If user has any of the tools listed in product.exeBasedExtensionTips, fetch corresponding recommendations
         */
        fetchExecutableRecommendations() {
            const homeDir = os.homedir();
            let foundExecutables = new Set();
            let findExecutable = (exeName, path) => {
                return pfs.fileExists(path).then(exists => {
                    if (exists && !foundExecutables.has(exeName)) {
                        foundExecutables.add(exeName);
                        (product_1.default.exeBasedExtensionTips[exeName]['recommendations'] || [])
                            .forEach(extensionId => {
                            if (product_1.default.exeBasedExtensionTips[exeName]['friendlyName']) {
                                this._exeBasedRecommendations[extensionId.toLowerCase()] = product_1.default.exeBasedExtensionTips[exeName]['friendlyName'];
                            }
                        });
                    }
                });
            };
            let promises = [];
            // Loop through recommended extensions
            collections_1.forEach(product_1.default.exeBasedExtensionTips, entry => {
                if (typeof entry.value !== 'object' || !Array.isArray(entry.value['recommendations'])) {
                    return;
                }
                let exeName = entry.key;
                if (process.platform === 'win32') {
                    let windowsPath = entry.value['windowsPath'];
                    if (!windowsPath || typeof windowsPath !== 'string') {
                        return;
                    }
                    windowsPath = windowsPath.replace('%USERPROFILE%', process.env['USERPROFILE'])
                        .replace('%ProgramFiles(x86)%', process.env['ProgramFiles(x86)'])
                        .replace('%ProgramFiles%', process.env['ProgramFiles'])
                        .replace('%APPDATA%', process.env['APPDATA']);
                    promises.push(findExecutable(exeName, windowsPath));
                }
                else {
                    promises.push(findExecutable(exeName, path_1.join('/usr/local/bin', exeName)));
                    promises.push(findExecutable(exeName, path_1.join(homeDir, exeName)));
                }
            });
            return Promise.all(promises);
        }
        /**
         * Fetch extensions used by others on the same workspace as recommendations from cache
         */
        fetchCachedDynamicWorkspaceRecommendations() {
            if (this.contextService.getWorkbenchState() !== 2 /* FOLDER */) {
                return;
            }
            const storageKey = 'extensionsAssistant/dynamicWorkspaceRecommendations';
            let storedRecommendationsJson = {};
            try {
                storedRecommendationsJson = JSON.parse(this.storageService.get(storageKey, 1 /* WORKSPACE */, '{}'));
            }
            catch (e) {
                this.storageService.remove(storageKey, 1 /* WORKSPACE */);
            }
            if (Array.isArray(storedRecommendationsJson['recommendations'])
                && types_1.isNumber(storedRecommendationsJson['timestamp'])
                && storedRecommendationsJson['timestamp'] > 0
                && (Date.now() - storedRecommendationsJson['timestamp']) / milliSecondsInADay < 14) {
                this._dynamicWorkspaceRecommendations = storedRecommendationsJson['recommendations'];
                /* __GDPR__
                    "dynamicWorkspaceRecommendations" : {
                        "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                        "cache" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                    }
                */
                this.telemetryService.publicLog('dynamicWorkspaceRecommendations', { count: this._dynamicWorkspaceRecommendations.length, cache: 1 });
            }
        }
        /**
         * Fetch extensions used by others on the same workspace as recommendations from recommendation service
         */
        fetchDynamicWorkspaceRecommendations() {
            if (this.contextService.getWorkbenchState() !== 2 /* FOLDER */
                || !this.fileService.canHandleResource(this.contextService.getWorkspace().folders[0].uri)
                || this._dynamicWorkspaceRecommendations.length
                || !this._extensionsRecommendationsUrl) {
                return Promise.resolve(undefined);
            }
            const storageKey = 'extensionsAssistant/dynamicWorkspaceRecommendations';
            const workspaceUri = this.contextService.getWorkspace().folders[0].uri;
            return Promise.all([workspaceStats_1.getHashedRemotesFromUri(workspaceUri, this.fileService, false), workspaceStats_1.getHashedRemotesFromUri(workspaceUri, this.fileService, true)]).then(([hashedRemotes1, hashedRemotes2]) => {
                const hashedRemotes = (hashedRemotes1 || []).concat(hashedRemotes2 || []);
                if (!hashedRemotes.length) {
                    return undefined;
                }
                return this.requestService.request({ type: 'GET', url: this._extensionsRecommendationsUrl }, cancellation_1.CancellationToken.None).then(context => {
                    if (context.res.statusCode !== 200) {
                        return Promise.resolve(undefined);
                    }
                    return request_2.asJson(context).then((result) => {
                        if (!result) {
                            return;
                        }
                        const allRecommendations = Array.isArray(result['workspaceRecommendations']) ? result['workspaceRecommendations'] : [];
                        if (!allRecommendations.length) {
                            return;
                        }
                        let foundRemote = false;
                        for (let i = 0; i < hashedRemotes.length && !foundRemote; i++) {
                            for (let j = 0; j < allRecommendations.length && !foundRemote; j++) {
                                if (Array.isArray(allRecommendations[j].remoteSet) && allRecommendations[j].remoteSet.indexOf(hashedRemotes[i]) > -1) {
                                    foundRemote = true;
                                    this._dynamicWorkspaceRecommendations = allRecommendations[j].recommendations.filter(id => this.isExtensionAllowedToBeRecommended(id)) || [];
                                    this.storageService.store(storageKey, JSON.stringify({
                                        recommendations: this._dynamicWorkspaceRecommendations,
                                        timestamp: Date.now()
                                    }), 1 /* WORKSPACE */);
                                    /* __GDPR__
                                        "dynamicWorkspaceRecommendations" : {
                                            "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                            "cache" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                        }
                                    */
                                    this.telemetryService.publicLog('dynamicWorkspaceRecommendations', { count: this._dynamicWorkspaceRecommendations.length, cache: 0 });
                                }
                            }
                        }
                    });
                });
            });
        }
        /**
         * Fetch extension recommendations from currently running experiments
         */
        fetchExperimentalRecommendations() {
            this.experimentService.getExperimentsByType(experimentService_1.ExperimentActionType.AddToRecommendations).then(experiments => {
                (experiments || []).forEach(experiment => {
                    const action = experiment.action;
                    if (action && experiment.state === 2 /* Run */ && action.properties && Array.isArray(action.properties.recommendations) && action.properties.recommendationReason) {
                        action.properties.recommendations.forEach(id => {
                            this._experimentalRecommendations[id] = action.properties.recommendationReason;
                        });
                    }
                });
            });
        }
        //#endregion
        isExtensionAllowedToBeRecommended(id) {
            return this._allIgnoredRecommendations.indexOf(id.toLowerCase()) === -1;
        }
        dispose() {
            this._disposables = lifecycle_1.dispose(this._disposables);
        }
    };
    ExtensionTipsService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, modelService_1.IModelService),
        __param(2, storage_1.IStorageService),
        __param(3, extensionManagement_1.IExtensionManagementService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, files_1.IFileService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, environment_1.IEnvironmentService),
        __param(10, extensions_2.IExtensionService),
        __param(11, request_1.IRequestService),
        __param(12, viewlet_1.IViewletService),
        __param(13, notification_1.INotificationService),
        __param(14, extensionManagement_1.IExtensionManagementService),
        __param(15, extensions_1.IExtensionsWorkbenchService),
        __param(16, experimentService_1.IExperimentService)
    ], ExtensionTipsService);
    exports.ExtensionTipsService = ExtensionTipsService;
});
//# sourceMappingURL=extensionTipsService.js.map