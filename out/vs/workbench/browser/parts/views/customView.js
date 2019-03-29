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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/actions", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuItemActionItem", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/workbench/browser/parts/views/viewsViewlet", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/commands/common/commands", "vs/base/browser/dom", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/theme/common/themeService", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/workbench/browser/parts/views/panelViewlet", "vs/nls", "vs/base/common/async", "vs/base/parts/tree/browser/treeDefaults", "vs/platform/theme/common/colorRegistry", "vs/base/common/types", "vs/base/browser/htmlContentRenderer", "vs/base/common/errors", "vs/platform/opener/common/opener", "vs/platform/label/common/label", "vs/platform/registry/common/platform", "vs/css!./media/views"], function (require, exports, event_1, lifecycle_1, instantiation_1, actions_1, keybinding_1, contextView_1, actions_2, menuItemActionItem_1, contextkey_1, views_1, viewsViewlet_1, configuration_1, notification_1, progress_1, extensions_1, workbenchThemeService_1, commands_1, DOM, labels_1, actionbar_1, uri_1, resources_1, themeService_1, files_1, listService_1, panelViewlet_1, nls_1, async_1, treeDefaults_1, colorRegistry_1, types_1, htmlContentRenderer_1, errors_1, opener_1, label_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CustomTreeViewPanel = class CustomTreeViewPanel extends panelViewlet_1.ViewletPanel {
        constructor(options, notificationService, keybindingService, contextMenuService, configurationService, viewsService) {
            super(Object.assign({}, options, { ariaHeaderLabel: options.title }), keybindingService, contextMenuService, configurationService);
            this.notificationService = notificationService;
            const { treeView } = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getView(options.id);
            this.treeView = treeView;
            this.treeView.onDidChangeActions(() => this.updateActions(), this, this.disposables);
            this.disposables.push(lifecycle_1.toDisposable(() => this.treeView.setVisibility(false)));
            this.disposables.push(this.onDidChangeBodyVisibility(() => this.updateTreeVisibility()));
            this.updateTreeVisibility();
        }
        focus() {
            super.focus();
            this.treeView.focus();
        }
        renderBody(container) {
            this.treeView.show(container);
        }
        layoutBody(size) {
            this.treeView.layout(size);
        }
        getActions() {
            return [...this.treeView.getPrimaryActions()];
        }
        getSecondaryActions() {
            return [...this.treeView.getSecondaryActions()];
        }
        getActionItem(action) {
            return action instanceof actions_2.MenuItemAction ? new menuItemActionItem_1.ContextAwareMenuItemActionItem(action, this.keybindingService, this.notificationService, this.contextMenuService) : null;
        }
        getOptimalWidth() {
            return this.treeView.getOptimalWidth();
        }
        updateTreeVisibility() {
            this.treeView.setVisibility(this.isBodyVisible());
        }
        dispose() {
            lifecycle_1.dispose(this.disposables);
            super.dispose();
        }
    };
    CustomTreeViewPanel = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, views_1.IViewsService)
    ], CustomTreeViewPanel);
    exports.CustomTreeViewPanel = CustomTreeViewPanel;
    let TitleMenus = class TitleMenus {
        constructor(id, contextKeyService, menuService) {
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.disposables = [];
            this.titleDisposable = lifecycle_1.Disposable.None;
            this.titleActions = [];
            this.titleSecondaryActions = [];
            this._onDidChangeTitle = new event_1.Emitter();
            if (this.titleDisposable) {
                this.titleDisposable.dispose();
                this.titleDisposable = lifecycle_1.Disposable.None;
            }
            const _contextKeyService = this.contextKeyService.createScoped();
            _contextKeyService.createKey('view', id);
            const titleMenu = this.menuService.createMenu(37 /* ViewTitle */, _contextKeyService);
            const updateActions = () => {
                this.titleActions = [];
                this.titleSecondaryActions = [];
                menuItemActionItem_1.fillInActionBarActions(titleMenu, undefined, { primary: this.titleActions, secondary: this.titleSecondaryActions });
                this._onDidChangeTitle.fire();
            };
            const listener = titleMenu.onDidChange(updateActions);
            updateActions();
            this.titleDisposable = lifecycle_1.toDisposable(() => {
                listener.dispose();
                titleMenu.dispose();
                _contextKeyService.dispose();
                this.titleActions = [];
                this.titleSecondaryActions = [];
            });
        }
        get onDidChangeTitle() { return this._onDidChangeTitle.event; }
        getTitleActions() {
            return this.titleActions;
        }
        getTitleSecondaryActions() {
            return this.titleSecondaryActions;
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    TitleMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_2.IMenuService)
    ], TitleMenus);
    class Root {
        constructor() {
            this.label = { label: 'root' };
            this.handle = '0';
            this.parentHandle = null;
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
            this.children = undefined;
        }
    }
    const noDataProviderMessage = nls_1.localize('no-dataprovider', "There is no data provider registered that can provide view data.");
    let CustomTreeView = class CustomTreeView extends lifecycle_1.Disposable {
        constructor(id, viewContainer, extensionService, themeService, instantiationService, commandService, configurationService, progressService) {
            super();
            this.id = id;
            this.viewContainer = viewContainer;
            this.extensionService = extensionService;
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.progressService = progressService;
            this.isVisible = false;
            this.activated = false;
            this._hasIconForParentNode = false;
            this._hasIconForLeafNode = false;
            this._showCollapseAllAction = false;
            this.focused = false;
            this.elementsToRefresh = [];
            this._onDidExpandItem = this._register(new event_1.Emitter());
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onDidCollapseItem = this._register(new event_1.Emitter());
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeActions = this._register(new event_1.Emitter());
            this.onDidChangeActions = this._onDidChangeActions.event;
            this.refreshing = false;
            this.root = new Root();
            this.menus = this._register(instantiationService.createInstance(TitleMenus, this.id));
            this._register(this.menus.onDidChangeTitle(() => this._onDidChangeActions.fire()));
            this._register(this.themeService.onDidFileIconThemeChange(() => this.doRefresh([this.root]) /** soft refresh **/));
            this._register(this.themeService.onThemeChange(() => this.doRefresh([this.root]) /** soft refresh **/));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer.decorations')) {
                    this.doRefresh([this.root]); /** soft refresh **/
                }
            }));
            this.markdownRenderer = instantiationService.createInstance(MarkdownRenderer);
            this._register(lifecycle_1.toDisposable(() => {
                if (this.markdownResult) {
                    this.markdownResult.dispose();
                }
            }));
            this._register(platform_1.Registry.as(views_1.Extensions.ViewsRegistry).onDidChangeContainer(({ views, from, to }) => {
                if (from === this.viewContainer && views.some(v => v.id === this.id)) {
                    this.viewContainer = to;
                }
            }));
            this.create();
        }
        get dataProvider() {
            return this._dataProvider;
        }
        set dataProvider(dataProvider) {
            if (dataProvider) {
                this._dataProvider = new class {
                    getChildren(node) {
                        if (node && node.children) {
                            return Promise.resolve(node.children);
                        }
                        const promise = node instanceof Root ? dataProvider.getChildren() : dataProvider.getChildren(node);
                        return promise.then(children => {
                            node.children = children;
                            return children;
                        });
                    }
                };
                this.updateMessage();
                this.refresh();
            }
            else {
                this._dataProvider = null;
                this.updateMessage();
            }
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this.updateMessage();
        }
        get hasIconForParentNode() {
            return this._hasIconForParentNode;
        }
        get hasIconForLeafNode() {
            return this._hasIconForLeafNode;
        }
        get visible() {
            return this.isVisible;
        }
        get showCollapseAllAction() {
            return this._showCollapseAllAction;
        }
        set showCollapseAllAction(showCollapseAllAction) {
            if (this._showCollapseAllAction !== !!showCollapseAllAction) {
                this._showCollapseAllAction = !!showCollapseAllAction;
                this._onDidChangeActions.fire();
            }
        }
        getPrimaryActions() {
            if (this.showCollapseAllAction) {
                const collapseAllAction = new actions_1.Action('vs.tree.collapse', nls_1.localize('collapseAll', "Collapse All"), 'monaco-tree-action collapse-all', true, () => this.tree ? new treeDefaults_1.CollapseAllAction(this.tree, true).run() : Promise.resolve());
                return [...this.menus.getTitleActions(), collapseAllAction];
            }
            else {
                return this.menus.getTitleActions();
            }
        }
        getSecondaryActions() {
            return this.menus.getTitleSecondaryActions();
        }
        setVisibility(isVisible) {
            isVisible = !!isVisible;
            if (this.isVisible === isVisible) {
                return;
            }
            this.isVisible = isVisible;
            if (this.isVisible) {
                this.activate();
            }
            if (this.tree) {
                if (this.isVisible) {
                    DOM.show(this.tree.getHTMLElement());
                }
                else {
                    DOM.hide(this.tree.getHTMLElement()); // make sure the tree goes out of the tabindex world by hiding it
                }
                if (this.isVisible) {
                    this.tree.onVisible();
                }
                else {
                    this.tree.onHidden();
                }
                if (this.isVisible && this.elementsToRefresh.length) {
                    this.doRefresh(this.elementsToRefresh);
                    this.elementsToRefresh = [];
                }
            }
            this._onDidChangeVisibility.fire(this.isVisible);
        }
        focus() {
            if (this.tree && this.root.children && this.root.children.length > 0) {
                // Make sure the current selected element is revealed
                const selectedElement = this.tree.getSelection()[0];
                if (selectedElement) {
                    this.tree.reveal(selectedElement, 0.5);
                }
                // Pass Focus to Viewer
                this.tree.domFocus();
            }
            else {
                this.domNode.focus();
            }
        }
        show(container) {
            DOM.append(container, this.domNode);
        }
        create() {
            this.domNode = DOM.$('.tree-explorer-viewlet-tree-view');
            this.messageElement = DOM.append(this.domNode, DOM.$('.message'));
            this.treeContainer = DOM.append(this.domNode, DOM.$('.customview-tree'));
            const focusTracker = this._register(DOM.trackFocus(this.domNode));
            this._register(focusTracker.onDidFocus(() => this.focused = true));
            this._register(focusTracker.onDidBlur(() => this.focused = false));
        }
        createTree() {
            const actionItemProvider = (action) => action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(menuItemActionItem_1.ContextAwareMenuItemActionItem, action) : null;
            const menus = this._register(this.instantiationService.createInstance(TreeMenus, this.id));
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            const dataSource = this.instantiationService.createInstance(TreeDataSource, this, (task) => this.progressService.withProgress({ location: this.viewContainer.id }, () => task));
            const renderer = this.instantiationService.createInstance(TreeRenderer, this.id, menus, this.treeLabels, actionItemProvider);
            const controller = this.instantiationService.createInstance(TreeController, this.id, menus);
            this.tree = this._register(this.instantiationService.createInstance(viewsViewlet_1.FileIconThemableWorkbenchTree, this.treeContainer, { dataSource, renderer, controller }, {}));
            this.tree.contextKeyService.createKey(this.id, true);
            this._register(this.tree.onDidChangeSelection(e => this.onSelection(e)));
            this._register(this.tree.onDidExpandItem(e => this._onDidExpandItem.fire(e.item.getElement())));
            this._register(this.tree.onDidCollapseItem(e => this._onDidCollapseItem.fire(e.item.getElement())));
            this._register(this.tree.onDidChangeSelection(e => this._onDidChangeSelection.fire(e.selection)));
            this.tree.setInput(this.root).then(() => this.updateContentAreas());
        }
        updateMessage() {
            if (this._message) {
                this.showMessage(this._message);
            }
            else if (!this.dataProvider) {
                this.showMessage(noDataProviderMessage);
            }
            else {
                this.hideMessage();
            }
            this.updateContentAreas();
        }
        showMessage(message) {
            DOM.removeClass(this.messageElement, 'hide');
            if (this._messageValue !== message) {
                this.resetMessageElement();
                this._messageValue = message;
                if (types_1.isString(this._messageValue)) {
                    this.messageElement.textContent = this._messageValue;
                }
                else {
                    this.markdownResult = this.markdownRenderer.render(this._messageValue);
                    DOM.append(this.messageElement, this.markdownResult.element);
                }
                this.layout(this._size);
            }
        }
        hideMessage() {
            this.resetMessageElement();
            DOM.addClass(this.messageElement, 'hide');
            this.layout(this._size);
        }
        resetMessageElement() {
            if (this.markdownResult) {
                this.markdownResult.dispose();
                this.markdownResult = null;
            }
            DOM.clearNode(this.messageElement);
        }
        layout(size) {
            if (size) {
                this._size = size;
                const treeSize = size - DOM.getTotalHeight(this.messageElement);
                this.treeContainer.style.height = treeSize + 'px';
                if (this.tree) {
                    this.tree.layout(treeSize);
                }
            }
        }
        getOptimalWidth() {
            if (this.tree) {
                const parentNode = this.tree.getHTMLElement();
                const childNodes = [].slice.call(parentNode.querySelectorAll('.outline-item-label > a'));
                return DOM.getLargestChildWidth(parentNode, childNodes);
            }
            return 0;
        }
        refresh(elements) {
            if (this.dataProvider && this.tree) {
                if (!elements) {
                    elements = [this.root];
                    // remove all waiting elements to refresh if root is asked to refresh
                    this.elementsToRefresh = [];
                }
                for (const element of elements) {
                    element.children = undefined; // reset children
                }
                if (this.isVisible) {
                    return this.doRefresh(elements);
                }
                else {
                    if (this.elementsToRefresh.length) {
                        const seen = new Set();
                        this.elementsToRefresh.forEach(element => seen.add(element.handle));
                        for (const element of elements) {
                            if (!seen.has(element.handle)) {
                                this.elementsToRefresh.push(element);
                            }
                        }
                    }
                    else {
                        this.elementsToRefresh.push(...elements);
                    }
                }
            }
            return Promise.resolve(undefined);
        }
        expand(itemOrItems) {
            if (this.tree) {
                itemOrItems = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
                return this.tree.expandAll(itemOrItems);
            }
            return Promise.resolve(undefined);
        }
        setSelection(items) {
            if (this.tree) {
                this.tree.setSelection(items, { source: 'api' });
            }
        }
        setFocus(item) {
            if (this.tree) {
                this.focus();
                this.tree.setFocus(item);
            }
        }
        reveal(item) {
            if (this.tree) {
                return this.tree.reveal(item);
            }
            return Promise.resolve();
        }
        activate() {
            if (!this.activated) {
                this.createTree();
                this.progressService.withProgress({ location: this.viewContainer.id }, () => this.extensionService.activateByEvent(`onView:${this.id}`))
                    .then(() => async_1.timeout(2000))
                    .then(() => {
                    this.updateMessage();
                });
                this.activated = true;
            }
        }
        doRefresh(elements) {
            if (this.tree) {
                this.refreshing = true;
                return Promise.all(elements.map(e => this.tree.refresh(e)))
                    .then(() => {
                    this.refreshing = false;
                    this.updateContentAreas();
                    if (this.focused) {
                        this.focus();
                    }
                });
            }
            return Promise.resolve(undefined);
        }
        updateContentAreas() {
            const isTreeEmpty = !this.root.children || this.root.children.length === 0;
            // Hide tree container only when there is a message and tree is empty and not refreshing
            if (this._messageValue && isTreeEmpty && !this.refreshing) {
                DOM.addClass(this.treeContainer, 'hide');
                this.domNode.setAttribute('tabindex', '0');
            }
            else {
                DOM.removeClass(this.treeContainer, 'hide');
                this.domNode.removeAttribute('tabindex');
            }
        }
        onSelection({ payload }) {
            if (payload && (!!payload.didClickOnTwistie || payload.source === 'api')) {
                return;
            }
            const selection = this.tree.getSelection()[0];
            if (selection) {
                if (selection.command) {
                    const originalEvent = payload && payload.originalEvent;
                    const isMouseEvent = payload && payload.origin === 'mouse';
                    const isDoubleClick = isMouseEvent && originalEvent && originalEvent.detail === 2;
                    if (!isMouseEvent || this.tree.openOnSingleClick || isDoubleClick) {
                        this.commandService.executeCommand(selection.command.id, ...(selection.command.arguments || []));
                    }
                }
            }
        }
    };
    CustomTreeView = __decorate([
        __param(2, extensions_1.IExtensionService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, commands_1.ICommandService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, progress_1.IProgressService2)
    ], CustomTreeView);
    exports.CustomTreeView = CustomTreeView;
    class TreeDataSource {
        constructor(treeView, withProgress) {
            this.treeView = treeView;
            this.withProgress = withProgress;
        }
        getId(tree, node) {
            return node.handle;
        }
        hasChildren(tree, node) {
            return !!this.treeView.dataProvider && node.collapsibleState !== views_1.TreeItemCollapsibleState.None;
        }
        getChildren(tree, node) {
            if (this.treeView.dataProvider) {
                return this.withProgress(this.treeView.dataProvider.getChildren(node));
            }
            return Promise.resolve([]);
        }
        shouldAutoexpand(tree, node) {
            return node.collapsibleState === views_1.TreeItemCollapsibleState.Expanded;
        }
        getParent(tree, node) {
            return Promise.resolve(null);
        }
    }
    // todo@joh,sandy make this proper and contributable from extensions
    themeService_1.registerThemingParticipant((theme, collector) => {
        const findMatchHighlightColor = theme.getColor(colorRegistry_1.editorFindMatchHighlight);
        if (findMatchHighlightColor) {
            collector.addRule(`.file-icon-themable-tree .monaco-tree-row .content .monaco-highlighted-label .highlight { color: unset !important; background-color: ${findMatchHighlightColor}; }`);
            collector.addRule(`.monaco-tl-contents .monaco-highlighted-label .highlight { color: unset !important; background-color: ${findMatchHighlightColor}; }`);
        }
        const findMatchHighlightColorBorder = theme.getColor(colorRegistry_1.editorFindMatchHighlightBorder);
        if (findMatchHighlightColorBorder) {
            collector.addRule(`.file-icon-themable-tree .monaco-tree-row .content .monaco-highlighted-label .highlight { color: unset !important; border: 1px dotted ${findMatchHighlightColorBorder}; box-sizing: border-box; }`);
            collector.addRule(`.monaco-tl-contents .monaco-highlighted-label .highlight { color: unset !important; border: 1px dotted ${findMatchHighlightColorBorder}; box-sizing: border-box; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message a { color: ${link}; }`);
        }
        const focustBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focustBorderColor) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message a:focus { outline: 1px solid ${focustBorderColor}; outline-offset: -1px; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message code { background-color: ${codeBackground}; }`);
        }
    });
    let TreeRenderer = class TreeRenderer {
        constructor(treeViewId, menus, labels, actionItemProvider, themeService, configurationService, labelService) {
            this.treeViewId = treeViewId;
            this.menus = menus;
            this.labels = labels;
            this.actionItemProvider = actionItemProvider;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.labelService = labelService;
        }
        getHeight(tree, element) {
            return TreeRenderer.ITEM_HEIGHT;
        }
        getTemplateId(tree, element) {
            return TreeRenderer.TREE_TEMPLATE_ID;
        }
        renderTemplate(tree, templateId, container) {
            DOM.addClass(container, 'custom-view-tree-node-item');
            const icon = DOM.append(container, DOM.$('.custom-view-tree-node-item-icon'));
            const resourceLabel = this.labels.create(container, { supportHighlights: true, donotSupportOcticons: true });
            DOM.addClass(resourceLabel.element, 'custom-view-tree-node-item-resourceLabel');
            const actionsContainer = DOM.append(resourceLabel.element, DOM.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionItemProvider: this.actionItemProvider,
                actionRunner: new MultipleSelectionActionRunner(() => tree.getSelection())
            });
            return { resourceLabel, icon, actionBar, aligner: new Aligner(container, tree, this.themeService) };
        }
        renderElement(tree, node, templateId, templateData) {
            const resource = node.resourceUri ? uri_1.URI.revive(node.resourceUri) : null;
            const treeItemLabel = node.label ? node.label : resource ? { label: resources_1.basename(resource) } : undefined;
            const description = types_1.isString(node.description) ? node.description : resource && node.description === true ? this.labelService.getUriLabel(resources_1.dirname(resource), { relative: true }) : undefined;
            const label = treeItemLabel ? treeItemLabel.label : undefined;
            const matches = treeItemLabel && treeItemLabel.highlights ? treeItemLabel.highlights.map(([start, end]) => ({ start, end })) : undefined;
            const icon = this.themeService.getTheme().type === themeService_1.LIGHT ? node.icon : node.iconDark;
            const iconUrl = icon ? uri_1.URI.revive(icon) : null;
            const title = node.tooltip ? node.tooltip : resource ? undefined : label;
            // reset
            templateData.actionBar.clear();
            if (resource || node.themeIcon) {
                const fileDecorations = this.configurationService.getValue('explorer.decorations');
                templateData.resourceLabel.setResource({ name: label, description, resource: resource ? resource : uri_1.URI.parse('missing:_icon_resource') }, { fileKind: this.getFileKind(node), title, hideIcon: !!iconUrl, fileDecorations, extraClasses: ['custom-view-tree-node-item-resourceLabel'], matches });
            }
            else {
                templateData.resourceLabel.setResource({ name: label, description }, { title, hideIcon: true, extraClasses: ['custom-view-tree-node-item-resourceLabel'], matches });
            }
            templateData.icon.style.backgroundImage = iconUrl ? `url('${iconUrl.toString(true)}')` : '';
            DOM.toggleClass(templateData.icon, 'custom-view-tree-node-item-icon', !!iconUrl);
            templateData.actionBar.context = { $treeViewId: this.treeViewId, $treeItemHandle: node.handle };
            templateData.actionBar.push(this.menus.getResourceActions(node), { icon: true, label: false });
            templateData.aligner.treeItem = node;
        }
        getFileKind(node) {
            if (node.themeIcon) {
                switch (node.themeIcon.id) {
                    case themeService_1.FileThemeIcon.id:
                        return files_1.FileKind.FILE;
                    case themeService_1.FolderThemeIcon.id:
                        return files_1.FileKind.FOLDER;
                }
            }
            return node.collapsibleState === views_1.TreeItemCollapsibleState.Collapsed || node.collapsibleState === views_1.TreeItemCollapsibleState.Expanded ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
        }
        disposeTemplate(tree, templateId, templateData) {
            templateData.resourceLabel.dispose();
            templateData.actionBar.dispose();
            templateData.aligner.dispose();
        }
    };
    TreeRenderer.ITEM_HEIGHT = 22;
    TreeRenderer.TREE_TEMPLATE_ID = 'treeExplorer';
    TreeRenderer = __decorate([
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, label_1.ILabelService)
    ], TreeRenderer);
    class Aligner extends lifecycle_1.Disposable {
        constructor(container, tree, themeService) {
            super();
            this.container = container;
            this.tree = tree;
            this.themeService = themeService;
            this._register(this.themeService.onDidFileIconThemeChange(() => this.render()));
        }
        set treeItem(treeItem) {
            this._treeItem = treeItem;
            this.render();
        }
        render() {
            if (this._treeItem) {
                DOM.toggleClass(this.container, 'align-icon-with-twisty', this.hasToAlignIconWithTwisty());
            }
        }
        hasToAlignIconWithTwisty() {
            if (this._treeItem.collapsibleState !== views_1.TreeItemCollapsibleState.None) {
                return false;
            }
            if (!this.hasIcon(this._treeItem)) {
                return false;
            }
            const parent = this.tree.getNavigator(this._treeItem).parent() || this.tree.getInput();
            if (this.hasIcon(parent)) {
                return false;
            }
            return !!parent.children && parent.children.every(c => c.collapsibleState === views_1.TreeItemCollapsibleState.None || !this.hasIcon(c));
        }
        hasIcon(node) {
            const icon = this.themeService.getTheme().type === themeService_1.LIGHT ? node.icon : node.iconDark;
            if (icon) {
                return true;
            }
            if (node.resourceUri || node.themeIcon) {
                const fileIconTheme = this.themeService.getFileIconTheme();
                const isFolder = node.themeIcon ? node.themeIcon.id === themeService_1.FolderThemeIcon.id : node.collapsibleState !== views_1.TreeItemCollapsibleState.None;
                if (isFolder) {
                    return fileIconTheme.hasFileIcons && fileIconTheme.hasFolderIcons;
                }
                return fileIconTheme.hasFileIcons;
            }
            return false;
        }
    }
    let TreeController = class TreeController extends listService_1.WorkbenchTreeController {
        constructor(treeViewId, menus, contextMenuService, _keybindingService, configurationService) {
            super({}, configurationService);
            this.treeViewId = treeViewId;
            this.menus = menus;
            this.contextMenuService = contextMenuService;
            this._keybindingService = _keybindingService;
        }
        shouldToggleExpansion(element, event, origin) {
            return element.command ? this.isClickOnTwistie(event) : super.shouldToggleExpansion(element, event, origin);
        }
        onContextMenu(tree, node, event) {
            event.preventDefault();
            event.stopPropagation();
            tree.setFocus(node);
            const actions = this.menus.getResourceContextActions(node);
            if (!actions.length) {
                return true;
            }
            const anchor = { x: event.posx, y: event.posy };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionItem: (action) => {
                    const keybinding = this._keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionbar_1.ActionItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return null;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        tree.domFocus();
                    }
                },
                getActionsContext: () => ({ $treeViewId: this.treeViewId, $treeItemHandle: node.handle }),
                actionRunner: new MultipleSelectionActionRunner(() => tree.getSelection())
            });
            return true;
        }
    };
    TreeController = __decorate([
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService)
    ], TreeController);
    class MultipleSelectionActionRunner extends actions_1.ActionRunner {
        constructor(getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
        }
        runAction(action, context) {
            if (action instanceof actions_2.MenuItemAction) {
                const selection = this.getSelectedResources();
                const filteredSelection = selection.filter(s => s !== context);
                if (selection.length === filteredSelection.length || selection.length === 1) {
                    return action.run(context);
                }
                return action.run(context, ...filteredSelection);
            }
            return super.runAction(action, context);
        }
    }
    let TreeMenus = class TreeMenus extends lifecycle_1.Disposable {
        constructor(id, contextKeyService, menuService, contextMenuService) {
            super();
            this.id = id;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
        }
        getResourceActions(element) {
            return this.getActions(36 /* ViewItemContext */, { key: 'viewItem', value: element.contextValue }).primary;
        }
        getResourceContextActions(element) {
            return this.getActions(36 /* ViewItemContext */, { key: 'viewItem', value: element.contextValue }).secondary;
        }
        getActions(menuId, context) {
            const contextKeyService = this.contextKeyService.createScoped();
            contextKeyService.createKey('view', this.id);
            contextKeyService.createKey(context.key, context.value);
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            menuItemActionItem_1.fillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));
            menu.dispose();
            contextKeyService.dispose();
            return result;
        }
    };
    TreeMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_2.IMenuService),
        __param(3, contextView_1.IContextMenuService)
    ], TreeMenus);
    let MarkdownRenderer = class MarkdownRenderer {
        constructor(_openerService) {
            this._openerService = _openerService;
        }
        getOptions(disposeables) {
            return {
                actionHandler: {
                    callback: (content) => {
                        let uri;
                        try {
                            uri = uri_1.URI.parse(content);
                        }
                        catch (_a) {
                            // ignore
                        }
                        if (uri && this._openerService) {
                            this._openerService.open(uri).catch(errors_1.onUnexpectedError);
                        }
                    },
                    disposeables
                }
            };
        }
        render(markdown) {
            let disposeables = [];
            const element = markdown ? htmlContentRenderer_1.renderMarkdown(markdown, this.getOptions(disposeables)) : document.createElement('span');
            return {
                element,
                dispose: () => lifecycle_1.dispose(disposeables)
            };
        }
    };
    MarkdownRenderer = __decorate([
        __param(0, opener_1.IOpenerService)
    ], MarkdownRenderer);
});
//# sourceMappingURL=customView.js.map