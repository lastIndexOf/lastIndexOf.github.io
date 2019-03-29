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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/actions", "vs/base/common/platform", "vs/workbench/common/editor/untitledEditorInput", "vs/workbench/common/editor", "vs/base/common/lifecycle", "vs/workbench/services/untitled/common/untitledEditorService", "vs/editor/contrib/linesOperations/linesOperations", "vs/editor/contrib/indentation/indentation", "vs/workbench/browser/parts/editor/binaryEditor", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/quickOpen/common/quickOpen", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/config/commonEditorConfig", "vs/platform/commands/common/commands", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/services/resourceConfiguration", "vs/platform/configuration/common/configuration", "vs/base/common/objects", "vs/editor/browser/editorBrowser", "vs/base/common/network", "vs/workbench/services/preferences/common/preferences", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/base/common/async", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/platform/accessibility/common/accessibility", "vs/css!./media/editorstatus"], function (require, exports, nls, dom_1, strings, resources_1, types, uri_1, actions_1, platform_1, untitledEditorInput_1, editor_1, lifecycle_1, untitledEditorService_1, linesOperations_1, indentation_1, binaryEditor_1, binaryDiffEditor_1, editorService_1, quickOpen_1, files_1, instantiation_1, modeService_1, modelService_1, range_1, selection_1, commonEditorConfig_1, commands_1, extensionManagement_1, textfiles_1, resourceConfiguration_1, configuration_1, objects_1, editorBrowser_1, network_1, preferences_1, quickInput_1, getIconClasses_1, async_1, notification_1, event_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SideBySideEditorEncodingSupport {
        constructor(master, details) {
            this.master = master;
            this.details = details;
        }
        getEncoding() {
            return this.master.getEncoding(); // always report from modified (right hand) side
        }
        setEncoding(encoding, mode) {
            [this.master, this.details].forEach(s => s.setEncoding(encoding, mode));
        }
    }
    function toEditorWithEncodingSupport(input) {
        // Untitled Editor
        if (input instanceof untitledEditorInput_1.UntitledEditorInput) {
            return input;
        }
        // Side by Side (diff) Editor
        if (input instanceof editor_1.SideBySideEditorInput) {
            const masterEncodingSupport = toEditorWithEncodingSupport(input.master);
            const detailsEncodingSupport = toEditorWithEncodingSupport(input.details);
            if (masterEncodingSupport && detailsEncodingSupport) {
                return new SideBySideEditorEncodingSupport(masterEncodingSupport, detailsEncodingSupport);
            }
            return masterEncodingSupport;
        }
        // File or Resource Editor
        let encodingSupport = input;
        if (types.areFunctions(encodingSupport.setEncoding, encodingSupport.getEncoding)) {
            return encodingSupport;
        }
        // Unsupported for any other editor
        return null;
    }
    class StateChange {
        constructor() {
            this.indentation = false;
            this.selectionStatus = false;
            this.mode = false;
            this.encoding = false;
            this.EOL = false;
            this.tabFocusMode = false;
            this.screenReaderMode = false;
            this.metadata = false;
        }
        combine(other) {
            this.indentation = this.indentation || other.indentation;
            this.selectionStatus = this.selectionStatus || other.selectionStatus;
            this.mode = this.mode || other.mode;
            this.encoding = this.encoding || other.encoding;
            this.EOL = this.EOL || other.EOL;
            this.tabFocusMode = this.tabFocusMode || other.tabFocusMode;
            this.screenReaderMode = this.screenReaderMode || other.screenReaderMode;
            this.metadata = this.metadata || other.metadata;
        }
    }
    class State {
        get selectionStatus() { return this._selectionStatus; }
        get mode() { return this._mode; }
        get encoding() { return this._encoding; }
        get EOL() { return this._EOL; }
        get indentation() { return this._indentation; }
        get tabFocusMode() { return this._tabFocusMode; }
        get screenReaderMode() { return this._screenReaderMode; }
        get metadata() { return this._metadata; }
        constructor() {
            this._selectionStatus = null;
            this._mode = null;
            this._encoding = null;
            this._EOL = null;
            this._tabFocusMode = false;
            this._screenReaderMode = false;
            this._metadata = null;
        }
        update(update) {
            const e = new StateChange();
            let somethingChanged = false;
            if (typeof update.selectionStatus !== 'undefined') {
                if (this._selectionStatus !== update.selectionStatus) {
                    this._selectionStatus = update.selectionStatus;
                    somethingChanged = true;
                    e.selectionStatus = true;
                }
            }
            if (typeof update.indentation !== 'undefined') {
                if (this._indentation !== update.indentation) {
                    this._indentation = update.indentation;
                    somethingChanged = true;
                    e.indentation = true;
                }
            }
            if (typeof update.mode !== 'undefined') {
                if (this._mode !== update.mode) {
                    this._mode = update.mode;
                    somethingChanged = true;
                    e.mode = true;
                }
            }
            if (typeof update.encoding !== 'undefined') {
                if (this._encoding !== update.encoding) {
                    this._encoding = update.encoding;
                    somethingChanged = true;
                    e.encoding = true;
                }
            }
            if (typeof update.EOL !== 'undefined') {
                if (this._EOL !== update.EOL) {
                    this._EOL = update.EOL;
                    somethingChanged = true;
                    e.EOL = true;
                }
            }
            if (typeof update.tabFocusMode !== 'undefined') {
                if (this._tabFocusMode !== update.tabFocusMode) {
                    this._tabFocusMode = update.tabFocusMode;
                    somethingChanged = true;
                    e.tabFocusMode = true;
                }
            }
            if (typeof update.screenReaderMode !== 'undefined') {
                if (this._screenReaderMode !== update.screenReaderMode) {
                    this._screenReaderMode = update.screenReaderMode;
                    somethingChanged = true;
                    e.screenReaderMode = true;
                }
            }
            if (typeof update.metadata !== 'undefined') {
                if (this._metadata !== update.metadata) {
                    this._metadata = update.metadata;
                    somethingChanged = true;
                    e.metadata = true;
                }
            }
            if (somethingChanged) {
                return e;
            }
            return null;
        }
    }
    const nlsSingleSelectionRange = nls.localize('singleSelectionRange', "Ln {0}, Col {1} ({2} selected)");
    const nlsSingleSelection = nls.localize('singleSelection', "Ln {0}, Col {1}");
    const nlsMultiSelectionRange = nls.localize('multiSelectionRange', "{0} selections ({1} characters selected)");
    const nlsMultiSelection = nls.localize('multiSelection', "{0} selections");
    const nlsEOLLF = nls.localize('endOfLineLineFeed', "LF");
    const nlsEOLCRLF = nls.localize('endOfLineCarriageReturnLineFeed', "CRLF");
    const nlsTabFocusMode = nls.localize('tabFocusModeEnabled', "Tab Moves Focus");
    const nlsScreenReaderDetected = nls.localize('screenReaderDetected', "Screen Reader Optimized");
    const nlsScreenReaderDetectedTitle = nls.localize('screenReaderDetectedExtra', "If you are not using a Screen Reader, please change the setting `editor.accessibilitySupport` to \"off\".");
    function setDisplay(el, desiredValue) {
        if (el.style.display !== desiredValue) {
            el.style.display = desiredValue;
        }
    }
    function show(el) {
        setDisplay(el, '');
    }
    function hide(el) {
        setDisplay(el, 'none');
    }
    let EditorStatus = class EditorStatus {
        constructor(editorService, quickOpenService, instantiationService, untitledEditorService, modeService, textFileService, configurationService, notificationService, accessibilityService) {
            this.editorService = editorService;
            this.quickOpenService = quickOpenService;
            this.instantiationService = instantiationService;
            this.untitledEditorService = untitledEditorService;
            this.modeService = modeService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.accessibilityService = accessibilityService;
            this._promptedScreenReader = false;
            this.toDispose = [];
            this.activeEditorListeners = [];
            this.state = new State();
        }
        render(container) {
            this.element = dom_1.append(container, dom_1.$('.editor-statusbar-item'));
            this.tabFocusModeElement = dom_1.append(this.element, dom_1.$('a.editor-status-tabfocusmode.status-bar-info'));
            this.tabFocusModeElement.title = nls.localize('disableTabMode', "Disable Accessibility Mode");
            this.tabFocusModeElement.onclick = () => this.onTabFocusModeClick();
            this.tabFocusModeElement.textContent = nlsTabFocusMode;
            hide(this.tabFocusModeElement);
            this.screenRedearModeElement = dom_1.append(this.element, dom_1.$('a.editor-status-screenreadermode.status-bar-info'));
            this.screenRedearModeElement.textContent = nlsScreenReaderDetected;
            this.screenRedearModeElement.title = nlsScreenReaderDetectedTitle;
            this.screenRedearModeElement.onclick = () => this.onScreenReaderModeClick();
            hide(this.screenRedearModeElement);
            this.selectionElement = dom_1.append(this.element, dom_1.$('a.editor-status-selection'));
            this.selectionElement.title = nls.localize('gotoLine', "Go to Line");
            this.selectionElement.onclick = () => this.onSelectionClick();
            hide(this.selectionElement);
            this.indentationElement = dom_1.append(this.element, dom_1.$('a.editor-status-indentation'));
            this.indentationElement.title = nls.localize('selectIndentation', "Select Indentation");
            this.indentationElement.onclick = () => this.onIndentationClick();
            hide(this.indentationElement);
            this.encodingElement = dom_1.append(this.element, dom_1.$('a.editor-status-encoding'));
            this.encodingElement.title = nls.localize('selectEncoding', "Select Encoding");
            this.encodingElement.onclick = () => this.onEncodingClick();
            hide(this.encodingElement);
            this.eolElement = dom_1.append(this.element, dom_1.$('a.editor-status-eol'));
            this.eolElement.title = nls.localize('selectEOL', "Select End of Line Sequence");
            this.eolElement.onclick = () => this.onEOLClick();
            hide(this.eolElement);
            this.modeElement = dom_1.append(this.element, dom_1.$('a.editor-status-mode'));
            this.modeElement.title = nls.localize('selectLanguageMode', "Select Language Mode");
            this.modeElement.onclick = () => this.onModeClick();
            hide(this.modeElement);
            this.metadataElement = dom_1.append(this.element, dom_1.$('span.editor-status-metadata'));
            this.metadataElement.title = nls.localize('fileInfo', "File Information");
            hide(this.metadataElement);
            this.delayedRender = null;
            this.toRender = null;
            this.toDispose.push({
                dispose: () => {
                    if (this.delayedRender) {
                        this.delayedRender.dispose();
                        this.delayedRender = null;
                    }
                }
            }, this.editorService.onDidActiveEditorChange(() => this.updateStatusBar()), this.untitledEditorService.onDidChangeEncoding(r => this.onResourceEncodingChange(r)), this.textFileService.models.onModelEncodingChanged(e => this.onResourceEncodingChange(e.resource)), commonEditorConfig_1.TabFocus.onDidChangeTabFocus(e => this.onTabFocusModeChange()));
            return lifecycle_1.combinedDisposable(this.toDispose);
        }
        updateState(update) {
            const changed = this.state.update(update);
            if (!changed) {
                // Nothing really changed
                return;
            }
            if (!this.toRender) {
                this.toRender = changed;
                this.delayedRender = dom_1.runAtThisOrScheduleAtNextAnimationFrame(() => {
                    this.delayedRender = null;
                    const toRender = this.toRender;
                    this.toRender = null;
                    if (toRender) {
                        this._renderNow(toRender);
                    }
                });
            }
            else {
                this.toRender.combine(changed);
            }
        }
        _renderNow(changed) {
            if (changed.tabFocusMode) {
                if (this.state.tabFocusMode && this.state.tabFocusMode === true) {
                    show(this.tabFocusModeElement);
                }
                else {
                    hide(this.tabFocusModeElement);
                }
            }
            if (changed.screenReaderMode) {
                if (this.state.screenReaderMode && this.state.screenReaderMode === true) {
                    show(this.screenRedearModeElement);
                }
                else {
                    hide(this.screenRedearModeElement);
                }
            }
            if (changed.indentation) {
                if (this.state.indentation) {
                    this.indentationElement.textContent = this.state.indentation;
                    show(this.indentationElement);
                }
                else {
                    hide(this.indentationElement);
                }
            }
            if (changed.selectionStatus) {
                if (this.state.selectionStatus && !this.state.screenReaderMode) {
                    this.selectionElement.textContent = this.state.selectionStatus;
                    show(this.selectionElement);
                }
                else {
                    hide(this.selectionElement);
                }
            }
            if (changed.encoding) {
                if (this.state.encoding) {
                    this.encodingElement.textContent = this.state.encoding;
                    show(this.encodingElement);
                }
                else {
                    hide(this.encodingElement);
                }
            }
            if (changed.EOL) {
                if (this.state.EOL) {
                    this.eolElement.textContent = this.state.EOL === '\r\n' ? nlsEOLCRLF : nlsEOLLF;
                    show(this.eolElement);
                }
                else {
                    hide(this.eolElement);
                }
            }
            if (changed.mode) {
                if (this.state.mode) {
                    this.modeElement.textContent = this.state.mode;
                    show(this.modeElement);
                }
                else {
                    hide(this.modeElement);
                }
            }
            if (changed.metadata) {
                if (this.state.metadata) {
                    this.metadataElement.textContent = this.state.metadata;
                    show(this.metadataElement);
                }
                else {
                    hide(this.metadataElement);
                }
            }
        }
        getSelectionLabel(info) {
            if (!info || !info.selections) {
                return undefined;
            }
            if (info.selections.length === 1) {
                if (info.charactersSelected) {
                    return strings.format(nlsSingleSelectionRange, info.selections[0].positionLineNumber, info.selections[0].positionColumn, info.charactersSelected);
                }
                return strings.format(nlsSingleSelection, info.selections[0].positionLineNumber, info.selections[0].positionColumn);
            }
            if (info.charactersSelected) {
                return strings.format(nlsMultiSelectionRange, info.selections.length, info.charactersSelected);
            }
            if (info.selections.length > 0) {
                return strings.format(nlsMultiSelection, info.selections.length);
            }
            return undefined;
        }
        onModeClick() {
            const action = this.instantiationService.createInstance(ChangeModeAction, ChangeModeAction.ID, ChangeModeAction.LABEL);
            action.run();
            action.dispose();
        }
        onIndentationClick() {
            const action = this.instantiationService.createInstance(ChangeIndentationAction, ChangeIndentationAction.ID, ChangeIndentationAction.LABEL);
            action.run();
            action.dispose();
        }
        onScreenReaderModeClick() {
            if (!this.screenReaderNotification) {
                this.screenReaderNotification = this.notificationService.prompt(notification_1.Severity.Info, nls.localize('screenReaderDetectedExplanation.question', "Are you using a screen reader to operate VS Code? (Certain features like folding, minimap or word wrap are disabled when using a screen reader)"), [{
                        label: nls.localize('screenReaderDetectedExplanation.answerYes', "Yes"),
                        run: () => {
                            this.configurationService.updateValue('editor.accessibilitySupport', 'on', 1 /* USER */);
                        }
                    }, {
                        label: nls.localize('screenReaderDetectedExplanation.answerNo', "No"),
                        run: () => {
                            this.configurationService.updateValue('editor.accessibilitySupport', 'off', 1 /* USER */);
                        }
                    }], { sticky: true });
                event_1.Event.once(this.screenReaderNotification.onDidClose)(() => {
                    this.screenReaderNotification = null;
                });
            }
        }
        onSelectionClick() {
            this.quickOpenService.show(':'); // "Go to line"
        }
        onEOLClick() {
            const action = this.instantiationService.createInstance(ChangeEOLAction, ChangeEOLAction.ID, ChangeEOLAction.LABEL);
            action.run();
            action.dispose();
        }
        onEncodingClick() {
            const action = this.instantiationService.createInstance(ChangeEncodingAction, ChangeEncodingAction.ID, ChangeEncodingAction.LABEL);
            action.run();
            action.dispose();
        }
        onTabFocusModeClick() {
            commonEditorConfig_1.TabFocus.setTabFocusMode(false);
        }
        updateStatusBar() {
            const activeControl = this.editorService.activeControl;
            const activeCodeEditor = activeControl ? types.withNullAsUndefined(editorBrowser_1.getCodeEditor(activeControl.getControl())) : undefined;
            // Update all states
            this.onScreenReaderModeChange(activeCodeEditor);
            this.onSelectionChange(activeCodeEditor);
            this.onModeChange(activeCodeEditor);
            this.onEOLChange(activeCodeEditor);
            this.onEncodingChange(activeControl);
            this.onIndentationChange(activeCodeEditor);
            this.onMetadataChange(activeControl);
            // Dispose old active editor listeners
            lifecycle_1.dispose(this.activeEditorListeners);
            // Attach new listeners to active editor
            if (activeCodeEditor) {
                // Hook Listener for Configuration changes
                this.activeEditorListeners.push(activeCodeEditor.onDidChangeConfiguration((event) => {
                    if (event.accessibilitySupport) {
                        this.onScreenReaderModeChange(activeCodeEditor);
                    }
                }));
                // Hook Listener for Selection changes
                this.activeEditorListeners.push(activeCodeEditor.onDidChangeCursorPosition((event) => {
                    this.onSelectionChange(activeCodeEditor);
                }));
                // Hook Listener for mode changes
                this.activeEditorListeners.push(activeCodeEditor.onDidChangeModelLanguage((event) => {
                    this.onModeChange(activeCodeEditor);
                }));
                // Hook Listener for content changes
                this.activeEditorListeners.push(activeCodeEditor.onDidChangeModelContent((e) => {
                    this.onEOLChange(activeCodeEditor);
                    const selections = activeCodeEditor.getSelections();
                    if (selections) {
                        for (const change of e.changes) {
                            if (selections.some(selection => range_1.Range.areIntersecting(selection, change.range))) {
                                this.onSelectionChange(activeCodeEditor);
                                break;
                            }
                        }
                    }
                }));
                // Hook Listener for content options changes
                this.activeEditorListeners.push(activeCodeEditor.onDidChangeModelOptions((event) => {
                    this.onIndentationChange(activeCodeEditor);
                }));
            }
            // Handle binary editors
            else if (activeControl instanceof binaryEditor_1.BaseBinaryResourceEditor || activeControl instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                const binaryEditors = [];
                if (activeControl instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                    const details = activeControl.getDetailsEditor();
                    if (details instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                        binaryEditors.push(details);
                    }
                    const master = activeControl.getMasterEditor();
                    if (master instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                        binaryEditors.push(master);
                    }
                }
                else {
                    binaryEditors.push(activeControl);
                }
                binaryEditors.forEach(editor => {
                    this.activeEditorListeners.push(editor.onMetadataChanged(metadata => {
                        this.onMetadataChange(activeControl);
                    }));
                    this.activeEditorListeners.push(editor.onDidOpenInPlace(() => {
                        this.updateStatusBar();
                    }));
                });
            }
        }
        onModeChange(editorWidget) {
            let info = { mode: undefined };
            // We only support text based editors
            if (editorWidget) {
                const textModel = editorWidget.getModel();
                if (textModel) {
                    // Compute mode
                    const modeId = textModel.getLanguageIdentifier().language;
                    info = { mode: this.modeService.getLanguageName(modeId) || undefined };
                }
            }
            this.updateState(info);
        }
        onIndentationChange(editorWidget) {
            const update = { indentation: undefined };
            if (editorWidget) {
                const model = editorWidget.getModel();
                if (model) {
                    const modelOpts = model.getOptions();
                    update.indentation = (modelOpts.insertSpaces
                        ? nls.localize('spacesSize', "Spaces: {0}", modelOpts.indentSize)
                        : nls.localize({ key: 'tabSize', comment: ['Tab corresponds to the tab key'] }, "Tab Size: {0}", modelOpts.tabSize));
                }
            }
            this.updateState(update);
        }
        onMetadataChange(editor) {
            const update = { metadata: undefined };
            if (editor instanceof binaryEditor_1.BaseBinaryResourceEditor || editor instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                update.metadata = editor.getMetadata();
            }
            this.updateState(update);
        }
        onScreenReaderModeChange(editorWidget) {
            let screenReaderMode = false;
            // We only support text based editors
            if (editorWidget) {
                const screenReaderDetected = (this.accessibilityService.getAccessibilitySupport() === 2 /* Enabled */);
                if (screenReaderDetected) {
                    const screenReaderConfiguration = this.configurationService.getValue('editor').accessibilitySupport;
                    if (screenReaderConfiguration === 'auto') {
                        // show explanation
                        if (!this._promptedScreenReader) {
                            this._promptedScreenReader = true;
                            setTimeout(() => {
                                this.onScreenReaderModeClick();
                            }, 100);
                        }
                    }
                }
                screenReaderMode = (editorWidget.getConfiguration().accessibilitySupport === 2 /* Enabled */);
            }
            if (screenReaderMode === false && this.screenReaderNotification) {
                this.screenReaderNotification.close();
            }
            this.updateState({ screenReaderMode: screenReaderMode });
        }
        onSelectionChange(editorWidget) {
            const info = {};
            // We only support text based editors
            if (editorWidget) {
                // Compute selection(s)
                info.selections = editorWidget.getSelections() || [];
                // Compute selection length
                info.charactersSelected = 0;
                const textModel = editorWidget.getModel();
                if (textModel) {
                    info.selections.forEach(selection => {
                        info.charactersSelected += textModel.getValueLengthInRange(selection);
                    });
                }
                // Compute the visible column for one selection. This will properly handle tabs and their configured widths
                if (info.selections.length === 1) {
                    const visibleColumn = editorWidget.getVisibleColumnFromPosition(editorWidget.getPosition());
                    let selectionClone = info.selections[0].clone(); // do not modify the original position we got from the editor
                    selectionClone = new selection_1.Selection(selectionClone.selectionStartLineNumber, selectionClone.selectionStartColumn, selectionClone.positionLineNumber, visibleColumn);
                    info.selections[0] = selectionClone;
                }
            }
            this.updateState({ selectionStatus: this.getSelectionLabel(info) });
        }
        onEOLChange(editorWidget) {
            const info = { EOL: undefined };
            if (editorWidget && !editorWidget.getConfiguration().readOnly) {
                const codeEditorModel = editorWidget.getModel();
                if (codeEditorModel) {
                    info.EOL = codeEditorModel.getEOL();
                }
            }
            this.updateState(info);
        }
        onEncodingChange(e) {
            if (e && !this.isActiveEditor(e)) {
                return;
            }
            const info = { encoding: undefined };
            // We only support text based editors
            if (e && (editorBrowser_1.isCodeEditor(e.getControl()) || editorBrowser_1.isDiffEditor(e.getControl()))) {
                const encodingSupport = e.input ? toEditorWithEncodingSupport(e.input) : null;
                if (encodingSupport) {
                    const rawEncoding = encodingSupport.getEncoding();
                    const encodingInfo = files_1.SUPPORTED_ENCODINGS[rawEncoding];
                    if (encodingInfo) {
                        info.encoding = encodingInfo.labelShort; // if we have a label, take it from there
                    }
                    else {
                        info.encoding = rawEncoding; // otherwise use it raw
                    }
                }
            }
            this.updateState(info);
        }
        onResourceEncodingChange(resource) {
            const activeControl = this.editorService.activeControl;
            if (activeControl) {
                const activeResource = editor_1.toResource(activeControl.input, { supportSideBySide: true });
                if (activeResource && activeResource.toString() === resource.toString()) {
                    return this.onEncodingChange(activeControl); // only update if the encoding changed for the active resource
                }
            }
        }
        onTabFocusModeChange() {
            const info = { tabFocusMode: commonEditorConfig_1.TabFocus.getTabFocusMode() };
            this.updateState(info);
        }
        isActiveEditor(control) {
            const activeControl = this.editorService.activeControl;
            return !!activeControl && activeControl === control;
        }
    };
    EditorStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, quickOpen_1.IQuickOpenService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, untitledEditorService_1.IUntitledEditorService),
        __param(4, modeService_1.IModeService),
        __param(5, textfiles_1.ITextFileService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, notification_1.INotificationService),
        __param(8, accessibility_1.IAccessibilityService)
    ], EditorStatus);
    exports.EditorStatus = EditorStatus;
    function isWritableCodeEditor(codeEditor) {
        if (!codeEditor) {
            return false;
        }
        const config = codeEditor.getConfiguration();
        return (!config.readOnly);
    }
    function isWritableBaseEditor(e) {
        return e && isWritableCodeEditor(editorBrowser_1.getCodeEditor(e.getControl()) || undefined);
    }
    let ShowLanguageExtensionsAction = class ShowLanguageExtensionsAction extends actions_1.Action {
        constructor(fileExtension, commandService, galleryService) {
            super(ShowLanguageExtensionsAction.ID, nls.localize('showLanguageExtensions', "Search Marketplace Extensions for '{0}'...", fileExtension));
            this.fileExtension = fileExtension;
            this.commandService = commandService;
            this.enabled = galleryService.isEnabled();
        }
        run() {
            return this.commandService.executeCommand('workbench.extensions.action.showExtensionsForLanguage', this.fileExtension).then(() => undefined);
        }
    };
    ShowLanguageExtensionsAction.ID = 'workbench.action.showLanguageExtensions';
    ShowLanguageExtensionsAction = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, extensionManagement_1.IExtensionGalleryService)
    ], ShowLanguageExtensionsAction);
    exports.ShowLanguageExtensionsAction = ShowLanguageExtensionsAction;
    let ChangeModeAction = class ChangeModeAction extends actions_1.Action {
        constructor(actionId, actionLabel, modeService, modelService, editorService, configurationService, quickInputService, preferencesService, instantiationService, untitledEditorService) {
            super(actionId, actionLabel);
            this.modeService = modeService;
            this.modelService = modelService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.preferencesService = preferencesService;
            this.instantiationService = instantiationService;
            this.untitledEditorService = untitledEditorService;
        }
        run() {
            const activeTextEditorWidget = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorWidget);
            if (!activeTextEditorWidget) {
                return this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
            }
            const textModel = activeTextEditorWidget.getModel();
            const resource = this.editorService.activeEditor ? editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: true }) : null;
            let hasLanguageSupport = !!resource;
            if (resource && resource.scheme === network_1.Schemas.untitled && !this.untitledEditorService.hasAssociatedFilePath(resource)) {
                hasLanguageSupport = false; // no configuration for untitled resources (e.g. "Untitled-1")
            }
            // Compute mode
            let currentModeId;
            let modeId;
            if (textModel) {
                modeId = textModel.getLanguageIdentifier().language;
                currentModeId = this.modeService.getLanguageName(modeId) || undefined;
            }
            // All languages are valid picks
            const languages = this.modeService.getRegisteredLanguageNames();
            const picks = languages.sort().map((lang, index) => {
                let description;
                if (currentModeId === lang) {
                    description = nls.localize('languageDescription', "({0}) - Configured Language", this.modeService.getModeIdForLanguageName(lang.toLowerCase()));
                }
                else {
                    description = nls.localize('languageDescriptionConfigured', "({0})", this.modeService.getModeIdForLanguageName(lang.toLowerCase()));
                }
                // construct a fake resource to be able to show nice icons if any
                let fakeResource;
                const extensions = this.modeService.getExtensions(lang);
                if (extensions && extensions.length) {
                    fakeResource = uri_1.URI.file(extensions[0]);
                }
                else {
                    const filenames = this.modeService.getFilenames(lang);
                    if (filenames && filenames.length) {
                        fakeResource = uri_1.URI.file(filenames[0]);
                    }
                }
                return {
                    label: lang,
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, fakeResource),
                    description
                };
            });
            if (hasLanguageSupport) {
                picks.unshift({ type: 'separator', label: nls.localize('languagesPicks', "languages (identifier)") });
            }
            // Offer action to configure via settings
            let configureModeAssociations;
            let configureModeSettings;
            let galleryAction;
            if (hasLanguageSupport && resource) {
                const ext = resources_1.extname(resource) || resources_1.basename(resource);
                galleryAction = this.instantiationService.createInstance(ShowLanguageExtensionsAction, ext);
                if (galleryAction.enabled) {
                    picks.unshift(galleryAction);
                }
                configureModeSettings = { label: nls.localize('configureModeSettings', "Configure '{0}' language based settings...", currentModeId) };
                picks.unshift(configureModeSettings);
                configureModeAssociations = { label: nls.localize('configureAssociationsExt', "Configure File Association for '{0}'...", ext) };
                picks.unshift(configureModeAssociations);
            }
            // Offer to "Auto Detect"
            const autoDetectMode = {
                label: nls.localize('autoDetect', "Auto Detect")
            };
            if (hasLanguageSupport) {
                picks.unshift(autoDetectMode);
            }
            return this.quickInputService.pick(picks, { placeHolder: nls.localize('pickLanguage', "Select Language Mode"), matchOnDescription: true }).then(pick => {
                if (!pick) {
                    return;
                }
                if (pick === galleryAction) {
                    galleryAction.run();
                    return;
                }
                // User decided to permanently configure associations, return right after
                if (pick === configureModeAssociations) {
                    if (resource) {
                        this.configureFileAssociation(resource);
                    }
                    return;
                }
                // User decided to configure settings for current language
                if (pick === configureModeSettings) {
                    this.preferencesService.configureSettingsForLanguage(modeId);
                    return;
                }
                // Change mode for active editor
                const activeEditor = this.editorService.activeEditor;
                const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
                const models = [];
                if (editorBrowser_1.isCodeEditor(activeTextEditorWidget)) {
                    const codeEditorModel = activeTextEditorWidget.getModel();
                    if (codeEditorModel) {
                        models.push(codeEditorModel);
                    }
                }
                else if (editorBrowser_1.isDiffEditor(activeTextEditorWidget)) {
                    const diffEditorModel = activeTextEditorWidget.getModel();
                    if (diffEditorModel) {
                        if (diffEditorModel.original) {
                            models.push(diffEditorModel.original);
                        }
                        if (diffEditorModel.modified) {
                            models.push(diffEditorModel.modified);
                        }
                    }
                }
                // Find mode
                let languageSelection;
                if (pick === autoDetectMode) {
                    if (textModel) {
                        const resource = editor_1.toResource(activeEditor, { supportSideBySide: true });
                        if (resource) {
                            languageSelection = this.modeService.createByFilepathOrFirstLine(resource.fsPath, textModel.getLineContent(1));
                        }
                    }
                }
                else {
                    languageSelection = this.modeService.createByLanguageName(pick.label);
                }
                // Change mode
                if (typeof languageSelection !== 'undefined') {
                    for (const textModel of models) {
                        this.modelService.setMode(textModel, languageSelection);
                    }
                }
            });
        }
        configureFileAssociation(resource) {
            const extension = resources_1.extname(resource);
            const base = resources_1.basename(resource);
            const currentAssociation = this.modeService.getModeIdByFilepathOrFirstLine(base);
            const languages = this.modeService.getRegisteredLanguageNames();
            const picks = languages.sort().map((lang, index) => {
                const id = this.modeService.getModeIdForLanguageName(lang.toLowerCase());
                return {
                    id,
                    label: lang,
                    description: (id === currentAssociation) ? nls.localize('currentAssociation', "Current Association") : undefined
                };
            });
            setTimeout(() => {
                this.quickInputService.pick(picks, { placeHolder: nls.localize('pickLanguageToConfigure', "Select Language Mode to Associate with '{0}'", extension || base) }).then(language => {
                    if (language) {
                        const fileAssociationsConfig = this.configurationService.inspect(files_1.FILES_ASSOCIATIONS_CONFIG);
                        let associationKey;
                        if (extension && base[0] !== '.') {
                            associationKey = `*${extension}`; // only use "*.ext" if the file path is in the form of <name>.<ext>
                        }
                        else {
                            associationKey = base; // otherwise use the basename (e.g. .gitignore, Dockerfile)
                        }
                        // If the association is already being made in the workspace, make sure to target workspace settings
                        let target = 1 /* USER */;
                        if (fileAssociationsConfig.workspace && !!fileAssociationsConfig.workspace[associationKey]) {
                            target = 2 /* WORKSPACE */;
                        }
                        // Make sure to write into the value of the target and not the merged value from USER and WORKSPACE config
                        const currentAssociations = objects_1.deepClone((target === 2 /* WORKSPACE */) ? fileAssociationsConfig.workspace : fileAssociationsConfig.user) || Object.create(null);
                        currentAssociations[associationKey] = language.id;
                        this.configurationService.updateValue(files_1.FILES_ASSOCIATIONS_CONFIG, currentAssociations, target);
                    }
                });
            }, 50 /* quick open is sensitive to being opened so soon after another */);
        }
    };
    ChangeModeAction.ID = 'workbench.action.editor.changeLanguageMode';
    ChangeModeAction.LABEL = nls.localize('changeMode', "Change Language Mode");
    ChangeModeAction = __decorate([
        __param(2, modeService_1.IModeService),
        __param(3, modelService_1.IModelService),
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, quickInput_1.IQuickInputService),
        __param(7, preferences_1.IPreferencesService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, untitledEditorService_1.IUntitledEditorService)
    ], ChangeModeAction);
    exports.ChangeModeAction = ChangeModeAction;
    let ChangeIndentationAction = class ChangeIndentationAction extends actions_1.Action {
        constructor(actionId, actionLabel, editorService, quickInputService) {
            super(actionId, actionLabel);
            this.editorService = editorService;
            this.quickInputService = quickInputService;
        }
        run() {
            const activeTextEditorWidget = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorWidget);
            if (!activeTextEditorWidget) {
                return this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
            }
            if (!isWritableCodeEditor(activeTextEditorWidget)) {
                return this.quickInputService.pick([{ label: nls.localize('noWritableCodeEditor', "The active code editor is read-only.") }]);
            }
            const picks = [
                activeTextEditorWidget.getAction(indentation_1.IndentUsingSpaces.ID),
                activeTextEditorWidget.getAction(indentation_1.IndentUsingTabs.ID),
                activeTextEditorWidget.getAction(indentation_1.DetectIndentation.ID),
                activeTextEditorWidget.getAction(indentation_1.IndentationToSpacesAction.ID),
                activeTextEditorWidget.getAction(indentation_1.IndentationToTabsAction.ID),
                activeTextEditorWidget.getAction(linesOperations_1.TrimTrailingWhitespaceAction.ID)
            ].map((a) => {
                return {
                    id: a.id,
                    label: a.label,
                    detail: (platform_1.language === platform_1.LANGUAGE_DEFAULT) ? undefined : a.alias,
                    run: () => {
                        activeTextEditorWidget.focus();
                        a.run();
                    }
                };
            });
            picks.splice(3, 0, { type: 'separator', label: nls.localize('indentConvert', "convert file") });
            picks.unshift({ type: 'separator', label: nls.localize('indentView', "change view") });
            return this.quickInputService.pick(picks, { placeHolder: nls.localize('pickAction', "Select Action"), matchOnDetail: true }).then(action => action && action.run());
        }
    };
    ChangeIndentationAction.ID = 'workbench.action.editor.changeIndentation';
    ChangeIndentationAction.LABEL = nls.localize('changeIndentation', "Change Indentation");
    ChangeIndentationAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, quickInput_1.IQuickInputService)
    ], ChangeIndentationAction);
    let ChangeEOLAction = class ChangeEOLAction extends actions_1.Action {
        constructor(actionId, actionLabel, editorService, quickInputService) {
            super(actionId, actionLabel);
            this.editorService = editorService;
            this.quickInputService = quickInputService;
        }
        run() {
            const activeTextEditorWidget = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorWidget);
            if (!activeTextEditorWidget) {
                return this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
            }
            if (!isWritableCodeEditor(activeTextEditorWidget)) {
                return this.quickInputService.pick([{ label: nls.localize('noWritableCodeEditor', "The active code editor is read-only.") }]);
            }
            const textModel = activeTextEditorWidget.getModel();
            const EOLOptions = [
                { label: nlsEOLLF, eol: 0 /* LF */ },
                { label: nlsEOLCRLF, eol: 1 /* CRLF */ },
            ];
            const selectedIndex = (textModel && textModel.getEOL() === '\n') ? 0 : 1;
            return this.quickInputService.pick(EOLOptions, { placeHolder: nls.localize('pickEndOfLine', "Select End of Line Sequence"), activeItem: EOLOptions[selectedIndex] }).then(eol => {
                if (eol) {
                    const activeCodeEditor = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorWidget);
                    if (activeCodeEditor && activeCodeEditor.hasModel() && isWritableCodeEditor(activeCodeEditor)) {
                        const textModel = activeCodeEditor.getModel();
                        textModel.pushEOL(eol.eol);
                    }
                }
            });
        }
    };
    ChangeEOLAction.ID = 'workbench.action.editor.changeEOL';
    ChangeEOLAction.LABEL = nls.localize('changeEndOfLine', "Change End of Line Sequence");
    ChangeEOLAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, quickInput_1.IQuickInputService)
    ], ChangeEOLAction);
    exports.ChangeEOLAction = ChangeEOLAction;
    let ChangeEncodingAction = class ChangeEncodingAction extends actions_1.Action {
        constructor(actionId, actionLabel, editorService, quickInputService, textResourceConfigurationService, fileService) {
            super(actionId, actionLabel);
            this.editorService = editorService;
            this.quickInputService = quickInputService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.fileService = fileService;
        }
        run() {
            if (!editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorWidget)) {
                return this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
            }
            const activeControl = this.editorService.activeControl;
            if (!activeControl) {
                return this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
            }
            const encodingSupport = toEditorWithEncodingSupport(activeControl.input);
            if (!encodingSupport) {
                return this.quickInputService.pick([{ label: nls.localize('noFileEditor', "No file active at this time") }]);
            }
            let saveWithEncodingPick;
            let reopenWithEncodingPick;
            if (platform_1.language === platform_1.LANGUAGE_DEFAULT) {
                saveWithEncodingPick = { label: nls.localize('saveWithEncoding', "Save with Encoding") };
                reopenWithEncodingPick = { label: nls.localize('reopenWithEncoding', "Reopen with Encoding") };
            }
            else {
                saveWithEncodingPick = { label: nls.localize('saveWithEncoding', "Save with Encoding"), detail: 'Save with Encoding', };
                reopenWithEncodingPick = { label: nls.localize('reopenWithEncoding', "Reopen with Encoding"), detail: 'Reopen with Encoding' };
            }
            let pickActionPromise;
            if (encodingSupport instanceof untitledEditorInput_1.UntitledEditorInput) {
                pickActionPromise = Promise.resolve(saveWithEncodingPick);
            }
            else if (!isWritableBaseEditor(activeControl)) {
                pickActionPromise = Promise.resolve(reopenWithEncodingPick);
            }
            else {
                pickActionPromise = this.quickInputService.pick([reopenWithEncodingPick, saveWithEncodingPick], { placeHolder: nls.localize('pickAction', "Select Action"), matchOnDetail: true });
            }
            return pickActionPromise.then(action => {
                if (!action) {
                    return undefined;
                }
                const resource = editor_1.toResource(activeControl.input, { supportSideBySide: true });
                return async_1.timeout(50 /* quick open is sensitive to being opened so soon after another */)
                    .then(() => {
                    if (!resource || !this.fileService.canHandleResource(resource)) {
                        return Promise.resolve(null); // encoding detection only possible for resources the file service can handle
                    }
                    return this.fileService.resolveContent(resource, { autoGuessEncoding: true, acceptTextOnly: true }).then(content => content.encoding, err => null);
                })
                    .then((guessedEncoding) => {
                    const isReopenWithEncoding = (action === reopenWithEncodingPick);
                    const configuredEncoding = this.textResourceConfigurationService.getValue(types.withNullAsUndefined(resource), 'files.encoding');
                    let directMatchIndex;
                    let aliasMatchIndex;
                    // All encodings are valid picks
                    const picks = Object.keys(files_1.SUPPORTED_ENCODINGS)
                        .sort((k1, k2) => {
                        if (k1 === configuredEncoding) {
                            return -1;
                        }
                        else if (k2 === configuredEncoding) {
                            return 1;
                        }
                        return files_1.SUPPORTED_ENCODINGS[k1].order - files_1.SUPPORTED_ENCODINGS[k2].order;
                    })
                        .filter(k => {
                        if (k === guessedEncoding && guessedEncoding !== configuredEncoding) {
                            return false; // do not show encoding if it is the guessed encoding that does not match the configured
                        }
                        return !isReopenWithEncoding || !files_1.SUPPORTED_ENCODINGS[k].encodeOnly; // hide those that can only be used for encoding if we are about to decode
                    })
                        .map((key, index) => {
                        if (key === encodingSupport.getEncoding()) {
                            directMatchIndex = index;
                        }
                        else if (files_1.SUPPORTED_ENCODINGS[key].alias === encodingSupport.getEncoding()) {
                            aliasMatchIndex = index;
                        }
                        return { id: key, label: files_1.SUPPORTED_ENCODINGS[key].labelLong, description: key };
                    });
                    const items = picks.slice();
                    // If we have a guessed encoding, show it first unless it matches the configured encoding
                    if (guessedEncoding && configuredEncoding !== guessedEncoding && files_1.SUPPORTED_ENCODINGS[guessedEncoding]) {
                        picks.unshift({ type: 'separator' });
                        picks.unshift({ id: guessedEncoding, label: files_1.SUPPORTED_ENCODINGS[guessedEncoding].labelLong, description: nls.localize('guessedEncoding', "Guessed from content") });
                    }
                    return this.quickInputService.pick(picks, {
                        placeHolder: isReopenWithEncoding ? nls.localize('pickEncodingForReopen', "Select File Encoding to Reopen File") : nls.localize('pickEncodingForSave', "Select File Encoding to Save with"),
                        activeItem: items[typeof directMatchIndex === 'number' ? directMatchIndex : typeof aliasMatchIndex === 'number' ? aliasMatchIndex : -1]
                    }).then(encoding => {
                        if (!encoding) {
                            return;
                        }
                        const activeControl = this.editorService.activeControl;
                        if (!activeControl) {
                            return;
                        }
                        const encodingSupport = toEditorWithEncodingSupport(activeControl.input);
                        if (typeof encoding.id !== 'undefined' && encodingSupport && encodingSupport.getEncoding() !== encoding.id) {
                            encodingSupport.setEncoding(encoding.id, isReopenWithEncoding ? 1 /* Decode */ : 0 /* Encode */); // Set new encoding
                        }
                    });
                });
            });
        }
    };
    ChangeEncodingAction.ID = 'workbench.action.editor.changeEncoding';
    ChangeEncodingAction.LABEL = nls.localize('changeEncoding', "Change File Encoding");
    ChangeEncodingAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, files_1.IFileService)
    ], ChangeEncodingAction);
    exports.ChangeEncodingAction = ChangeEncodingAction;
});
//# sourceMappingURL=editorStatus.js.map