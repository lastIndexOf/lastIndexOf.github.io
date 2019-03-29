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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/contextkey/common/contextkey", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/types", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/nls", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/map", "vs/base/browser/dom", "vs/platform/instantiation/common/extensions", "vs/css!./media/views"], function (require, exports, lifecycle_1, views_1, platform_1, storage_1, viewlet_1, contextkey_1, event_1, arrays_1, types_1, actions_1, commands_1, nls_1, keybindingsRegistry_1, map_1, dom_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function filterViewRegisterEvent(container, event) {
        return event_1.Event.chain(event)
            .map(({ views, viewContainer }) => viewContainer === container ? views : [])
            .filter(views => views.length > 0)
            .event;
    }
    function filterViewMoveEvent(container, event) {
        return event_1.Event.chain(event)
            .map(({ views, from, to }) => from === container ? { removed: views } : to === container ? { added: views } : {})
            .filter(({ added, removed }) => arrays_1.isNonEmptyArray(added) || arrays_1.isNonEmptyArray(removed))
            .event;
    }
    class CounterSet {
        constructor() {
            this.map = new Map();
        }
        add(value) {
            this.map.set(value, (this.map.get(value) || 0) + 1);
            return this;
        }
        delete(value) {
            let counter = this.map.get(value) || 0;
            if (counter === 0) {
                return false;
            }
            counter--;
            if (counter === 0) {
                this.map.delete(value);
            }
            else {
                this.map.set(value, counter);
            }
            return true;
        }
        has(value) {
            return this.map.has(value);
        }
    }
    let ViewDescriptorCollection = class ViewDescriptorCollection extends lifecycle_1.Disposable {
        constructor(container, contextKeyService) {
            super();
            this.contextKeyService = contextKeyService;
            this.contextKeys = new CounterSet();
            this.items = [];
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChangeActiveViews = this._onDidChange.event;
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const onRelevantViewsRegistered = filterViewRegisterEvent(container, viewsRegistry.onViewsRegistered);
            this._register(onRelevantViewsRegistered(this.onViewsRegistered, this));
            const onRelevantViewsMoved = filterViewMoveEvent(container, viewsRegistry.onDidChangeContainer);
            this._register(onRelevantViewsMoved(({ added, removed }) => {
                if (arrays_1.isNonEmptyArray(added)) {
                    this.onViewsRegistered(added);
                }
                if (arrays_1.isNonEmptyArray(removed)) {
                    this.onViewsDeregistered(removed);
                }
            }));
            const onRelevantViewsDeregistered = filterViewRegisterEvent(container, viewsRegistry.onViewsDeregistered);
            this._register(onRelevantViewsDeregistered(this.onViewsDeregistered, this));
            const onRelevantContextChange = event_1.Event.filter(contextKeyService.onDidChangeContext, e => e.affectsSome(this.contextKeys));
            this._register(onRelevantContextChange(this.onContextChanged, this));
            this.onViewsRegistered(viewsRegistry.getViews(container));
        }
        get activeViewDescriptors() {
            return this.items
                .filter(i => i.active)
                .map(i => i.viewDescriptor);
        }
        get allViewDescriptors() {
            return this.items.map(i => i.viewDescriptor);
        }
        onViewsRegistered(viewDescriptors) {
            const added = [];
            for (const viewDescriptor of viewDescriptors) {
                const item = {
                    viewDescriptor,
                    active: this.isViewDescriptorActive(viewDescriptor) // TODO: should read from some state?
                };
                this.items.push(item);
                if (viewDescriptor.when) {
                    for (const key of viewDescriptor.when.keys()) {
                        this.contextKeys.add(key);
                    }
                }
                if (item.active) {
                    added.push(viewDescriptor);
                }
            }
            if (added.length) {
                this._onDidChange.fire({ added, removed: [] });
            }
        }
        onViewsDeregistered(viewDescriptors) {
            const removed = [];
            for (const viewDescriptor of viewDescriptors) {
                const index = arrays_1.firstIndex(this.items, i => i.viewDescriptor.id === viewDescriptor.id);
                if (index === -1) {
                    continue;
                }
                const item = this.items[index];
                this.items.splice(index, 1);
                if (viewDescriptor.when) {
                    for (const key of viewDescriptor.when.keys()) {
                        this.contextKeys.delete(key);
                    }
                }
                if (item.active) {
                    removed.push(viewDescriptor);
                }
            }
            if (removed.length) {
                this._onDidChange.fire({ added: [], removed });
            }
        }
        onContextChanged(event) {
            const removed = [];
            const added = [];
            for (const item of this.items) {
                const active = this.isViewDescriptorActive(item.viewDescriptor);
                if (item.active !== active) {
                    if (active) {
                        added.push(item.viewDescriptor);
                    }
                    else {
                        removed.push(item.viewDescriptor);
                    }
                }
                item.active = active;
            }
            if (added.length || removed.length) {
                this._onDidChange.fire({ added, removed });
            }
        }
        isViewDescriptorActive(viewDescriptor) {
            return !viewDescriptor.when || this.contextKeyService.contextMatchesRules(viewDescriptor.when);
        }
    };
    ViewDescriptorCollection = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], ViewDescriptorCollection);
    class ContributableViewsModel extends lifecycle_1.Disposable {
        constructor(container, viewsService, viewStates = new Map()) {
            super();
            this.viewStates = viewStates;
            this.viewDescriptors = [];
            this._onDidAdd = this._register(new event_1.Emitter());
            this.onDidAdd = this._onDidAdd.event;
            this._onDidRemove = this._register(new event_1.Emitter());
            this.onDidRemove = this._onDidRemove.event;
            this._onDidMove = this._register(new event_1.Emitter());
            this.onDidMove = this._onDidMove.event;
            const viewDescriptorCollection = viewsService.getViewDescriptors(container);
            if (viewDescriptorCollection) {
                this._register(viewDescriptorCollection.onDidChangeActiveViews(() => this.onDidChangeViewDescriptors(viewDescriptorCollection.activeViewDescriptors)));
                this.onDidChangeViewDescriptors(viewDescriptorCollection.activeViewDescriptors);
            }
        }
        get visibleViewDescriptors() {
            return this.viewDescriptors.filter(v => this.isViewDescriptorVisible(v));
        }
        isVisible(id) {
            const viewDescriptor = this.viewDescriptors.filter(v => v.id === id)[0];
            if (!viewDescriptor) {
                throw new Error(`Unknown view ${id}`);
            }
            return this.isViewDescriptorVisible(viewDescriptor);
        }
        setVisible(id, visible) {
            const { visibleIndex, viewDescriptor, state } = this.find(id);
            if (!viewDescriptor.canToggleVisibility) {
                throw new Error(`Can't toggle this view's visibility`);
            }
            if (this.isViewDescriptorVisible(viewDescriptor) === visible) {
                return;
            }
            if (viewDescriptor.workspace) {
                state.visibleWorkspace = visible;
            }
            else {
                state.visibleGlobal = visible;
            }
            if (visible) {
                this._onDidAdd.fire([{ index: visibleIndex, viewDescriptor, size: state.size, collapsed: state.collapsed }]);
            }
            else {
                this._onDidRemove.fire([{ index: visibleIndex, viewDescriptor }]);
            }
        }
        isCollapsed(id) {
            const state = this.viewStates.get(id);
            if (!state) {
                throw new Error(`Unknown view ${id}`);
            }
            return state.collapsed;
        }
        setCollapsed(id, collapsed) {
            const { state } = this.find(id);
            state.collapsed = collapsed;
        }
        getSize(id) {
            const state = this.viewStates.get(id);
            if (!state) {
                throw new Error(`Unknown view ${id}`);
            }
            return state.size;
        }
        setSize(id, size) {
            const { state } = this.find(id);
            state.size = size;
        }
        move(from, to) {
            const fromIndex = arrays_1.firstIndex(this.viewDescriptors, v => v.id === from);
            const toIndex = arrays_1.firstIndex(this.viewDescriptors, v => v.id === to);
            const fromViewDescriptor = this.viewDescriptors[fromIndex];
            const toViewDescriptor = this.viewDescriptors[toIndex];
            arrays_1.move(this.viewDescriptors, fromIndex, toIndex);
            for (let index = 0; index < this.viewDescriptors.length; index++) {
                const state = this.viewStates.get(this.viewDescriptors[index].id);
                state.order = index;
            }
            this._onDidMove.fire({
                from: { index: fromIndex, viewDescriptor: fromViewDescriptor },
                to: { index: toIndex, viewDescriptor: toViewDescriptor }
            });
        }
        isViewDescriptorVisible(viewDescriptor) {
            const viewState = this.viewStates.get(viewDescriptor.id);
            if (!viewState) {
                throw new Error(`Unknown view ${viewDescriptor.id}`);
            }
            return viewDescriptor.workspace ? viewState.visibleWorkspace : viewState.visibleGlobal;
        }
        find(id) {
            for (let i = 0, visibleIndex = 0; i < this.viewDescriptors.length; i++) {
                const viewDescriptor = this.viewDescriptors[i];
                const state = this.viewStates.get(viewDescriptor.id);
                if (!state) {
                    throw new Error(`View state for ${id} not found`);
                }
                if (viewDescriptor.id === id) {
                    return { index: i, visibleIndex, viewDescriptor, state };
                }
                if (viewDescriptor.workspace ? state.visibleWorkspace : state.visibleGlobal) {
                    visibleIndex++;
                }
            }
            throw new Error(`view descriptor ${id} not found`);
        }
        compareViewDescriptors(a, b) {
            if (a.id === b.id) {
                return 0;
            }
            return (this.getViewOrder(a) - this.getViewOrder(b)) || (a.id < b.id ? -1 : 1);
        }
        getViewOrder(viewDescriptor) {
            const viewState = this.viewStates.get(viewDescriptor.id);
            const viewOrder = viewState && typeof viewState.order === 'number' ? viewState.order : viewDescriptor.order;
            return typeof viewOrder === 'number' ? viewOrder : Number.MAX_VALUE;
        }
        onDidChangeViewDescriptors(viewDescriptors) {
            const ids = new Set();
            for (const viewDescriptor of this.viewDescriptors) {
                ids.add(viewDescriptor.id);
            }
            viewDescriptors = viewDescriptors.sort(this.compareViewDescriptors.bind(this));
            for (const viewDescriptor of viewDescriptors) {
                const viewState = this.viewStates.get(viewDescriptor.id);
                if (viewState) {
                    // set defaults if not set
                    if (viewDescriptor.workspace) {
                        viewState.visibleWorkspace = types_1.isUndefinedOrNull(viewState.visibleWorkspace) ? !viewDescriptor.hideByDefault : viewState.visibleWorkspace;
                    }
                    else {
                        viewState.visibleGlobal = types_1.isUndefinedOrNull(viewState.visibleGlobal) ? !viewDescriptor.hideByDefault : viewState.visibleGlobal;
                    }
                    viewState.collapsed = types_1.isUndefinedOrNull(viewState.collapsed) ? !!viewDescriptor.collapsed : viewState.collapsed;
                }
                else {
                    this.viewStates.set(viewDescriptor.id, {
                        visibleGlobal: !viewDescriptor.hideByDefault,
                        visibleWorkspace: !viewDescriptor.hideByDefault,
                        collapsed: !!viewDescriptor.collapsed
                    });
                }
            }
            const splices = arrays_1.sortedDiff(this.viewDescriptors, viewDescriptors, this.compareViewDescriptors.bind(this)).reverse();
            const toRemove = [];
            const toAdd = [];
            for (const splice of splices) {
                const startViewDescriptor = this.viewDescriptors[splice.start];
                let startIndex = startViewDescriptor ? this.find(startViewDescriptor.id).visibleIndex : this.viewDescriptors.length;
                for (let i = 0; i < splice.deleteCount; i++) {
                    const viewDescriptor = this.viewDescriptors[splice.start + i];
                    if (this.isViewDescriptorVisible(viewDescriptor)) {
                        toRemove.push({ index: startIndex++, viewDescriptor });
                    }
                }
                for (const viewDescriptor of splice.toInsert) {
                    const state = this.viewStates.get(viewDescriptor.id);
                    if (this.isViewDescriptorVisible(viewDescriptor)) {
                        toAdd.push({ index: startIndex++, viewDescriptor, size: state.size, collapsed: state.collapsed });
                    }
                }
            }
            this.viewDescriptors.splice(0, this.viewDescriptors.length, ...viewDescriptors);
            if (toRemove.length) {
                this._onDidRemove.fire(toRemove);
            }
            if (toAdd.length) {
                this._onDidAdd.fire(toAdd);
            }
        }
    }
    exports.ContributableViewsModel = ContributableViewsModel;
    let PersistentContributableViewsModel = class PersistentContributableViewsModel extends ContributableViewsModel {
        constructor(container, viewletStateStorageId, viewsService, storageService) {
            const hiddenViewsStorageId = `${viewletStateStorageId}.hidden`;
            const viewStates = PersistentContributableViewsModel.loadViewsStates(viewletStateStorageId, hiddenViewsStorageId, storageService);
            super(container, viewsService, viewStates);
            this.viewletStateStorageId = viewletStateStorageId;
            this.hiddenViewsStorageId = hiddenViewsStorageId;
            this.storageService = storageService;
            this._register(this.onDidAdd(viewDescriptorRefs => this.saveVisibilityStates(viewDescriptorRefs.map(r => r.viewDescriptor))));
            this._register(this.onDidRemove(viewDescriptorRefs => this.saveVisibilityStates(viewDescriptorRefs.map(r => r.viewDescriptor))));
            this._register(this.storageService.onWillSaveState(() => this.saveViewsStates()));
        }
        saveViewsStates() {
            const storedViewsStates = {};
            let hasState = false;
            for (const viewDescriptor of this.viewDescriptors) {
                const viewState = this.viewStates.get(viewDescriptor.id);
                if (viewState) {
                    storedViewsStates[viewDescriptor.id] = { collapsed: viewState.collapsed, size: viewState.size, order: viewState.order };
                    hasState = true;
                }
            }
            if (hasState) {
                this.storageService.store(this.viewletStateStorageId, JSON.stringify(storedViewsStates), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(this.viewletStateStorageId, 1 /* WORKSPACE */);
            }
        }
        saveVisibilityStates(viewDescriptors) {
            const globalViews = viewDescriptors.filter(v => !v.workspace);
            const workspaceViews = viewDescriptors.filter(v => v.workspace);
            if (globalViews.length) {
                this.saveVisibilityStatesInScope(globalViews, 0 /* GLOBAL */);
            }
            if (workspaceViews.length) {
                this.saveVisibilityStatesInScope(workspaceViews, 1 /* WORKSPACE */);
            }
        }
        saveVisibilityStatesInScope(viewDescriptors, scope) {
            const storedViewsVisibilityStates = PersistentContributableViewsModel.loadViewsVisibilityState(this.hiddenViewsStorageId, this.storageService, scope);
            for (const viewDescriptor of viewDescriptors) {
                if (viewDescriptor.canToggleVisibility) {
                    const viewState = this.viewStates.get(viewDescriptor.id);
                    storedViewsVisibilityStates.set(viewDescriptor.id, { id: viewDescriptor.id, isHidden: viewState ? (scope === 0 /* GLOBAL */ ? !viewState.visibleGlobal : !viewState.visibleWorkspace) : false });
                }
            }
            this.storageService.store(this.hiddenViewsStorageId, JSON.stringify(map_1.values(storedViewsVisibilityStates)), scope);
        }
        static loadViewsStates(viewletStateStorageId, hiddenViewsStorageId, storageService) {
            const viewStates = new Map();
            const storedViewsStates = JSON.parse(storageService.get(viewletStateStorageId, 1 /* WORKSPACE */, '{}'));
            const globalVisibilityStates = this.loadViewsVisibilityState(hiddenViewsStorageId, storageService, 0 /* GLOBAL */);
            const workspaceVisibilityStates = this.loadViewsVisibilityState(hiddenViewsStorageId, storageService, 1 /* WORKSPACE */);
            for (const { id, isHidden } of map_1.values(globalVisibilityStates)) {
                const viewState = storedViewsStates[id];
                if (viewState) {
                    viewStates.set(id, Object.assign({}, viewState, { visibleGlobal: !isHidden }));
                }
                else {
                    // New workspace
                    viewStates.set(id, Object.assign({ visibleGlobal: !isHidden }));
                }
            }
            for (const { id, isHidden } of map_1.values(workspaceVisibilityStates)) {
                const viewState = storedViewsStates[id];
                if (viewState) {
                    viewStates.set(id, Object.assign({}, viewState, { visibleWorkspace: !isHidden }));
                }
                else {
                    // New workspace
                    viewStates.set(id, Object.assign({ visibleWorkspace: !isHidden }));
                }
            }
            for (const id of Object.keys(storedViewsStates)) {
                if (!viewStates.has(id)) {
                    viewStates.set(id, Object.assign({}, storedViewsStates[id]));
                }
            }
            return viewStates;
        }
        static loadViewsVisibilityState(hiddenViewsStorageId, storageService, scope) {
            const storedVisibilityStates = JSON.parse(storageService.get(hiddenViewsStorageId, scope, '[]'));
            let hasDuplicates = false;
            const storedViewsVisibilityStates = storedVisibilityStates.reduce((result, storedState) => {
                if (typeof storedState === 'string' /* migration */) {
                    hasDuplicates = hasDuplicates || result.has(storedState);
                    result.set(storedState, { id: storedState, isHidden: true });
                }
                else {
                    hasDuplicates = hasDuplicates || result.has(storedState.id);
                    result.set(storedState.id, storedState);
                }
                return result;
            }, new Map());
            if (hasDuplicates) {
                storageService.store(hiddenViewsStorageId, JSON.stringify(map_1.values(storedViewsVisibilityStates)), scope);
            }
            return storedViewsVisibilityStates;
        }
    };
    PersistentContributableViewsModel = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, storage_1.IStorageService)
    ], PersistentContributableViewsModel);
    exports.PersistentContributableViewsModel = PersistentContributableViewsModel;
    let ViewsService = class ViewsService extends lifecycle_1.Disposable {
        constructor(viewletService, contextKeyService) {
            super();
            this.viewletService = viewletService;
            this.contextKeyService = contextKeyService;
            this.viewDescriptorCollections = new Map();
            this.viewDisposable = new Map();
            this.activeViewContextKeys = new Map();
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewContainersRegistry.all.forEach(viewContainer => {
                this.onDidRegisterViews(viewContainer, viewsRegistry.getViews(viewContainer));
                this.onDidRegisterViewContainer(viewContainer);
            });
            this._register(viewsRegistry.onViewsRegistered(({ views, viewContainer }) => this.onDidRegisterViews(viewContainer, views)));
            this._register(viewsRegistry.onViewsDeregistered(({ views }) => this.onDidDeregisterViews(views)));
            this._register(viewsRegistry.onDidChangeContainer(({ views, to }) => { this.onDidDeregisterViews(views); this.onDidRegisterViews(to, views); }));
            this._register(lifecycle_1.toDisposable(() => {
                this.viewDisposable.forEach(disposable => disposable.dispose());
                this.viewDisposable.clear();
            }));
            this._register(viewContainersRegistry.onDidRegister(viewContainer => this.onDidRegisterViewContainer(viewContainer)));
            this._register(viewContainersRegistry.onDidDeregister(viewContainer => this.onDidDeregisterViewContainer(viewContainer)));
            this._register(lifecycle_1.toDisposable(() => {
                this.viewDescriptorCollections.forEach(({ disposable }) => disposable.dispose());
                this.viewDescriptorCollections.clear();
            }));
        }
        getViewDescriptors(container) {
            const viewDescriptorCollectionItem = this.viewDescriptorCollections.get(container);
            return viewDescriptorCollectionItem ? viewDescriptorCollectionItem.viewDescriptorCollection : null;
        }
        openView(id, focus) {
            const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getViewContainer(id);
            if (viewContainer) {
                const viewletDescriptor = this.viewletService.getViewlet(viewContainer.id);
                if (viewletDescriptor) {
                    return this.viewletService.openViewlet(viewletDescriptor.id, focus)
                        .then((viewlet) => {
                        if (viewlet && viewlet.openView) {
                            return viewlet.openView(id, focus);
                        }
                        return null;
                    });
                }
            }
            return Promise.resolve(null);
        }
        onDidRegisterViewContainer(viewContainer) {
            const viewDescriptorCollection = new ViewDescriptorCollection(viewContainer, this.contextKeyService);
            const disposables = [viewDescriptorCollection];
            this.onDidChangeActiveViews({ added: viewDescriptorCollection.activeViewDescriptors, removed: [] });
            viewDescriptorCollection.onDidChangeActiveViews(changed => this.onDidChangeActiveViews(changed), this, disposables);
            this.viewDescriptorCollections.set(viewContainer, { viewDescriptorCollection, disposable: lifecycle_1.toDisposable(() => lifecycle_1.dispose(disposables)) });
        }
        onDidDeregisterViewContainer(viewContainer) {
            const viewDescriptorCollectionItem = this.viewDescriptorCollections.get(viewContainer);
            if (viewDescriptorCollectionItem) {
                viewDescriptorCollectionItem.disposable.dispose();
                this.viewDescriptorCollections.delete(viewContainer);
            }
        }
        onDidChangeActiveViews({ added, removed }) {
            added.forEach(viewDescriptor => this.getOrCreateActiveViewContextKey(viewDescriptor).set(true));
            removed.forEach(viewDescriptor => this.getOrCreateActiveViewContextKey(viewDescriptor).set(false));
        }
        onDidRegisterViews(container, views) {
            const viewlet = this.viewletService.getViewlet(container.id);
            for (const viewDescriptor of views) {
                const disposables = [];
                const command = {
                    id: viewDescriptor.focusCommand ? viewDescriptor.focusCommand.id : `${viewDescriptor.id}.focus`,
                    title: { original: `Focus on ${viewDescriptor.name} View`, value: nls_1.localize('focus view', "Focus on {0} View", viewDescriptor.name) },
                    category: viewlet ? viewlet.name : nls_1.localize('view category', "View"),
                };
                const when = contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.active`);
                disposables.push(commands_1.CommandsRegistry.registerCommand(command.id, () => this.openView(viewDescriptor.id, true).then(() => null)));
                disposables.push(actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                    command,
                    when
                }));
                if (viewDescriptor.focusCommand && viewDescriptor.focusCommand.keybindings) {
                    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                        id: command.id,
                        when,
                        weight: 200 /* WorkbenchContrib */,
                        primary: viewDescriptor.focusCommand.keybindings.primary,
                        secondary: viewDescriptor.focusCommand.keybindings.secondary,
                        linux: viewDescriptor.focusCommand.keybindings.linux,
                        mac: viewDescriptor.focusCommand.keybindings.mac,
                        win: viewDescriptor.focusCommand.keybindings.win
                    });
                }
                this.viewDisposable.set(viewDescriptor, lifecycle_1.toDisposable(() => lifecycle_1.dispose(disposables)));
            }
        }
        onDidDeregisterViews(views) {
            for (const view of views) {
                const disposable = this.viewDisposable.get(view);
                if (disposable) {
                    disposable.dispose();
                    this.viewDisposable.delete(view);
                }
            }
        }
        getOrCreateActiveViewContextKey(viewDescriptor) {
            const activeContextKeyId = `${viewDescriptor.id}.active`;
            let contextKey = this.activeViewContextKeys.get(activeContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(activeContextKeyId, false).bindTo(this.contextKeyService);
                this.activeViewContextKeys.set(activeContextKeyId, contextKey);
            }
            return contextKey;
        }
    };
    ViewsService = __decorate([
        __param(0, viewlet_1.IViewletService),
        __param(1, contextkey_1.IContextKeyService)
    ], ViewsService);
    exports.ViewsService = ViewsService;
    function createFileIconThemableTreeContainerScope(container, themeService) {
        dom_1.addClass(container, 'file-icon-themable-tree');
        dom_1.addClass(container, 'show-file-icons');
        const onDidChangeFileIconTheme = (theme) => {
            dom_1.toggleClass(container, 'align-icons-and-twisties', theme.hasFileIcons && !theme.hasFolderIcons);
            dom_1.toggleClass(container, 'hide-arrows', theme.hidesExplorerArrows === true);
        };
        onDidChangeFileIconTheme(themeService.getFileIconTheme());
        return themeService.onDidFileIconThemeChange(onDidChangeFileIconTheme);
    }
    exports.createFileIconThemableTreeContainerScope = createFileIconThemableTreeContainerScope;
    extensions_1.registerSingleton(views_1.IViewsService, ViewsService);
});
//# sourceMappingURL=views.js.map