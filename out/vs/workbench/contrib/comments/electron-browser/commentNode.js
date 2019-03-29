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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/electron-browser/commentService", "vs/workbench/contrib/comments/electron-browser/simpleCommentEditor", "vs/editor/common/core/selection", "vs/platform/dialogs/common/dialogs", "vs/base/common/event", "vs/platform/notification/common/notification", "vs/base/common/objects", "vs/base/common/htmlContent", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/dropdown/dropdown", "./reactionsAction", "vs/platform/commands/common/commands"], function (require, exports, nls, dom, actionbar_1, button_1, actions_1, lifecycle_1, uri_1, modelService_1, modeService_1, instantiation_1, colorRegistry_1, styler_1, themeService_1, commentService_1, simpleCommentEditor_1, selection_1, dialogs_1, event_1, notification_1, objects_1, htmlContent_1, toolbar_1, contextView_1, dropdown_1, reactionsAction_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const UPDATE_COMMENT_LABEL = nls.localize('label.updateComment', "Update comment");
    const UPDATE_IN_PROGRESS_LABEL = nls.localize('label.updatingComment', "Updating comment...");
    let CommentNode = class CommentNode extends lifecycle_1.Disposable {
        constructor(commentThread, comment, owner, resource, parentEditor, parentThread, markdownRenderer, themeService, instantiationService, commentService, commandService, modelService, modeService, dialogService, notificationService, contextMenuService) {
            super();
            this.commentThread = commentThread;
            this.comment = comment;
            this.owner = owner;
            this.resource = resource;
            this.parentEditor = parentEditor;
            this.parentThread = parentThread;
            this.markdownRenderer = markdownRenderer;
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.commentService = commentService;
            this.commandService = commandService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.contextMenuService = contextMenuService;
            this._commentEditorDisposables = [];
            this._onDidDelete = new event_1.Emitter();
            this._domNode = dom.$('div.review-comment');
            this._domNode.tabIndex = 0;
            const avatar = dom.append(this._domNode, dom.$('div.avatar-container'));
            if (comment.userIconPath) {
                const img = dom.append(avatar, dom.$('img.avatar'));
                img.src = comment.userIconPath.toString();
                img.onerror = _ => img.remove();
            }
            this._commentDetailsContainer = dom.append(this._domNode, dom.$('.review-comment-contents'));
            this.createHeader(this._commentDetailsContainer);
            this._body = dom.append(this._commentDetailsContainer, dom.$('div.comment-body'));
            this._md = this.markdownRenderer.render(comment.body).element;
            this._body.appendChild(this._md);
            if (this.comment.commentReactions && this.comment.commentReactions.length) {
                this.createReactionsContainer(this._commentDetailsContainer);
            }
            this._domNode.setAttribute('aria-label', `${comment.userName}, ${comment.body.value}`);
            this._domNode.setAttribute('role', 'treeitem');
            this._clearTimeout = null;
        }
        get domNode() {
            return this._domNode;
        }
        get onDidDelete() {
            return this._onDidDelete.event;
        }
        createHeader(commentDetailsContainer) {
            const header = dom.append(commentDetailsContainer, dom.$('div.comment-title'));
            const author = dom.append(header, dom.$('strong.author'));
            author.innerText = this.comment.userName;
            this._isPendingLabel = dom.append(header, dom.$('span.isPending'));
            if (this.comment.isDraft) {
                this._isPendingLabel.innerText = 'Pending';
            }
            const actions = [];
            let reactionGroup = this.commentService.getReactionGroup(this.owner);
            if (reactionGroup && reactionGroup.length) {
                let commentThread = this.commentThread;
                if (commentThread.commentThreadHandle) {
                    let toggleReactionAction = this.createReactionPicker2();
                    actions.push(toggleReactionAction);
                }
                else {
                    let toggleReactionAction = this.createReactionPicker();
                    actions.push(toggleReactionAction);
                }
            }
            if (this.comment.canEdit || this.comment.editCommand) {
                this._editAction = this.createEditAction(commentDetailsContainer);
                actions.push(this._editAction);
            }
            if (this.comment.canDelete || this.comment.deleteCommand) {
                this._deleteAction = this.createDeleteAction();
                actions.push(this._deleteAction);
            }
            if (actions.length) {
                const actionsContainer = dom.append(header, dom.$('.comment-actions.hidden'));
                this.toolbar = new toolbar_1.ToolBar(actionsContainer, this.contextMenuService, {
                    actionItemProvider: action => {
                        if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                            return new dropdown_1.DropdownMenuActionItem(action, action.menuActions, this.contextMenuService, action => {
                                return this.actionItemProvider(action);
                            }, this.actionRunner, undefined, 'toolbar-toggle-pickReactions', () => { return 1 /* RIGHT */; });
                        }
                        return this.actionItemProvider(action);
                    },
                    orientation: 0 /* HORIZONTAL */
                });
                this.registerActionBarListeners(actionsContainer);
                this.toolbar.setActions(actions, [])();
                this._toDispose.push(this.toolbar);
            }
        }
        actionItemProvider(action) {
            let options = {};
            if (action.id === 'comment.delete' || action.id === 'comment.edit' || action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                options = { label: false, icon: true };
            }
            else {
                options = { label: true, icon: true };
            }
            if (action.id === reactionsAction_1.ReactionAction.ID) {
                let item = new reactionsAction_1.ReactionActionItem(action);
                return item;
            }
            else {
                let item = new actionbar_1.ActionItem({}, action, options);
                return item;
            }
        }
        createReactionPicker2() {
            let toggleReactionActionItem;
            let toggleReactionAction = this._register(new reactionsAction_1.ToggleReactionsAction(() => {
                if (toggleReactionActionItem) {
                    toggleReactionActionItem.show();
                }
            }, nls.localize('commentToggleReaction', "Toggle Reaction")));
            let reactionMenuActions = [];
            let reactionGroup = this.commentService.getReactionGroup(this.owner);
            if (reactionGroup && reactionGroup.length) {
                reactionMenuActions = reactionGroup.map((reaction) => {
                    return new actions_1.Action(`reaction.command.${reaction.label}`, `${reaction.label}`, '', true, () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            yield this.commentService.toggleReaction(this.owner, this.resource, this.commentThread, this.comment, reaction);
                        }
                        catch (e) {
                            const error = e.message
                                ? nls.localize('commentToggleReactionError', "Toggling the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentToggleReactionDefaultError', "Toggling the comment reaction failed");
                            this.notificationService.error(error);
                        }
                    }));
                });
            }
            toggleReactionAction.menuActions = reactionMenuActions;
            toggleReactionActionItem = new dropdown_1.DropdownMenuActionItem(toggleReactionAction, toggleReactionAction.menuActions, this.contextMenuService, action => {
                if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                    return toggleReactionActionItem;
                }
                return this.actionItemProvider(action);
            }, this.actionRunner, undefined, 'toolbar-toggle-pickReactions', () => { return 1 /* RIGHT */; });
            return toggleReactionAction;
        }
        createReactionPicker() {
            let toggleReactionActionItem;
            let toggleReactionAction = this._register(new reactionsAction_1.ToggleReactionsAction(() => {
                if (toggleReactionActionItem) {
                    toggleReactionActionItem.show();
                }
            }, nls.localize('commentAddReaction', "Add Reaction")));
            let reactionMenuActions = [];
            let reactionGroup = this.commentService.getReactionGroup(this.owner);
            if (reactionGroup && reactionGroup.length) {
                reactionMenuActions = reactionGroup.map((reaction) => {
                    return new actions_1.Action(`reaction.command.${reaction.label}`, `${reaction.label}`, '', true, () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            yield this.commentService.addReaction(this.owner, this.resource, this.comment, reaction);
                        }
                        catch (e) {
                            const error = e.message
                                ? nls.localize('commentAddReactionError', "Deleting the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentAddReactionDefaultError', "Deleting the comment reaction failed");
                            this.notificationService.error(error);
                        }
                    }));
                });
            }
            toggleReactionAction.menuActions = reactionMenuActions;
            toggleReactionActionItem = new dropdown_1.DropdownMenuActionItem(toggleReactionAction, toggleReactionAction.menuActions, this.contextMenuService, action => {
                if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                    return toggleReactionActionItem;
                }
                return this.actionItemProvider(action);
            }, this.actionRunner, undefined, 'toolbar-toggle-pickReactions', () => { return 1 /* RIGHT */; });
            return toggleReactionAction;
        }
        createReactionsContainer(commentDetailsContainer) {
            this._actionsContainer = dom.append(commentDetailsContainer, dom.$('div.comment-reactions'));
            this._reactionsActionBar = new actionbar_1.ActionBar(this._actionsContainer, {
                actionItemProvider: action => {
                    if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                        return new dropdown_1.DropdownMenuActionItem(action, action.menuActions, this.contextMenuService, action => {
                            return this.actionItemProvider(action);
                        }, this.actionRunner, undefined, 'toolbar-toggle-pickReactions', () => { return 1 /* RIGHT */; });
                    }
                    return this.actionItemProvider(action);
                }
            });
            this._toDispose.push(this._reactionsActionBar);
            this.comment.commentReactions.map(reaction => {
                let action = new reactionsAction_1.ReactionAction(`reaction.${reaction.label}`, `${reaction.label}`, reaction.hasReacted && reaction.canEdit ? 'active' : '', reaction.canEdit, () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let commentThread = this.commentThread;
                        if (commentThread.commentThreadHandle) {
                            yield this.commentService.toggleReaction(this.owner, this.resource, this.commentThread, this.comment, reaction);
                        }
                        else {
                            if (reaction.hasReacted) {
                                yield this.commentService.deleteReaction(this.owner, this.resource, this.comment, reaction);
                            }
                            else {
                                yield this.commentService.addReaction(this.owner, this.resource, this.comment, reaction);
                            }
                        }
                    }
                    catch (e) {
                        let error;
                        if (reaction.hasReacted) {
                            error = e.message
                                ? nls.localize('commentDeleteReactionError', "Deleting the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentDeleteReactionDefaultError', "Deleting the comment reaction failed");
                        }
                        else {
                            error = e.message
                                ? nls.localize('commentAddReactionError', "Deleting the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentAddReactionDefaultError', "Deleting the comment reaction failed");
                        }
                        this.notificationService.error(error);
                    }
                }), reaction.iconPath, reaction.count);
                if (this._reactionsActionBar) {
                    this._reactionsActionBar.push(action, { label: true, icon: true });
                }
            });
            let reactionGroup = this.commentService.getReactionGroup(this.owner);
            if (reactionGroup && reactionGroup.length) {
                let commentThread = this.commentThread;
                if (commentThread.commentThreadHandle) {
                    let toggleReactionAction = this.createReactionPicker2();
                    this._reactionsActionBar.push(toggleReactionAction, { label: false, icon: true });
                }
                else {
                    let toggleReactionAction = this.createReactionPicker();
                    this._reactionsActionBar.push(toggleReactionAction, { label: false, icon: true });
                }
            }
        }
        createCommentEditor() {
            const container = dom.append(this._commentEditContainer, dom.$('.edit-textarea'));
            this._commentEditor = this.instantiationService.createInstance(simpleCommentEditor_1.SimpleCommentEditor, container, simpleCommentEditor_1.SimpleCommentEditor.getEditorOptions(), this.parentEditor, this.parentThread);
            const resource = uri_1.URI.parse(`comment:commentinput-${this.comment.commentId}-${Date.now()}.md`);
            this._commentEditorModel = this.modelService.createModel('', this.modeService.createByFilepathOrFirstLine(resource.path), resource, false);
            this._commentEditor.setModel(this._commentEditorModel);
            this._commentEditor.setValue(this.comment.body.value);
            this._commentEditor.layout({ width: container.clientWidth - 14, height: 90 });
            this._commentEditor.focus();
            const lastLine = this._commentEditorModel.getLineCount();
            const lastColumn = this._commentEditorModel.getLineContent(lastLine).length + 1;
            this._commentEditor.setSelection(new selection_1.Selection(lastLine, lastColumn, lastLine, lastColumn));
            let commentThread = this.commentThread;
            if (commentThread.commentThreadHandle) {
                commentThread.input = {
                    uri: this._commentEditor.getModel().uri,
                    value: this.comment.body.value
                };
                this.commentService.setActiveCommentThread(commentThread);
                this._commentEditorDisposables.push(this._commentEditor.onDidFocusEditorWidget(() => {
                    commentThread.input = {
                        uri: this._commentEditor.getModel().uri,
                        value: this.comment.body.value
                    };
                    this.commentService.setActiveCommentThread(commentThread);
                }));
                this._commentEditorDisposables.push(this._commentEditor.onDidChangeModelContent(e => {
                    if (commentThread.input && this._commentEditor && this._commentEditor.getModel().uri === commentThread.input.uri) {
                        let newVal = this._commentEditor.getValue();
                        if (newVal !== commentThread.input.value) {
                            let input = commentThread.input;
                            input.value = newVal;
                            commentThread.input = input;
                        }
                    }
                }));
            }
            this._toDispose.push(this._commentEditor);
            this._toDispose.push(this._commentEditorModel);
        }
        removeCommentEditor() {
            this.isEditing = false;
            this._editAction.enabled = true;
            this._body.classList.remove('hidden');
            this._commentEditorModel.dispose();
            this._commentEditorDisposables.forEach(dispose => dispose.dispose());
            this._commentEditorDisposables = [];
            if (this._commentEditor) {
                this._commentEditor.dispose();
                this._commentEditor = null;
            }
            this._commentEditContainer.remove();
        }
        editComment() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._commentEditor) {
                    throw new Error('No comment editor');
                }
                this._updateCommentButton.enabled = false;
                this._updateCommentButton.label = UPDATE_IN_PROGRESS_LABEL;
                try {
                    const newBody = this._commentEditor.getValue();
                    if (this.comment.editCommand) {
                        let commentThread = this.commentThread;
                        commentThread.input = {
                            uri: this._commentEditor.getModel().uri,
                            value: newBody
                        };
                        this.commentService.setActiveCommentThread(commentThread);
                        let commandId = this.comment.editCommand.id;
                        let args = this.comment.editCommand.arguments || [];
                        yield this.commandService.executeCommand(commandId, ...args);
                    }
                    else {
                        yield this.commentService.editComment(this.owner, this.resource, this.comment, newBody);
                    }
                    this._updateCommentButton.enabled = true;
                    this._updateCommentButton.label = UPDATE_COMMENT_LABEL;
                    this._commentEditor.getDomNode().style.outline = '';
                    this.removeCommentEditor();
                    const editedComment = objects_1.assign({}, this.comment, { body: new htmlContent_1.MarkdownString(newBody) });
                    this.update(editedComment);
                }
                catch (e) {
                    this._updateCommentButton.enabled = true;
                    this._updateCommentButton.label = UPDATE_COMMENT_LABEL;
                    this._commentEditor.getDomNode().style.outline = `1px solid ${this.themeService.getTheme().getColor(colorRegistry_1.inputValidationErrorBorder)}`;
                    this._errorEditingContainer.textContent = e.message
                        ? nls.localize('commentEditError', "Updating the comment failed: {0}.", e.message)
                        : nls.localize('commentEditDefaultError', "Updating the comment failed.");
                    this._errorEditingContainer.classList.remove('hidden');
                    this._commentEditor.focus();
                }
            });
        }
        createDeleteAction() {
            return new actions_1.Action('comment.delete', nls.localize('label.delete', "Delete"), 'octicon octicon-x', true, () => {
                return this.dialogService.confirm({
                    message: nls.localize('confirmDelete', "Delete comment?"),
                    type: 'question',
                    primaryButton: nls.localize('label.delete', "Delete")
                }).then((result) => __awaiter(this, void 0, void 0, function* () {
                    if (result.confirmed) {
                        try {
                            if (this.comment.deleteCommand) {
                                this.commentService.setActiveCommentThread(this.commentThread);
                                let commandId = this.comment.deleteCommand.id;
                                let args = this.comment.deleteCommand.arguments || [];
                                yield this.commandService.executeCommand(commandId, ...args);
                            }
                            else {
                                const didDelete = yield this.commentService.deleteComment(this.owner, this.resource, this.comment);
                                if (didDelete) {
                                    this._onDidDelete.fire(this);
                                }
                                else {
                                    throw Error();
                                }
                            }
                        }
                        catch (e) {
                            const error = e.message
                                ? nls.localize('commentDeletionError', "Deleting the comment failed: {0}.", e.message)
                                : nls.localize('commentDeletionDefaultError', "Deleting the comment failed");
                            this.notificationService.error(error);
                        }
                    }
                }));
            });
        }
        createEditAction(commentDetailsContainer) {
            return new actions_1.Action('comment.edit', nls.localize('label.edit', "Edit"), 'octicon octicon-pencil', true, () => {
                this.isEditing = true;
                this._body.classList.add('hidden');
                this._commentEditContainer = dom.append(commentDetailsContainer, dom.$('.edit-container'));
                this.createCommentEditor();
                this._errorEditingContainer = dom.append(this._commentEditContainer, dom.$('.validation-error.hidden'));
                const formActions = dom.append(this._commentEditContainer, dom.$('.form-actions'));
                const cancelEditButton = new button_1.Button(formActions);
                cancelEditButton.label = nls.localize('label.cancel', "Cancel");
                this._toDispose.push(styler_1.attachButtonStyler(cancelEditButton, this.themeService));
                this._toDispose.push(cancelEditButton.onDidClick(_ => {
                    this.removeCommentEditor();
                }));
                this._updateCommentButton = new button_1.Button(formActions);
                this._updateCommentButton.label = UPDATE_COMMENT_LABEL;
                this._toDispose.push(styler_1.attachButtonStyler(this._updateCommentButton, this.themeService));
                this._toDispose.push(this._updateCommentButton.onDidClick(_ => {
                    this.editComment();
                }));
                this._commentEditorDisposables.push(this._commentEditor.onDidChangeModelContent(_ => {
                    this._updateCommentButton.enabled = !!this._commentEditor.getValue();
                }));
                this._editAction.enabled = false;
                return Promise.resolve();
            });
        }
        registerActionBarListeners(actionsContainer) {
            this._toDispose.push(dom.addDisposableListener(this._domNode, 'mouseenter', () => {
                actionsContainer.classList.remove('hidden');
            }));
            this._toDispose.push(dom.addDisposableListener(this._domNode, 'focus', () => {
                actionsContainer.classList.remove('hidden');
            }));
            this._toDispose.push(dom.addDisposableListener(this._domNode, 'mouseleave', () => {
                if (!this._domNode.contains(document.activeElement)) {
                    actionsContainer.classList.add('hidden');
                }
            }));
            this._toDispose.push(dom.addDisposableListener(this._domNode, 'focusout', (e) => {
                if (!this._domNode.contains(e.relatedTarget)) {
                    actionsContainer.classList.add('hidden');
                    if (this._commentEditor && this._commentEditor.getValue() === this.comment.body.value) {
                        this.removeCommentEditor();
                    }
                }
            }));
        }
        update(newComment) {
            if (newComment.body !== this.comment.body) {
                this._body.removeChild(this._md);
                this._md = this.markdownRenderer.render(newComment.body).element;
                this._body.appendChild(this._md);
            }
            this.comment = newComment;
            if (newComment.label) {
                this._isPendingLabel.innerText = newComment.label;
            }
            else if (newComment.isDraft) {
                this._isPendingLabel.innerText = 'Pending';
            }
            else {
                this._isPendingLabel.innerText = '';
            }
            // update comment reactions
            if (this._actionsContainer) {
                this._actionsContainer.remove();
            }
            if (this._reactionsActionBar) {
                this._reactionsActionBar.clear();
            }
            if (this.comment.commentReactions && this.comment.commentReactions.length) {
                this.createReactionsContainer(this._commentDetailsContainer);
            }
        }
        focus() {
            this.domNode.focus();
            if (!this._clearTimeout) {
                dom.addClass(this.domNode, 'focus');
                this._clearTimeout = setTimeout(() => {
                    dom.removeClass(this.domNode, 'focus');
                }, 3000);
            }
        }
        dispose() {
            this._toDispose.forEach(disposeable => disposeable.dispose());
        }
    };
    CommentNode = __decorate([
        __param(7, themeService_1.IThemeService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, commentService_1.ICommentService),
        __param(10, commands_1.ICommandService),
        __param(11, modelService_1.IModelService),
        __param(12, modeService_1.IModeService),
        __param(13, dialogs_1.IDialogService),
        __param(14, notification_1.INotificationService),
        __param(15, contextView_1.IContextMenuService)
    ], CommentNode);
    exports.CommentNode = CommentNode;
});
//# sourceMappingURL=commentNode.js.map