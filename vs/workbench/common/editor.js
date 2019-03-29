/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/base/common/network", "vs/base/common/actions"], function (require, exports, event_1, objects, types, lifecycle_1, instantiation_1, contextkey_1, platform_1, network_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActiveEditorContext = new contextkey_1.RawContextKey('activeEditor', null);
    exports.EditorsVisibleContext = new contextkey_1.RawContextKey('editorIsOpen', false);
    exports.EditorGroupActiveEditorDirtyContext = new contextkey_1.RawContextKey('groupActiveEditorDirty', false);
    exports.NoEditorsVisibleContext = exports.EditorsVisibleContext.toNegated();
    exports.TextCompareEditorVisibleContext = new contextkey_1.RawContextKey('textCompareEditorVisible', false);
    exports.TextCompareEditorActiveContext = new contextkey_1.RawContextKey('textCompareEditorActive', false);
    exports.ActiveEditorGroupEmptyContext = new contextkey_1.RawContextKey('activeEditorGroupEmpty', false);
    exports.MultipleEditorGroupsContext = new contextkey_1.RawContextKey('multipleEditorGroups', false);
    exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext.toNegated();
    exports.InEditorZenModeContext = new contextkey_1.RawContextKey('inZenMode', false);
    exports.SplitEditorsVertically = new contextkey_1.RawContextKey('splitEditorsVertically', false);
    /**
     * Text diff editor id.
     */
    exports.TEXT_DIFF_EDITOR_ID = 'workbench.editors.textDiffEditor';
    /**
     * Binary diff editor id.
     */
    exports.BINARY_DIFF_EDITOR_ID = 'workbench.editors.binaryResourceDiffEditor';
    var Verbosity;
    (function (Verbosity) {
        Verbosity[Verbosity["SHORT"] = 0] = "SHORT";
        Verbosity[Verbosity["MEDIUM"] = 1] = "MEDIUM";
        Verbosity[Verbosity["LONG"] = 2] = "LONG";
    })(Verbosity = exports.Verbosity || (exports.Verbosity = {}));
    /**
     * Editor inputs are lightweight objects that can be passed to the workbench API to open inside the editor part.
     * Each editor input is mapped to an editor that is capable of opening it through the Platform facade.
     */
    class EditorInput extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this._onDispose = this._register(new event_1.Emitter());
            this.disposed = false;
        }
        get onDidChangeDirty() { return this._onDidChangeDirty.event; }
        get onDidChangeLabel() { return this._onDidChangeLabel.event; }
        get onDispose() { return this._onDispose.event; }
        /**
         * Returns the associated resource of this input if any.
         */
        getResource() {
            return null;
        }
        /**
         * Returns the name of this input that can be shown to the user. Examples include showing the name of the input
         * above the editor area when the input is shown.
         */
        getName() {
            return null;
        }
        /**
         * Returns the description of this input that can be shown to the user. Examples include showing the description of
         * the input above the editor area to the side of the name of the input.
         */
        getDescription(verbosity) {
            return null;
        }
        /**
         * Returns the title of this input that can be shown to the user. Examples include showing the title of
         * the input above the editor area as hover over the input label.
         */
        getTitle(verbosity) {
            return this.getName();
        }
        /**
         * Returns the preferred editor for this input. A list of candidate editors is passed in that whee registered
         * for the input. This allows subclasses to decide late which editor to use for the input on a case by case basis.
         */
        getPreferredEditorId(candidates) {
            if (candidates && candidates.length > 0) {
                return candidates[0];
            }
            return null;
        }
        /**
         * Returns a descriptor suitable for telemetry events or null if none is available.
         *
         * Subclasses should extend if they can contribute.
         */
        getTelemetryDescriptor() {
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "typeId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return { typeId: this.getTypeId() };
        }
        /**
         * An editor that is dirty will be asked to be saved once it closes.
         */
        isDirty() {
            return false;
        }
        /**
         * Subclasses should bring up a proper dialog for the user if the editor is dirty and return the result.
         */
        confirmSave() {
            return Promise.resolve(1 /* DONT_SAVE */);
        }
        /**
         * Saves the editor if it is dirty. Subclasses return a promise with a boolean indicating the success of the operation.
         */
        save() {
            return Promise.resolve(true);
        }
        /**
         * Reverts the editor if it is dirty. Subclasses return a promise with a boolean indicating the success of the operation.
         */
        revert(options) {
            return Promise.resolve(true);
        }
        /**
         * Called when this input is no longer opened in any editor. Subclasses can free resources as needed.
         */
        close() {
            this.dispose();
        }
        /**
         * Subclasses can set this to false if it does not make sense to split the editor input.
         */
        supportsSplitEditor() {
            return true;
        }
        /**
         * Returns true if this input is identical to the otherInput.
         */
        matches(otherInput) {
            return this === otherInput;
        }
        /**
         * Returns whether this input was disposed or not.
         */
        isDisposed() {
            return this.disposed;
        }
        /**
         * Called when an editor input is no longer needed. Allows to free up any resources taken by
         * resolving the editor input.
         */
        dispose() {
            this.disposed = true;
            this._onDispose.fire();
            super.dispose();
        }
    }
    exports.EditorInput = EditorInput;
    var ConfirmResult;
    (function (ConfirmResult) {
        ConfirmResult[ConfirmResult["SAVE"] = 0] = "SAVE";
        ConfirmResult[ConfirmResult["DONT_SAVE"] = 1] = "DONT_SAVE";
        ConfirmResult[ConfirmResult["CANCEL"] = 2] = "CANCEL";
    })(ConfirmResult = exports.ConfirmResult || (exports.ConfirmResult = {}));
    var EncodingMode;
    (function (EncodingMode) {
        /**
         * Instructs the encoding support to encode the current input with the provided encoding
         */
        EncodingMode[EncodingMode["Encode"] = 0] = "Encode";
        /**
         * Instructs the encoding support to decode the current input with the provided encoding
         */
        EncodingMode[EncodingMode["Decode"] = 1] = "Decode";
    })(EncodingMode = exports.EncodingMode || (exports.EncodingMode = {}));
    /**
     * Side by side editor inputs that have a master and details side.
     */
    class SideBySideEditorInput extends EditorInput {
        constructor(name, description, _details, _master) {
            super();
            this.name = name;
            this.description = description;
            this._details = _details;
            this._master = _master;
            this.registerListeners();
        }
        get master() {
            return this._master;
        }
        get details() {
            return this._details;
        }
        isDirty() {
            return this.master.isDirty();
        }
        confirmSave() {
            return this.master.confirmSave();
        }
        save() {
            return this.master.save();
        }
        revert() {
            return this.master.revert();
        }
        getTelemetryDescriptor() {
            const descriptor = this.master.getTelemetryDescriptor();
            return objects.assign(descriptor, super.getTelemetryDescriptor());
        }
        registerListeners() {
            // When the details or master input gets disposed, dispose this diff editor input
            const onceDetailsDisposed = event_1.Event.once(this.details.onDispose);
            this._register(onceDetailsDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            const onceMasterDisposed = event_1.Event.once(this.master.onDispose);
            this._register(onceMasterDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Reemit some events from the master side to the outside
            this._register(this.master.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(this.master.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
        }
        resolve() {
            return Promise.resolve(null);
        }
        getTypeId() {
            return SideBySideEditorInput.ID;
        }
        getName() {
            return this.name;
        }
        getDescription() {
            return this.description;
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            if (otherInput) {
                if (!(otherInput instanceof SideBySideEditorInput)) {
                    return false;
                }
                const otherDiffInput = otherInput;
                return this.details.matches(otherDiffInput.details) && this.master.matches(otherDiffInput.master);
            }
            return false;
        }
    }
    SideBySideEditorInput.ID = 'workbench.editorinputs.sidebysideEditorInput';
    exports.SideBySideEditorInput = SideBySideEditorInput;
    /**
     * The editor model is the heavyweight counterpart of editor input. Depending on the editor input, it
     * connects to the disk to retrieve content and may allow for saving it back or reverting it. Editor models
     * are typically cached for some while because they are expensive to construct.
     */
    class EditorModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDispose = this._register(new event_1.Emitter());
        }
        get onDispose() { return this._onDispose.event; }
        /**
         * Causes this model to load returning a promise when loading is completed.
         */
        load() {
            return Promise.resolve(this);
        }
        /**
         * Returns whether this model was loaded or not.
         */
        isResolved() {
            return true;
        }
        /**
         * Subclasses should implement to free resources that have been claimed through loading.
         */
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    }
    exports.EditorModel = EditorModel;
    function isEditorInputWithOptions(obj) {
        const editorInputWithOptions = obj;
        return !!editorInputWithOptions && !!editorInputWithOptions.editor;
    }
    exports.isEditorInputWithOptions = isEditorInputWithOptions;
    /**
     * The editor options is the base class of options that can be passed in when opening an editor.
     */
    class EditorOptions {
        /**
         * Helper to create EditorOptions inline.
         */
        static create(settings) {
            const options = new EditorOptions();
            options.preserveFocus = settings.preserveFocus;
            options.forceReload = settings.forceReload;
            options.revealIfVisible = settings.revealIfVisible;
            options.revealIfOpened = settings.revealIfOpened;
            options.pinned = settings.pinned;
            options.index = settings.index;
            options.inactive = settings.inactive;
            options.ignoreError = settings.ignoreError;
            return options;
        }
    }
    exports.EditorOptions = EditorOptions;
    /**
     * Base Text Editor Options.
     */
    class TextEditorOptions extends EditorOptions {
        static from(input) {
            if (!input || !input.options) {
                return undefined;
            }
            return TextEditorOptions.create(input.options);
        }
        /**
         * Helper to convert options bag to real class
         */
        static create(options = Object.create(null)) {
            const textEditorOptions = new TextEditorOptions();
            if (options.selection) {
                const selection = options.selection;
                textEditorOptions.selection(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
            }
            if (options.viewState) {
                textEditorOptions.editorViewState = options.viewState;
            }
            if (options.forceReload) {
                textEditorOptions.forceReload = true;
            }
            if (options.revealIfVisible) {
                textEditorOptions.revealIfVisible = true;
            }
            if (options.revealIfOpened) {
                textEditorOptions.revealIfOpened = true;
            }
            if (options.preserveFocus) {
                textEditorOptions.preserveFocus = true;
            }
            if (options.revealInCenterIfOutsideViewport) {
                textEditorOptions.revealInCenterIfOutsideViewport = true;
            }
            if (options.pinned) {
                textEditorOptions.pinned = true;
            }
            if (options.inactive) {
                textEditorOptions.inactive = true;
            }
            if (options.ignoreError) {
                textEditorOptions.ignoreError = true;
            }
            if (typeof options.index === 'number') {
                textEditorOptions.index = options.index;
            }
            return textEditorOptions;
        }
        /**
         * Returns if this options object has objects defined for the editor.
         */
        hasOptionsDefined() {
            return !!this.editorViewState || (!types.isUndefinedOrNull(this.startLineNumber) && !types.isUndefinedOrNull(this.startColumn));
        }
        /**
         * Tells the editor to set show the given selection when the editor is being opened.
         */
        selection(startLineNumber, startColumn, endLineNumber = startLineNumber, endColumn = startColumn) {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
            return this;
        }
        /**
         * Create a TextEditorOptions inline to be used when the editor is opening.
         */
        static fromEditor(editor, settings) {
            const options = TextEditorOptions.create(settings);
            // View state
            options.editorViewState = editor.saveViewState();
            return options;
        }
        /**
         * Apply the view state or selection to the given editor.
         *
         * @return if something was applied
         */
        apply(editor, scrollType) {
            // View state
            return this.applyViewState(editor, scrollType);
        }
        applyViewState(editor, scrollType) {
            let gotApplied = false;
            // First try viewstate
            if (this.editorViewState) {
                editor.restoreViewState(this.editorViewState);
                gotApplied = true;
            }
            // Otherwise check for selection
            else if (!types.isUndefinedOrNull(this.startLineNumber) && !types.isUndefinedOrNull(this.startColumn)) {
                // Select
                if (!types.isUndefinedOrNull(this.endLineNumber) && !types.isUndefinedOrNull(this.endColumn)) {
                    const range = {
                        startLineNumber: this.startLineNumber,
                        startColumn: this.startColumn,
                        endLineNumber: this.endLineNumber,
                        endColumn: this.endColumn
                    };
                    editor.setSelection(range);
                    if (this.revealInCenterIfOutsideViewport) {
                        editor.revealRangeInCenterIfOutsideViewport(range, scrollType);
                    }
                    else {
                        editor.revealRangeInCenter(range, scrollType);
                    }
                }
                // Reveal
                else {
                    const pos = {
                        lineNumber: this.startLineNumber,
                        column: this.startColumn
                    };
                    editor.setPosition(pos);
                    if (this.revealInCenterIfOutsideViewport) {
                        editor.revealPositionInCenterIfOutsideViewport(pos, scrollType);
                    }
                    else {
                        editor.revealPositionInCenter(pos, scrollType);
                    }
                }
                gotApplied = true;
            }
            return gotApplied;
        }
    }
    exports.TextEditorOptions = TextEditorOptions;
    class EditorCommandsContextActionRunner extends actions_1.ActionRunner {
        constructor(context) {
            super();
            this.context = context;
        }
        run(action, context) {
            return super.run(action, this.context);
        }
    }
    exports.EditorCommandsContextActionRunner = EditorCommandsContextActionRunner;
    function toResource(editor, options) {
        if (!editor) {
            return null;
        }
        // Check for side by side if we are asked to
        if (options && options.supportSideBySide && editor instanceof SideBySideEditorInput) {
            editor = editor.master;
        }
        const resource = editor.getResource();
        if (!options || !options.filter) {
            return resource; // return early if no filter is specified
        }
        if (!resource) {
            return null;
        }
        let includeFiles;
        let includeUntitled;
        if (Array.isArray(options.filter)) {
            includeFiles = (options.filter.indexOf(network_1.Schemas.file) >= 0);
            includeUntitled = (options.filter.indexOf(network_1.Schemas.untitled) >= 0);
        }
        else {
            includeFiles = (options.filter === network_1.Schemas.file);
            includeUntitled = (options.filter === network_1.Schemas.untitled);
        }
        if (includeFiles && resource.scheme === network_1.Schemas.file) {
            return resource;
        }
        if (includeUntitled && resource.scheme === network_1.Schemas.untitled) {
            return resource;
        }
        return null;
    }
    exports.toResource = toResource;
    var CloseDirection;
    (function (CloseDirection) {
        CloseDirection[CloseDirection["LEFT"] = 0] = "LEFT";
        CloseDirection[CloseDirection["RIGHT"] = 1] = "RIGHT";
    })(CloseDirection = exports.CloseDirection || (exports.CloseDirection = {}));
    class EditorInputFactoryRegistry {
        constructor() {
            this.editorInputFactoryConstructors = Object.create(null);
            this.editorInputFactoryInstances = Object.create(null);
        }
        start(accessor) {
            this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            for (let key in this.editorInputFactoryConstructors) {
                const element = this.editorInputFactoryConstructors[key];
                this.createEditorInputFactory(key, element);
            }
            this.editorInputFactoryConstructors = Object.create(null);
        }
        createEditorInputFactory(editorInputId, ctor) {
            const instance = this.instantiationService.createInstance(ctor);
            this.editorInputFactoryInstances[editorInputId] = instance;
        }
        registerFileInputFactory(factory) {
            this.fileInputFactory = factory;
        }
        getFileInputFactory() {
            return this.fileInputFactory;
        }
        registerEditorInputFactory(editorInputId, ctor) {
            if (!this.instantiationService) {
                this.editorInputFactoryConstructors[editorInputId] = ctor;
            }
            else {
                this.createEditorInputFactory(editorInputId, ctor);
            }
        }
        getEditorInputFactory(editorInputId) {
            return this.editorInputFactoryInstances[editorInputId];
        }
    }
    exports.Extensions = {
        EditorInputFactories: 'workbench.contributions.editor.inputFactories'
    };
    platform_1.Registry.add(exports.Extensions.EditorInputFactories, new EditorInputFactoryRegistry());
});
//# sourceMappingURL=editor.js.map