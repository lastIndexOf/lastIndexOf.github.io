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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/services/viewlet/browser/viewlet", "vs/base/browser/dom", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "../common/extensions", "vs/workbench/contrib/extensions/electron-browser/extensionsActions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/common/extensionsInput", "./extensionsViews", "vs/workbench/contrib/preferences/browser/preferencesActions", "vs/platform/progress/common/progress", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/severity", "vs/workbench/services/activity/common/activity", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/workbench/common/views", "vs/workbench/browser/parts/views/viewsViewlet", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/windows/common/windows", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/base/browser/ui/aria/aria", "vs/base/common/errorsWithActions", "vs/platform/environment/common/environment", "vs/platform/registry/common/platform", "vs/css!./media/extensionsViewlet"], function (require, exports, nls_1, async_1, errors_1, lifecycle_1, event_1, actionbar_1, viewlet_1, dom_1, telemetry_1, instantiation_1, extensions_1, extensions_2, extensionsActions_1, extensionManagement_1, extensionsInput_1, extensionsViews_1, preferencesActions_1, progress_1, editorGroupsService_1, severity_1, activity_1, themeService_1, configuration_1, views_1, viewsViewlet_1, storage_1, workspace_1, contextkey_1, contextView_1, extensionManagementUtil_1, log_1, notification_1, windows_1, layoutService_1, extensionQuery_1, suggestEnabledInput_1, aria_1, errorsWithActions_1, environment_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const NonEmptyWorkspaceContext = new contextkey_1.RawContextKey('nonEmptyWorkspace', false);
    const SearchExtensionsContext = new contextkey_1.RawContextKey('searchExtensions', false);
    const HasInstalledExtensionsContext = new contextkey_1.RawContextKey('hasInstalledExtensions', true);
    const SearchBuiltInExtensionsContext = new contextkey_1.RawContextKey('searchBuiltInExtensions', false);
    const RecommendedExtensionsContext = new contextkey_1.RawContextKey('recommendedExtensions', false);
    const DefaultRecommendedExtensionsContext = new contextkey_1.RawContextKey('defaultRecommendedExtensions', false);
    const GroupByServersContext = new contextkey_1.RawContextKey('groupByServersContext', false);
    const viewIdNameMappings = {
        'extensions.listView': nls_1.localize('marketPlace', "Marketplace"),
        'extensions.enabledExtensionList': nls_1.localize('enabledExtensions', "Enabled"),
        'extensions.disabledExtensionList': nls_1.localize('disabledExtensions', "Disabled"),
        'extensions.popularExtensionsList': nls_1.localize('popularExtensions', "Popular"),
        'extensions.recommendedList': nls_1.localize('recommendedExtensions', "Recommended"),
        'extensions.otherrecommendedList': nls_1.localize('otherRecommendedExtensions', "Other Recommendations"),
        'extensions.workspaceRecommendedList': nls_1.localize('workspaceRecommendedExtensions', "Workspace Recommendations"),
        'extensions.builtInExtensionsList': nls_1.localize('builtInExtensions', "Features"),
        'extensions.builtInThemesExtensionsList': nls_1.localize('builtInThemesExtensions', "Themes"),
        'extensions.builtInBasicsExtensionsList': nls_1.localize('builtInBasicsExtensions', "Programming Languages"),
    };
    let ExtensionsViewletViewsContribution = class ExtensionsViewletViewsContribution {
        constructor(extensionManagementServerService) {
            this.extensionManagementServerService = extensionManagementServerService;
            this.registerViews();
        }
        registerViews() {
            let viewDescriptors = [];
            viewDescriptors.push(this.createMarketPlaceExtensionsListViewDescriptor());
            viewDescriptors.push(this.createEnabledExtensionsListViewDescriptor());
            viewDescriptors.push(this.createDisabledExtensionsListViewDescriptor());
            viewDescriptors.push(this.createPopularExtensionsListViewDescriptor());
            viewDescriptors.push(this.createBuiltInExtensionsListViewDescriptor());
            viewDescriptors.push(this.createBuiltInBasicsExtensionsListViewDescriptor());
            viewDescriptors.push(this.createBuiltInThemesExtensionsListViewDescriptor());
            viewDescriptors.push(this.createDefaultRecommendedExtensionsListViewDescriptor());
            viewDescriptors.push(this.createOtherRecommendedExtensionsListViewDescriptor());
            viewDescriptors.push(this.createWorkspaceRecommendedExtensionsListViewDescriptor());
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                viewDescriptors.push(...this.createExtensionsViewDescriptorsForServer(this.extensionManagementServerService.localExtensionManagementServer));
                viewDescriptors.push(...this.createExtensionsViewDescriptorsForServer(this.extensionManagementServerService.remoteExtensionManagementServer));
            }
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews(viewDescriptors, extensions_2.VIEW_CONTAINER);
        }
        // View used for any kind of searching
        createMarketPlaceExtensionsListViewDescriptor() {
            const id = 'extensions.listView';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.ExtensionsListView },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchExtensions'), contextkey_1.ContextKeyExpr.not('searchInstalledExtensions'), contextkey_1.ContextKeyExpr.not('searchBuiltInExtensions'), contextkey_1.ContextKeyExpr.not('recommendedExtensions'), contextkey_1.ContextKeyExpr.not('groupByServersContext')),
                weight: 100
            };
        }
        // Separate view for enabled extensions required as we need to show enabled, disabled and recommended sections
        // in the default view when there is no search text, but user has installed extensions.
        createEnabledExtensionsListViewDescriptor() {
            const id = 'extensions.enabledExtensionList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.EnabledExtensionsView },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('searchExtensions'), contextkey_1.ContextKeyExpr.has('hasInstalledExtensions')),
                weight: 40,
                canToggleVisibility: true,
                order: 1
            };
        }
        // Separate view for disabled extensions required as we need to show enabled, disabled and recommended sections
        // in the default view when there is no search text, but user has installed extensions.
        createDisabledExtensionsListViewDescriptor() {
            const id = 'extensions.disabledExtensionList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.DisabledExtensionsView },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('searchExtensions'), contextkey_1.ContextKeyExpr.has('hasInstalledExtensions')),
                weight: 10,
                canToggleVisibility: true,
                order: 3,
                collapsed: true
            };
        }
        // Separate view for popular extensions required as we need to show popular and recommended sections
        // in the default view when there is no search text, and user has no installed extensions.
        createPopularExtensionsListViewDescriptor() {
            const id = 'extensions.popularExtensionsList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.ExtensionsListView },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('searchExtensions'), contextkey_1.ContextKeyExpr.not('hasInstalledExtensions')),
                weight: 60,
                order: 1
            };
        }
        createExtensionsViewDescriptorsForServer(server) {
            return [{
                    id: `server.extensionsList.${server.authority}`,
                    name: server.label,
                    ctorDescriptor: { ctor: extensionsViews_1.GroupByServerExtensionsView },
                    when: contextkey_1.ContextKeyExpr.has('groupByServersContext'),
                    weight: 100
                }];
        }
        // Separate view for recommended extensions required as we need to show it along with other views when there is no search text.
        // When user has installed extensions, this is shown along with the views for enabled & disabled extensions
        // When user has no installed extensions, this is shown along with the view for popular extensions
        createDefaultRecommendedExtensionsListViewDescriptor() {
            const id = 'extensions.recommendedList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.DefaultRecommendedExtensionsView },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('searchExtensions'), contextkey_1.ContextKeyExpr.has('defaultRecommendedExtensions')),
                weight: 40,
                order: 2,
                canToggleVisibility: true
            };
        }
        // Separate view for recommedations that are not workspace recommendations.
        // Shown along with view for workspace recommendations, when using the command that shows recommendations
        createOtherRecommendedExtensionsListViewDescriptor() {
            const id = 'extensions.otherrecommendedList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.RecommendedExtensionsView },
                when: contextkey_1.ContextKeyExpr.has('recommendedExtensions'),
                weight: 50,
                canToggleVisibility: true,
                order: 2
            };
        }
        // Separate view for workspace recommendations.
        // Shown along with view for other recommendations, when using the command that shows recommendations
        createWorkspaceRecommendedExtensionsListViewDescriptor() {
            const id = 'extensions.workspaceRecommendedList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.WorkspaceRecommendedExtensionsView },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('recommendedExtensions'), contextkey_1.ContextKeyExpr.has('nonEmptyWorkspace')),
                weight: 50,
                canToggleVisibility: true,
                order: 1
            };
        }
        createBuiltInExtensionsListViewDescriptor() {
            const id = 'extensions.builtInExtensionsList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.BuiltInExtensionsView },
                when: contextkey_1.ContextKeyExpr.has('searchBuiltInExtensions'),
                weight: 100,
                canToggleVisibility: true
            };
        }
        createBuiltInThemesExtensionsListViewDescriptor() {
            const id = 'extensions.builtInThemesExtensionsList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.BuiltInThemesExtensionsView },
                when: contextkey_1.ContextKeyExpr.has('searchBuiltInExtensions'),
                weight: 100,
                canToggleVisibility: true
            };
        }
        createBuiltInBasicsExtensionsListViewDescriptor() {
            const id = 'extensions.builtInBasicsExtensionsList';
            return {
                id,
                name: viewIdNameMappings[id],
                ctorDescriptor: { ctor: extensionsViews_1.BuiltInBasicsExtensionsView },
                when: contextkey_1.ContextKeyExpr.has('searchBuiltInExtensions'),
                weight: 100,
                canToggleVisibility: true
            };
        }
    };
    ExtensionsViewletViewsContribution = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementServerService)
    ], ExtensionsViewletViewsContribution);
    exports.ExtensionsViewletViewsContribution = ExtensionsViewletViewsContribution;
    let ExtensionsViewlet = class ExtensionsViewlet extends viewsViewlet_1.ViewContainerViewlet {
        constructor(layoutService, telemetryService, progressService, instantiationService, editorGroupService, extensionManagementService, notificationService, viewletService, themeService, configurationService, storageService, contextService, contextKeyService, contextMenuService, extensionService) {
            super(extensions_2.VIEWLET_ID, `${extensions_2.VIEWLET_ID}.state`, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
            this.progressService = progressService;
            this.editorGroupService = editorGroupService;
            this.extensionManagementService = extensionManagementService;
            this.notificationService = notificationService;
            this.viewletService = viewletService;
            this.disposables = [];
            this.searchDelayer = new async_1.ThrottledDelayer(500);
            this.nonEmptyWorkspaceContextKey = NonEmptyWorkspaceContext.bindTo(contextKeyService);
            this.searchExtensionsContextKey = SearchExtensionsContext.bindTo(contextKeyService);
            this.hasInstalledExtensionsContextKey = HasInstalledExtensionsContext.bindTo(contextKeyService);
            this.searchBuiltInExtensionsContextKey = SearchBuiltInExtensionsContext.bindTo(contextKeyService);
            this.recommendedExtensionsContextKey = RecommendedExtensionsContext.bindTo(contextKeyService);
            this.groupByServersContextKey = GroupByServersContext.bindTo(contextKeyService);
            this.defaultRecommendedExtensionsContextKey = DefaultRecommendedExtensionsContext.bindTo(contextKeyService);
            this.defaultRecommendedExtensionsContextKey.set(!this.configurationService.getValue(extensions_2.ShowRecommendationsOnlyOnDemandKey));
            this.disposables.push(this.viewletService.onDidViewletOpen(this.onViewletOpen, this, this.disposables));
            this.searchViewletState = this.getMemento(1 /* WORKSPACE */);
            this.extensionManagementService.getInstalled(1 /* User */).then(result => {
                this.hasInstalledExtensionsContextKey.set(result.length > 0);
            });
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(extensions_2.AutoUpdateConfigurationKey)) {
                    this.secondaryActions = null;
                    this.updateTitleArea();
                }
                if (e.affectedKeys.indexOf(extensions_2.ShowRecommendationsOnlyOnDemandKey) > -1) {
                    this.defaultRecommendedExtensionsContextKey.set(!this.configurationService.getValue(extensions_2.ShowRecommendationsOnlyOnDemandKey));
                }
            }, this, this.disposables);
        }
        create(parent) {
            dom_1.addClass(parent, 'extensions-viewlet');
            this.root = parent;
            const header = dom_1.append(this.root, dom_1.$('.header'));
            const placeholder = nls_1.localize('searchExtensions', "Search Extensions in Marketplace");
            const searchValue = this.searchViewletState['query.value'] ? this.searchViewletState['query.value'] : '';
            this.searchBox = this.instantiationService.createInstance(suggestEnabledInput_1.SuggestEnabledInput, `${extensions_2.VIEWLET_ID}.searchbox`, header, {
                triggerCharacters: ['@'],
                sortKey: item => {
                    if (item.indexOf(':') === -1) {
                        return 'a';
                    }
                    else if (/ext:/.test(item) || /tag:/.test(item)) {
                        return 'b';
                    }
                    else if (/sort:/.test(item)) {
                        return 'c';
                    }
                    else {
                        return 'd';
                    }
                },
                provideResults: (query) => extensionQuery_1.Query.suggestions(query)
            }, placeholder, 'extensions:searchinput', { placeholderText: placeholder, value: searchValue });
            if (this.searchBox.getValue()) {
                this.triggerSearch();
            }
            this.disposables.push(suggestEnabledInput_1.attachSuggestEnabledInputBoxStyler(this.searchBox, this.themeService));
            this.disposables.push(this.searchBox);
            const _searchChange = new event_1.Emitter();
            this.onSearchChange = _searchChange.event;
            this.searchBox.onInputDidChange(() => {
                this.triggerSearch();
                _searchChange.fire(this.searchBox.getValue());
            }, this, this.disposables);
            this.searchBox.onShouldFocusResults(() => this.focusListView(), this, this.disposables);
            this._register(this.onDidChangeVisibility(visible => {
                if (visible) {
                    this.searchBox.focus();
                }
            }));
            this.extensionsBox = dom_1.append(this.root, dom_1.$('.extensions'));
            super.create(this.extensionsBox);
        }
        focus() {
            this.searchBox.focus();
        }
        layout(dimension) {
            dom_1.toggleClass(this.root, 'narrow', dimension.width <= 300);
            this.searchBox.layout({ height: 20, width: dimension.width - 34 });
            super.layout(new dom_1.Dimension(dimension.width, dimension.height - 38));
        }
        getOptimalWidth() {
            return 400;
        }
        getActions() {
            if (!this.primaryActions) {
                this.primaryActions = [
                    this.instantiationService.createInstance(extensionsActions_1.ClearExtensionsInputAction, extensionsActions_1.ClearExtensionsInputAction.ID, extensionsActions_1.ClearExtensionsInputAction.LABEL, this.onSearchChange)
                ];
            }
            return this.primaryActions;
        }
        getSecondaryActions() {
            if (!this.secondaryActions) {
                this.secondaryActions = [
                    this.instantiationService.createInstance(extensionsActions_1.ShowInstalledExtensionsAction, extensionsActions_1.ShowInstalledExtensionsAction.ID, extensionsActions_1.ShowInstalledExtensionsAction.LABEL),
                    this.instantiationService.createInstance(extensionsActions_1.ShowOutdatedExtensionsAction, extensionsActions_1.ShowOutdatedExtensionsAction.ID, extensionsActions_1.ShowOutdatedExtensionsAction.LABEL),
                    this.instantiationService.createInstance(extensionsActions_1.ShowEnabledExtensionsAction, extensionsActions_1.ShowEnabledExtensionsAction.ID, extensionsActions_1.ShowEnabledExtensionsAction.LABEL),
                    this.instantiationService.createInstance(extensionsActions_1.ShowDisabledExtensionsAction, extensionsActions_1.ShowDisabledExtensionsAction.ID, extensionsActions_1.ShowDisabledExtensionsAction.LABEL),
                    this.instantiationService.createInstance(extensionsActions_1.ShowBuiltInExtensionsAction, extensionsActions_1.ShowBuiltInExtensionsAction.ID, extensionsActions_1.ShowBuiltInExtensionsAction.LABEL),
                    this.instantiationService.createInstance(extensionsActions_1.ShowRecommendedExtensionsAction, extensionsActions_1.ShowRecommendedExtensionsAction.ID, extensionsActions_1.ShowRecommendedExtensionsAction.LABEL),
                    this.instantiationService.createInstance(extensionsActions_1.ShowPopularExtensionsAction, extensionsActions_1.ShowPopularExtensionsAction.ID, extensionsActions_1.ShowPopularExtensionsAction.LABEL),
                    new actionbar_1.Separator(),
                    this.instantiationService.createInstance(extensionsActions_1.ChangeSortAction, 'extensions.sort.install', nls_1.localize('sort by installs', "Sort By: Install Count"), this.onSearchChange, 'installs'),
                    this.instantiationService.createInstance(extensionsActions_1.ChangeSortAction, 'extensions.sort.rating', nls_1.localize('sort by rating', "Sort By: Rating"), this.onSearchChange, 'rating'),
                    this.instantiationService.createInstance(extensionsActions_1.ChangeSortAction, 'extensions.sort.name', nls_1.localize('sort by name', "Sort By: Name"), this.onSearchChange, 'name'),
                    new actionbar_1.Separator(),
                    this.instantiationService.createInstance(extensionsActions_1.CheckForUpdatesAction, extensionsActions_1.CheckForUpdatesAction.ID, extensionsActions_1.CheckForUpdatesAction.LABEL),
                    ...(this.configurationService.getValue(extensions_2.AutoUpdateConfigurationKey) ? [this.instantiationService.createInstance(extensionsActions_1.DisableAutoUpdateAction, extensionsActions_1.DisableAutoUpdateAction.ID, extensionsActions_1.DisableAutoUpdateAction.LABEL)] : [this.instantiationService.createInstance(extensionsActions_1.UpdateAllAction, extensionsActions_1.UpdateAllAction.ID, extensionsActions_1.UpdateAllAction.LABEL), this.instantiationService.createInstance(extensionsActions_1.EnableAutoUpdateAction, extensionsActions_1.EnableAutoUpdateAction.ID, extensionsActions_1.EnableAutoUpdateAction.LABEL)]),
                    this.instantiationService.createInstance(extensionsActions_1.InstallVSIXAction, extensionsActions_1.InstallVSIXAction.ID, extensionsActions_1.InstallVSIXAction.LABEL),
                    new actionbar_1.Separator(),
                    this.instantiationService.createInstance(extensionsActions_1.DisableAllAction, extensionsActions_1.DisableAllAction.ID, extensionsActions_1.DisableAllAction.LABEL),
                    this.instantiationService.createInstance(extensionsActions_1.EnableAllAction, extensionsActions_1.EnableAllAction.ID, extensionsActions_1.EnableAllAction.LABEL)
                ];
            }
            return this.secondaryActions;
        }
        search(value) {
            const event = new Event('input', { bubbles: true });
            event.immediate = true;
            this.searchBox.setValue(value);
        }
        triggerSearch(immediate = false) {
            this.searchDelayer.trigger(() => this.doSearch(), immediate || !this.searchBox.getValue() ? 0 : 500).then(undefined, err => this.onError(err));
        }
        normalizedQuery() {
            return this.searchBox.getValue().replace(/@category/g, 'category').replace(/@tag:/g, 'tag:').replace(/@ext:/g, 'ext:');
        }
        saveState() {
            const value = this.searchBox.getValue();
            if (extensionsViews_1.ExtensionsListView.isInstalledExtensionsQuery(value)) {
                this.searchViewletState['query.value'] = value;
            }
            else {
                this.searchViewletState['query.value'] = '';
            }
            super.saveState();
        }
        doSearch() {
            const value = this.normalizedQuery();
            this.searchExtensionsContextKey.set(!!value);
            this.searchBuiltInExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isBuiltInExtensionsQuery(value));
            this.groupByServersContextKey.set(extensionsViews_1.ExtensionsListView.isGroupByServersExtensionsQuery(value));
            this.recommendedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isRecommendedExtensionsQuery(value));
            this.nonEmptyWorkspaceContextKey.set(this.contextService.getWorkbenchState() !== 1 /* EMPTY */);
            if (value) {
                return this.progress(Promise.all(this.panels.map(view => view.show(this.normalizedQuery())
                    .then(model => this.alertSearchResult(model.length, view.id)))));
            }
            return Promise.resolve(null);
        }
        onDidAddViews(added) {
            const addedViews = super.onDidAddViews(added);
            this.progress(Promise.all(addedViews.map(addedView => addedView.show(this.normalizedQuery())
                .then(model => this.alertSearchResult(model.length, addedView.id)))));
            return addedViews;
        }
        alertSearchResult(count, viewId) {
            switch (count) {
                case 0:
                    break;
                case 1:
                    if (viewIdNameMappings[viewId]) {
                        aria_1.alert(nls_1.localize('extensionFoundInSection', "1 extension found in the {0} section.", viewIdNameMappings[viewId]));
                    }
                    else {
                        aria_1.alert(nls_1.localize('extensionFound', "1 extension found."));
                    }
                    break;
                default:
                    if (viewIdNameMappings[viewId]) {
                        aria_1.alert(nls_1.localize('extensionsFoundInSection', "{0} extensions found in the {1} section.", count, viewIdNameMappings[viewId]));
                    }
                    else {
                        aria_1.alert(nls_1.localize('extensionsFound', "{0} extensions found.", count));
                    }
                    break;
            }
        }
        count() {
            return this.panels.reduce((count, view) => view.count() + count, 0);
        }
        focusListView() {
            if (this.count() > 0) {
                this.panels[0].focus();
            }
        }
        onViewletOpen(viewlet) {
            if (!viewlet || viewlet.getId() === extensions_2.VIEWLET_ID) {
                return;
            }
            if (this.configurationService.getValue(extensions_2.CloseExtensionDetailsOnViewChangeKey)) {
                const promises = this.editorGroupService.groups.map(group => {
                    const editors = group.editors.filter(input => input instanceof extensionsInput_1.ExtensionsInput);
                    const promises = editors.map(editor => group.closeEditor(editor));
                    return Promise.all(promises);
                });
                Promise.all(promises);
            }
        }
        progress(promise) {
            return this.progressService.withProgress({ location: 5 /* Extensions */ }, () => promise);
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
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
            super.dispose();
        }
    };
    ExtensionsViewlet = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, progress_1.IProgressService2),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, notification_1.INotificationService),
        __param(7, viewlet_1.IViewletService),
        __param(8, themeService_1.IThemeService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, storage_1.IStorageService),
        __param(11, workspace_1.IWorkspaceContextService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, contextView_1.IContextMenuService),
        __param(14, extensions_1.IExtensionService)
    ], ExtensionsViewlet);
    exports.ExtensionsViewlet = ExtensionsViewlet;
    let StatusUpdater = class StatusUpdater {
        constructor(activityService, extensionsWorkbenchService) {
            this.activityService = activityService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            extensionsWorkbenchService.onChange(this.onServiceChange, this, this.disposables);
        }
        onServiceChange() {
            lifecycle_1.dispose(this.badgeHandle);
            if (this.extensionsWorkbenchService.local.some(e => e.state === 0 /* Installing */)) {
                this.badgeHandle = this.activityService.showActivity(extensions_2.VIEWLET_ID, new activity_1.ProgressBadge(() => nls_1.localize('extensions', "Extensions")), 'extensions-badge progress-badge');
                return;
            }
            const outdated = this.extensionsWorkbenchService.local.reduce((r, e) => r + (e.outdated && e.enablementState !== 0 /* Disabled */ && e.enablementState !== 1 /* WorkspaceDisabled */ ? 1 : 0), 0);
            if (outdated > 0) {
                const badge = new activity_1.NumberBadge(outdated, n => nls_1.localize('outdatedExtensions', '{0} Outdated Extensions', n));
                this.badgeHandle = this.activityService.showActivity(extensions_2.VIEWLET_ID, badge, 'extensions-badge count-badge');
            }
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
            lifecycle_1.dispose(this.badgeHandle);
        }
    };
    StatusUpdater = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, extensions_2.IExtensionsWorkbenchService)
    ], StatusUpdater);
    exports.StatusUpdater = StatusUpdater;
    let MaliciousExtensionChecker = class MaliciousExtensionChecker {
        constructor(extensionsManagementService, windowService, logService, notificationService, environmentService) {
            this.extensionsManagementService = extensionsManagementService;
            this.windowService = windowService;
            this.logService = logService;
            this.notificationService = notificationService;
            this.environmentService = environmentService;
            if (!this.environmentService.disableExtensions) {
                this.loopCheckForMaliciousExtensions();
            }
        }
        loopCheckForMaliciousExtensions() {
            this.checkForMaliciousExtensions()
                .then(() => async_1.timeout(1000 * 60 * 5)) // every five minutes
                .then(() => this.loopCheckForMaliciousExtensions());
        }
        checkForMaliciousExtensions() {
            return this.extensionsManagementService.getExtensionsReport().then(report => {
                const maliciousSet = extensionManagementUtil_1.getMaliciousExtensionsSet(report);
                return this.extensionsManagementService.getInstalled(1 /* User */).then(installed => {
                    const maliciousExtensions = installed
                        .filter(e => maliciousSet.has(e.identifier.id));
                    if (maliciousExtensions.length) {
                        return Promise.all(maliciousExtensions.map(e => this.extensionsManagementService.uninstall(e, true).then(() => {
                            this.notificationService.prompt(severity_1.default.Warning, nls_1.localize('malicious warning', "We have uninstalled '{0}' which was reported to be problematic.", e.identifier.id), [{
                                    label: nls_1.localize('reloadNow', "Reload Now"),
                                    run: () => this.windowService.reloadWindow()
                                }], { sticky: true });
                        })));
                    }
                    else {
                        return Promise.resolve(null);
                    }
                });
            }, err => this.logService.error(err));
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    MaliciousExtensionChecker = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, windows_1.IWindowService),
        __param(2, log_1.ILogService),
        __param(3, notification_1.INotificationService),
        __param(4, environment_1.IEnvironmentService)
    ], MaliciousExtensionChecker);
    exports.MaliciousExtensionChecker = MaliciousExtensionChecker;
});
//# sourceMappingURL=extensionsViewlet.js.map