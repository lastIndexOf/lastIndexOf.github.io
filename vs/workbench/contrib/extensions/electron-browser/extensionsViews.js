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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/paging", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/electron-browser/extensionsList", "../common/extensions", "../common/extensionQuery", "vs/workbench/services/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/workbench/contrib/preferences/browser/preferencesActions", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/modeService", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/extensions/electron-browser/extensionsActions", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/workbench/contrib/experiments/node/experimentService", "vs/base/browser/ui/aria/aria", "vs/base/common/errorsWithActions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/product/node/product"], function (require, exports, nls_1, lifecycle_1, objects_1, event_1, errors_1, paging_1, extensionManagement_1, extensionManagementUtil_1, keybinding_1, contextView_1, dom_1, instantiation_1, extensionsList_1, extensions_1, extensionQuery_1, extensions_2, themeService_1, styler_1, preferencesActions_1, editorService_1, modeService_1, telemetry_1, countBadge_1, actionbar_1, extensionsActions_1, listService_1, configuration_1, notification_1, panelViewlet_1, workspace_1, arrays_1, experimentService_1, aria_1, errorsWithActions_1, workbenchThemeService_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionsViewState extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onFocus = this._register(new event_1.Emitter());
            this.onFocus = this._onFocus.event;
            this._onBlur = this._register(new event_1.Emitter());
            this.onBlur = this._onBlur.event;
            this.currentlyFocusedItems = [];
        }
        onFocusChange(extensions) {
            this.currentlyFocusedItems.forEach(extension => this._onBlur.fire(extension));
            this.currentlyFocusedItems = extensions;
            this.currentlyFocusedItems.forEach(extension => this._onFocus.fire(extension));
        }
    }
    let ExtensionsListView = class ExtensionsListView extends panelViewlet_1.ViewletPanel {
        constructor(options, notificationService, keybindingService, contextMenuService, instantiationService, themeService, extensionService, extensionsWorkbenchService, editorService, tipsService, modeService, telemetryService, configurationService, contextService, experimentService, workbenchThemeService) {
            super(Object.assign({}, options, { ariaHeaderLabel: options.title }), keybindingService, contextMenuService, configurationService);
            this.options = options;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this.extensionService = extensionService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.editorService = editorService;
            this.tipsService = tipsService;
            this.modeService = modeService;
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this.experimentService = experimentService;
            this.workbenchThemeService = workbenchThemeService;
        }
        renderHeader(container) {
            this.renderHeaderTitle(container);
        }
        renderHeaderTitle(container) {
            super.renderHeaderTitle(container, this.options.title);
            this.badgeContainer = dom_1.append(container, dom_1.$('.count-badge-wrapper'));
            this.badge = new countBadge_1.CountBadge(this.badgeContainer);
            this.disposables.push(styler_1.attachBadgeStyler(this.badge, this.themeService));
        }
        renderBody(container) {
            this.extensionsList = dom_1.append(container, dom_1.$('.extensions-list'));
            this.messageBox = dom_1.append(container, dom_1.$('.message'));
            const delegate = new extensionsList_1.Delegate();
            const extensionsViewState = new ExtensionsViewState();
            const renderer = this.instantiationService.createInstance(extensionsList_1.Renderer, extensionsViewState);
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchPagedList, this.extensionsList, delegate, [renderer], {
                ariaLabel: nls_1.localize('extensions', "Extensions"),
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                horizontalScrolling: false
            });
            this.list.onContextMenu(e => this.onContextMenu(e), this, this.disposables);
            this.list.onFocusChange(e => extensionsViewState.onFocusChange(e.elements), this, this.disposables);
            this.disposables.push(this.list);
            this.disposables.push(extensionsViewState);
            event_1.Event.chain(this.list.onOpen)
                .map(e => e.elements[0])
                .filter(e => !!e)
                .on(this.openExtension, this, this.disposables);
            event_1.Event.chain(this.list.onPin)
                .map(e => e.elements[0])
                .filter(e => !!e)
                .on(this.pin, this, this.disposables);
        }
        layoutBody(height, width) {
            this.extensionsList.style.height = height + 'px';
            if (this.list) {
                this.list.layout(height, width);
            }
        }
        show(query) {
            return __awaiter(this, void 0, void 0, function* () {
                const parsedQuery = extensionQuery_1.Query.parse(query);
                let options = {
                    sortOrder: 0 /* Default */
                };
                switch (parsedQuery.sortBy) {
                    case 'installs':
                        options = objects_1.assign(options, { sortBy: 4 /* InstallCount */ });
                        break;
                    case 'rating':
                        options = objects_1.assign(options, { sortBy: 12 /* WeightedRating */ });
                        break;
                    case 'name':
                        options = objects_1.assign(options, { sortBy: 2 /* Title */ });
                        break;
                }
                const successCallback = model => {
                    this.setModel(model);
                    return model;
                };
                const errorCallback = e => {
                    console.warn('Error querying extensions gallery', e);
                    const model = new paging_1.PagedModel([]);
                    this.setModel(model, true);
                    return model;
                };
                if (ExtensionsListView.isInstalledExtensionsQuery(query) || /@builtin/.test(query)) {
                    return yield this.queryLocal(parsedQuery, options).then(successCallback).catch(errorCallback);
                }
                return yield this.queryGallery(parsedQuery, options).then(successCallback).catch(errorCallback);
            });
        }
        count() {
            return this.list ? this.list.length : 0;
        }
        showEmptyModel() {
            const emptyModel = new paging_1.PagedModel([]);
            this.setModel(emptyModel);
            return Promise.resolve(emptyModel);
        }
        onContextMenu(e) {
            return __awaiter(this, void 0, void 0, function* () {
                if (e.element) {
                    const runningExtensions = yield this.extensionService.getExtensions();
                    const colorThemes = yield this.workbenchThemeService.getColorThemes();
                    const fileIconThemes = yield this.workbenchThemeService.getFileIconThemes();
                    const manageExtensionAction = this.instantiationService.createInstance(extensionsActions_1.ManageExtensionAction);
                    manageExtensionAction.extension = e.element;
                    const groups = manageExtensionAction.getActionGroups(runningExtensions, colorThemes, fileIconThemes);
                    let actions = [];
                    for (const menuActions of groups) {
                        actions = [...actions, ...menuActions, new actionbar_1.Separator()];
                    }
                    if (manageExtensionAction.enabled) {
                        this.contextMenuService.showContextMenu({
                            getAnchor: () => e.anchor,
                            getActions: () => actions.slice(0, actions.length - 1)
                        });
                    }
                }
            });
        }
        queryLocal(query, options) {
            return __awaiter(this, void 0, void 0, function* () {
                let value = query.value;
                if (/@builtin/i.test(value)) {
                    const showThemesOnly = /@builtin:themes/i.test(value);
                    if (showThemesOnly) {
                        value = value.replace(/@builtin:themes/g, '');
                    }
                    const showBasicsOnly = /@builtin:basics/i.test(value);
                    if (showBasicsOnly) {
                        value = value.replace(/@builtin:basics/g, '');
                    }
                    const showFeaturesOnly = /@builtin:features/i.test(value);
                    if (showFeaturesOnly) {
                        value = value.replace(/@builtin:features/g, '');
                    }
                    value = value.replace(/@builtin/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
                    let result = yield this.extensionsWorkbenchService.queryLocal();
                    result = result
                        .filter(e => e.type === 0 /* System */ && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1));
                    if (showThemesOnly) {
                        const themesExtensions = result.filter(e => {
                            return e.local
                                && e.local.manifest
                                && e.local.manifest.contributes
                                && Array.isArray(e.local.manifest.contributes.themes)
                                && e.local.manifest.contributes.themes.length;
                        });
                        return this.getPagedModel(this.sortExtensions(themesExtensions, options));
                    }
                    if (showBasicsOnly) {
                        const basics = result.filter(e => {
                            return e.local && e.local.manifest
                                && e.local.manifest.contributes
                                && Array.isArray(e.local.manifest.contributes.grammars)
                                && e.local.manifest.contributes.grammars.length
                                && e.local.identifier.id !== 'vscode.git';
                        });
                        return this.getPagedModel(this.sortExtensions(basics, options));
                    }
                    if (showFeaturesOnly) {
                        const others = result.filter(e => {
                            return e.local
                                && e.local.manifest
                                && e.local.manifest.contributes
                                && (!Array.isArray(e.local.manifest.contributes.grammars) || e.local.identifier.id === 'vscode.git')
                                && !Array.isArray(e.local.manifest.contributes.themes);
                        });
                        return this.getPagedModel(this.sortExtensions(others, options));
                    }
                    return this.getPagedModel(this.sortExtensions(result, options));
                }
                const categories = [];
                value = value.replace(/\bcategory:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedCategory, category) => {
                    const entry = (category || quotedCategory || '').toLowerCase();
                    if (categories.indexOf(entry) === -1) {
                        categories.push(entry);
                    }
                    return '';
                });
                if (/@installed/i.test(value)) {
                    // Show installed extensions
                    value = value.replace(/@installed/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
                    let result = yield this.extensionsWorkbenchService.queryLocal();
                    result = result
                        .filter(e => e.type === 1 /* User */
                        && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                        && (!categories.length || categories.some(category => (e.local && e.local.manifest.categories || []).some(c => c.toLowerCase() === category))));
                    return this.getPagedModel(this.sortExtensions(result, options));
                }
                if (/@outdated/i.test(value)) {
                    value = value.replace(/@outdated/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
                    const local = yield this.extensionsWorkbenchService.queryLocal();
                    const result = local
                        .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                        .filter(extension => extension.outdated
                        && (extension.name.toLowerCase().indexOf(value) > -1 || extension.displayName.toLowerCase().indexOf(value) > -1)
                        && (!categories.length || categories.some(category => !!extension.local && extension.local.manifest.categories.some(c => c.toLowerCase() === category))));
                    return this.getPagedModel(this.sortExtensions(result, options));
                }
                if (/@disabled/i.test(value)) {
                    value = value.replace(/@disabled/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
                    const local = yield this.extensionsWorkbenchService.queryLocal();
                    const runningExtensions = yield this.extensionService.getExtensions();
                    const result = local
                        .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                        .filter(e => runningExtensions.every(r => !extensionManagementUtil_1.areSameExtensions({ id: r.identifier.value }, e.identifier))
                        && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                        && (!categories.length || categories.some(category => (e.local && e.local.manifest.categories || []).some(c => c.toLowerCase() === category))));
                    return this.getPagedModel(this.sortExtensions(result, options));
                }
                if (/@enabled/i.test(value)) {
                    value = value ? value.replace(/@enabled/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase() : '';
                    const local = (yield this.extensionsWorkbenchService.queryLocal()).filter(e => e.type === 1 /* User */);
                    const runningExtensions = yield this.extensionService.getExtensions();
                    const result = local
                        .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                        .filter(e => runningExtensions.some(r => extensionManagementUtil_1.areSameExtensions({ id: r.identifier.value }, e.identifier))
                        && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                        && (!categories.length || categories.some(category => (e.local && e.local.manifest.categories || []).some(c => c.toLowerCase() === category))));
                    return this.getPagedModel(this.sortExtensions(result, options));
                }
                return new paging_1.PagedModel([]);
            });
        }
        queryGallery(query, options) {
            return __awaiter(this, void 0, void 0, function* () {
                const hasUserDefinedSortOrder = options.sortBy !== undefined;
                if (!hasUserDefinedSortOrder && !query.value.trim()) {
                    options.sortBy = 4 /* InstallCount */;
                }
                let value = query.value;
                const idRegex = /@id:(([a-z0-9A-Z][a-z0-9\-A-Z]*)\.([a-z0-9A-Z][a-z0-9\-A-Z]*))/g;
                let idMatch;
                const names = [];
                while ((idMatch = idRegex.exec(value)) !== null) {
                    const name = idMatch[1];
                    names.push(name);
                }
                if (names.length) {
                    return this.extensionsWorkbenchService.queryGallery({ names, source: 'queryById' })
                        .then(pager => this.getPagedModel(pager));
                }
                if (ExtensionsListView.isWorkspaceRecommendedExtensionsQuery(query.value)) {
                    return this.getWorkspaceRecommendationsModel(query, options);
                }
                else if (ExtensionsListView.isKeymapsRecommendedExtensionsQuery(query.value)) {
                    return this.getKeymapRecommendationsModel(query, options);
                }
                else if (/@recommended:all/i.test(query.value) || ExtensionsListView.isSearchRecommendedExtensionsQuery(query.value)) {
                    return this.getAllRecommendationsModel(query, options);
                }
                else if (ExtensionsListView.isRecommendedExtensionsQuery(query.value)) {
                    return this.getRecommendationsModel(query, options);
                }
                if (/\bcurated:([^\s]+)\b/.test(query.value)) {
                    return this.getCuratedModel(query, options);
                }
                let text = query.value;
                const extensionRegex = /\bext:([^\s]+)\b/g;
                if (extensionRegex.test(query.value)) {
                    text = query.value.replace(extensionRegex, (m, ext) => {
                        // Get curated keywords
                        const lookup = product_1.default.extensionKeywords || {};
                        const keywords = lookup[ext] || [];
                        // Get mode name
                        const modeId = this.modeService.getModeIdByFilepathOrFirstLine(`.${ext}`);
                        const languageName = modeId && this.modeService.getLanguageName(modeId);
                        const languageTag = languageName ? ` tag:"${languageName}"` : '';
                        // Construct a rich query
                        return `tag:"__ext_${ext}" tag:"__ext_.${ext}" ${keywords.map(tag => `tag:"${tag}"`).join(' ')}${languageTag} tag:"${ext}"`;
                    });
                    if (text !== query.value) {
                        options = objects_1.assign(options, { text: text.substr(0, 350), source: 'file-extension-tags' });
                        return this.extensionsWorkbenchService.queryGallery(options).then(pager => this.getPagedModel(pager));
                    }
                }
                let preferredResults = [];
                if (text) {
                    options = objects_1.assign(options, { text: text.substr(0, 350), source: 'searchText' });
                    if (!hasUserDefinedSortOrder) {
                        const searchExperiments = yield this.getSearchExperiments();
                        for (const experiment of searchExperiments) {
                            if (experiment.action && text.toLowerCase() === experiment.action.properties['searchText'] && Array.isArray(experiment.action.properties['preferredResults'])) {
                                preferredResults = experiment.action.properties['preferredResults'];
                                options.source += `-experiment-${experiment.id}`;
                                break;
                            }
                        }
                    }
                }
                else {
                    options.source = 'viewlet';
                }
                const pager = yield this.extensionsWorkbenchService.queryGallery(options);
                let positionToUpdate = 0;
                for (const preferredResult of preferredResults) {
                    for (let j = positionToUpdate; j < pager.firstPage.length; j++) {
                        if (extensionManagementUtil_1.areSameExtensions(pager.firstPage[j].identifier, { id: preferredResult })) {
                            if (positionToUpdate !== j) {
                                const preferredExtension = pager.firstPage.splice(j, 1)[0];
                                pager.firstPage.splice(positionToUpdate, 0, preferredExtension);
                                positionToUpdate++;
                            }
                            break;
                        }
                    }
                }
                return this.getPagedModel(pager);
            });
        }
        getSearchExperiments() {
            if (!this._searchExperiments) {
                this._searchExperiments = this.experimentService.getExperimentsByType(experimentService_1.ExperimentActionType.ExtensionSearchResults);
            }
            return this._searchExperiments;
        }
        sortExtensions(extensions, options) {
            switch (options.sortBy) {
                case 4 /* InstallCount */:
                    extensions = extensions.sort((e1, e2) => typeof e2.installCount === 'number' && typeof e1.installCount === 'number' ? e2.installCount - e1.installCount : NaN);
                    break;
                case 6 /* AverageRating */:
                case 12 /* WeightedRating */:
                    extensions = extensions.sort((e1, e2) => typeof e2.rating === 'number' && typeof e1.rating === 'number' ? e2.rating - e1.rating : NaN);
                    break;
                default:
                    extensions = extensions.sort((e1, e2) => e1.displayName.localeCompare(e2.displayName));
                    break;
            }
            if (options.sortOrder === 2 /* Descending */) {
                extensions = extensions.reverse();
            }
            return extensions;
        }
        // Get All types of recommendations, trimmed to show a max of 8 at any given time
        getAllRecommendationsModel(query, options) {
            const value = query.value.replace(/@recommended:all/g, '').replace(/@recommended/g, '').trim().toLowerCase();
            return this.extensionsWorkbenchService.queryLocal()
                .then(result => result.filter(e => e.type === 1 /* User */))
                .then(local => {
                const fileBasedRecommendations = this.tipsService.getFileBasedRecommendations();
                const othersPromise = this.tipsService.getOtherRecommendations();
                const workspacePromise = this.tipsService.getWorkspaceRecommendations();
                return Promise.all([othersPromise, workspacePromise])
                    .then(([others, workspaceRecommendations]) => {
                    const names = this.getTrimmedRecommendations(local, value, fileBasedRecommendations, others, workspaceRecommendations);
                    const recommendationsWithReason = this.tipsService.getAllRecommendationsWithReason();
                    /* __GDPR__
                        "extensionAllRecommendations:open" : {
                            "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                            "recommendations": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('extensionAllRecommendations:open', {
                        count: names.length,
                        recommendations: names.map(id => {
                            return {
                                id,
                                recommendationReason: recommendationsWithReason[id.toLowerCase()].reasonId
                            };
                        })
                    });
                    if (!names.length) {
                        return Promise.resolve(new paging_1.PagedModel([]));
                    }
                    options.source = 'recommendations-all';
                    return this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }))
                        .then(pager => {
                        this.sortFirstPage(pager, names);
                        return this.getPagedModel(pager || []);
                    });
                });
            });
        }
        getCuratedModel(query, options) {
            return __awaiter(this, void 0, void 0, function* () {
                const value = query.value.replace(/curated:/g, '').trim();
                const names = yield this.experimentService.getCuratedExtensionsList(value);
                if (Array.isArray(names) && names.length) {
                    options.source = `curated:${value}`;
                    const pager = yield this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }));
                    this.sortFirstPage(pager, names);
                    return this.getPagedModel(pager || []);
                }
                return new paging_1.PagedModel([]);
            });
        }
        // Get All types of recommendations other than Workspace recommendations, trimmed to show a max of 8 at any given time
        getRecommendationsModel(query, options) {
            const value = query.value.replace(/@recommended/g, '').trim().toLowerCase();
            return this.extensionsWorkbenchService.queryLocal()
                .then(result => result.filter(e => e.type === 1 /* User */))
                .then(local => {
                let fileBasedRecommendations = this.tipsService.getFileBasedRecommendations();
                const othersPromise = this.tipsService.getOtherRecommendations();
                const workspacePromise = this.tipsService.getWorkspaceRecommendations();
                return Promise.all([othersPromise, workspacePromise])
                    .then(([others, workspaceRecommendations]) => {
                    fileBasedRecommendations = fileBasedRecommendations.filter(x => workspaceRecommendations.every(({ extensionId }) => x.extensionId !== extensionId));
                    others = others.filter(x => x => workspaceRecommendations.every(({ extensionId }) => x.extensionId !== extensionId));
                    const names = this.getTrimmedRecommendations(local, value, fileBasedRecommendations, others, []);
                    const recommendationsWithReason = this.tipsService.getAllRecommendationsWithReason();
                    /* __GDPR__
                        "extensionRecommendations:open" : {
                            "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                            "recommendations": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('extensionRecommendations:open', {
                        count: names.length,
                        recommendations: names.map(id => {
                            return {
                                id,
                                recommendationReason: recommendationsWithReason[id.toLowerCase()].reasonId
                            };
                        })
                    });
                    if (!names.length) {
                        return Promise.resolve(new paging_1.PagedModel([]));
                    }
                    options.source = 'recommendations';
                    return this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }))
                        .then(pager => {
                        this.sortFirstPage(pager, names);
                        return this.getPagedModel(pager || []);
                    });
                });
            });
        }
        // Given all recommendations, trims and returns recommendations in the relevant order after filtering out installed extensions
        getTrimmedRecommendations(installedExtensions, value, fileBasedRecommendations, otherRecommendations, workpsaceRecommendations) {
            const totalCount = 8;
            workpsaceRecommendations = workpsaceRecommendations
                .filter(recommendation => {
                return !this.isRecommendationInstalled(recommendation, installedExtensions)
                    && recommendation.extensionId.toLowerCase().indexOf(value) > -1;
            });
            fileBasedRecommendations = fileBasedRecommendations.filter(recommendation => {
                return !this.isRecommendationInstalled(recommendation, installedExtensions)
                    && workpsaceRecommendations.every(workspaceRecommendation => workspaceRecommendation.extensionId !== recommendation.extensionId)
                    && recommendation.extensionId.toLowerCase().indexOf(value) > -1;
            });
            otherRecommendations = otherRecommendations.filter(recommendation => {
                return !this.isRecommendationInstalled(recommendation, installedExtensions)
                    && fileBasedRecommendations.every(fileBasedRecommendation => fileBasedRecommendation.extensionId !== recommendation.extensionId)
                    && workpsaceRecommendations.every(workspaceRecommendation => workspaceRecommendation.extensionId !== recommendation.extensionId)
                    && recommendation.extensionId.toLowerCase().indexOf(value) > -1;
            });
            const otherCount = Math.min(2, otherRecommendations.length);
            const fileBasedCount = Math.min(fileBasedRecommendations.length, totalCount - workpsaceRecommendations.length - otherCount);
            const recommendations = workpsaceRecommendations;
            recommendations.push(...fileBasedRecommendations.splice(0, fileBasedCount));
            recommendations.push(...otherRecommendations.splice(0, otherCount));
            return arrays_1.distinct(recommendations.map(({ extensionId }) => extensionId));
        }
        isRecommendationInstalled(recommendation, installed) {
            return installed.some(i => extensionManagementUtil_1.areSameExtensions(i.identifier, { id: recommendation.extensionId }));
        }
        getWorkspaceRecommendationsModel(query, options) {
            const value = query.value.replace(/@recommended:workspace/g, '').trim().toLowerCase();
            return this.tipsService.getWorkspaceRecommendations()
                .then(recommendations => {
                const names = recommendations.map(({ extensionId }) => extensionId).filter(name => name.toLowerCase().indexOf(value) > -1);
                /* __GDPR__
                    "extensionWorkspaceRecommendations:open" : {
                        "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                    }
                */
                this.telemetryService.publicLog('extensionWorkspaceRecommendations:open', { count: names.length });
                if (!names.length) {
                    return Promise.resolve(new paging_1.PagedModel([]));
                }
                options.source = 'recommendations-workspace';
                return this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }))
                    .then(pager => this.getPagedModel(pager || []));
            });
        }
        getKeymapRecommendationsModel(query, options) {
            const value = query.value.replace(/@recommended:keymaps/g, '').trim().toLowerCase();
            const names = this.tipsService.getKeymapRecommendations().map(({ extensionId }) => extensionId)
                .filter(extensionId => extensionId.toLowerCase().indexOf(value) > -1);
            if (!names.length) {
                return Promise.resolve(new paging_1.PagedModel([]));
            }
            options.source = 'recommendations-keymaps';
            return this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }))
                .then(result => this.getPagedModel(result));
        }
        // Sorts the firstPage of the pager in the same order as given array of extension ids
        sortFirstPage(pager, ids) {
            ids = ids.map(x => x.toLowerCase());
            pager.firstPage.sort((a, b) => {
                return ids.indexOf(a.identifier.id.toLowerCase()) < ids.indexOf(b.identifier.id.toLowerCase()) ? -1 : 1;
            });
        }
        setModel(model, isGalleryError) {
            if (this.list) {
                this.list.model = new paging_1.DelayedPagedModel(model);
                this.list.scrollTop = 0;
                const count = this.count();
                dom_1.toggleClass(this.extensionsList, 'hidden', count === 0);
                dom_1.toggleClass(this.messageBox, 'hidden', count > 0);
                this.badge.setCount(count);
                if (count === 0 && this.isBodyVisible()) {
                    this.messageBox.textContent = isGalleryError ? nls_1.localize('galleryError', "We cannot connect to the Extensions Marketplace at this time, please try again later.") : nls_1.localize('no extensions found', "No extensions found.");
                    if (isGalleryError) {
                        aria_1.alert(this.messageBox.textContent);
                    }
                }
                else {
                    this.messageBox.textContent = '';
                }
            }
        }
        openExtension(extension) {
            this.extensionsWorkbenchService.open(extension).then(undefined, err => this.onError(err));
        }
        pin() {
            const activeControl = this.editorService.activeControl;
            if (activeControl) {
                activeControl.group.pinEditor(activeControl.input);
                activeControl.focus();
            }
        }
        onError(err) {
            if (errors_1.isPromiseCanceledError(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/ECONNREFUSED/.test(message)) {
                const error = errorsWithActions_1.createErrorWithActions(nls_1.localize('suggestProxyError', "Marketplace returned 'ECONNREFUSED'. Please check the 'http.proxy' setting."), {
                    actions: [
                        this.instantiationService.createInstance(preferencesActions_1.OpenGlobalSettingsAction, preferencesActions_1.OpenGlobalSettingsAction.ID, preferencesActions_1.OpenGlobalSettingsAction.LABEL)
                    ]
                });
                this.notificationService.error(error);
                return;
            }
            this.notificationService.error(err);
        }
        getPagedModel(arg) {
            if (Array.isArray(arg)) {
                return new paging_1.PagedModel(arg);
            }
            const pager = {
                total: arg.total,
                pageSize: arg.pageSize,
                firstPage: arg.firstPage,
                getPage: (pageIndex, cancellationToken) => arg.getPage(pageIndex, cancellationToken)
            };
            return new paging_1.PagedModel(pager);
        }
        dispose() {
            super.dispose();
            this.disposables = lifecycle_1.dispose(this.disposables);
            this.list = null;
        }
        static isBuiltInExtensionsQuery(query) {
            return /^\s*@builtin\s*$/i.test(query);
        }
        static isInstalledExtensionsQuery(query) {
            return /@installed|@outdated|@enabled|@disabled/i.test(query);
        }
        static isGroupByServersExtensionsQuery(query) {
            return !!extensionQuery_1.Query.parse(query).groupBy;
        }
        static isRecommendedExtensionsQuery(query) {
            return /^@recommended$/i.test(query.trim());
        }
        static isSearchRecommendedExtensionsQuery(query) {
            return /@recommended/i.test(query) && !ExtensionsListView.isRecommendedExtensionsQuery(query);
        }
        static isWorkspaceRecommendedExtensionsQuery(query) {
            return /@recommended:workspace/i.test(query);
        }
        static isKeymapsRecommendedExtensionsQuery(query) {
            return /@recommended:keymaps/i.test(query);
        }
        focus() {
            super.focus();
            if (!this.list) {
                return;
            }
            if (!(this.list.getFocus().length || this.list.getSelection().length)) {
                this.list.focusNext();
            }
            this.list.domFocus();
        }
    };
    ExtensionsListView = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, extensions_2.IExtensionService),
        __param(7, extensions_1.IExtensionsWorkbenchService),
        __param(8, editorService_1.IEditorService),
        __param(9, extensionManagement_1.IExtensionTipsService),
        __param(10, modeService_1.IModeService),
        __param(11, telemetry_1.ITelemetryService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, workspace_1.IWorkspaceContextService),
        __param(14, experimentService_1.IExperimentService),
        __param(15, workbenchThemeService_1.IWorkbenchThemeService)
    ], ExtensionsListView);
    exports.ExtensionsListView = ExtensionsListView;
    class GroupByServerExtensionsView extends ExtensionsListView {
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                query = query.replace(/@group:server/g, '').trim();
                query = query ? query : '@installed';
                if (!ExtensionsListView.isInstalledExtensionsQuery(query) && !ExtensionsListView.isBuiltInExtensionsQuery(query)) {
                    query = query += ' @installed';
                }
                return _super.show.call(this, query.trim());
            });
        }
    }
    exports.GroupByServerExtensionsView = GroupByServerExtensionsView;
    class EnabledExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.enabledExtensionsQuery = '@enabled';
        }
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                return (query && query.trim() !== this.enabledExtensionsQuery) ? this.showEmptyModel() : _super.show.call(this, this.enabledExtensionsQuery);
            });
        }
    }
    exports.EnabledExtensionsView = EnabledExtensionsView;
    class DisabledExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.disabledExtensionsQuery = '@disabled';
        }
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                return (query && query.trim() !== this.disabledExtensionsQuery) ? this.showEmptyModel() : _super.show.call(this, this.disabledExtensionsQuery);
            });
        }
    }
    exports.DisabledExtensionsView = DisabledExtensionsView;
    class BuiltInExtensionsView extends ExtensionsListView {
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                return (query && query.trim() !== '@builtin') ? this.showEmptyModel() : _super.show.call(this, '@builtin:features');
            });
        }
    }
    exports.BuiltInExtensionsView = BuiltInExtensionsView;
    class BuiltInThemesExtensionsView extends ExtensionsListView {
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                return (query && query.trim() !== '@builtin') ? this.showEmptyModel() : _super.show.call(this, '@builtin:themes');
            });
        }
    }
    exports.BuiltInThemesExtensionsView = BuiltInThemesExtensionsView;
    class BuiltInBasicsExtensionsView extends ExtensionsListView {
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                return (query && query.trim() !== '@builtin') ? this.showEmptyModel() : _super.show.call(this, '@builtin:basics');
            });
        }
    }
    exports.BuiltInBasicsExtensionsView = BuiltInBasicsExtensionsView;
    class DefaultRecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended:all';
        }
        renderBody(container) {
            super.renderBody(container);
            this.disposables.push(this.tipsService.onRecommendationChange(() => {
                this.show('');
            }));
        }
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                if (query && query.trim() !== this.recommendedExtensionsQuery) {
                    return this.showEmptyModel();
                }
                const model = yield _super.show.call(this, this.recommendedExtensionsQuery);
                if (!this.extensionsWorkbenchService.local.some(e => e.type === 1 /* User */)) {
                    // This is part of popular extensions view. Collapse if no installed extensions.
                    this.setExpanded(model.length > 0);
                }
                return model;
            });
        }
    }
    exports.DefaultRecommendedExtensionsView = DefaultRecommendedExtensionsView;
    class RecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended';
        }
        renderBody(container) {
            super.renderBody(container);
            this.disposables.push(this.tipsService.onRecommendationChange(() => {
                this.show('');
            }));
        }
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                return (query && query.trim() !== this.recommendedExtensionsQuery) ? this.showEmptyModel() : _super.show.call(this, this.recommendedExtensionsQuery);
            });
        }
    }
    exports.RecommendedExtensionsView = RecommendedExtensionsView;
    class WorkspaceRecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended:workspace';
        }
        renderBody(container) {
            super.renderBody(container);
            this.disposables.push(this.tipsService.onRecommendationChange(() => this.update()));
            this.disposables.push(this.extensionsWorkbenchService.onChange(() => this.setRecommendationsToInstall()));
            this.disposables.push(this.contextService.onDidChangeWorkbenchState(() => this.update()));
        }
        renderHeader(container) {
            super.renderHeader(container);
            const listActionBar = dom_1.$('.list-actionbar-container');
            container.insertBefore(listActionBar, this.badgeContainer);
            const actionbar = new actionbar_1.ActionBar(listActionBar, {
                animated: false
            });
            actionbar.onDidRun(({ error }) => error && this.notificationService.error(error));
            this.installAllAction = this.instantiationService.createInstance(extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction, extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction.ID, extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction.LABEL, []);
            const configureWorkspaceFolderAction = this.instantiationService.createInstance(extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction, extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.ID, extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL);
            this.installAllAction.class = 'octicon octicon-cloud-download';
            configureWorkspaceFolderAction.class = 'octicon octicon-pencil';
            actionbar.push([this.installAllAction], { icon: true, label: false });
            actionbar.push([configureWorkspaceFolderAction], { icon: true, label: false });
            this.disposables.push(...[this.installAllAction, configureWorkspaceFolderAction, actionbar]);
        }
        show(query) {
            const _super = Object.create(null, {
                show: { get: () => super.show }
            });
            return __awaiter(this, void 0, void 0, function* () {
                let shouldShowEmptyView = query && query.trim() !== '@recommended' && query.trim() !== '@recommended:workspace';
                let model = yield (shouldShowEmptyView ? this.showEmptyModel() : _super.show.call(this, this.recommendedExtensionsQuery));
                this.setExpanded(model.length > 0);
                return model;
            });
        }
        update() {
            this.show(this.recommendedExtensionsQuery);
            this.setRecommendationsToInstall();
        }
        setRecommendationsToInstall() {
            return this.getRecommendationsToInstall()
                .then(recommendations => { this.installAllAction.recommendations = recommendations; });
        }
        getRecommendationsToInstall() {
            return this.tipsService.getWorkspaceRecommendations()
                .then(recommendations => recommendations.filter(({ extensionId }) => !this.extensionsWorkbenchService.local.some(i => extensionManagementUtil_1.areSameExtensions({ id: extensionId }, i.identifier))));
        }
    }
    exports.WorkspaceRecommendedExtensionsView = WorkspaceRecommendedExtensionsView;
});
//# sourceMappingURL=extensionsViews.js.map