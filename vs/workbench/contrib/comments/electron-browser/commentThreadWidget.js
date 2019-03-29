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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/modes", "vs/editor/contrib/referenceSearch/referencesWidget", "vs/editor/contrib/zoneWidget/zoneWidget", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/electron-browser/commentGlyphWidget", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/modelService", "./simpleCommentEditor", "vs/base/common/uri", "vs/platform/theme/common/colorRegistry", "vs/editor/common/services/modeService", "vs/workbench/contrib/comments/electron-browser/commentService", "vs/editor/common/core/range", "vs/platform/opener/common/opener", "vs/editor/contrib/markdown/markdownRenderer", "vs/workbench/contrib/comments/electron-browser/commentNode", "vs/platform/commands/common/commands", "vs/base/common/uuid", "vs/base/common/types"], function (require, exports, nls, dom, actionbar_1, button_1, actions_1, arrays, color_1, event_1, lifecycle_1, strings, modes, referencesWidget_1, zoneWidget_1, styler_1, themeService_1, commentGlyphWidget_1, instantiation_1, modelService_1, simpleCommentEditor_1, uri_1, colorRegistry_1, modeService_1, commentService_1, range_1, opener_1, markdownRenderer_1, commentNode_1, commands_1, uuid_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COMMENTEDITOR_DECORATION_KEY = 'commenteditordecoration';
    const COLLAPSE_ACTION_CLASS = 'expand-review-action octicon octicon-x';
    const COMMENT_SCHEME = 'comment';
    let INMEM_MODEL_ID = 0;
    let ReviewZoneWidget = class ReviewZoneWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, _owner, _commentThread, _pendingComment, _draftMode, instantiationService, modeService, commandService, modelService, themeService, commentService, openerService) {
            super(editor, { keepEditorSelection: true });
            this._owner = _owner;
            this._commentThread = _commentThread;
            this._pendingComment = _pendingComment;
            this._draftMode = _draftMode;
            this.instantiationService = instantiationService;
            this.modeService = modeService;
            this.commandService = commandService;
            this.modelService = modelService;
            this.themeService = themeService;
            this.commentService = commentService;
            this.openerService = openerService;
            this._onDidClose = new event_1.Emitter();
            this._onDidCreateThread = new event_1.Emitter();
            this._resizeObserver = null;
            this._isCollapsed = _commentThread.collapsibleState !== modes.CommentThreadCollapsibleState.Expanded;
            this._globalToDispose = [];
            this._submitActionsDisposables = [];
            this._formActions = null;
            this.create();
            this._styleElement = dom.createStyleSheet(this.domNode);
            this._globalToDispose.push(this.themeService.onThemeChange(this._applyTheme, this));
            this._globalToDispose.push(this.editor.onDidChangeConfiguration(e => {
                if (e.fontInfo) {
                    this._applyTheme(this.themeService.getTheme());
                }
            }));
            this._applyTheme(this.themeService.getTheme());
            this._markdownRenderer = new markdownRenderer_1.MarkdownRenderer(editor, this.modeService, this.openerService);
            this._parentEditor = editor;
        }
        get owner() {
            return this._owner;
        }
        get commentThread() {
            return this._commentThread;
        }
        get extensionId() {
            return this._commentThread.extensionId;
        }
        get draftMode() {
            return this._draftMode;
        }
        get onDidClose() {
            return this._onDidClose.event;
        }
        get onDidCreateThread() {
            return this._onDidCreateThread.event;
        }
        getPosition() {
            if (this.position) {
                return this.position;
            }
            if (this._commentGlyph) {
                return types_1.withNullAsUndefined(this._commentGlyph.getPosition().position);
            }
            return undefined;
        }
        revealLine(lineNumber) {
            // we don't do anything here as we always do the reveal ourselves.
        }
        reveal(commentId) {
            if (this._isCollapsed) {
                this.show({ lineNumber: this._commentThread.range.startLineNumber, column: 1 }, 2);
            }
            if (commentId) {
                let height = this.editor.getLayoutInfo().height;
                let matchedNode = this._commentElements.filter(commentNode => commentNode.comment.commentId === commentId);
                if (matchedNode && matchedNode.length) {
                    const commentThreadCoords = dom.getDomNodePagePosition(this._commentElements[0].domNode);
                    const commentCoords = dom.getDomNodePagePosition(matchedNode[0].domNode);
                    this.editor.setScrollTop(this.editor.getTopForLineNumber(this._commentThread.range.startLineNumber) - height / 2 + commentCoords.top - commentThreadCoords.top);
                    return;
                }
            }
            this.editor.revealRangeInCenter(this._commentThread.range);
        }
        getPendingComment() {
            if (this._commentEditor) {
                let model = this._commentEditor.getModel();
                if (model && model.getValueLength() > 0) { // checking length is cheap
                    return model.getValue();
                }
            }
            return null;
        }
        _fillContainer(container) {
            this.setCssClass('review-widget');
            this._headElement = dom.$('.head');
            container.appendChild(this._headElement);
            this._fillHead(this._headElement);
            this._bodyElement = dom.$('.body');
            container.appendChild(this._bodyElement);
            dom.addDisposableListener(this._bodyElement, dom.EventType.FOCUS_IN, e => {
                this.commentService.setActiveCommentThread(this._commentThread);
            });
        }
        _fillHead(container) {
            let titleElement = dom.append(this._headElement, dom.$('.review-title'));
            this._headingLabel = dom.append(titleElement, dom.$('span.filename'));
            this.createThreadLabel();
            const actionsContainer = dom.append(this._headElement, dom.$('.review-actions'));
            this._actionbarWidget = new actionbar_1.ActionBar(actionsContainer, {});
            this._disposables.push(this._actionbarWidget);
            this._collapseAction = new actions_1.Action('review.expand', nls.localize('label.collapse', "Collapse"), COLLAPSE_ACTION_CLASS, true, () => {
                if (this._commentThread.comments.length === 0 && this._commentThread.commentThreadHandle === undefined) {
                    this.dispose();
                    return Promise.resolve();
                }
                this._isCollapsed = true;
                this.hide();
                return Promise.resolve();
            });
            this._actionbarWidget.push(this._collapseAction, { label: false, icon: true });
        }
        getGlyphPosition() {
            if (this._commentGlyph) {
                return this._commentGlyph.getPosition().position.lineNumber;
            }
            return 0;
        }
        toggleExpand(lineNumber) {
            if (this._isCollapsed) {
                this.show({ lineNumber: lineNumber, column: 1 }, 2);
            }
            else {
                this.hide();
                if (this._commentThread === null || this._commentThread.threadId === null) {
                    this.dispose();
                }
            }
        }
        update(commentThread) {
            return __awaiter(this, void 0, void 0, function* () {
                const oldCommentsLen = this._commentElements.length;
                const newCommentsLen = commentThread.comments.length;
                let commentElementsToDel = [];
                let commentElementsToDelIndex = [];
                for (let i = 0; i < oldCommentsLen; i++) {
                    let comment = this._commentElements[i].comment;
                    let newComment = commentThread.comments.filter(c => c.commentId === comment.commentId);
                    if (newComment.length) {
                        this._commentElements[i].update(newComment[0]);
                    }
                    else {
                        commentElementsToDelIndex.push(i);
                        commentElementsToDel.push(this._commentElements[i]);
                    }
                }
                // del removed elements
                for (let i = commentElementsToDel.length - 1; i >= 0; i--) {
                    this._commentElements.splice(commentElementsToDelIndex[i], 1);
                    this._commentsElement.removeChild(commentElementsToDel[i].domNode);
                }
                let lastCommentElement = null;
                let newCommentNodeList = [];
                for (let i = newCommentsLen - 1; i >= 0; i--) {
                    let currentComment = commentThread.comments[i];
                    let oldCommentNode = this._commentElements.filter(commentNode => commentNode.comment.commentId === currentComment.commentId);
                    if (oldCommentNode.length) {
                        oldCommentNode[0].update(currentComment);
                        lastCommentElement = oldCommentNode[0].domNode;
                        newCommentNodeList.unshift(oldCommentNode[0]);
                    }
                    else {
                        const newElement = this.createNewCommentNode(currentComment);
                        newCommentNodeList.unshift(newElement);
                        if (lastCommentElement) {
                            this._commentsElement.insertBefore(newElement.domNode, lastCommentElement);
                            lastCommentElement = newElement.domNode;
                        }
                        else {
                            this._commentsElement.appendChild(newElement.domNode);
                            lastCommentElement = newElement.domNode;
                        }
                    }
                }
                this._commentThread = commentThread;
                this._commentElements = newCommentNodeList;
                this.createThreadLabel();
                // Move comment glyph widget and show position if the line has changed.
                const lineNumber = this._commentThread.range.startLineNumber;
                if (this._commentGlyph) {
                    if (this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                        this._commentGlyph.setLineNumber(lineNumber);
                    }
                }
                if (!this._reviewThreadReplyButton) {
                    this.createReplyButton();
                }
                if (!this._isCollapsed) {
                    this.show({ lineNumber, column: 1 }, 2);
                }
            });
        }
        updateDraftMode(draftMode) {
            if (this._draftMode !== draftMode) {
                this._draftMode = draftMode;
                if (this._formActions && this._commentEditor.hasModel()) {
                    const model = this._commentEditor.getModel();
                    dom.clearNode(this._formActions);
                    this.createCommentWidgetActions(this._formActions, model);
                }
            }
        }
        _onWidth(widthInPixel) {
            this._commentEditor.layout({ height: (this._commentEditor.hasWidgetFocus() ? 5 : 1) * 18, width: widthInPixel - 54 /* margin 20px * 10 + scrollbar 14px*/ });
        }
        _doLayout(heightInPixel, widthInPixel) {
            this._commentEditor.layout({ height: (this._commentEditor.hasWidgetFocus() ? 5 : 1) * 18, width: widthInPixel - 54 /* margin 20px * 10 + scrollbar 14px*/ });
        }
        display(lineNumber) {
            this._commentGlyph = new commentGlyphWidget_1.CommentGlyphWidget(this.editor, lineNumber);
            this._disposables.push(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this._disposables.push(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            let headHeight = Math.ceil(this.editor.getConfiguration().lineHeight * 1.2);
            this._headElement.style.height = `${headHeight}px`;
            this._headElement.style.lineHeight = this._headElement.style.height;
            this._commentsElement = dom.append(this._bodyElement, dom.$('div.comments-container'));
            this._commentsElement.setAttribute('role', 'presentation');
            this._commentElements = [];
            for (const comment of this._commentThread.comments) {
                const newCommentNode = this.createNewCommentNode(comment);
                this._commentElements.push(newCommentNode);
                this._commentsElement.appendChild(newCommentNode.domNode);
            }
            const hasExistingComments = this._commentThread.comments.length > 0;
            this._commentForm = dom.append(this._bodyElement, dom.$('.comment-form'));
            this._commentEditor = this.instantiationService.createInstance(simpleCommentEditor_1.SimpleCommentEditor, this._commentForm, simpleCommentEditor_1.SimpleCommentEditor.getEditorOptions(), this._parentEditor, this);
            const modeId = uuid_1.generateUuid() + '-' + (hasExistingComments ? this._commentThread.threadId : ++INMEM_MODEL_ID);
            const params = JSON.stringify({
                extensionId: this.extensionId,
                commentThreadId: this.commentThread.threadId
            });
            const resource = uri_1.URI.parse(`${COMMENT_SCHEME}:commentinput-${modeId}.md?${params}`);
            const model = this.modelService.createModel(this._pendingComment || '', this.modeService.createByFilepathOrFirstLine(resource.path), resource, false);
            this._disposables.push(model);
            this._commentEditor.setModel(model);
            this._disposables.push(this._commentEditor);
            this._disposables.push(this._commentEditor.getModel().onDidChangeContent(() => this.setCommentEditorDecorations()));
            if (this._commentThread.commentThreadHandle !== undefined) {
                this._disposables.push(this._commentEditor.onDidFocusEditorWidget(() => {
                    let commentThread = this._commentThread;
                    commentThread.input = {
                        uri: this._commentEditor.getModel().uri,
                        value: this._commentEditor.getValue()
                    };
                    this.commentService.setActiveCommentThread(this._commentThread);
                }));
                this._disposables.push(this._commentEditor.getModel().onDidChangeContent(() => {
                    let modelContent = this._commentEditor.getValue();
                    let thread = this._commentThread;
                    if (thread.input && thread.input.uri === this._commentEditor.getModel().uri && thread.input.value !== modelContent) {
                        let newInput = thread.input;
                        newInput.value = modelContent;
                        thread.input = newInput;
                    }
                }));
                this._disposables.push(this._commentThread.onDidChangeInput(input => {
                    let thread = this._commentThread;
                    if (thread.input && thread.input.uri !== this._commentEditor.getModel().uri) {
                        return;
                    }
                    if (!input) {
                        return;
                    }
                    if (this._commentEditor.getValue() !== input.value) {
                        this._commentEditor.setValue(input.value);
                        if (input.value === '') {
                            this._pendingComment = '';
                            if (dom.hasClass(this._commentForm, 'expand')) {
                                dom.removeClass(this._commentForm, 'expand');
                            }
                            this._commentEditor.getDomNode().style.outline = '';
                            this._error.textContent = '';
                            dom.addClass(this._error, 'hidden');
                        }
                    }
                }));
                this._disposables.push(this._commentThread.onDidChangeComments((_) => __awaiter(this, void 0, void 0, function* () {
                    yield this.update(this._commentThread);
                })));
                this._disposables.push(this._commentThread.onDidChangeLabel(_ => {
                    this.createThreadLabel();
                }));
            }
            this.setCommentEditorDecorations();
            // Only add the additional step of clicking a reply button to expand the textarea when there are existing comments
            if (hasExistingComments) {
                this.createReplyButton();
            }
            else {
                if (!dom.hasClass(this._commentForm, 'expand')) {
                    dom.addClass(this._commentForm, 'expand');
                    this._commentEditor.focus();
                }
            }
            this._error = dom.append(this._commentForm, dom.$('.validation-error.hidden'));
            this._formActions = dom.append(this._commentForm, dom.$('.form-actions'));
            if (this._commentThread.commentThreadHandle !== undefined) {
                this.createCommentWidgetActions2(this._formActions, model);
                this._disposables.push(this._commentThread.onDidChangeAcceptInputCommand(_ => {
                    if (this._formActions) {
                        dom.clearNode(this._formActions);
                        this.createCommentWidgetActions2(this._formActions, model);
                    }
                }));
                this._disposables.push(this._commentThread.onDidChangeAdditionalCommands(_ => {
                    if (this._formActions) {
                        dom.clearNode(this._formActions);
                        this.createCommentWidgetActions2(this._formActions, model);
                    }
                }));
                this._disposables.push(this._commentThread.onDidChangeRange(range => {
                    // Move comment glyph widget and show position if the line has changed.
                    const lineNumber = this._commentThread.range.startLineNumber;
                    if (this._commentGlyph) {
                        if (this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                            this._commentGlyph.setLineNumber(lineNumber);
                        }
                    }
                    if (!this._isCollapsed) {
                        this.show({ lineNumber, column: 1 }, 2);
                    }
                }));
                this._disposables.push(this._commentThread.onDidChangeCollasibleState(state => {
                    if (state === modes.CommentThreadCollapsibleState.Expanded && this._isCollapsed) {
                        const lineNumber = this._commentThread.range.startLineNumber;
                        this.show({ lineNumber, column: 1 }, 2);
                        return;
                    }
                    if (state === modes.CommentThreadCollapsibleState.Collapsed && !this._isCollapsed) {
                        this.hide();
                        return;
                    }
                }));
            }
            else {
                this.createCommentWidgetActions(this._formActions, model);
            }
            this._resizeObserver = new MutationObserver(this._refresh.bind(this));
            this._resizeObserver.observe(this._bodyElement, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
            if (this._commentThread.collapsibleState === modes.CommentThreadCollapsibleState.Expanded) {
                this.show({ lineNumber: lineNumber, column: 1 }, 2);
            }
            // If there are no existing comments, place focus on the text area. This must be done after show, which also moves focus.
            if (this._commentThread.reply && !this._commentThread.comments.length) {
                this._commentEditor.focus();
            }
            else if (this._commentEditor.getModel().getValueLength() > 0) {
                if (!dom.hasClass(this._commentForm, 'expand')) {
                    dom.addClass(this._commentForm, 'expand');
                }
                this._commentEditor.focus();
            }
        }
        handleError(e) {
            this._error.textContent = e.message;
            this._commentEditor.getDomNode().style.outline = `1px solid ${this.themeService.getTheme().getColor(colorRegistry_1.inputValidationErrorBorder)}`;
            dom.removeClass(this._error, 'hidden');
        }
        getActiveComment() {
            return this._commentElements.filter(node => node.isEditing)[0] || this;
        }
        createCommentWidgetActions(container, model) {
            lifecycle_1.dispose(this._submitActionsDisposables);
            const button = new button_1.Button(container);
            this._submitActionsDisposables.push(styler_1.attachButtonStyler(button, this.themeService));
            button.label = 'Add comment';
            button.enabled = model.getValueLength() > 0;
            this._submitActionsDisposables.push(this._commentEditor.onDidChangeModelContent(_ => {
                if (this._commentEditor.getValue()) {
                    button.enabled = true;
                }
                else {
                    button.enabled = false;
                }
            }));
            button.onDidClick(() => __awaiter(this, void 0, void 0, function* () {
                this.createComment();
            }));
            if (this._draftMode === modes.DraftMode.NotSupported) {
                return;
            }
            switch (this._draftMode) {
                case modes.DraftMode.InDraft:
                    const deleteDraftLabel = this.commentService.getDeleteDraftLabel(this._owner);
                    if (deleteDraftLabel) {
                        const deletedraftButton = new button_1.Button(container);
                        this._submitActionsDisposables.push(styler_1.attachButtonStyler(deletedraftButton, this.themeService));
                        deletedraftButton.label = deleteDraftLabel;
                        deletedraftButton.enabled = true;
                        this._disposables.push(deletedraftButton.onDidClick(() => __awaiter(this, void 0, void 0, function* () {
                            try {
                                yield this.commentService.deleteDraft(this._owner, this.editor.getModel().uri);
                            }
                            catch (e) {
                                this.handleError(e);
                            }
                        })));
                    }
                    const submitDraftLabel = this.commentService.getFinishDraftLabel(this._owner);
                    if (submitDraftLabel) {
                        const submitdraftButton = new button_1.Button(container);
                        this._submitActionsDisposables.push(styler_1.attachButtonStyler(submitdraftButton, this.themeService));
                        submitdraftButton.label = this.commentService.getFinishDraftLabel(this._owner);
                        submitdraftButton.enabled = true;
                        submitdraftButton.onDidClick(() => __awaiter(this, void 0, void 0, function* () {
                            try {
                                if (this._commentEditor.getValue()) {
                                    yield this.createComment();
                                }
                                yield this.commentService.finishDraft(this._owner, this.editor.getModel().uri);
                            }
                            catch (e) {
                                this.handleError(e);
                            }
                        }));
                    }
                    break;
                case modes.DraftMode.NotInDraft:
                    const startDraftLabel = this.commentService.getStartDraftLabel(this._owner);
                    if (startDraftLabel) {
                        const draftButton = new button_1.Button(container);
                        this._disposables.push(styler_1.attachButtonStyler(draftButton, this.themeService));
                        draftButton.label = this.commentService.getStartDraftLabel(this._owner);
                        draftButton.enabled = model.getValueLength() > 0;
                        this._submitActionsDisposables.push(this._commentEditor.onDidChangeModelContent(_ => {
                            if (this._commentEditor.getValue()) {
                                draftButton.enabled = true;
                            }
                            else {
                                draftButton.enabled = false;
                            }
                        }));
                        this._disposables.push(draftButton.onDidClick(() => __awaiter(this, void 0, void 0, function* () {
                            try {
                                yield this.commentService.startDraft(this._owner, this.editor.getModel().uri);
                                yield this.createComment();
                            }
                            catch (e) {
                                this.handleError(e);
                            }
                        })));
                    }
                    break;
            }
        }
        /**
         * Command based actions.
         */
        createCommentWidgetActions2(container, model) {
            let commentThread = this._commentThread;
            const { acceptInputCommand } = commentThread;
            if (acceptInputCommand) {
                const button = new button_1.Button(container);
                this._disposables.push(styler_1.attachButtonStyler(button, this.themeService));
                button.label = acceptInputCommand.title;
                this._disposables.push(button.onDidClick(() => __awaiter(this, void 0, void 0, function* () {
                    commentThread.input = {
                        uri: this._commentEditor.getModel().uri,
                        value: this._commentEditor.getValue()
                    };
                    this.commentService.setActiveCommentThread(this._commentThread);
                    yield this.commandService.executeCommand(acceptInputCommand.id, ...(acceptInputCommand.arguments || []));
                })));
                button.enabled = model.getValueLength() > 0;
                this._disposables.push(this._commentEditor.onDidChangeModelContent(_ => {
                    if (this._commentEditor.getValue()) {
                        button.enabled = true;
                    }
                    else {
                        button.enabled = false;
                    }
                }));
            }
            commentThread.additionalCommands.reverse().forEach(command => {
                const button = new button_1.Button(container);
                this._disposables.push(styler_1.attachButtonStyler(button, this.themeService));
                button.label = command.title;
                this._disposables.push(button.onDidClick(() => __awaiter(this, void 0, void 0, function* () {
                    commentThread.input = {
                        uri: this._commentEditor.getModel().uri,
                        value: this._commentEditor.getValue()
                    };
                    this.commentService.setActiveCommentThread(this._commentThread);
                    yield this.commandService.executeCommand(command.id, ...(command.arguments || []));
                })));
            });
        }
        createNewCommentNode(comment) {
            let newCommentNode = this.instantiationService.createInstance(commentNode_1.CommentNode, this._commentThread, comment, this.owner, this.editor.getModel().uri, this._parentEditor, this, this._markdownRenderer);
            this._disposables.push(newCommentNode);
            this._disposables.push(newCommentNode.onDidDelete(deletedNode => {
                const deletedNodeId = deletedNode.comment.commentId;
                const deletedElementIndex = arrays.firstIndex(this._commentElements, commentNode => commentNode.comment.commentId === deletedNodeId);
                if (deletedElementIndex > -1) {
                    this._commentElements.splice(deletedElementIndex, 1);
                }
                const deletedCommentIndex = arrays.firstIndex(this._commentThread.comments, comment => comment.commentId === deletedNodeId);
                if (deletedCommentIndex > -1) {
                    this._commentThread.comments.splice(deletedCommentIndex, 1);
                }
                this._commentsElement.removeChild(deletedNode.domNode);
                deletedNode.dispose();
                if (this._commentThread.comments.length === 0) {
                    this.dispose();
                }
            }));
            return newCommentNode;
        }
        submitComment() {
            return __awaiter(this, void 0, void 0, function* () {
                const activeComment = this.getActiveComment();
                if (activeComment instanceof ReviewZoneWidget) {
                    if (this._commentThread.commentThreadHandle) {
                        let commentThread = this._commentThread;
                        if (commentThread.acceptInputCommand) {
                            commentThread.input = {
                                uri: this._commentEditor.getModel().uri,
                                value: this._commentEditor.getValue()
                            };
                            this.commentService.setActiveCommentThread(this._commentThread);
                            let commandId = commentThread.acceptInputCommand.id;
                            let args = commentThread.acceptInputCommand.arguments || [];
                            yield this.commandService.executeCommand(commandId, ...args);
                            return;
                        }
                    }
                    else {
                        this.createComment();
                    }
                }
                if (activeComment instanceof commentNode_1.CommentNode) {
                    activeComment.editComment();
                }
            });
        }
        createComment() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (this._commentEditor.getModel().getValueLength() === 0) {
                        return;
                    }
                    if (!this._commentGlyph) {
                        return;
                    }
                    let newCommentThread;
                    const lineNumber = this._commentGlyph.getPosition().position.lineNumber;
                    const isReply = this._commentThread.threadId !== null;
                    if (isReply) {
                        newCommentThread = yield this.commentService.replyToCommentThread(this._owner, this.editor.getModel().uri, new range_1.Range(lineNumber, 1, lineNumber, 1), this._commentThread, this._commentEditor.getValue());
                    }
                    else {
                        newCommentThread = yield this.commentService.createNewCommentThread(this._owner, this.editor.getModel().uri, new range_1.Range(lineNumber, 1, lineNumber, 1), this._commentEditor.getValue());
                        if (newCommentThread) {
                            this.createReplyButton();
                        }
                    }
                    if (newCommentThread) {
                        this._commentEditor.setValue('');
                        this._pendingComment = '';
                        if (dom.hasClass(this._commentForm, 'expand')) {
                            dom.removeClass(this._commentForm, 'expand');
                        }
                        this._commentEditor.getDomNode().style.outline = '';
                        this._error.textContent = '';
                        dom.addClass(this._error, 'hidden');
                        this.update(newCommentThread);
                        if (!isReply) {
                            this._onDidCreateThread.fire(this);
                        }
                    }
                }
                catch (e) {
                    this._error.textContent = e.message
                        ? nls.localize('commentCreationError', "Adding a comment failed: {0}.", e.message)
                        : nls.localize('commentCreationDefaultError', "Adding a comment failed. Please try again or report an issue with the extension if the problem persists.");
                    this._commentEditor.getDomNode().style.outline = `1px solid ${this.themeService.getTheme().getColor(colorRegistry_1.inputValidationErrorBorder)}`;
                    dom.removeClass(this._error, 'hidden');
                }
            });
        }
        createThreadLabel() {
            let label;
            if (this._commentThread.commentThreadHandle !== undefined) {
                label = this._commentThread.label;
            }
            if (label === undefined) {
                if (this._commentThread.comments.length) {
                    const participantsList = this._commentThread.comments.filter(arrays.uniqueFilter(comment => comment.userName)).map(comment => `@${comment.userName}`).join(', ');
                    label = nls.localize('commentThreadParticipants', "Participants: {0}", participantsList);
                }
                else {
                    label = nls.localize('startThread', "Start discussion");
                }
            }
            this._headingLabel.innerHTML = strings.escape(label);
            this._headingLabel.setAttribute('aria-label', label);
        }
        expandReplyArea() {
            if (!dom.hasClass(this._commentForm, 'expand')) {
                dom.addClass(this._commentForm, 'expand');
                this._commentEditor.focus();
            }
        }
        createReplyButton() {
            this._reviewThreadReplyButton = dom.append(this._commentForm, dom.$('button.review-thread-reply-button'));
            if (this._commentThread.commentThreadHandle !== undefined) {
                // this._reviewThreadReplyButton.title = (this._commentThread as modes.CommentThread2).acceptInputCommands.title;
            }
            else {
                this._reviewThreadReplyButton.title = nls.localize('reply', "Reply...");
            }
            this._reviewThreadReplyButton.textContent = nls.localize('reply', "Reply...");
            // bind click/escape actions for reviewThreadReplyButton and textArea
            this._disposables.push(dom.addDisposableListener(this._reviewThreadReplyButton, 'click', _ => this.expandReplyArea()));
            this._disposables.push(dom.addDisposableListener(this._reviewThreadReplyButton, 'focus', _ => this.expandReplyArea()));
            this._commentEditor.onDidBlurEditorWidget(() => {
                if (this._commentEditor.getModel().getValueLength() === 0 && dom.hasClass(this._commentForm, 'expand')) {
                    dom.removeClass(this._commentForm, 'expand');
                }
            });
        }
        _refresh() {
            if (!this._isCollapsed && this._bodyElement) {
                let dimensions = dom.getClientArea(this._bodyElement);
                const headHeight = Math.ceil(this.editor.getConfiguration().lineHeight * 1.2);
                const lineHeight = this.editor.getConfiguration().lineHeight;
                const arrowHeight = Math.round(lineHeight / 3);
                const frameThickness = Math.round(lineHeight / 9) * 2;
                const computedLinesNumber = Math.ceil((headHeight + dimensions.height + arrowHeight + frameThickness + 8 /** margin bottom to avoid margin collapse */) / lineHeight);
                this._relayout(computedLinesNumber);
            }
        }
        setCommentEditorDecorations() {
            const model = this._commentEditor && this._commentEditor.getModel();
            if (model) {
                const valueLength = model.getValueLength();
                const hasExistingComments = this._commentThread.comments.length > 0;
                const placeholder = valueLength > 0
                    ? ''
                    : hasExistingComments
                        ? nls.localize('reply', "Reply...")
                        : nls.localize('newComment', "Type a new comment");
                const decorations = [{
                        range: {
                            startLineNumber: 0,
                            endLineNumber: 0,
                            startColumn: 0,
                            endColumn: 1
                        },
                        renderOptions: {
                            after: {
                                contentText: placeholder,
                                color: `${colorRegistry_1.transparent(colorRegistry_1.editorForeground, 0.4)(this.themeService.getTheme())}`
                            }
                        }
                    }];
                this._commentEditor.setDecorations(exports.COMMENTEDITOR_DECORATION_KEY, decorations);
            }
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range) {
                return;
            }
            if (!e.event.leftButton) {
                return;
            }
            if (e.target.type !== 4 /* GUTTER_LINE_DECORATIONS */) {
                return;
            }
            const data = e.target.detail;
            const gutterOffsetX = data.offsetX - data.glyphMarginWidth - data.lineNumbersWidth - data.glyphMarginLeft;
            // don't collide with folding and git decorations
            if (gutterOffsetX > 14) {
                return;
            }
            this.mouseDownInfo = { lineNumber: range.startLineNumber };
        }
        onEditorMouseUp(e) {
            if (!this.mouseDownInfo) {
                return;
            }
            const { lineNumber } = this.mouseDownInfo;
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range || range.startLineNumber !== lineNumber) {
                return;
            }
            if (e.target.type !== 4 /* GUTTER_LINE_DECORATIONS */) {
                return;
            }
            if (!e.target.element) {
                return;
            }
            if (this._commentGlyph && this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                return;
            }
            if (e.target.element.className.indexOf('comment-thread') >= 0) {
                this.toggleExpand(lineNumber);
            }
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(referencesWidget_1.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor
            });
            const content = [];
            const linkColor = theme.getColor(colorRegistry_1.textLinkForeground);
            if (linkColor) {
                content.push(`.monaco-editor .review-widget .body .comment-body a { color: ${linkColor} }`);
            }
            const linkActiveColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
            if (linkActiveColor) {
                content.push(`.monaco-editor .review-widget .body .comment-body a:hover, a:active { color: ${linkActiveColor} }`);
            }
            const focusColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusColor) {
                content.push(`.monaco-editor .review-widget .body .comment-body a:focus { outline: 1px solid ${focusColor}; }`);
                content.push(`.monaco-editor .review-widget .body .monaco-editor.focused { outline: 1px solid ${focusColor}; }`);
            }
            const blockQuoteBackground = theme.getColor(colorRegistry_1.textBlockQuoteBackground);
            if (blockQuoteBackground) {
                content.push(`.monaco-editor .review-widget .body .review-comment blockquote { background: ${blockQuoteBackground}; }`);
            }
            const blockQuoteBOrder = theme.getColor(colorRegistry_1.textBlockQuoteBorder);
            if (blockQuoteBOrder) {
                content.push(`.monaco-editor .review-widget .body .review-comment blockquote { border-color: ${blockQuoteBOrder}; }`);
            }
            const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
            if (hcBorder) {
                content.push(`.monaco-editor .review-widget .body .comment-form .review-thread-reply-button { outline-color: ${hcBorder}; }`);
                content.push(`.monaco-editor .review-widget .body .monaco-editor { outline: 1px solid ${hcBorder}; }`);
            }
            const errorBorder = theme.getColor(colorRegistry_1.inputValidationErrorBorder);
            if (errorBorder) {
                content.push(`.monaco-editor .review-widget .validation-error { border: 1px solid ${errorBorder}; }`);
            }
            const errorBackground = theme.getColor(colorRegistry_1.inputValidationErrorBackground);
            if (errorBackground) {
                content.push(`.monaco-editor .review-widget .validation-error { background: ${errorBackground}; }`);
            }
            const errorForeground = theme.getColor(colorRegistry_1.inputValidationErrorForeground);
            if (errorForeground) {
                content.push(`.monaco-editor .review-widget .body .comment-form .validation-error { color: ${errorForeground}; }`);
            }
            const fontInfo = this.editor.getConfiguration().fontInfo;
            content.push(`.monaco-editor .review-widget .body code {
			font-family: ${fontInfo.fontFamily};
			font-size: ${fontInfo.fontSize}px;
			font-weight: ${fontInfo.fontWeight};
		}`);
            this._styleElement.innerHTML = content.join('\n');
            // Editor decorations should also be responsive to theme changes
            this.setCommentEditorDecorations();
        }
        show(rangeOrPos, heightInLines) {
            this._isCollapsed = false;
            super.show(rangeOrPos, heightInLines);
            this._refresh();
        }
        hide() {
            this._isCollapsed = true;
            super.hide();
        }
        dispose() {
            super.dispose();
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
            if (this._commentGlyph) {
                this._commentGlyph.dispose();
                this._commentGlyph = undefined;
            }
            this._globalToDispose.forEach(global => global.dispose());
            this._submitActionsDisposables.forEach(local => local.dispose());
            this._onDidClose.fire(undefined);
        }
    };
    ReviewZoneWidget = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, modeService_1.IModeService),
        __param(7, commands_1.ICommandService),
        __param(8, modelService_1.IModelService),
        __param(9, themeService_1.IThemeService),
        __param(10, commentService_1.ICommentService),
        __param(11, opener_1.IOpenerService)
    ], ReviewZoneWidget);
    exports.ReviewZoneWidget = ReviewZoneWidget;
});
//# sourceMappingURL=commentThreadWidget.js.map