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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/breadcrumbs/breadcrumbsWidget", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/contrib/documentSymbols/outlineModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/quickOpen/common/quickOpen", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/browser/parts/editor/breadcrumbsModel", "vs/workbench/browser/parts/editor/breadcrumbsPicker", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/telemetry/common/telemetry", "vs/editor/browser/services/codeEditorService", "vs/base/browser/browser", "vs/base/common/types", "vs/css!./media/breadcrumbscontrol"], function (require, exports, dom, mouseEvent_1, breadcrumbsWidget_1, iconLabel_1, arrays_1, async_1, lifecycle_1, network_1, resources_1, uri_1, editorBrowser_1, range_1, modes_1, outlineModel_1, nls_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, files_1, instantiation_1, keybindingsRegistry_1, listService_1, quickOpen_1, styler_1, themeService_1, workspace_1, labels_1, breadcrumbs_1, breadcrumbsModel_1, breadcrumbsPicker_1, editor_1, editorService_1, editorGroupsService_1, telemetry_1, codeEditorService_1, browser_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let Item = class Item extends breadcrumbsWidget_1.BreadcrumbsItem {
        constructor(element, options, _instantiationService) {
            super();
            this.element = element;
            this.options = options;
            this._instantiationService = _instantiationService;
            this._disposables = [];
        }
        dispose() {
            lifecycle_1.dispose(this._disposables);
        }
        equals(other) {
            if (!(other instanceof Item)) {
                return false;
            }
            if (this.element instanceof breadcrumbsModel_1.FileElement && other.element instanceof breadcrumbsModel_1.FileElement) {
                return resources_1.isEqual(this.element.uri, other.element.uri);
            }
            if (this.element instanceof outlineModel_1.TreeElement && other.element instanceof outlineModel_1.TreeElement) {
                return this.element.id === other.element.id;
            }
            return false;
        }
        render(container) {
            if (this.element instanceof breadcrumbsModel_1.FileElement) {
                // file/folder
                let label = this._instantiationService.createInstance(labels_1.ResourceLabel, container, {});
                label.element.setFile(this.element.uri, {
                    hidePath: true,
                    hideIcon: this.element.kind === files_1.FileKind.FOLDER || !this.options.showFileIcons,
                    fileKind: this.element.kind,
                    fileDecorations: { colors: this.options.showDecorationColors, badges: false },
                });
                dom.addClass(container, files_1.FileKind[this.element.kind].toLowerCase());
                this._disposables.push(label);
            }
            else if (this.element instanceof outlineModel_1.OutlineModel) {
                // has outline element but not in one
                let label = document.createElement('div');
                label.innerHTML = '&hellip;';
                label.className = 'hint-more';
                container.appendChild(label);
            }
            else if (this.element instanceof outlineModel_1.OutlineGroup) {
                // provider
                let label = new iconLabel_1.IconLabel(container);
                label.setLabel(this.element.provider.displayName);
                this._disposables.push(label);
            }
            else if (this.element instanceof outlineModel_1.OutlineElement) {
                // symbol
                if (this.options.showSymbolIcons) {
                    let icon = document.createElement('div');
                    icon.className = modes_1.symbolKindToCssClass(this.element.symbol.kind);
                    container.appendChild(icon);
                    dom.addClass(container, 'shows-symbol-icon');
                }
                let label = new iconLabel_1.IconLabel(container);
                let title = this.element.symbol.name.replace(/\r|\n|\r\n/g, '\u23CE');
                label.setLabel(title);
                this._disposables.push(label);
            }
        }
    };
    Item = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], Item);
    let BreadcrumbsControl = class BreadcrumbsControl {
        constructor(container, _options, _editorGroup, _contextKeyService, _contextViewService, _editorService, _codeEditorService, _workspaceService, _instantiationService, _themeService, _quickOpenService, _configurationService, _fileService, _telemetryService, breadcrumbsService) {
            this._options = _options;
            this._editorGroup = _editorGroup;
            this._contextKeyService = _contextKeyService;
            this._contextViewService = _contextViewService;
            this._editorService = _editorService;
            this._codeEditorService = _codeEditorService;
            this._workspaceService = _workspaceService;
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._quickOpenService = _quickOpenService;
            this._configurationService = _configurationService;
            this._fileService = _fileService;
            this._telemetryService = _telemetryService;
            this._disposables = new Array();
            this._breadcrumbsDisposables = new Array();
            this._breadcrumbsPickerShowing = false;
            this.domNode = document.createElement('div');
            dom.addClass(this.domNode, 'breadcrumbs-control');
            dom.append(container, this.domNode);
            this._widget = new breadcrumbsWidget_1.BreadcrumbsWidget(this.domNode);
            this._widget.onDidSelectItem(this._onSelectEvent, this, this._disposables);
            this._widget.onDidFocusItem(this._onFocusEvent, this, this._disposables);
            this._widget.onDidChangeFocus(this._updateCkBreadcrumbsActive, this, this._disposables);
            this._disposables.push(styler_1.attachBreadcrumbsStyler(this._widget, this._themeService, { breadcrumbsBackground: _options.breadcrumbsBackground }));
            this._ckBreadcrumbsPossible = BreadcrumbsControl.CK_BreadcrumbsPossible.bindTo(this._contextKeyService);
            this._ckBreadcrumbsVisible = BreadcrumbsControl.CK_BreadcrumbsVisible.bindTo(this._contextKeyService);
            this._ckBreadcrumbsActive = BreadcrumbsControl.CK_BreadcrumbsActive.bindTo(this._contextKeyService);
            this._cfUseQuickPick = breadcrumbs_1.BreadcrumbsConfig.UseQuickPick.bindTo(_configurationService);
            this._disposables.push(breadcrumbsService.register(this._editorGroup.id, this._widget));
        }
        dispose() {
            this._disposables = lifecycle_1.dispose(this._disposables);
            this._breadcrumbsDisposables = lifecycle_1.dispose(this._breadcrumbsDisposables);
            this._ckBreadcrumbsPossible.reset();
            this._ckBreadcrumbsVisible.reset();
            this._ckBreadcrumbsActive.reset();
            this._cfUseQuickPick.dispose();
            this._widget.dispose();
            this.domNode.remove();
        }
        layout(dim) {
            this._widget.layout(dim);
        }
        isHidden() {
            return dom.hasClass(this.domNode, 'hidden');
        }
        hide() {
            this._breadcrumbsDisposables = lifecycle_1.dispose(this._breadcrumbsDisposables);
            this._ckBreadcrumbsVisible.set(false);
            dom.toggleClass(this.domNode, 'hidden', true);
        }
        update() {
            this._breadcrumbsDisposables = lifecycle_1.dispose(this._breadcrumbsDisposables);
            // honor diff editors and such
            let input = this._editorGroup.activeEditor;
            if (input instanceof editor_1.SideBySideEditorInput) {
                input = input.master;
            }
            if (!input || !input.getResource() || (input.getResource().scheme !== network_1.Schemas.untitled && !this._fileService.canHandleResource(input.getResource()))) {
                // cleanup and return when there is no input or when
                // we cannot handle this input
                this._ckBreadcrumbsPossible.set(false);
                if (!this.isHidden()) {
                    this.hide();
                    return true;
                }
                else {
                    return false;
                }
            }
            dom.toggleClass(this.domNode, 'hidden', false);
            this._ckBreadcrumbsVisible.set(true);
            this._ckBreadcrumbsPossible.set(true);
            let editor = this._getActiveCodeEditor();
            let model = new breadcrumbsModel_1.EditorBreadcrumbsModel(input.getResource(), editor, this._workspaceService, this._configurationService);
            dom.toggleClass(this.domNode, 'relative-path', model.isRelative());
            let updateBreadcrumbs = () => {
                let items = model.getElements().map(element => new Item(element, this._options, this._instantiationService));
                this._widget.setItems(items);
                this._widget.reveal(items[items.length - 1]);
            };
            let listener = model.onDidUpdate(updateBreadcrumbs);
            updateBreadcrumbs();
            this._breadcrumbsDisposables = [model, listener];
            // close picker on hide/update
            this._breadcrumbsDisposables.push({
                dispose: () => {
                    if (this._breadcrumbsPickerShowing) {
                        this._contextViewService.hideContextView(this);
                    }
                }
            });
            return true;
        }
        _getActiveCodeEditor() {
            if (!this._editorGroup.activeControl) {
                return undefined;
            }
            let control = this._editorGroup.activeControl.getControl();
            let editor;
            if (editorBrowser_1.isCodeEditor(control)) {
                editor = control;
            }
            else if (editorBrowser_1.isDiffEditor(control)) {
                editor = control.getModifiedEditor();
            }
            return editor;
        }
        _onFocusEvent(event) {
            if (event.item && this._breadcrumbsPickerShowing) {
                return this._widget.setSelection(event.item);
            }
        }
        _onSelectEvent(event) {
            if (!event.item) {
                return;
            }
            if (event.item === this._breadcrumbsPickerIgnoreOnceItem) {
                this._breadcrumbsPickerIgnoreOnceItem = undefined;
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                return;
            }
            const { element } = event.item;
            this._editorGroup.focus();
            /* __GDPR__
                "breadcrumbs/select" : {
                    "type": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this._telemetryService.publicLog('breadcrumbs/select', { type: element instanceof outlineModel_1.TreeElement ? 'symbol' : 'file' });
            const group = this._getEditorGroup(event.payload);
            if (group !== undefined) {
                // reveal the item
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                this._revealInEditor(event, element, group);
                return;
            }
            if (this._cfUseQuickPick.getValue()) {
                // using quick pick
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                this._quickOpenService.show(element instanceof outlineModel_1.TreeElement ? '@' : '');
                return;
            }
            // show picker
            let picker;
            let editor = this._getActiveCodeEditor();
            let editorDecorations = [];
            let editorViewState;
            this._contextViewService.showContextView({
                render: (parent) => {
                    picker = breadcrumbsPicker_1.createBreadcrumbsPicker(this._instantiationService, parent, element);
                    let selectListener = picker.onDidPickElement(data => {
                        if (data.target) {
                            editorViewState = undefined;
                        }
                        this._contextViewService.hideContextView(this);
                        this._revealInEditor(event, data.target, this._getEditorGroup(data.payload && data.payload.originalEvent), (data.payload && data.payload.originalEvent && data.payload.originalEvent.middleButton));
                        /* __GDPR__
                            "breadcrumbs/open" : {
                                "type": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                            }
                        */
                        this._telemetryService.publicLog('breadcrumbs/open', { type: !data ? 'nothing' : data.target instanceof outlineModel_1.TreeElement ? 'symbol' : 'file' });
                    });
                    let focusListener = picker.onDidFocusElement(data => {
                        if (!editor || !(data.target instanceof outlineModel_1.OutlineElement)) {
                            return;
                        }
                        if (!editorViewState) {
                            editorViewState = types_1.withNullAsUndefined(editor.saveViewState());
                        }
                        const { symbol } = data.target;
                        editor.revealRangeInCenter(symbol.range, 0 /* Smooth */);
                        editorDecorations = editor.deltaDecorations(editorDecorations, [{
                                range: symbol.range,
                                options: {
                                    className: 'rangeHighlight',
                                    isWholeLine: true
                                }
                            }]);
                    });
                    let zoomListener = browser_1.onDidChangeZoomLevel(() => {
                        this._contextViewService.hideContextView(this);
                    });
                    let focusTracker = dom.trackFocus(parent);
                    let blurListener = focusTracker.onDidBlur(() => {
                        this._breadcrumbsPickerIgnoreOnceItem = this._widget.isDOMFocused() ? event.item : undefined;
                        this._contextViewService.hideContextView(this);
                    });
                    this._breadcrumbsPickerShowing = true;
                    this._updateCkBreadcrumbsActive();
                    return lifecycle_1.combinedDisposable([
                        picker,
                        selectListener,
                        focusListener,
                        zoomListener,
                        focusTracker,
                        blurListener
                    ]);
                },
                getAnchor: () => {
                    let maxInnerWidth = window.innerWidth - 8 /*a little less the full widget*/;
                    let maxHeight = Math.min(window.innerHeight * 0.7, 300);
                    let pickerWidth = Math.min(maxInnerWidth, Math.max(240, maxInnerWidth / 4.17));
                    let pickerArrowSize = 8;
                    let pickerArrowOffset;
                    let data = dom.getDomNodePagePosition(event.node.firstChild);
                    let y = data.top + data.height + pickerArrowSize;
                    if (y + maxHeight >= window.innerHeight) {
                        maxHeight = window.innerHeight - y - 30 /* room for shadow and status bar*/;
                    }
                    let x = data.left;
                    if (x + pickerWidth >= maxInnerWidth) {
                        x = maxInnerWidth - pickerWidth;
                    }
                    if (event.payload instanceof mouseEvent_1.StandardMouseEvent) {
                        let maxPickerArrowOffset = pickerWidth - 2 * pickerArrowSize;
                        pickerArrowOffset = event.payload.posx - x;
                        if (pickerArrowOffset > maxPickerArrowOffset) {
                            x = Math.min(maxInnerWidth - pickerWidth, x + pickerArrowOffset - maxPickerArrowOffset);
                            pickerArrowOffset = maxPickerArrowOffset;
                        }
                    }
                    else {
                        pickerArrowOffset = (data.left + (data.width * 0.3)) - x;
                    }
                    picker.show(element, maxHeight, pickerWidth, pickerArrowSize, Math.max(0, pickerArrowOffset));
                    return { x, y };
                },
                onHide: (data) => {
                    if (editor) {
                        editor.deltaDecorations(editorDecorations, []);
                        if (editorViewState) {
                            editor.restoreViewState(editorViewState);
                        }
                    }
                    this._breadcrumbsPickerShowing = false;
                    this._updateCkBreadcrumbsActive();
                    if (data === this) {
                        this._widget.setFocused(undefined);
                        this._widget.setSelection(undefined);
                    }
                }
            });
        }
        _updateCkBreadcrumbsActive() {
            const value = this._widget.isDOMFocused() || this._breadcrumbsPickerShowing;
            this._ckBreadcrumbsActive.set(value);
        }
        _revealInEditor(event, element, group, pinned = false) {
            if (element instanceof breadcrumbsModel_1.FileElement) {
                if (element.kind === files_1.FileKind.FILE) {
                    // open file in any editor
                    this._editorService.openEditor({ resource: element.uri, options: { pinned: pinned } }, group);
                }
                else {
                    // show next picker
                    let items = this._widget.getItems();
                    let idx = items.indexOf(event.item);
                    this._widget.setFocused(items[idx + 1]);
                    this._widget.setSelection(items[idx + 1], BreadcrumbsControl.Payload_Pick);
                }
            }
            else if (element instanceof outlineModel_1.OutlineElement) {
                // open symbol in code editor
                const model = outlineModel_1.OutlineModel.get(element);
                if (model) {
                    this._codeEditorService.openCodeEditor({
                        resource: model.textModel.uri,
                        options: {
                            selection: range_1.Range.collapseToStart(element.symbol.selectionRange),
                            revealInCenterIfOutsideViewport: true
                        }
                    }, types_1.withUndefinedAsNull(this._getActiveCodeEditor()), group === editorService_1.SIDE_GROUP);
                }
            }
        }
        _getEditorGroup(data) {
            if (data === BreadcrumbsControl.Payload_RevealAside || (data instanceof mouseEvent_1.StandardMouseEvent && data.altKey)) {
                return editorService_1.SIDE_GROUP;
            }
            else if (data === BreadcrumbsControl.Payload_Reveal || (data instanceof mouseEvent_1.StandardMouseEvent && data.metaKey)) {
                return editorService_1.ACTIVE_GROUP;
            }
            else {
                return undefined;
            }
        }
    };
    BreadcrumbsControl.HEIGHT = 22;
    BreadcrumbsControl.Payload_Reveal = {};
    BreadcrumbsControl.Payload_RevealAside = {};
    BreadcrumbsControl.Payload_Pick = {};
    BreadcrumbsControl.CK_BreadcrumbsPossible = new contextkey_1.RawContextKey('breadcrumbsPossible', false);
    BreadcrumbsControl.CK_BreadcrumbsVisible = new contextkey_1.RawContextKey('breadcrumbsVisible', false);
    BreadcrumbsControl.CK_BreadcrumbsActive = new contextkey_1.RawContextKey('breadcrumbsActive', false);
    BreadcrumbsControl = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextViewService),
        __param(5, editorService_1.IEditorService),
        __param(6, codeEditorService_1.ICodeEditorService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, themeService_1.IThemeService),
        __param(10, quickOpen_1.IQuickOpenService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, files_1.IFileService),
        __param(13, telemetry_1.ITelemetryService),
        __param(14, breadcrumbs_1.IBreadcrumbsService)
    ], BreadcrumbsControl);
    exports.BreadcrumbsControl = BreadcrumbsControl;
    //#region commands
    // toggle command
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: 'breadcrumbs.toggle',
            title: { value: nls_1.localize('cmd.toggle', "Toggle Breadcrumbs"), original: 'View: Toggle Breadcrumbs' },
            category: nls_1.localize('cmd.category', "View")
        }
    });
    actions_1.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '5_editor',
        order: 99,
        command: {
            id: 'breadcrumbs.toggle',
            title: nls_1.localize('miToggleBreadcrumbs', "Toggle &&Breadcrumbs"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.breadcrumbs.enabled', true)
        }
    });
    commands_1.CommandsRegistry.registerCommand('breadcrumbs.toggle', accessor => {
        let config = accessor.get(configuration_1.IConfigurationService);
        let value = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config).getValue();
        breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config).updateValue(!value);
    });
    // focus/focus-and-select
    function focusAndSelectHandler(accessor, select) {
        // find widget and focus/select
        const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
        const widget = breadcrumbs.getWidget(groups.activeGroup.id);
        if (widget) {
            const item = arrays_1.tail(widget.getItems());
            widget.setFocused(item);
            if (select) {
                widget.setSelection(item, BreadcrumbsControl.Payload_Pick);
            }
        }
    }
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: 'breadcrumbs.focusAndSelect',
            title: { value: nls_1.localize('cmd.focus', "Focus Breadcrumbs"), original: 'Focus Breadcrumbs' },
            precondition: BreadcrumbsControl.CK_BreadcrumbsVisible
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusAndSelect',
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 84 /* US_DOT */,
        when: BreadcrumbsControl.CK_BreadcrumbsPossible,
        handler: accessor => focusAndSelectHandler(accessor, true)
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focus',
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 80 /* US_SEMICOLON */,
        when: BreadcrumbsControl.CK_BreadcrumbsPossible,
        handler: accessor => focusAndSelectHandler(accessor, false)
    });
    // this commands is only enabled when breadcrumbs are
    // disabled which it then enables and focuses
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.toggleToOn',
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 84 /* US_DOT */,
        when: contextkey_1.ContextKeyExpr.not('config.breadcrumbs.enabled'),
        handler: (accessor) => __awaiter(this, void 0, void 0, function* () {
            const instant = accessor.get(instantiation_1.IInstantiationService);
            const config = accessor.get(configuration_1.IConfigurationService);
            // check if enabled and iff not enable
            const isEnabled = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config);
            if (!isEnabled.getValue()) {
                yield isEnabled.updateValue(true);
                yield async_1.timeout(50); // hacky - the widget might not be ready yet...
            }
            return instant.invokeFunction(focusAndSelectHandler, true);
        })
    });
    // navigation
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusNext',
        weight: 200 /* WorkbenchContrib */,
        primary: 17 /* RightArrow */,
        secondary: [2048 /* CtrlCmd */ | 17 /* RightArrow */],
        mac: {
            primary: 17 /* RightArrow */,
            secondary: [512 /* Alt */ | 17 /* RightArrow */],
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusNext();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusPrevious',
        weight: 200 /* WorkbenchContrib */,
        primary: 15 /* LeftArrow */,
        secondary: [2048 /* CtrlCmd */ | 15 /* LeftArrow */],
        mac: {
            primary: 15 /* LeftArrow */,
            secondary: [512 /* Alt */ | 15 /* LeftArrow */],
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusPrev();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.selectFocused',
        weight: 200 /* WorkbenchContrib */,
        primary: 3 /* Enter */,
        secondary: [18 /* DownArrow */],
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setSelection(widget.getFocused(), BreadcrumbsControl.Payload_Pick);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.revealFocused',
        weight: 200 /* WorkbenchContrib */,
        primary: 10 /* Space */,
        secondary: [2048 /* CtrlCmd */ | 3 /* Enter */],
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setSelection(widget.getFocused(), BreadcrumbsControl.Payload_Reveal);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.selectEditor',
        weight: 200 /* WorkbenchContrib */ + 1,
        primary: 9 /* Escape */,
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setFocused(undefined);
            widget.setSelection(undefined);
            if (groups.activeGroup.activeControl) {
                groups.activeGroup.activeControl.focus();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.revealFocusedFromTreeAside',
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const editors = accessor.get(editorService_1.IEditorService);
            const lists = accessor.get(listService_1.IListService);
            const element = lists.lastFocusedList ? lists.lastFocusedList.getFocus() : undefined;
            if (element instanceof outlineModel_1.OutlineElement) {
                const outlineElement = outlineModel_1.OutlineModel.get(element);
                if (!outlineElement) {
                    return undefined;
                }
                // open symbol in editor
                return editors.openEditor({
                    resource: outlineElement.textModel.uri,
                    options: { selection: range_1.Range.collapseToStart(element.symbol.selectionRange) }
                }, editorService_1.SIDE_GROUP);
            }
            else if (element && uri_1.URI.isUri(element.resource)) {
                // open file in editor
                return editors.openEditor({
                    resource: element.resource,
                }, editorService_1.SIDE_GROUP);
            }
            else {
                // ignore
                return undefined;
            }
        }
    });
});
//#endregion
//# sourceMappingURL=breadcrumbsControl.js.map