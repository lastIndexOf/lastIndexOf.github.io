/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/comparers", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom", "vs/base/common/async", "vs/base/browser/browser", "vs/base/common/performance", "vs/base/common/errors", "vs/platform/registry/common/platform", "vs/base/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/browser/parts/sidebar/sidebarPart", "vs/workbench/browser/parts/panel/panelPart", "vs/workbench/browser/actions", "vs/workbench/browser/panel", "vs/platform/instantiation/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/files/common/files", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/title/common/titleService", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/platform/windows/common/windows", "vs/platform/environment/common/environment", "vs/platform/notification/common/notification", "vs/workbench/browser/parts/notifications/notificationsCenter", "vs/workbench/browser/parts/notifications/notificationsAlerts", "vs/workbench/browser/parts/notifications/notificationsStatus", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/workbench/browser/parts/notifications/notificationsToasts", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/browser/ui/grid/grid", "vs/workbench/browser/legacyLayout", "vs/base/browser/ui/aria/aria", "vs/editor/browser/config/configuration", "vs/editor/common/config/fontInfo", "vs/platform/log/common/log", "vs/base/common/errorMessage", "vs/workbench/browser/contextkeys", "vs/platform/statusbar/common/statusbar", "vs/workbench/services/activityBar/browser/activityBarService", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiationService", "vs/workbench/browser/style"], function (require, exports, nls_1, comparers_1, lifecycle_1, event_1, dom_1, async_1, browser_1, performance_1, errors_1, platform_1, platform_2, contributions_1, editor_1, sidebarPart_1, panelPart_1, actions_1, panel_1, extensions_1, layoutService_1, workspace_1, storage_1, configuration_1, viewlet_1, files_1, panelService_1, titleService_1, instantiation_1, lifecycle_2, windows_1, environment_1, notification_1, notificationsCenter_1, notificationsAlerts_1, notificationsStatus_1, notificationsCommands_1, notificationsToasts_1, editorService_1, editorGroupsService_1, workbenchThemeService_1, grid_1, legacyLayout_1, aria_1, configuration_2, fontInfo_1, log_1, errorMessage_1, contextkeys_1, statusbar_1, activityBarService_1, arrays_1, instantiationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Settings;
    (function (Settings) {
        Settings["MENUBAR_VISIBLE"] = "window.menuBarVisibility";
        Settings["ACTIVITYBAR_VISIBLE"] = "workbench.activityBar.visible";
        Settings["STATUSBAR_VISIBLE"] = "workbench.statusBar.visible";
        Settings["SIDEBAR_POSITION"] = "workbench.sideBar.location";
        Settings["PANEL_POSITION"] = "workbench.panel.defaultLocation";
        Settings["FONT_ALIASING"] = "workbench.fontAliasing";
        Settings["ZEN_MODE_RESTORE"] = "zenMode.restore";
    })(Settings || (Settings = {}));
    var Storage;
    (function (Storage) {
        Storage["SIDEBAR_HIDDEN"] = "workbench.sidebar.hidden";
        Storage["PANEL_HIDDEN"] = "workbench.panel.hidden";
        Storage["PANEL_POSITION"] = "workbench.panel.location";
        Storage["ZEN_MODE_ENABLED"] = "workbench.zenmode.active";
        Storage["CENTERED_LAYOUT_ENABLED"] = "workbench.centerededitorlayout.active";
    })(Storage || (Storage = {}));
    class Workbench extends lifecycle_1.Disposable {
        constructor(parent, serviceCollection, logService) {
            super();
            this.parent = parent;
            this.serviceCollection = serviceCollection;
            this._onShutdown = this._register(new event_1.Emitter());
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.workbench = document.createElement('div');
            this.previousUnexpectedError = { message: undefined, time: 0 };
            //#region ILayoutService
            this._onTitleBarVisibilityChange = this._register(new event_1.Emitter());
            this._onZenMode = this._register(new event_1.Emitter());
            this._onLayout = this._register(new event_1.Emitter());
            this.parts = new Map();
            this.state = {
                fullscreen: false,
                menuBar: {
                    visibility: 'default',
                    toggled: false
                },
                activityBar: {
                    hidden: false
                },
                sideBar: {
                    hidden: false,
                    position: 0 /* LEFT */,
                    width: 300,
                    viewletToRestore: undefined
                },
                editor: {
                    hidden: false,
                    centered: false,
                    restoreCentered: false,
                    restoreEditors: false,
                    editorsToOpen: []
                },
                panel: {
                    hidden: false,
                    position: 2 /* BOTTOM */,
                    height: 350,
                    width: 350,
                    panelToRestore: undefined
                },
                statusBar: {
                    hidden: false
                },
                zenMode: {
                    active: false,
                    restore: false,
                    transitionedToFullScreen: false,
                    transitionedToCenteredEditorLayout: false,
                    wasSideBarVisible: false,
                    wasPanelVisible: false,
                    transitionDisposeables: []
                }
            };
            this.registerErrorHandler(logService);
        }
        get onShutdown() { return this._onShutdown.event; }
        get onWillShutdown() { return this._onWillShutdown.event; }
        registerErrorHandler(logService) {
            // Listen on unhandled rejection events
            window.addEventListener('unhandledrejection', (event) => {
                // See https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent
                errors_1.onUnexpectedError(event.reason);
                // Prevent the printing of this event to the console
                event.preventDefault();
            });
            // Install handler for unexpected errors
            errors_1.setUnexpectedErrorHandler(error => this.handleUnexpectedError(error, logService));
            // Inform user about loading issues from the loader
            self.require.config({
                onError: err => {
                    if (err.errorCode === 'load') {
                        errors_1.onUnexpectedError(new Error(nls_1.localize('loaderErrorNative', "Failed to load a required file. Please restart the application to try again. Details: {0}", JSON.stringify(err))));
                    }
                }
            });
        }
        handleUnexpectedError(error, logService) {
            const message = errorMessage_1.toErrorMessage(error, true);
            if (!message) {
                return;
            }
            const now = Date.now();
            if (message === this.previousUnexpectedError.message && now - this.previousUnexpectedError.time <= 1000) {
                return; // Return if error message identical to previous and shorter than 1 second
            }
            this.previousUnexpectedError.time = now;
            this.previousUnexpectedError.message = message;
            // Log it
            logService.error(message);
        }
        startup() {
            try {
                // Configure emitter leak warning threshold
                event_1.setGlobalLeakWarningThreshold(175);
                // Setup Intl for comparers
                comparers_1.setFileNameComparer(new async_1.IdleValue(() => {
                    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
                    return {
                        collator: collator,
                        collatorIsNumeric: collator.resolvedOptions().numeric
                    };
                }));
                // ARIA
                aria_1.setARIAContainer(document.body);
                // Services
                const instantiationService = this.initServices(this.serviceCollection);
                instantiationService.invokeFunction(accessor => {
                    const lifecycleService = accessor.get(lifecycle_2.ILifecycleService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    // Layout
                    this.initLayout(accessor);
                    // Registries
                    this.initRegistries(accessor);
                    // Context Keys
                    this._register(instantiationService.createInstance(contextkeys_1.WorkbenchContextKeysHandler));
                    // Register Listeners
                    this.registerListeners(lifecycleService, storageService, configurationService);
                    // Render Workbench
                    this.renderWorkbench(instantiationService, accessor.get(notification_1.INotificationService), storageService, configurationService);
                    // Workbench Layout
                    this.createWorkbenchLayout(instantiationService);
                    // Layout
                    this.layout();
                    // Restore
                    this.restoreWorkbench(accessor.get(editorService_1.IEditorService), accessor.get(editorGroupsService_1.IEditorGroupsService), accessor.get(viewlet_1.IViewletService), accessor.get(panelService_1.IPanelService), accessor.get(log_1.ILogService), lifecycleService).then(undefined, error => errors_1.onUnexpectedError(error));
                });
                return instantiationService;
            }
            catch (error) {
                errors_1.onUnexpectedError(error);
                throw error; // rethrow because this is a critical issue we cannot handle properly here
            }
        }
        initServices(serviceCollection) {
            // Layout Service
            serviceCollection.set(layoutService_1.IWorkbenchLayoutService, this);
            //
            // NOTE: DO NOT ADD ANY OTHER SERVICE INTO THE COLLECTION HERE.
            // INSTEAD, CONTRIBUTE IT VIA WORKBENCH.MAIN.TS
            //
            // All Contributed Services
            const contributedServices = extensions_1.getServices();
            for (let contributedService of contributedServices) {
                serviceCollection.set(contributedService.id, contributedService.descriptor);
            }
            const instantationServie = new instantiationService_1.InstantiationService(serviceCollection, true);
            // Wrap up
            instantationServie.invokeFunction(accessor => {
                const lifecycleService = accessor.get(lifecycle_2.ILifecycleService);
                // TODO@Ben TODO@Sandeep TODO@Martin debt around cyclic dependencies
                const fileService = accessor.get(files_1.IFileService);
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
                if (typeof configurationService.acquireFileService === 'function') {
                    configurationService.acquireFileService(fileService);
                }
                if (typeof configurationService.acquireInstantiationService === 'function') {
                    configurationService.acquireInstantiationService(instantiationService);
                }
                if (typeof themeService.acquireFileService === 'function') {
                    themeService.acquireFileService(fileService);
                }
                // Signal to lifecycle that services are set
                lifecycleService.phase = 2 /* Ready */;
            });
            return instantationServie;
        }
        initRegistries(accessor) {
            platform_1.Registry.as(actions_1.Extensions.Actionbar).start(accessor);
            platform_1.Registry.as(contributions_1.Extensions.Workbench).start(accessor);
            platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).start(accessor);
        }
        registerListeners(lifecycleService, storageService, configurationService) {
            // Lifecycle
            this._register(lifecycleService.onWillShutdown(event => this._onWillShutdown.fire(event)));
            this._register(lifecycleService.onShutdown(() => {
                this._onShutdown.fire();
                this.dispose();
            }));
            // Storage
            this._register(storageService.onWillSaveState(() => configuration_2.saveFontInfo(storageService)));
            // Configuration changes
            this._register(configurationService.onDidChangeConfiguration(() => this.setFontAliasing(configurationService)));
        }
        setFontAliasing(configurationService) {
            const aliasing = configurationService.getValue(Settings.FONT_ALIASING);
            if (this.fontAliasing === aliasing) {
                return;
            }
            this.fontAliasing = aliasing;
            // Remove all
            const fontAliasingValues = ['antialiased', 'none', 'auto'];
            dom_1.removeClasses(this.workbench, ...fontAliasingValues.map(value => `monaco-font-aliasing-${value}`));
            // Add specific
            if (fontAliasingValues.some(option => option === aliasing)) {
                dom_1.addClass(this.workbench, `monaco-font-aliasing-${aliasing}`);
            }
        }
        renderWorkbench(instantiationService, notificationService, storageService, configurationService) {
            // State specific classes
            const platformClass = platform_2.isWindows ? 'windows' : platform_2.isLinux ? 'linux' : 'mac';
            const workbenchClasses = arrays_1.coalesce([
                'monaco-workbench',
                platformClass,
                this.state.sideBar.hidden ? 'nosidebar' : undefined,
                this.state.panel.hidden ? 'nopanel' : undefined,
                this.state.statusBar.hidden ? 'nostatusbar' : undefined,
                this.state.fullscreen ? 'fullscreen' : undefined
            ]);
            dom_1.addClasses(this.workbench, ...workbenchClasses);
            dom_1.addClasses(document.body, platformClass); // used by our fonts
            // Apply font aliasing
            this.setFontAliasing(configurationService);
            // Warm up font cache information before building up too many dom elements
            configuration_2.restoreFontInfo(storageService);
            configuration_2.readFontInfo(fontInfo_1.BareFontInfo.createFromRawSettings(configurationService.getValue('editor'), browser_1.getZoomLevel()));
            // Create Parts
            [
                { id: "workbench.parts.titlebar" /* TITLEBAR_PART */, role: 'contentinfo', classes: ['titlebar'] },
                { id: "workbench.parts.activitybar" /* ACTIVITYBAR_PART */, role: 'navigation', classes: ['activitybar', this.state.sideBar.position === 0 /* LEFT */ ? 'left' : 'right'] },
                { id: "workbench.parts.sidebar" /* SIDEBAR_PART */, role: 'complementary', classes: ['sidebar', this.state.sideBar.position === 0 /* LEFT */ ? 'left' : 'right'] },
                { id: "workbench.parts.editor" /* EDITOR_PART */, role: 'main', classes: ['editor'], options: { restorePreviousState: this.state.editor.restoreEditors } },
                { id: "workbench.parts.panel" /* PANEL_PART */, role: 'complementary', classes: ['panel', this.state.panel.position === 2 /* BOTTOM */ ? 'bottom' : 'right'] },
                { id: "workbench.parts.statusbar" /* STATUSBAR_PART */, role: 'contentinfo', classes: ['statusbar'] }
            ].forEach(({ id, role, classes, options }) => {
                const partContainer = this.createPart(id, role, classes);
                if (!configurationService.getValue('workbench.useExperimentalGridLayout')) {
                    // TODO@Ben cleanup once moved to grid
                    // Insert all workbench parts at the beginning. Issue #52531
                    // This is primarily for the title bar to allow overriding -webkit-app-region
                    this.workbench.insertBefore(partContainer, this.workbench.lastChild);
                }
                this.getPart(id).create(partContainer, options);
            });
            // Notification Handlers
            this.createNotificationsHandlers(instantiationService, notificationService);
            // Add Workbench to DOM
            this.parent.appendChild(this.workbench);
        }
        createPart(id, role, classes) {
            const part = document.createElement('div');
            dom_1.addClasses(part, 'part', ...classes);
            part.id = id;
            part.setAttribute('role', role);
            return part;
        }
        createNotificationsHandlers(instantiationService, notificationService) {
            // Instantiate Notification components
            const notificationsCenter = this._register(instantiationService.createInstance(notificationsCenter_1.NotificationsCenter, this.workbench, notificationService.model));
            const notificationsToasts = this._register(instantiationService.createInstance(notificationsToasts_1.NotificationsToasts, this.workbench, notificationService.model));
            this._register(instantiationService.createInstance(notificationsAlerts_1.NotificationsAlerts, notificationService.model));
            const notificationsStatus = instantiationService.createInstance(notificationsStatus_1.NotificationsStatus, notificationService.model);
            // Visibility
            this._register(notificationsCenter.onDidChangeVisibility(() => {
                notificationsStatus.update(notificationsCenter.isVisible);
                notificationsToasts.update(notificationsCenter.isVisible);
            }));
            // Register Commands
            notificationsCommands_1.registerNotificationCommands(notificationsCenter, notificationsToasts);
        }
        restoreWorkbench(editorService, editorGroupService, viewletService, panelService, logService, lifecycleService) {
            const restorePromises = [];
            // Restore editors
            performance_1.mark('willRestoreEditors');
            restorePromises.push(editorGroupService.whenRestored.then(() => {
                function openEditors(editors, editorService) {
                    if (editors.length) {
                        return editorService.openEditors(editors);
                    }
                    return Promise.resolve(undefined);
                }
                if (Array.isArray(this.state.editor.editorsToOpen)) {
                    return openEditors(this.state.editor.editorsToOpen, editorService);
                }
                return this.state.editor.editorsToOpen.then(editors => openEditors(editors, editorService));
            }).then(() => performance_1.mark('didRestoreEditors')));
            // Restore Sidebar
            if (this.state.sideBar.viewletToRestore) {
                performance_1.mark('willRestoreViewlet');
                restorePromises.push(viewletService.openViewlet(this.state.sideBar.viewletToRestore)
                    .then(viewlet => {
                    if (!viewlet) {
                        return viewletService.openViewlet(viewletService.getDefaultViewletId()); // fallback to default viewlet as needed
                    }
                    return viewlet;
                })
                    .then(() => performance_1.mark('didRestoreViewlet')));
            }
            // Restore Panel
            if (this.state.panel.panelToRestore) {
                performance_1.mark('willRestorePanel');
                panelService.openPanel(this.state.panel.panelToRestore);
                performance_1.mark('didRestorePanel');
            }
            // Restore Zen Mode
            if (this.state.zenMode.restore) {
                this.toggleZenMode(true, true);
            }
            // Restore Editor Center Mode
            if (this.state.editor.restoreCentered) {
                this.centerEditorLayout(true);
            }
            // Emit a warning after 10s if restore does not complete
            const restoreTimeoutHandle = setTimeout(() => logService.warn('Workbench did not finish loading in 10 seconds, that might be a problem that should be reported.'), 10000);
            return Promise.all(restorePromises)
                .then(() => clearTimeout(restoreTimeoutHandle))
                .catch(error => errors_1.onUnexpectedError(error))
                .finally(() => {
                // Set lifecycle phase to `Restored`
                lifecycleService.phase = 3 /* Restored */;
                // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
                setTimeout(() => {
                    this._register(async_1.runWhenIdle(() => {
                        lifecycleService.phase = 4 /* Eventually */;
                    }, 2500));
                }, 2500);
                // Telemetry: startup metrics
                performance_1.mark('didStartWorkbench');
            });
        }
        get onTitleBarVisibilityChange() { return this._onTitleBarVisibilityChange.event; }
        get onZenModeChange() { return this._onZenMode.event; }
        get onLayout() { return this._onLayout.event; }
        get dimension() { return this._dimension; }
        get container() { return this.workbench; }
        get hasWorkbench() { return true; }
        initLayout(accessor) {
            // Services
            this.environmentService = accessor.get(environment_1.IEnvironmentService);
            this.configurationService = accessor.get(configuration_1.IConfigurationService);
            this.lifecycleService = accessor.get(lifecycle_2.ILifecycleService);
            this.windowService = accessor.get(windows_1.IWindowService);
            this.contextService = accessor.get(workspace_1.IWorkspaceContextService);
            this.storageService = accessor.get(storage_1.IStorageService);
            // Parts
            this.editorService = accessor.get(editorService_1.IEditorService);
            this.editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            this.panelService = accessor.get(panelService_1.IPanelService);
            this.viewletService = accessor.get(viewlet_1.IViewletService);
            this.titleService = accessor.get(titleService_1.ITitleService);
            accessor.get(statusbar_1.IStatusbarService); // not used, but called to ensure instantiated
            accessor.get(activityBarService_1.IActivityBarService); // not used, but called to ensure instantiated
            // Listeners
            this.registerLayoutListeners();
            // State
            this.initLayoutState(accessor.get(lifecycle_2.ILifecycleService));
        }
        registerLayoutListeners() {
            // Storage
            this._register(this.storageService.onWillSaveState(e => this.saveLayoutState(e)));
            // Restore editor if hidden and it changes
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.setEditorHidden(false)));
            this._register(this.editorGroupService.onDidActivateGroup(() => this.setEditorHidden(false)));
            // Configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(() => this.doUpdateLayoutConfiguration()));
            // Fullscreen changes
            this._register(browser_1.onDidChangeFullscreen(() => this.onFullscreenChanged()));
            // Group changes
            this._register(this.editorGroupService.onDidAddGroup(() => this.centerEditorLayout(this.state.editor.centered)));
            this._register(this.editorGroupService.onDidRemoveGroup(() => this.centerEditorLayout(this.state.editor.centered)));
            // Prevent workbench from scrolling #55456
            this._register(dom_1.addDisposableListener(this.workbench, dom_1.EventType.SCROLL, () => this.workbench.scrollTop = 0));
            // Menubar visibility changes
            if ((platform_2.isWindows || platform_2.isLinux) && windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom') {
                this._register(this.titleService.onMenubarVisibilityChange(visible => this.onMenubarToggled(visible)));
            }
        }
        onMenubarToggled(visible) {
            if (visible !== this.state.menuBar.toggled) {
                this.state.menuBar.toggled = visible;
                if (this.state.fullscreen && (this.state.menuBar.visibility === 'toggle' || this.state.menuBar.visibility === 'default')) {
                    this._onTitleBarVisibilityChange.fire();
                    this.layout();
                }
            }
        }
        onFullscreenChanged() {
            this.state.fullscreen = browser_1.isFullscreen();
            // Apply as CSS class
            if (this.state.fullscreen) {
                dom_1.addClass(this.workbench, 'fullscreen');
            }
            else {
                dom_1.removeClass(this.workbench, 'fullscreen');
                if (this.state.zenMode.transitionedToFullScreen && this.state.zenMode.active) {
                    this.toggleZenMode();
                }
            }
            // Changing fullscreen state of the window has an impact on custom title bar visibility, so we need to update
            if (windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom') {
                this._onTitleBarVisibilityChange.fire();
                this.layout(); // handle title bar when fullscreen changes
            }
        }
        doUpdateLayoutConfiguration(skipLayout) {
            // Sidebar position
            const newSidebarPositionValue = this.configurationService.getValue(Settings.SIDEBAR_POSITION);
            const newSidebarPosition = (newSidebarPositionValue === 'right') ? 1 /* RIGHT */ : 0 /* LEFT */;
            if (newSidebarPosition !== this.getSideBarPosition()) {
                this.setSideBarPosition(newSidebarPosition);
            }
            // Panel position
            this.updatePanelPosition();
            if (!this.state.zenMode.active) {
                // Statusbar visibility
                const newStatusbarHiddenValue = !this.configurationService.getValue(Settings.STATUSBAR_VISIBLE);
                if (newStatusbarHiddenValue !== this.state.statusBar.hidden) {
                    this.setStatusBarHidden(newStatusbarHiddenValue, skipLayout);
                }
                // Activitybar visibility
                const newActivityBarHiddenValue = !this.configurationService.getValue(Settings.ACTIVITYBAR_VISIBLE);
                if (newActivityBarHiddenValue !== this.state.activityBar.hidden) {
                    this.setActivityBarHidden(newActivityBarHiddenValue, skipLayout);
                }
            }
            // Menubar visibility
            const newMenubarVisibility = this.configurationService.getValue(Settings.MENUBAR_VISIBLE);
            this.setMenubarVisibility(newMenubarVisibility, !!skipLayout);
        }
        setSideBarPosition(position) {
            const activityBar = this.getPart("workbench.parts.activitybar" /* ACTIVITYBAR_PART */);
            const sideBar = this.getPart("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const wasHidden = this.state.sideBar.hidden;
            if (this.state.sideBar.hidden) {
                this.setSideBarHidden(false, true /* Skip Layout */);
            }
            const newPositionValue = (position === 0 /* LEFT */) ? 'left' : 'right';
            const oldPositionValue = (this.state.sideBar.position === 0 /* LEFT */) ? 'left' : 'right';
            this.state.sideBar.position = position;
            // Adjust CSS
            dom_1.removeClass(activityBar.getContainer(), oldPositionValue);
            dom_1.removeClass(sideBar.getContainer(), oldPositionValue);
            dom_1.addClass(activityBar.getContainer(), newPositionValue);
            dom_1.addClass(sideBar.getContainer(), newPositionValue);
            // Update Styles
            activityBar.updateStyles();
            sideBar.updateStyles();
            // Layout
            if (this.workbenchGrid instanceof grid_1.Grid) {
                if (!wasHidden) {
                    this.state.sideBar.width = this.workbenchGrid.getViewSize(this.sideBarPartView);
                }
                this.workbenchGrid.removeView(this.sideBarPartView);
                this.workbenchGrid.removeView(this.activityBarPartView);
                if (!this.state.panel.hidden && this.state.panel.position === 2 /* BOTTOM */) {
                    this.workbenchGrid.removeView(this.panelPartView);
                }
                this.layout();
            }
            else {
                this.workbenchGrid.layout();
            }
        }
        initLayoutState(lifecycleService) {
            // Fullscreen
            this.state.fullscreen = browser_1.isFullscreen();
            // Menubar visibility
            this.state.menuBar.visibility = this.configurationService.getValue(Settings.MENUBAR_VISIBLE);
            // Activity bar visibility
            this.state.activityBar.hidden = !this.configurationService.getValue(Settings.ACTIVITYBAR_VISIBLE);
            // Sidebar visibility
            this.state.sideBar.hidden = this.storageService.getBoolean(Storage.SIDEBAR_HIDDEN, 1 /* WORKSPACE */, this.contextService.getWorkbenchState() === 1 /* EMPTY */);
            // Sidebar position
            this.state.sideBar.position = (this.configurationService.getValue(Settings.SIDEBAR_POSITION) === 'right') ? 1 /* RIGHT */ : 0 /* LEFT */;
            // Sidebar viewlet
            if (!this.state.sideBar.hidden) {
                // Only restore last viewlet if window was reloaded or we are in development mode
                let viewletToRestore;
                if (!this.environmentService.isBuilt || lifecycleService.startupKind === 3 /* ReloadedWindow */) {
                    viewletToRestore = this.storageService.get(sidebarPart_1.SidebarPart.activeViewletSettingsKey, 1 /* WORKSPACE */, this.viewletService.getDefaultViewletId());
                }
                else {
                    viewletToRestore = this.viewletService.getDefaultViewletId();
                }
                if (viewletToRestore) {
                    this.state.sideBar.viewletToRestore = viewletToRestore;
                }
                else {
                    this.state.sideBar.hidden = true; // we hide sidebar if there is no viewlet to restore
                }
            }
            // Editor centered layout
            this.state.editor.restoreCentered = this.storageService.getBoolean(Storage.CENTERED_LAYOUT_ENABLED, 1 /* WORKSPACE */, false);
            // Editors to open
            this.state.editor.editorsToOpen = this.resolveEditorsToOpen();
            // Panel visibility
            this.state.panel.hidden = this.storageService.getBoolean(Storage.PANEL_HIDDEN, 1 /* WORKSPACE */, true);
            // Panel position
            this.updatePanelPosition();
            // Panel to restore
            if (!this.state.panel.hidden) {
                const panelRegistry = platform_1.Registry.as(panel_1.Extensions.Panels);
                let panelToRestore = this.storageService.get(panelPart_1.PanelPart.activePanelSettingsKey, 1 /* WORKSPACE */, panelRegistry.getDefaultPanelId());
                if (!panelRegistry.hasPanel(panelToRestore)) {
                    panelToRestore = panelRegistry.getDefaultPanelId(); // fallback to default if panel is unknown
                }
                if (panelToRestore) {
                    this.state.panel.panelToRestore = panelToRestore;
                }
                else {
                    this.state.panel.hidden = true; // we hide panel if there is no panel to restore
                }
            }
            // Statusbar visibility
            this.state.statusBar.hidden = !this.configurationService.getValue(Settings.STATUSBAR_VISIBLE);
            // Zen mode enablement
            this.state.zenMode.restore = this.storageService.getBoolean(Storage.ZEN_MODE_ENABLED, 1 /* WORKSPACE */, false) && this.configurationService.getValue(Settings.ZEN_MODE_RESTORE);
        }
        resolveEditorsToOpen() {
            const configuration = this.windowService.getConfiguration();
            const hasInitialFilesToOpen = this.hasInitialFilesToOpen();
            // Only restore editors if we are not instructed to open files initially
            this.state.editor.restoreEditors = !hasInitialFilesToOpen;
            // Files to open, diff or create
            if (hasInitialFilesToOpen) {
                // Files to diff is exclusive
                const filesToDiff = this.toInputs(configuration.filesToDiff, false);
                if (filesToDiff && filesToDiff.length === 2) {
                    return [{
                            leftResource: filesToDiff[0].resource,
                            rightResource: filesToDiff[1].resource,
                            options: { pinned: true },
                            forceFile: true
                        }];
                }
                const filesToCreate = this.toInputs(configuration.filesToCreate, true);
                const filesToOpen = this.toInputs(configuration.filesToOpen, false);
                // Otherwise: Open/Create files
                return [...filesToOpen, ...filesToCreate];
            }
            // Empty workbench
            else if (this.contextService.getWorkbenchState() === 1 /* EMPTY */ && this.configurationService.inspect('workbench.startupEditor').value === 'newUntitledFile') {
                const isEmpty = this.editorGroupService.count === 1 && this.editorGroupService.activeGroup.count === 0;
                if (!isEmpty) {
                    return []; // do not open any empty untitled file if we restored editors from previous session
                }
                return this.backupFileService.hasBackups().then(hasBackups => {
                    if (hasBackups) {
                        return []; // do not open any empty untitled file if we have backups to restore
                    }
                    return [{}];
                });
            }
            return [];
        }
        hasInitialFilesToOpen() {
            const configuration = this.windowService.getConfiguration();
            return !!((configuration.filesToCreate && configuration.filesToCreate.length > 0) ||
                (configuration.filesToOpen && configuration.filesToOpen.length > 0) ||
                (configuration.filesToDiff && configuration.filesToDiff.length > 0));
        }
        toInputs(paths, isNew) {
            if (!paths || !paths.length) {
                return [];
            }
            return arrays_1.coalesce(paths.map(p => {
                const resource = p.fileUri;
                if (!resource) {
                    return undefined;
                }
                let input;
                if (isNew) {
                    input = { filePath: resource.fsPath, options: { pinned: true } };
                }
                else {
                    input = { resource, options: { pinned: true }, forceFile: true };
                }
                if (!isNew && typeof p.lineNumber === 'number') {
                    input.options.selection = {
                        startLineNumber: p.lineNumber,
                        startColumn: p.columnNumber || 1
                    };
                }
                return input;
            }));
        }
        updatePanelPosition() {
            const defaultPanelPosition = this.configurationService.getValue(Settings.PANEL_POSITION);
            const panelPosition = this.storageService.get(Storage.PANEL_POSITION, 1 /* WORKSPACE */, defaultPanelPosition);
            this.state.panel.position = (panelPosition === 'right') ? 1 /* RIGHT */ : 2 /* BOTTOM */;
        }
        registerPart(part) {
            this.parts.set(part.getId(), part);
        }
        isRestored() {
            return this.lifecycleService.phase >= 3 /* Restored */;
        }
        hasFocus(part) {
            const activeElement = document.activeElement;
            if (!activeElement) {
                return false;
            }
            const container = this.getContainer(part);
            return dom_1.isAncestor(activeElement, container);
        }
        getContainer(part) {
            switch (part) {
                case "workbench.parts.titlebar" /* TITLEBAR_PART */:
                    return this.getPart("workbench.parts.titlebar" /* TITLEBAR_PART */).getContainer();
                case "workbench.parts.activitybar" /* ACTIVITYBAR_PART */:
                    return this.getPart("workbench.parts.activitybar" /* ACTIVITYBAR_PART */).getContainer();
                case "workbench.parts.sidebar" /* SIDEBAR_PART */:
                    return this.getPart("workbench.parts.sidebar" /* SIDEBAR_PART */).getContainer();
                case "workbench.parts.panel" /* PANEL_PART */:
                    return this.getPart("workbench.parts.panel" /* PANEL_PART */).getContainer();
                case "workbench.parts.editor" /* EDITOR_PART */:
                    return this.getPart("workbench.parts.editor" /* EDITOR_PART */).getContainer();
                case "workbench.parts.statusbar" /* STATUSBAR_PART */:
                    return this.getPart("workbench.parts.statusbar" /* STATUSBAR_PART */).getContainer();
            }
            return null;
        }
        isVisible(part) {
            switch (part) {
                case "workbench.parts.titlebar" /* TITLEBAR_PART */:
                    if (windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'native') {
                        return false;
                    }
                    else if (!this.state.fullscreen) {
                        return true;
                    }
                    else if (platform_2.isMacintosh) {
                        return false;
                    }
                    else if (this.state.menuBar.visibility === 'visible') {
                        return true;
                    }
                    else if (this.state.menuBar.visibility === 'toggle' || this.state.menuBar.visibility === 'default') {
                        return this.state.menuBar.toggled;
                    }
                    return false;
                case "workbench.parts.sidebar" /* SIDEBAR_PART */:
                    return !this.state.sideBar.hidden;
                case "workbench.parts.panel" /* PANEL_PART */:
                    return !this.state.panel.hidden;
                case "workbench.parts.statusbar" /* STATUSBAR_PART */:
                    return !this.state.statusBar.hidden;
                case "workbench.parts.activitybar" /* ACTIVITYBAR_PART */:
                    return !this.state.activityBar.hidden;
                case "workbench.parts.editor" /* EDITOR_PART */:
                    return this.workbenchGrid instanceof grid_1.Grid ? !this.state.editor.hidden : true;
            }
            return true; // any other part cannot be hidden
        }
        getTitleBarOffset() {
            let offset = 0;
            if (this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)) {
                if (this.workbenchGrid instanceof grid_1.Grid) {
                    offset = this.getPart("workbench.parts.titlebar" /* TITLEBAR_PART */).maximumHeight;
                }
                else {
                    offset = this.workbenchGrid.partLayoutInfo.titlebar.height;
                    if (platform_2.isMacintosh || this.state.menuBar.visibility === 'hidden') {
                        offset /= browser_1.getZoomFactor();
                    }
                }
            }
            return offset;
        }
        getWorkbenchElement() {
            return this.workbench;
        }
        toggleZenMode(skipLayout, restoring = false) {
            this.state.zenMode.active = !this.state.zenMode.active;
            this.state.zenMode.transitionDisposeables = lifecycle_1.dispose(this.state.zenMode.transitionDisposeables);
            const setLineNumbers = (lineNumbers) => this.editorService.visibleTextEditorWidgets.forEach(editor => editor.updateOptions({ lineNumbers }));
            // Check if zen mode transitioned to full screen and if now we are out of zen mode
            // -> we need to go out of full screen (same goes for the centered editor layout)
            let toggleFullScreen = false;
            // Zen Mode Active
            if (this.state.zenMode.active) {
                const config = this.configurationService.getValue('zenMode');
                toggleFullScreen = !this.state.fullscreen && config.fullScreen;
                this.state.zenMode.transitionedToFullScreen = restoring ? config.fullScreen : toggleFullScreen;
                this.state.zenMode.transitionedToCenteredEditorLayout = !this.isEditorLayoutCentered() && config.centerLayout;
                this.state.zenMode.wasSideBarVisible = this.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
                this.state.zenMode.wasPanelVisible = this.isVisible("workbench.parts.panel" /* PANEL_PART */);
                this.setPanelHidden(true, true);
                this.setSideBarHidden(true, true);
                if (config.hideActivityBar) {
                    this.setActivityBarHidden(true, true);
                }
                if (config.hideStatusBar) {
                    this.setStatusBarHidden(true, true);
                }
                if (config.hideLineNumbers) {
                    setLineNumbers('off');
                    this.state.zenMode.transitionDisposeables.push(this.editorService.onDidVisibleEditorsChange(() => setLineNumbers('off')));
                }
                if (config.hideTabs && this.editorGroupService.partOptions.showTabs) {
                    this.state.zenMode.transitionDisposeables.push(this.editorGroupService.enforcePartOptions({ showTabs: false }));
                }
                if (config.centerLayout) {
                    this.centerEditorLayout(true, true);
                }
            }
            // Zen Mode Inactive
            else {
                if (this.state.zenMode.wasPanelVisible) {
                    this.setPanelHidden(false, true);
                }
                if (this.state.zenMode.wasSideBarVisible) {
                    this.setSideBarHidden(false, true);
                }
                if (this.state.zenMode.transitionedToCenteredEditorLayout) {
                    this.centerEditorLayout(false, true);
                }
                setLineNumbers(this.configurationService.getValue('editor.lineNumbers'));
                // Status bar and activity bar visibility come from settings -> update their visibility.
                this.doUpdateLayoutConfiguration(true);
                this.editorGroupService.activeGroup.focus();
                toggleFullScreen = this.state.zenMode.transitionedToFullScreen && this.state.fullscreen;
            }
            if (!skipLayout) {
                this.layout();
            }
            if (toggleFullScreen) {
                this.windowService.toggleFullScreen();
            }
            // Event
            this._onZenMode.fire(this.state.zenMode.active);
        }
        setStatusBarHidden(hidden, skipLayout) {
            this.state.statusBar.hidden = hidden;
            // Adjust CSS
            if (hidden) {
                dom_1.addClass(this.workbench, 'nostatusbar');
            }
            else {
                dom_1.removeClass(this.workbench, 'nostatusbar');
            }
            // Layout
            if (!skipLayout) {
                if (this.workbenchGrid instanceof grid_1.Grid) {
                    this.layout();
                }
                else {
                    this.workbenchGrid.layout();
                }
            }
        }
        createWorkbenchLayout(instantiationService) {
            const titleBar = this.getPart("workbench.parts.titlebar" /* TITLEBAR_PART */);
            const editorPart = this.getPart("workbench.parts.editor" /* EDITOR_PART */);
            const activityBar = this.getPart("workbench.parts.activitybar" /* ACTIVITYBAR_PART */);
            const panelPart = this.getPart("workbench.parts.panel" /* PANEL_PART */);
            const sideBar = this.getPart("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const statusBar = this.getPart("workbench.parts.statusbar" /* STATUSBAR_PART */);
            if (this.configurationService.getValue('workbench.useExperimentalGridLayout')) {
                // Create view wrappers for all parts
                this.titleBarPartView = new grid_1.View(titleBar);
                this.sideBarPartView = new grid_1.View(sideBar);
                this.activityBarPartView = new grid_1.View(activityBar);
                this.editorPartView = new grid_1.View(editorPart);
                this.panelPartView = new grid_1.View(panelPart);
                this.statusBarPartView = new grid_1.View(statusBar);
                this.workbenchGrid = new grid_1.Grid(this.editorPartView, { proportionalLayout: false });
                this.workbench.prepend(this.workbenchGrid.element);
            }
            else {
                this.workbenchGrid = instantiationService.createInstance(legacyLayout_1.WorkbenchLegacyLayout, this.parent, this.workbench, {
                    titlebar: titleBar,
                    activitybar: activityBar,
                    editor: editorPart,
                    sidebar: sideBar,
                    panel: panelPart,
                    statusbar: statusBar,
                });
            }
        }
        layout(options) {
            if (!this.disposed) {
                this._dimension = dom_1.getClientArea(this.parent);
                if (this.workbenchGrid instanceof grid_1.Grid) {
                    dom_1.position(this.workbench, 0, 0, 0, 0, 'relative');
                    dom_1.size(this.workbench, this._dimension.width, this._dimension.height);
                    // Layout the grid widget
                    this.workbenchGrid.layout(this._dimension.width, this._dimension.height);
                    // Layout grid views
                    this.layoutGrid();
                }
                else {
                    this.workbenchGrid.layout(options);
                }
                // Emit as event
                this._onLayout.fire(this._dimension);
            }
        }
        layoutGrid() {
            if (!(this.workbenchGrid instanceof grid_1.Grid)) {
                return;
            }
            let panelInGrid = this.workbenchGrid.hasView(this.panelPartView);
            let sidebarInGrid = this.workbenchGrid.hasView(this.sideBarPartView);
            let activityBarInGrid = this.workbenchGrid.hasView(this.activityBarPartView);
            let statusBarInGrid = this.workbenchGrid.hasView(this.statusBarPartView);
            let titlebarInGrid = this.workbenchGrid.hasView(this.titleBarPartView);
            // Add parts to grid
            if (!statusBarInGrid) {
                this.workbenchGrid.addView(this.statusBarPartView, "split" /* Split */, this.editorPartView, 1 /* Down */);
                statusBarInGrid = true;
            }
            if (!titlebarInGrid && windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom') {
                this.workbenchGrid.addView(this.titleBarPartView, "split" /* Split */, this.editorPartView, 0 /* Up */);
                titlebarInGrid = true;
            }
            if (!activityBarInGrid) {
                this.workbenchGrid.addView(this.activityBarPartView, "split" /* Split */, panelInGrid && this.state.sideBar.position === this.state.panel.position ? this.panelPartView : this.editorPartView, this.state.sideBar.position === 1 /* RIGHT */ ? 3 /* Right */ : 2 /* Left */);
                activityBarInGrid = true;
            }
            if (!sidebarInGrid) {
                this.workbenchGrid.addView(this.sideBarPartView, this.state.sideBar.width !== undefined ? this.state.sideBar.width : "split" /* Split */, this.activityBarPartView, this.state.sideBar.position === 0 /* LEFT */ ? 3 /* Right */ : 2 /* Left */);
                sidebarInGrid = true;
            }
            if (!panelInGrid) {
                this.workbenchGrid.addView(this.panelPartView, this.getPanelDimension(this.state.panel.position) !== undefined ? this.getPanelDimension(this.state.panel.position) : "split" /* Split */, this.editorPartView, this.state.panel.position === 2 /* BOTTOM */ ? 1 /* Down */ : 3 /* Right */);
                panelInGrid = true;
            }
            // Hide parts
            if (this.state.panel.hidden) {
                this.panelPartView.hide();
            }
            if (this.state.statusBar.hidden) {
                this.statusBarPartView.hide();
            }
            if (!this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)) {
                this.titleBarPartView.hide();
            }
            if (this.state.activityBar.hidden) {
                this.activityBarPartView.hide();
            }
            if (this.state.sideBar.hidden) {
                this.sideBarPartView.hide();
            }
            if (this.state.editor.hidden) {
                this.editorPartView.hide();
            }
            // Show visible parts
            if (!this.state.editor.hidden) {
                this.editorPartView.show();
            }
            if (!this.state.statusBar.hidden) {
                this.statusBarPartView.show();
            }
            if (this.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)) {
                this.titleBarPartView.show();
            }
            if (!this.state.activityBar.hidden) {
                this.activityBarPartView.show();
            }
            if (!this.state.sideBar.hidden) {
                this.sideBarPartView.show();
            }
            if (!this.state.panel.hidden) {
                this.panelPartView.show();
            }
        }
        getPanelDimension(position) {
            return position === 2 /* BOTTOM */ ? this.state.panel.height : this.state.panel.width;
        }
        isEditorLayoutCentered() {
            return this.state.editor.centered;
        }
        centerEditorLayout(active, skipLayout) {
            this.state.editor.centered = active;
            this.storageService.store(Storage.CENTERED_LAYOUT_ENABLED, active, 1 /* WORKSPACE */);
            let smartActive = active;
            if (this.editorGroupService.groups.length > 1 && this.configurationService.getValue('workbench.editor.centeredLayoutAutoResize')) {
                smartActive = false; // Respect the auto resize setting - do not go into centered layout if there is more than 1 group.
            }
            // Enter Centered Editor Layout
            if (this.editorGroupService.isLayoutCentered() !== smartActive) {
                this.editorGroupService.centerLayout(smartActive);
                if (!skipLayout) {
                    this.layout();
                }
            }
        }
        resizePart(part, sizeChange) {
            let view;
            switch (part) {
                case "workbench.parts.sidebar" /* SIDEBAR_PART */:
                    view = this.sideBarPartView;
                case "workbench.parts.panel" /* PANEL_PART */:
                    view = this.panelPartView;
                case "workbench.parts.editor" /* EDITOR_PART */:
                    view = this.editorPartView;
                    if (this.workbenchGrid instanceof grid_1.Grid) {
                        this.workbenchGrid.resizeView(view, this.workbenchGrid.getViewSize(view) + sizeChange);
                    }
                    else {
                        this.workbenchGrid.resizePart(part, sizeChange);
                    }
                    break;
                default:
                    return; // Cannot resize other parts
            }
        }
        setActivityBarHidden(hidden, skipLayout) {
            this.state.activityBar.hidden = hidden;
            // Layout
            if (!skipLayout) {
                if (this.workbenchGrid instanceof grid_1.Grid) {
                    this.layout();
                }
                else {
                    this.workbenchGrid.layout();
                }
            }
        }
        setEditorHidden(hidden, skipLayout) {
            if (!(this.workbenchGrid instanceof grid_1.Grid) || hidden === this.state.editor.hidden) {
                return;
            }
            this.state.editor.hidden = hidden;
            // The editor and the panel cannot be hidden at the same time
            if (this.state.editor.hidden && this.state.panel.hidden) {
                this.setPanelHidden(false, true);
            }
            if (!skipLayout) {
                this.layout();
            }
        }
        setSideBarHidden(hidden, skipLayout) {
            this.state.sideBar.hidden = hidden;
            // Adjust CSS
            if (hidden) {
                dom_1.addClass(this.workbench, 'nosidebar');
            }
            else {
                dom_1.removeClass(this.workbench, 'nosidebar');
            }
            // If sidebar becomes hidden, also hide the current active Viewlet if any
            if (hidden && this.viewletService.getActiveViewlet()) {
                this.viewletService.hideActiveViewlet();
                // Pass Focus to Editor or Panel if Sidebar is now hidden
                const activePanel = this.panelService.getActivePanel();
                if (this.hasFocus("workbench.parts.panel" /* PANEL_PART */) && activePanel) {
                    activePanel.focus();
                }
                else {
                    this.editorGroupService.activeGroup.focus();
                }
            }
            // If sidebar becomes visible, show last active Viewlet or default viewlet
            else if (!hidden && !this.viewletService.getActiveViewlet()) {
                const viewletToOpen = this.viewletService.getLastActiveViewletId();
                if (viewletToOpen) {
                    const viewlet = this.viewletService.openViewlet(viewletToOpen, true);
                    if (!viewlet) {
                        this.viewletService.openViewlet(this.viewletService.getDefaultViewletId(), true);
                    }
                }
            }
            // Remember in settings
            const defaultHidden = this.contextService.getWorkbenchState() === 1 /* EMPTY */;
            if (hidden !== defaultHidden) {
                this.storageService.store(Storage.SIDEBAR_HIDDEN, hidden ? 'true' : 'false', 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(Storage.SIDEBAR_HIDDEN, 1 /* WORKSPACE */);
            }
            // Layout
            if (!skipLayout) {
                if (this.workbenchGrid instanceof grid_1.Grid) {
                    this.layout();
                }
                else {
                    this.workbenchGrid.layout();
                }
            }
        }
        setPanelHidden(hidden, skipLayout) {
            this.state.panel.hidden = hidden;
            // Adjust CSS
            if (hidden) {
                dom_1.addClass(this.workbench, 'nopanel');
            }
            else {
                dom_1.removeClass(this.workbench, 'nopanel');
            }
            // If panel part becomes hidden, also hide the current active panel if any
            if (hidden && this.panelService.getActivePanel()) {
                this.panelService.hideActivePanel();
                this.editorGroupService.activeGroup.focus(); // Pass focus to editor group if panel part is now hidden
            }
            // If panel part becomes visible, show last active panel or default panel
            else if (!hidden && !this.panelService.getActivePanel()) {
                const panelToOpen = this.panelService.getLastActivePanelId();
                if (panelToOpen) {
                    const focus = !skipLayout;
                    this.panelService.openPanel(panelToOpen, focus);
                }
            }
            // Remember in settings
            if (!hidden) {
                this.storageService.store(Storage.PANEL_HIDDEN, 'false', 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(Storage.PANEL_HIDDEN, 1 /* WORKSPACE */);
            }
            // The editor and panel cannot be hidden at the same time
            if (hidden && this.state.editor.hidden) {
                this.setEditorHidden(false, true);
            }
            // Layout
            if (!skipLayout) {
                if (this.workbenchGrid instanceof grid_1.Grid) {
                    this.layout();
                }
                else {
                    this.workbenchGrid.layout();
                }
            }
        }
        toggleMaximizedPanel() {
            if (this.workbenchGrid instanceof grid_1.Grid) {
                this.workbenchGrid.maximizeViewSize(this.panelPartView);
            }
            else {
                this.workbenchGrid.layout({ toggleMaximizedPanel: true, source: "workbench.parts.panel" /* PANEL_PART */ });
            }
        }
        isPanelMaximized() {
            if (this.workbenchGrid instanceof grid_1.Grid) {
                try {
                    return this.workbenchGrid.getViewSize2(this.panelPartView).height === this.getPart("workbench.parts.panel" /* PANEL_PART */).maximumHeight;
                }
                catch (e) {
                    return false;
                }
            }
            else {
                return this.workbenchGrid.isPanelMaximized();
            }
        }
        getSideBarPosition() {
            return this.state.sideBar.position;
        }
        setMenubarVisibility(visibility, skipLayout) {
            if (this.state.menuBar.visibility !== visibility) {
                this.state.menuBar.visibility = visibility;
                // Layout
                if (!skipLayout) {
                    if (this.workbenchGrid instanceof grid_1.Grid) {
                        const dimensions = dom_1.getClientArea(this.parent);
                        this.workbenchGrid.layout(dimensions.width, dimensions.height);
                    }
                    else {
                        this.workbenchGrid.layout();
                    }
                }
            }
        }
        getMenubarVisibility() {
            return this.state.menuBar.visibility;
        }
        getPanelPosition() {
            return this.state.panel.position;
        }
        setPanelPosition(position) {
            const panelPart = this.getPart("workbench.parts.panel" /* PANEL_PART */);
            const wasHidden = this.state.panel.hidden;
            if (this.state.panel.hidden) {
                this.setPanelHidden(false, true /* Skip Layout */);
            }
            else {
                this.savePanelDimension();
            }
            const newPositionValue = (position === 2 /* BOTTOM */) ? 'bottom' : 'right';
            const oldPositionValue = (this.state.panel.position === 2 /* BOTTOM */) ? 'bottom' : 'right';
            this.state.panel.position = position;
            function positionToString(position) {
                switch (position) {
                    case 0 /* LEFT */: return 'left';
                    case 1 /* RIGHT */: return 'right';
                    case 2 /* BOTTOM */: return 'bottom';
                }
            }
            this.storageService.store(Storage.PANEL_POSITION, positionToString(this.state.panel.position), 1 /* WORKSPACE */);
            // Adjust CSS
            dom_1.removeClass(panelPart.getContainer(), oldPositionValue);
            dom_1.addClass(panelPart.getContainer(), newPositionValue);
            // Update Styles
            panelPart.updateStyles();
            // Layout
            if (this.workbenchGrid instanceof grid_1.Grid) {
                if (!wasHidden) {
                    this.savePanelDimension();
                }
                this.workbenchGrid.removeView(this.panelPartView);
                this.layout();
            }
            else {
                this.workbenchGrid.layout();
            }
        }
        savePanelDimension() {
            if (!(this.workbenchGrid instanceof grid_1.Grid)) {
                return;
            }
            if (this.state.panel.position === 2 /* BOTTOM */) {
                this.state.panel.height = this.workbenchGrid.getViewSize(this.panelPartView);
            }
            else {
                this.state.panel.width = this.workbenchGrid.getViewSize(this.panelPartView);
            }
        }
        saveLayoutState(e) {
            // Zen Mode
            if (this.state.zenMode.active) {
                this.storageService.store(Storage.ZEN_MODE_ENABLED, true, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(Storage.ZEN_MODE_ENABLED, 1 /* WORKSPACE */);
            }
            if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN && this.state.zenMode.active) {
                if (!this.configurationService.getValue(Settings.ZEN_MODE_RESTORE)) {
                    this.toggleZenMode(true); // We will not restore zen mode, need to clear all zen mode state changes
                }
            }
        }
        getPart(key) {
            const part = this.parts.get(key);
            if (!part) {
                throw new Error('unknown part');
            }
            return part;
        }
        dispose() {
            super.dispose();
            this.disposed = true;
        }
    }
    exports.Workbench = Workbench;
});
//# sourceMappingURL=workbench.js.map