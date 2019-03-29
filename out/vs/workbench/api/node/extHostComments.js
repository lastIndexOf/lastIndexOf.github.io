/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/uri", "vs/editor/common/modes", "vs/workbench/api/node/extHostTypeConverters", "vs/workbench/api/node/extHostTypes", "./extHost.protocol", "vs/base/common/cancellation", "vs/platform/extensions/common/extensions", "vs/base/common/event"], function (require, exports, async_1, uri_1, modes, extHostTypeConverter, types, extHost_protocol_1, cancellation_1, extensions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostComments {
        constructor(mainContext, _commands, _documents) {
            this._commands = _commands;
            this._documents = _documents;
            this._commentControllers = new Map();
            this._commentControllersByExtension = new Map();
            this._documentProviders = new Map();
            this._workspaceProviders = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadComments);
            _commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (arg && arg.$mid === 6) {
                        const commentController = this._commentControllers.get(arg.handle);
                        if (!commentController) {
                            return arg;
                        }
                        return commentController;
                    }
                    else if (arg && arg.$mid === 7) {
                        const commentController = this._commentControllers.get(arg.commentControlHandle);
                        if (!commentController) {
                            return arg;
                        }
                        const commentThread = commentController.getCommentThread(arg.commentThreadHandle);
                        if (!commentThread) {
                            return arg;
                        }
                        return commentThread;
                    }
                    return arg;
                }
            });
        }
        createCommentController(extension, id, label) {
            const handle = ExtHostComments.handlePool++;
            const commentController = new ExtHostCommentController(extension, handle, this._commands.converter, this._proxy, id, label);
            this._commentControllers.set(commentController.handle, commentController);
            const commentControllers = this._commentControllersByExtension.get(extensions_1.ExtensionIdentifier.toKey(extension.identifier)) || [];
            commentControllers.push(commentController);
            this._commentControllersByExtension.set(extensions_1.ExtensionIdentifier.toKey(extension.identifier), commentControllers);
            return commentController;
        }
        $onCommentWidgetInputChange(commentControllerHandle, input) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController) {
                return Promise.resolve(undefined);
            }
            commentController.$onCommentWidgetInputChange(input);
            return Promise.resolve(commentControllerHandle);
        }
        $provideCommentingRanges(commentControllerHandle, uriComponents, token) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController || !commentController.commentingRangeProvider) {
                return Promise.resolve(undefined);
            }
            const document = this._documents.getDocument(uri_1.URI.revive(uriComponents));
            return async_1.asPromise(() => {
                return commentController.commentingRangeProvider.provideCommentingRanges(document, token);
            }).then(ranges => ranges ? ranges.map(x => extHostTypeConverter.Range.from(x)) : undefined);
        }
        $provideReactionGroup(commentControllerHandle) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController || !commentController.reactionProvider) {
                return Promise.resolve(undefined);
            }
            return async_1.asPromise(() => {
                return commentController.reactionProvider.availableReactions;
            }).then(reactions => reactions.map(reaction => convertToReaction2(commentController.reactionProvider, reaction)));
        }
        $toggleReaction(commentControllerHandle, threadHandle, uri, comment, reaction) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController || !commentController.reactionProvider || !commentController.reactionProvider.toggleReaction) {
                return Promise.resolve(undefined);
            }
            return async_1.asPromise(() => {
                const commentThread = commentController.getCommentThread(threadHandle);
                if (commentThread) {
                    const vscodeComment = commentThread.getComment(comment.commentId);
                    if (commentController !== undefined && commentController.reactionProvider && commentController.reactionProvider.toggleReaction && vscodeComment) {
                        return commentController.reactionProvider.toggleReaction(document, vscodeComment, convertFromReaction(reaction));
                    }
                }
                return Promise.resolve(undefined);
            });
        }
        $createNewCommentWidgetCallback(commentControllerHandle, uriComponents, range, token) {
            const commentController = this._commentControllers.get(commentControllerHandle);
            if (!commentController || !commentController.emptyCommentThreadFactory) {
                return;
            }
            const document = this._documents.getDocument(uri_1.URI.revive(uriComponents));
            commentController.emptyCommentThreadFactory.createEmptyCommentThread(document, extHostTypeConverter.Range.to(range));
        }
        registerWorkspaceCommentProvider(extensionId, provider) {
            const handle = ExtHostComments.handlePool++;
            this._workspaceProviders.set(handle, {
                extensionId,
                provider
            });
            this._proxy.$registerWorkspaceCommentProvider(handle, extensionId);
            this.registerListeners(handle, extensionId, provider);
            return {
                dispose: () => {
                    this._proxy.$unregisterWorkspaceCommentProvider(handle);
                    this._workspaceProviders.delete(handle);
                }
            };
        }
        registerDocumentCommentProvider(extensionId, provider) {
            const handle = ExtHostComments.handlePool++;
            this._documentProviders.set(handle, {
                extensionId,
                provider
            });
            this._proxy.$registerDocumentCommentProvider(handle, {
                startDraftLabel: provider.startDraftLabel,
                deleteDraftLabel: provider.deleteDraftLabel,
                finishDraftLabel: provider.finishDraftLabel,
                reactionGroup: provider.reactionGroup ? provider.reactionGroup.map(reaction => convertToReaction(provider, reaction)) : undefined
            });
            this.registerListeners(handle, extensionId, provider);
            return {
                dispose: () => {
                    this._proxy.$unregisterDocumentCommentProvider(handle);
                    this._documentProviders.delete(handle);
                }
            };
        }
        $createNewCommentThread(handle, uri, range, text) {
            const data = this._documents.getDocumentData(uri_1.URI.revive(uri));
            const ran = extHostTypeConverter.Range.to(range);
            if (!data || !data.document) {
                return Promise.resolve(null);
            }
            const handlerData = this.getDocumentProvider(handle);
            return async_1.asPromise(() => {
                return handlerData.provider.createNewCommentThread(data.document, ran, text, cancellation_1.CancellationToken.None);
            }).then(commentThread => commentThread ? convertToCommentThread(handlerData.extensionId, handlerData.provider, commentThread, this._commands.converter) : null);
        }
        $replyToCommentThread(handle, uri, range, thread, text) {
            const data = this._documents.getDocumentData(uri_1.URI.revive(uri));
            const ran = extHostTypeConverter.Range.to(range);
            if (!data || !data.document) {
                return Promise.resolve(null);
            }
            const handlerData = this.getDocumentProvider(handle);
            return async_1.asPromise(() => {
                return handlerData.provider.replyToCommentThread(data.document, ran, convertFromCommentThread(thread), text, cancellation_1.CancellationToken.None);
            }).then(commentThread => commentThread ? convertToCommentThread(handlerData.extensionId, handlerData.provider, commentThread, this._commands.converter) : null);
        }
        $editComment(handle, uri, comment, text) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const handlerData = this.getDocumentProvider(handle);
            if (!handlerData.provider.editComment) {
                return Promise.reject(new Error('not implemented'));
            }
            return async_1.asPromise(() => {
                return handlerData.provider.editComment(document, convertFromComment(comment), text, cancellation_1.CancellationToken.None);
            });
        }
        $deleteComment(handle, uri, comment) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const handlerData = this.getDocumentProvider(handle);
            if (!handlerData.provider.deleteComment) {
                return Promise.reject(new Error('not implemented'));
            }
            return async_1.asPromise(() => {
                return handlerData.provider.deleteComment(document, convertFromComment(comment), cancellation_1.CancellationToken.None);
            });
        }
        $startDraft(handle, uri) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const handlerData = this.getDocumentProvider(handle);
            if (!handlerData.provider.startDraft) {
                return Promise.reject(new Error('not implemented'));
            }
            return async_1.asPromise(() => {
                return handlerData.provider.startDraft(document, cancellation_1.CancellationToken.None);
            });
        }
        $deleteDraft(handle, uri) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const handlerData = this.getDocumentProvider(handle);
            if (!handlerData.provider.deleteDraft) {
                return Promise.reject(new Error('not implemented'));
            }
            return async_1.asPromise(() => {
                return handlerData.provider.deleteDraft(document, cancellation_1.CancellationToken.None);
            });
        }
        $finishDraft(handle, uri) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const handlerData = this.getDocumentProvider(handle);
            if (!handlerData.provider.finishDraft) {
                return Promise.reject(new Error('not implemented'));
            }
            return async_1.asPromise(() => {
                return handlerData.provider.finishDraft(document, cancellation_1.CancellationToken.None);
            });
        }
        $addReaction(handle, uri, comment, reaction) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const handlerData = this.getDocumentProvider(handle);
            if (!handlerData.provider.addReaction) {
                return Promise.reject(new Error('not implemented'));
            }
            return async_1.asPromise(() => {
                return handlerData.provider.addReaction(document, convertFromComment(comment), convertFromReaction(reaction));
            });
        }
        $deleteReaction(handle, uri, comment, reaction) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const handlerData = this.getDocumentProvider(handle);
            if (!handlerData.provider.deleteReaction) {
                return Promise.reject(new Error('not implemented'));
            }
            return async_1.asPromise(() => {
                return handlerData.provider.deleteReaction(document, convertFromComment(comment), convertFromReaction(reaction));
            });
        }
        $provideDocumentComments(handle, uri) {
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const handlerData = this.getDocumentProvider(handle);
            return async_1.asPromise(() => {
                return handlerData.provider.provideDocumentComments(document, cancellation_1.CancellationToken.None);
            }).then(commentInfo => commentInfo ? convertCommentInfo(handle, handlerData.extensionId, handlerData.provider, commentInfo, this._commands.converter) : null);
        }
        $provideWorkspaceComments(handle) {
            const handlerData = this._workspaceProviders.get(handle);
            if (!handlerData) {
                return Promise.resolve(null);
            }
            return async_1.asPromise(() => {
                return handlerData.provider.provideWorkspaceComments(cancellation_1.CancellationToken.None);
            }).then(comments => comments.map(comment => convertToCommentThread(handlerData.extensionId, handlerData.provider, comment, this._commands.converter)));
        }
        registerListeners(handle, extensionId, provider) {
            provider.onDidChangeCommentThreads(event => {
                this._proxy.$onDidCommentThreadsChange(handle, {
                    changed: event.changed.map(thread => convertToCommentThread(extensionId, provider, thread, this._commands.converter)),
                    added: event.added.map(thread => convertToCommentThread(extensionId, provider, thread, this._commands.converter)),
                    removed: event.removed.map(thread => convertToCommentThread(extensionId, provider, thread, this._commands.converter)),
                    draftMode: !!provider.startDraft && !!provider.finishDraft ? (event.inDraftMode ? modes.DraftMode.InDraft : modes.DraftMode.NotInDraft) : modes.DraftMode.NotSupported
                });
            });
        }
        getDocumentProvider(handle) {
            const provider = this._documentProviders.get(handle);
            if (!provider) {
                throw new Error('unknown provider');
            }
            return provider;
        }
    }
    ExtHostComments.handlePool = 0;
    exports.ExtHostComments = ExtHostComments;
    class ExtHostCommentThread {
        constructor(_proxy, _commandsConverter, _commentController, _threadId, _resource, _range) {
            this._proxy = _proxy;
            this._commandsConverter = _commandsConverter;
            this._commentController = _commentController;
            this._threadId = _threadId;
            this._resource = _resource;
            this._range = _range;
            this.handle = ExtHostCommentThread._handlePool++;
            this._comments = [];
            this._additionalCommands = [];
            this._proxy.$createCommentThread(this._commentController.handle, this.handle, this._threadId, this._resource, extHostTypeConverter.Range.from(this._range), this._comments.map(comment => { return convertToModeComment(this._commentController, comment, this._commandsConverter); }), this._acceptInputCommand ? this._commandsConverter.toInternal(this._acceptInputCommand) : undefined, this._additionalCommands ? this._additionalCommands.map(x => this._commandsConverter.toInternal(x)) : [], this._collapseState);
        }
        get threadId() {
            return this._threadId;
        }
        get resource() {
            return this._resource;
        }
        set range(range) {
            if (range.isEqual(this._range)) {
                this._range = range;
                this._proxy.$updateCommentThreadRange(this._commentController.handle, this.handle, extHostTypeConverter.Range.from(this._range));
            }
        }
        get range() {
            return this._range;
        }
        get label() {
            return this._label;
        }
        set label(label) {
            this._label = label;
            this._proxy.$updateCommentThreadLabel(this._commentController.handle, this.handle, this._label);
        }
        get comments() {
            return this._comments;
        }
        set comments(newComments) {
            this._proxy.$updateComments(this._commentController.handle, this.handle, newComments.map(cmt => { return convertToModeComment(this._commentController, cmt, this._commandsConverter); }));
            this._comments = newComments;
        }
        get acceptInputCommand() {
            return this._acceptInputCommand;
        }
        set acceptInputCommand(acceptInputCommand) {
            this._acceptInputCommand = acceptInputCommand;
            const internal = this._commandsConverter.toInternal(acceptInputCommand);
            this._proxy.$updateCommentThreadAcceptInputCommand(this._commentController.handle, this.handle, internal);
        }
        get additionalCommands() {
            return this._additionalCommands;
        }
        set additionalCommands(additionalCommands) {
            this._additionalCommands = additionalCommands;
            const internals = additionalCommands.map(x => this._commandsConverter.toInternal(x));
            this._proxy.$updateCommentThreadAdditionalCommands(this._commentController.handle, this.handle, internals);
        }
        get collapsibleState() {
            return this._collapseState;
        }
        set collapsibleState(newState) {
            this._collapseState = newState;
            this._proxy.$updateCommentThreadCollapsibleState(this._commentController.handle, this.handle, convertToCollapsibleState(newState));
        }
        getComment(commentId) {
            const comments = this._comments.filter(comment => comment.commentId === commentId);
            if (comments && comments.length) {
                return comments[0];
            }
            return undefined;
        }
        dispose() {
            this._proxy.$deleteCommentThread(this._commentController.handle, this.handle);
        }
    }
    ExtHostCommentThread._handlePool = 0;
    exports.ExtHostCommentThread = ExtHostCommentThread;
    class ExtHostCommentInputBox {
        constructor(_proxy, commentControllerHandle, input) {
            this._proxy = _proxy;
            this.commentControllerHandle = commentControllerHandle;
            this._onDidChangeValue = new event_1.Emitter();
            this._value = '';
            this._value = input;
        }
        get onDidChangeValue() {
            return this._onDidChangeValue.event;
        }
        get value() {
            return this._value;
        }
        set value(newInput) {
            this._value = newInput;
            this._onDidChangeValue.fire(this._value);
            this._proxy.$setInputValue(this.commentControllerHandle, newInput);
        }
        setInput(input) {
            this._value = input;
        }
    }
    exports.ExtHostCommentInputBox = ExtHostCommentInputBox;
    class ExtHostCommentController {
        constructor(_extension, _handle, _commandsConverter, _proxy, _id, _label) {
            this._handle = _handle;
            this._commandsConverter = _commandsConverter;
            this._proxy = _proxy;
            this._id = _id;
            this._label = _label;
            this._threads = new Map();
            this._proxy.$registerCommentController(this.handle, _id, _label);
        }
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        get handle() {
            return this._handle;
        }
        get reactionProvider() {
            return this._commentReactionProvider;
        }
        set reactionProvider(provider) {
            this._commentReactionProvider = provider;
            if (provider) {
                this._proxy.$updateCommentControllerFeatures(this.handle, { reactionGroup: provider.availableReactions.map(reaction => convertToReaction2(provider, reaction)) });
            }
        }
        createCommentThread(id, resource, range) {
            const commentThread = new ExtHostCommentThread(this._proxy, this._commandsConverter, this, id, resource, range);
            this._threads.set(commentThread.handle, commentThread);
            return commentThread;
        }
        $onCommentWidgetInputChange(input) {
            if (!this.inputBox) {
                this.inputBox = new ExtHostCommentInputBox(this._proxy, this.handle, input);
            }
            else {
                this.inputBox.setInput(input);
            }
        }
        getCommentThread(handle) {
            return this._threads.get(handle);
        }
        dispose() {
            this._threads.forEach(value => {
                value.dispose();
            });
        }
    }
    function convertCommentInfo(owner, extensionId, provider, vscodeCommentInfo, commandsConverter) {
        return {
            extensionId: extensionId.value,
            threads: vscodeCommentInfo.threads.map(x => convertToCommentThread(extensionId, provider, x, commandsConverter)),
            commentingRanges: vscodeCommentInfo.commentingRanges ? vscodeCommentInfo.commentingRanges.map(range => extHostTypeConverter.Range.from(range)) : [],
            draftMode: provider.startDraft && provider.finishDraft ? (vscodeCommentInfo.inDraftMode ? modes.DraftMode.InDraft : modes.DraftMode.NotInDraft) : modes.DraftMode.NotSupported
        };
    }
    function convertToCommentThread(extensionId, provider, vscodeCommentThread, commandsConverter) {
        return {
            extensionId: extensionId.value,
            threadId: vscodeCommentThread.threadId,
            resource: vscodeCommentThread.resource.toString(),
            range: extHostTypeConverter.Range.from(vscodeCommentThread.range),
            comments: vscodeCommentThread.comments.map(comment => convertToComment(provider, comment, commandsConverter)),
            collapsibleState: vscodeCommentThread.collapsibleState
        };
    }
    function convertFromCommentThread(commentThread) {
        return {
            threadId: commentThread.threadId,
            resource: uri_1.URI.parse(commentThread.resource),
            range: extHostTypeConverter.Range.to(commentThread.range),
            comments: commentThread.comments.map(convertFromComment),
            collapsibleState: commentThread.collapsibleState
        };
    }
    function convertFromComment(comment) {
        let userIconPath;
        if (comment.userIconPath) {
            try {
                userIconPath = uri_1.URI.parse(comment.userIconPath);
            }
            catch (e) {
                // Ignore
            }
        }
        return {
            commentId: comment.commentId,
            body: extHostTypeConverter.MarkdownString.to(comment.body),
            userName: comment.userName,
            userIconPath: userIconPath,
            canEdit: comment.canEdit,
            canDelete: comment.canDelete,
            isDraft: comment.isDraft,
            commentReactions: comment.commentReactions ? comment.commentReactions.map(reaction => {
                return {
                    label: reaction.label,
                    count: reaction.count,
                    hasReacted: reaction.hasReacted
                };
            }) : undefined
        };
    }
    function convertToModeComment(commentController, vscodeComment, commandsConverter) {
        const iconPath = vscodeComment.userIconPath ? vscodeComment.userIconPath.toString() : vscodeComment.gravatar;
        return {
            commentId: vscodeComment.commentId,
            body: extHostTypeConverter.MarkdownString.from(vscodeComment.body),
            userName: vscodeComment.userName,
            userIconPath: iconPath,
            isDraft: vscodeComment.isDraft,
            selectCommand: vscodeComment.selectCommand ? commandsConverter.toInternal(vscodeComment.selectCommand) : undefined,
            editCommand: vscodeComment.editCommand ? commandsConverter.toInternal(vscodeComment.editCommand) : undefined,
            deleteCommand: vscodeComment.editCommand ? commandsConverter.toInternal(vscodeComment.deleteCommand) : undefined,
            label: vscodeComment.label,
            commentReactions: vscodeComment.commentReactions ? vscodeComment.commentReactions.map(reaction => convertToReaction2(commentController.reactionProvider, reaction)) : undefined
        };
    }
    function convertToComment(provider, vscodeComment, commandsConverter) {
        const canEdit = !!provider.editComment && vscodeComment.canEdit;
        const canDelete = !!provider.deleteComment && vscodeComment.canDelete;
        const iconPath = vscodeComment.userIconPath ? vscodeComment.userIconPath.toString() : vscodeComment.gravatar;
        return {
            commentId: vscodeComment.commentId,
            body: extHostTypeConverter.MarkdownString.from(vscodeComment.body),
            userName: vscodeComment.userName,
            userIconPath: iconPath,
            canEdit: canEdit,
            canDelete: canDelete,
            selectCommand: vscodeComment.command ? commandsConverter.toInternal(vscodeComment.command) : undefined,
            isDraft: vscodeComment.isDraft,
            commentReactions: vscodeComment.commentReactions ? vscodeComment.commentReactions.map(reaction => convertToReaction(provider, reaction)) : undefined
        };
    }
    function convertToReaction(provider, reaction) {
        const providerCanDeleteReaction = !!provider.deleteReaction;
        const providerCanAddReaction = !!provider.addReaction;
        return {
            label: reaction.label,
            iconPath: reaction.iconPath ? extHostTypeConverter.pathOrURIToURI(reaction.iconPath) : undefined,
            count: reaction.count,
            hasReacted: reaction.hasReacted,
            canEdit: (reaction.hasReacted && providerCanDeleteReaction) || (!reaction.hasReacted && providerCanAddReaction)
        };
    }
    function convertToReaction2(provider, reaction) {
        return {
            label: reaction.label,
            iconPath: reaction.iconPath ? extHostTypeConverter.pathOrURIToURI(reaction.iconPath) : undefined,
            count: reaction.count,
            hasReacted: reaction.hasReacted,
            canEdit: provider !== undefined ? !!provider.toggleReaction : false
        };
    }
    function convertFromReaction(reaction) {
        return {
            label: reaction.label,
            count: reaction.count,
            hasReacted: reaction.hasReacted
        };
    }
    function convertToCollapsibleState(kind) {
        if (kind !== undefined) {
            switch (kind) {
                case types.CommentThreadCollapsibleState.Expanded:
                    return modes.CommentThreadCollapsibleState.Expanded;
                case types.CommentThreadCollapsibleState.Collapsed:
                    return modes.CommentThreadCollapsibleState.Collapsed;
            }
        }
        return modes.CommentThreadCollapsibleState.Collapsed;
    }
});
//# sourceMappingURL=extHostComments.js.map