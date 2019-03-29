/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/event", "vs/base/common/errors", "vs/base/browser/ui/toolbar/toolbar", "vs/base/browser/ui/progressbar/progressbar", "vs/workbench/browser/actions", "vs/workbench/browser/part", "vs/workbench/services/progress/browser/progressService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/progress/common/progress", "vs/platform/theme/common/styler", "vs/base/browser/dom", "vs/base/common/types", "vs/css!./media/compositepart"], function (require, exports, nls, idGenerator_1, lifecycle_1, strings, event_1, errors, toolbar_1, progressbar_1, actions_1, part_1, progressService_1, serviceCollection_1, progress_1, styler_1, dom_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CompositePart extends part_1.Part {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, registry, activeCompositeSettingsKey, defaultCompositeId, nameForTelemetry, compositeCSSClass, titleForegroundColor, id, options) {
            super(id, options, themeService, storageService, layoutService);
            this.notificationService = notificationService;
            this.storageService = storageService;
            this.telemetryService = telemetryService;
            this.contextMenuService = contextMenuService;
            this.layoutService = layoutService;
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            this.registry = registry;
            this.activeCompositeSettingsKey = activeCompositeSettingsKey;
            this.defaultCompositeId = defaultCompositeId;
            this.nameForTelemetry = nameForTelemetry;
            this.compositeCSSClass = compositeCSSClass;
            this.titleForegroundColor = titleForegroundColor;
            this.onDidCompositeOpen = this._register(new event_1.Emitter());
            this.onDidCompositeClose = this._register(new event_1.Emitter());
            this.mapCompositeToCompositeContainer = {};
            this.mapActionsBindingToComposite = {};
            this.activeComposite = null;
            this.instantiatedCompositeItems = new Map();
            this.lastActiveCompositeId = storageService.get(activeCompositeSettingsKey, 1 /* WORKSPACE */, this.defaultCompositeId);
        }
        openComposite(id, focus) {
            // Check if composite already visible and just focus in that case
            if (this.activeComposite && this.activeComposite.getId() === id) {
                if (focus) {
                    this.activeComposite.focus();
                }
                // Fullfill promise with composite that is being opened
                return this.activeComposite;
            }
            // Open
            return this.doOpenComposite(id, focus);
        }
        doOpenComposite(id, focus = false) {
            // Use a generated token to avoid race conditions from long running promises
            const currentCompositeOpenToken = idGenerator_1.defaultGenerator.nextId();
            this.currentCompositeOpenToken = currentCompositeOpenToken;
            // Hide current
            if (this.activeComposite) {
                this.hideActiveComposite();
            }
            // Update Title
            this.updateTitle(id);
            // Create composite
            const composite = this.createComposite(id, true);
            // Check if another composite opened meanwhile and return in that case
            if ((this.currentCompositeOpenToken !== currentCompositeOpenToken) || (this.activeComposite && this.activeComposite.getId() !== composite.getId())) {
                return undefined;
            }
            // Check if composite already visible and just focus in that case
            if (this.activeComposite && this.activeComposite.getId() === composite.getId()) {
                if (focus) {
                    composite.focus();
                }
                this.onDidCompositeOpen.fire({ composite, focus });
                return composite;
            }
            // Show Composite and Focus
            this.showComposite(composite);
            if (focus) {
                composite.focus();
            }
            // Return with the composite that is being opened
            if (composite) {
                this.onDidCompositeOpen.fire({ composite, focus });
            }
            return composite;
        }
        createComposite(id, isActive) {
            // Check if composite is already created
            const compositeItem = this.instantiatedCompositeItems.get(id);
            if (compositeItem) {
                return compositeItem.composite;
            }
            // Instantiate composite from registry otherwise
            const compositeDescriptor = this.registry.getComposite(id);
            if (compositeDescriptor) {
                const progressService = this.instantiationService.createInstance(progressService_1.ScopedProgressService, this.progressBar, compositeDescriptor.id, isActive);
                const compositeInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([progress_1.IProgressService, progressService]));
                const composite = compositeDescriptor.instantiate(compositeInstantiationService);
                const disposables = [];
                // Remember as Instantiated
                this.instantiatedCompositeItems.set(id, { composite, disposable: lifecycle_1.toDisposable(() => lifecycle_1.dispose(disposables)), progressService });
                // Register to title area update events from the composite
                composite.onTitleAreaUpdate(() => this.onTitleAreaUpdate(composite.getId()), this, disposables);
                return composite;
            }
            throw new Error(`Unable to find composite with id ${id}`);
        }
        showComposite(composite) {
            // Remember Composite
            this.activeComposite = composite;
            // Store in preferences
            const id = this.activeComposite.getId();
            if (id !== this.defaultCompositeId) {
                this.storageService.store(this.activeCompositeSettingsKey, id, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(this.activeCompositeSettingsKey, 1 /* WORKSPACE */);
            }
            // Remember
            this.lastActiveCompositeId = this.activeComposite.getId();
            // Composites created for the first time
            let compositeContainer = this.mapCompositeToCompositeContainer[composite.getId()];
            if (!compositeContainer) {
                // Build Container off-DOM
                compositeContainer = dom_1.$('.composite');
                dom_1.addClasses(compositeContainer, this.compositeCSSClass);
                compositeContainer.id = composite.getId();
                composite.create(compositeContainer);
                composite.updateStyles();
                // Remember composite container
                this.mapCompositeToCompositeContainer[composite.getId()] = compositeContainer;
            }
            // Report progress for slow loading composites (but only if we did not create the composites before already)
            const compositeItem = this.instantiatedCompositeItems.get(composite.getId());
            if (compositeItem && !compositeContainer) {
                compositeItem.progressService.showWhile(Promise.resolve(), this.layoutService.isRestored() ? 800 : 3200 /* less ugly initial startup */);
            }
            // Fill Content and Actions
            // Make sure that the user meanwhile did not open another composite or closed the part containing the composite
            if (!this.activeComposite || composite.getId() !== this.activeComposite.getId()) {
                return undefined;
            }
            // Take Composite on-DOM and show
            const contentArea = this.getContentArea();
            if (contentArea) {
                contentArea.appendChild(compositeContainer);
            }
            dom_1.show(compositeContainer);
            // Setup action runner
            this.toolBar.actionRunner = composite.getActionRunner();
            // Update title with composite title if it differs from descriptor
            const descriptor = this.registry.getComposite(composite.getId());
            if (descriptor && descriptor.name !== composite.getTitle()) {
                this.updateTitle(composite.getId(), types_1.withNullAsUndefined(composite.getTitle()));
            }
            // Handle Composite Actions
            let actionsBinding = this.mapActionsBindingToComposite[composite.getId()];
            if (!actionsBinding) {
                actionsBinding = this.collectCompositeActions(composite);
                this.mapActionsBindingToComposite[composite.getId()] = actionsBinding;
            }
            actionsBinding();
            if (this.telemetryActionsListener) {
                this.telemetryActionsListener.dispose();
                this.telemetryActionsListener = null;
            }
            // Action Run Handling
            this.telemetryActionsListener = this.toolBar.actionRunner.onDidRun(e => {
                // Check for Error
                if (e.error && !errors.isPromiseCanceledError(e.error)) {
                    this.notificationService.error(e.error);
                }
                // Log in telemetry
                if (this.telemetryService) {
                    /* __GDPR__
                        "workbenchActionExecuted" : {
                            "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                            "from": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('workbenchActionExecuted', { id: e.action.id, from: this.nameForTelemetry });
                }
            });
            // Indicate to composite that it is now visible
            composite.setVisible(true);
            // Make sure that the user meanwhile did not open another composite or closed the part containing the composite
            if (!this.activeComposite || composite.getId() !== this.activeComposite.getId()) {
                return;
            }
            // Make sure the composite is layed out
            if (this.contentAreaSize) {
                composite.layout(this.contentAreaSize);
            }
        }
        onTitleAreaUpdate(compositeId) {
            // Active Composite
            if (this.activeComposite && this.activeComposite.getId() === compositeId) {
                // Title
                this.updateTitle(this.activeComposite.getId(), this.activeComposite.getTitle() || undefined);
                // Actions
                const actionsBinding = this.collectCompositeActions(this.activeComposite);
                this.mapActionsBindingToComposite[this.activeComposite.getId()] = actionsBinding;
                actionsBinding();
            }
            // Otherwise invalidate actions binding for next time when the composite becomes visible
            else {
                delete this.mapActionsBindingToComposite[compositeId];
            }
        }
        updateTitle(compositeId, compositeTitle) {
            const compositeDescriptor = this.registry.getComposite(compositeId);
            if (!compositeDescriptor || !this.titleLabel) {
                return;
            }
            if (!compositeTitle) {
                compositeTitle = compositeDescriptor.name;
            }
            const keybinding = this.keybindingService.lookupKeybinding(compositeId);
            this.titleLabel.updateTitle(compositeId, compositeTitle, (keybinding && keybinding.getLabel()) || undefined);
            this.toolBar.setAriaLabel(nls.localize('ariaCompositeToolbarLabel', "{0} actions", compositeTitle));
        }
        collectCompositeActions(composite) {
            // From Composite
            const primaryActions = composite.getActions().slice(0);
            const secondaryActions = composite.getSecondaryActions().slice(0);
            // From Part
            primaryActions.push(...this.getActions());
            secondaryActions.push(...this.getSecondaryActions());
            // Update context
            this.toolBar.context = this.actionsContextProvider();
            // Return fn to set into toolbar
            return this.toolBar.setActions(actions_1.prepareActions(primaryActions), actions_1.prepareActions(secondaryActions));
        }
        getActiveComposite() {
            return this.activeComposite;
        }
        getLastActiveCompositetId() {
            return this.lastActiveCompositeId;
        }
        hideActiveComposite() {
            if (!this.activeComposite) {
                return undefined; // Nothing to do
            }
            const composite = this.activeComposite;
            this.activeComposite = null;
            const compositeContainer = this.mapCompositeToCompositeContainer[composite.getId()];
            // Indicate to Composite
            composite.setVisible(false);
            // Take Container Off-DOM and hide
            compositeContainer.remove();
            dom_1.hide(compositeContainer);
            // Clear any running Progress
            this.progressBar.stop().hide();
            // Empty Actions
            this.toolBar.setActions([])();
            this.onDidCompositeClose.fire(composite);
            return composite;
        }
        createTitleArea(parent) {
            // Title Area Container
            const titleArea = dom_1.append(parent, dom_1.$('.composite'));
            dom_1.addClass(titleArea, 'title');
            // Left Title Label
            this.titleLabel = this.createTitleLabel(titleArea);
            // Right Actions Container
            const titleActionsContainer = dom_1.append(titleArea, dom_1.$('.title-actions'));
            // Toolbar
            this.toolBar = this._register(new toolbar_1.ToolBar(titleActionsContainer, this.contextMenuService, {
                actionItemProvider: action => this.actionItemProvider(action),
                orientation: 0 /* HORIZONTAL */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                anchorAlignmentProvider: () => this.getTitleAreaDropDownAnchorAlignment()
            }));
            return titleArea;
        }
        createTitleLabel(parent) {
            const titleContainer = dom_1.append(parent, dom_1.$('.title-label'));
            const titleLabel = dom_1.append(titleContainer, dom_1.$('h2'));
            const $this = this;
            return {
                updateTitle: (id, title, keybinding) => {
                    titleLabel.innerHTML = strings.escape(title);
                    titleLabel.title = keybinding ? nls.localize('titleTooltip', "{0} ({1})", title, keybinding) : title;
                },
                updateStyles: () => {
                    titleLabel.style.color = $this.titleForegroundColor ? $this.getColor($this.titleForegroundColor) : null;
                }
            };
        }
        updateStyles() {
            super.updateStyles();
            // Forward to title label
            this.titleLabel.updateStyles();
        }
        actionItemProvider(action) {
            // Check Active Composite
            if (this.activeComposite) {
                return this.activeComposite.getActionItem(action);
            }
            return null;
        }
        actionsContextProvider() {
            // Check Active Composite
            if (this.activeComposite) {
                return this.activeComposite.getActionsContext();
            }
            return null;
        }
        createContentArea(parent) {
            const contentContainer = dom_1.append(parent, dom_1.$('.content'));
            this.progressBar = this._register(new progressbar_1.ProgressBar(contentContainer));
            this._register(styler_1.attachProgressBarStyler(this.progressBar, this.themeService));
            this.progressBar.hide();
            return contentContainer;
        }
        getProgressIndicator(id) {
            const compositeItem = this.instantiatedCompositeItems.get(id);
            return compositeItem ? compositeItem.progressService : null;
        }
        getActions() {
            return [];
        }
        getSecondaryActions() {
            return [];
        }
        getTitleAreaDropDownAnchorAlignment() {
            return 1 /* RIGHT */;
        }
        layout(width, height) {
            // Layout contents
            this.contentAreaSize = super.layoutContents(width, height).contentSize;
            // Layout composite
            if (this.activeComposite) {
                this.activeComposite.layout(this.contentAreaSize);
            }
        }
        removeComposite(compositeId) {
            if (this.activeComposite && this.activeComposite.getId() === compositeId) {
                return false; // do not remove active composite
            }
            delete this.mapCompositeToCompositeContainer[compositeId];
            delete this.mapActionsBindingToComposite[compositeId];
            const compositeItem = this.instantiatedCompositeItems.get(compositeId);
            if (compositeItem) {
                compositeItem.composite.dispose();
                lifecycle_1.dispose(compositeItem.disposable);
                this.instantiatedCompositeItems.delete(compositeId);
            }
            return true;
        }
        dispose() {
            this.mapCompositeToCompositeContainer = null; // StrictNullOverride: nulling out ok in dispose
            this.mapActionsBindingToComposite = null; // StrictNullOverride: nulling out ok in dispose
            this.instantiatedCompositeItems.forEach(compositeItem => {
                compositeItem.composite.dispose();
                lifecycle_1.dispose(compositeItem.disposable);
            });
            this.instantiatedCompositeItems.clear();
            super.dispose();
        }
    }
    exports.CompositePart = CompositePart;
});
//# sourceMappingURL=compositePart.js.map