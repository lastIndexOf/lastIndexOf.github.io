/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/tree/browser/treeDefaults", "vs/base/parts/tree/browser/treeModel", "./treeView", "vs/base/common/iterator", "vs/base/common/event", "vs/base/common/color", "vs/base/common/objects", "vs/css!./tree"], function (require, exports, TreeDefaults, Model, View, iterator_1, event_1, color_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TreeContext {
        constructor(tree, configuration, options = {}) {
            this.tree = tree;
            this.configuration = configuration;
            this.options = options;
            if (!configuration.dataSource) {
                throw new Error('You must provide a Data Source to the tree.');
            }
            this.dataSource = configuration.dataSource;
            this.renderer = configuration.renderer;
            this.controller = configuration.controller || new TreeDefaults.DefaultController({ clickBehavior: 1 /* ON_MOUSE_UP */, keyboardSupport: typeof options.keyboardSupport !== 'boolean' || options.keyboardSupport });
            this.dnd = configuration.dnd || new TreeDefaults.DefaultDragAndDrop();
            this.filter = configuration.filter || new TreeDefaults.DefaultFilter();
            this.sorter = configuration.sorter;
            this.accessibilityProvider = configuration.accessibilityProvider || new TreeDefaults.DefaultAccessibilityProvider();
            this.styler = configuration.styler;
        }
    }
    exports.TreeContext = TreeContext;
    const defaultStyles = {
        listFocusBackground: color_1.Color.fromHex('#073655'),
        listActiveSelectionBackground: color_1.Color.fromHex('#0E639C'),
        listActiveSelectionForeground: color_1.Color.fromHex('#FFFFFF'),
        listFocusAndSelectionBackground: color_1.Color.fromHex('#094771'),
        listFocusAndSelectionForeground: color_1.Color.fromHex('#FFFFFF'),
        listInactiveSelectionBackground: color_1.Color.fromHex('#3F3F46'),
        listHoverBackground: color_1.Color.fromHex('#2A2D2E'),
        listDropBackground: color_1.Color.fromHex('#383B3D')
    };
    class Tree {
        constructor(container, configuration, options = {}) {
            this._onDidChangeFocus = new event_1.Relay();
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidChangeSelection = new event_1.Relay();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onHighlightChange = new event_1.Relay();
            this.onDidChangeHighlight = this._onHighlightChange.event;
            this._onDidExpandItem = new event_1.Relay();
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onDidCollapseItem = new event_1.Relay();
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDispose = new event_1.Emitter();
            this.onDidDispose = this._onDispose.event;
            this.container = container;
            objects_1.mixin(options, defaultStyles, false);
            options.twistiePixels = typeof options.twistiePixels === 'number' ? options.twistiePixels : 32;
            options.showTwistie = options.showTwistie === false ? false : true;
            options.indentPixels = typeof options.indentPixels === 'number' ? options.indentPixels : 12;
            options.alwaysFocused = options.alwaysFocused === true ? true : false;
            options.useShadows = options.useShadows === false ? false : true;
            options.paddingOnRow = options.paddingOnRow === false ? false : true;
            options.showLoading = options.showLoading === false ? false : true;
            this.context = new TreeContext(this, configuration, options);
            this.model = new Model.TreeModel(this.context);
            this.view = new View.TreeView(this.context, this.container);
            this.view.setModel(this.model);
            this._onDidChangeFocus.input = this.model.onDidFocus;
            this._onDidChangeSelection.input = this.model.onDidSelect;
            this._onHighlightChange.input = this.model.onDidHighlight;
            this._onDidExpandItem.input = this.model.onDidExpandItem;
            this._onDidCollapseItem.input = this.model.onDidCollapseItem;
        }
        style(styles) {
            this.view.applyStyles(styles);
        }
        get onDidFocus() {
            return this.view && this.view.onDOMFocus;
        }
        get onDidBlur() {
            return this.view && this.view.onDOMBlur;
        }
        get onDidScroll() {
            return this.view && this.view.onDidScroll;
        }
        getHTMLElement() {
            return this.view.getHTMLElement();
        }
        layout(height, width) {
            this.view.layout(height, width);
        }
        domFocus() {
            this.view.focus();
        }
        isDOMFocused() {
            return this.view.isFocused();
        }
        domBlur() {
            this.view.blur();
        }
        onVisible() {
            this.view.onVisible();
        }
        onHidden() {
            this.view.onHidden();
        }
        setInput(element) {
            return this.model.setInput(element);
        }
        getInput() {
            return this.model.getInput();
        }
        refresh(element = null, recursive = true) {
            return this.model.refresh(element, recursive);
        }
        expand(element) {
            return this.model.expand(element);
        }
        expandAll(elements) {
            return this.model.expandAll(elements);
        }
        collapse(element, recursive = false) {
            return this.model.collapse(element, recursive);
        }
        collapseAll(elements = null, recursive = false) {
            return this.model.collapseAll(elements, recursive);
        }
        toggleExpansion(element, recursive = false) {
            return this.model.toggleExpansion(element, recursive);
        }
        toggleExpansionAll(elements) {
            return this.model.toggleExpansionAll(elements);
        }
        isExpanded(element) {
            return this.model.isExpanded(element);
        }
        getExpandedElements() {
            return this.model.getExpandedElements();
        }
        reveal(element, relativeTop = null) {
            return this.model.reveal(element, relativeTop);
        }
        getRelativeTop(element) {
            const item = this.model.getItem(element);
            return item ? this.view.getRelativeTop(item) : 0;
        }
        getFirstVisibleElement() {
            return this.view.getFirstVisibleElement();
        }
        getLastVisibleElement() {
            return this.view.getLastVisibleElement();
        }
        getScrollPosition() {
            return this.view.getScrollPosition();
        }
        setScrollPosition(pos) {
            this.view.setScrollPosition(pos);
        }
        getContentHeight() {
            return this.view.getContentHeight();
        }
        setHighlight(element, eventPayload) {
            this.model.setHighlight(element, eventPayload);
        }
        getHighlight() {
            return this.model.getHighlight();
        }
        isHighlighted(element) {
            return this.model.isFocused(element);
        }
        clearHighlight(eventPayload) {
            this.model.setHighlight(null, eventPayload);
        }
        select(element, eventPayload) {
            this.model.select(element, eventPayload);
        }
        selectRange(fromElement, toElement, eventPayload) {
            this.model.selectRange(fromElement, toElement, eventPayload);
        }
        deselectRange(fromElement, toElement, eventPayload) {
            this.model.deselectRange(fromElement, toElement, eventPayload);
        }
        selectAll(elements, eventPayload) {
            this.model.selectAll(elements, eventPayload);
        }
        deselect(element, eventPayload) {
            this.model.deselect(element, eventPayload);
        }
        deselectAll(elements, eventPayload) {
            this.model.deselectAll(elements, eventPayload);
        }
        setSelection(elements, eventPayload) {
            this.model.setSelection(elements, eventPayload);
        }
        toggleSelection(element, eventPayload) {
            this.model.toggleSelection(element, eventPayload);
        }
        isSelected(element) {
            return this.model.isSelected(element);
        }
        getSelection() {
            return this.model.getSelection();
        }
        clearSelection(eventPayload) {
            this.model.setSelection([], eventPayload);
        }
        selectNext(count, clearSelection, eventPayload) {
            this.model.selectNext(count, clearSelection, eventPayload);
        }
        selectPrevious(count, clearSelection, eventPayload) {
            this.model.selectPrevious(count, clearSelection, eventPayload);
        }
        selectParent(clearSelection, eventPayload) {
            this.model.selectParent(clearSelection, eventPayload);
        }
        setFocus(element, eventPayload) {
            this.model.setFocus(element, eventPayload);
        }
        isFocused(element) {
            return this.model.isFocused(element);
        }
        getFocus() {
            return this.model.getFocus();
        }
        focusNext(count, eventPayload) {
            this.model.focusNext(count, eventPayload);
        }
        focusPrevious(count, eventPayload) {
            this.model.focusPrevious(count, eventPayload);
        }
        focusParent(eventPayload) {
            this.model.focusParent(eventPayload);
        }
        focusFirstChild(eventPayload) {
            this.model.focusFirstChild(eventPayload);
        }
        focusFirst(eventPayload, from) {
            this.model.focusFirst(eventPayload, from);
        }
        focusNth(index, eventPayload) {
            this.model.focusNth(index, eventPayload);
        }
        focusLast(eventPayload, from) {
            this.model.focusLast(eventPayload, from);
        }
        focusNextPage(eventPayload) {
            this.view.focusNextPage(eventPayload);
        }
        focusPreviousPage(eventPayload) {
            this.view.focusPreviousPage(eventPayload);
        }
        clearFocus(eventPayload) {
            this.model.setFocus(null, eventPayload);
        }
        addTraits(trait, elements) {
            this.model.addTraits(trait, elements);
        }
        removeTraits(trait, elements) {
            this.model.removeTraits(trait, elements);
        }
        toggleTrait(trait, element) {
            this.model.hasTrait(trait, element) ? this.model.removeTraits(trait, [element])
                : this.model.addTraits(trait, [element]);
        }
        hasTrait(trait, element) {
            return this.model.hasTrait(trait, element);
        }
        getNavigator(fromElement, subTreeOnly) {
            return new iterator_1.MappedNavigator(this.model.getNavigator(fromElement, subTreeOnly), i => i && i.getElement());
        }
        dispose() {
            this._onDispose.fire();
            if (this.model !== null) {
                this.model.dispose();
                this.model = null; // StrictNullOverride Nulling out ok in dispose
            }
            if (this.view !== null) {
                this.view.dispose();
                this.view = null; // StrictNullOverride Nulling out ok in dispose
            }
            this._onDidChangeFocus.dispose();
            this._onDidChangeSelection.dispose();
            this._onHighlightChange.dispose();
            this._onDidExpandItem.dispose();
            this._onDidCollapseItem.dispose();
            this._onDispose.dispose();
        }
    }
    exports.Tree = Tree;
});
//# sourceMappingURL=treeImpl.js.map