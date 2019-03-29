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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/common/modes", "vs/workbench/api/electron-browser/extHostCustomers", "vs/base/common/map", "vs/workbench/services/editor/common/editorService", "../node/extHost.protocol", "vs/workbench/contrib/comments/electron-browser/commentService", "vs/workbench/contrib/comments/electron-browser/commentsPanel", "vs/workbench/services/panel/common/panelService", "vs/base/common/uri", "vs/platform/telemetry/common/telemetry", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/workbench/browser/panel", "vs/base/common/event"], function (require, exports, lifecycle_1, editorBrowser_1, modes, extHostCustomers_1, map_1, editorService_1, extHost_protocol_1, commentService_1, commentsPanel_1, panelService_1, uri_1, telemetry_1, uuid_1, configuration_1, platform_1, panel_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MainThreadDocumentCommentProvider {
        get startDraftLabel() { return this._features.startDraftLabel; }
        get deleteDraftLabel() { return this._features.deleteDraftLabel; }
        get finishDraftLabel() { return this._features.finishDraftLabel; }
        get reactionGroup() { return this._features.reactionGroup; }
        constructor(proxy, handle, features) {
            this._proxy = proxy;
            this._handle = handle;
            this._features = features;
        }
        provideDocumentComments(uri, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$provideDocumentComments(this._handle, uri);
            });
        }
        createNewCommentThread(uri, range, text, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$createNewCommentThread(this._handle, uri, range, text);
            });
        }
        replyToCommentThread(uri, range, thread, text, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$replyToCommentThread(this._handle, uri, range, thread, text);
            });
        }
        editComment(uri, comment, text, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$editComment(this._handle, uri, comment, text);
            });
        }
        deleteComment(uri, comment, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$deleteComment(this._handle, uri, comment);
            });
        }
        startDraft(uri, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$startDraft(this._handle, uri);
            });
        }
        deleteDraft(uri, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$deleteDraft(this._handle, uri);
            });
        }
        finishDraft(uri, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$finishDraft(this._handle, uri);
            });
        }
        addReaction(uri, comment, reaction, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$addReaction(this._handle, uri, comment, reaction);
            });
        }
        deleteReaction(uri, comment, reaction, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$deleteReaction(this._handle, uri, comment, reaction);
            });
        }
    }
    exports.MainThreadDocumentCommentProvider = MainThreadDocumentCommentProvider;
    class MainThreadCommentThread {
        constructor(commentThreadHandle, controller, extensionId, threadId, resource, _range, _comments, _acceptInputCommand, _additionalCommands, _collapsibleState) {
            this.commentThreadHandle = commentThreadHandle;
            this.controller = controller;
            this.extensionId = extensionId;
            this.threadId = threadId;
            this.resource = resource;
            this._range = _range;
            this._comments = _comments;
            this._acceptInputCommand = _acceptInputCommand;
            this._additionalCommands = _additionalCommands;
            this._collapsibleState = _collapsibleState;
            this._onDidChangeInput = new event_1.Emitter();
            this._onDidChangeLabel = new event_1.Emitter();
            this._onDidChangeComments = new event_1.Emitter();
            this._onDidChangeAcceptInputCommand = new event_1.Emitter();
            this._onDidChangeAdditionalCommands = new event_1.Emitter();
            this._onDidChangeRange = new event_1.Emitter();
            this.onDidChangeRange = this._onDidChangeRange.event;
            this._onDidChangeCollasibleState = new event_1.Emitter();
            this.onDidChangeCollasibleState = this._onDidChangeCollasibleState.event;
        }
        get input() {
            return this._input;
        }
        set input(value) {
            this._input = value;
            this._onDidChangeInput.fire(value);
        }
        get onDidChangeInput() { return this._onDidChangeInput.event; }
        get label() {
            return this._label;
        }
        set label(label) {
            this._label = label;
            this._onDidChangeLabel.fire(this._label);
        }
        get onDidChangeLabel() { return this._onDidChangeLabel.event; }
        get comments() {
            return this._comments;
        }
        set comments(newComments) {
            this._comments = newComments;
            this._onDidChangeComments.fire(this._comments);
        }
        get onDidChangeComments() { return this._onDidChangeComments.event; }
        set acceptInputCommand(newCommand) {
            this._acceptInputCommand = newCommand;
            this._onDidChangeAcceptInputCommand.fire(this._acceptInputCommand);
        }
        get acceptInputCommand() {
            return this._acceptInputCommand;
        }
        get onDidChangeAcceptInputCommand() { return this._onDidChangeAcceptInputCommand.event; }
        set additionalCommands(newCommands) {
            this._additionalCommands = newCommands;
            this._onDidChangeAdditionalCommands.fire(this._additionalCommands);
        }
        get additionalCommands() {
            return this._additionalCommands;
        }
        get onDidChangeAdditionalCommands() { return this._onDidChangeAdditionalCommands.event; }
        set range(range) {
            this._range = range;
            this._onDidChangeRange.fire(this._range);
        }
        get range() {
            return this._range;
        }
        get collapsibleState() {
            return this._collapsibleState;
        }
        set collapsibleState(newState) {
            this._collapsibleState = newState;
            this._onDidChangeCollasibleState.fire(this._collapsibleState);
        }
        dispose() { }
        toJSON() {
            return {
                $mid: 7,
                commentControlHandle: this.controller.handle,
                commentThreadHandle: this.commentThreadHandle,
            };
        }
    }
    exports.MainThreadCommentThread = MainThreadCommentThread;
    class MainThreadCommentController {
        constructor(_proxy, _commentService, _handle, _uniqueId, _id, _label, _features) {
            this._proxy = _proxy;
            this._commentService = _commentService;
            this._handle = _handle;
            this._uniqueId = _uniqueId;
            this._id = _id;
            this._label = _label;
            this._features = _features;
            this._threads = new Map();
        }
        get handle() {
            return this._handle;
        }
        get id() {
            return this._id;
        }
        get proxy() {
            return this._proxy;
        }
        get label() {
            return this._label;
        }
        get reactions() {
            return this._reactions;
        }
        set reactions(reactions) {
            this._reactions = reactions;
        }
        updateFeatures(features) {
            this._features = features;
        }
        createCommentThread(commentThreadHandle, threadId, resource, range, comments, acceptInputCommand, additionalCommands, collapseState) {
            let thread = new MainThreadCommentThread(commentThreadHandle, this, '', threadId, uri_1.URI.revive(resource).toString(), range, comments, acceptInputCommand, additionalCommands, collapseState);
            this._threads.set(commentThreadHandle, thread);
            this._commentService.updateComments(this._uniqueId, {
                added: [thread],
                removed: [],
                changed: [],
                draftMode: modes.DraftMode.NotSupported
            });
            return thread;
        }
        deleteCommentThread(commentThreadHandle) {
            let thread = this.getKnownThread(commentThreadHandle);
            this._threads.delete(commentThreadHandle);
            this._commentService.updateComments(this._uniqueId, {
                added: [],
                removed: [thread],
                changed: [],
                draftMode: modes.DraftMode.NotSupported
            });
            thread.dispose();
        }
        updateComments(commentThreadHandle, comments) {
            let thread = this.getKnownThread(commentThreadHandle);
            thread.comments = comments;
            this._commentService.updateComments(this._uniqueId, {
                added: [],
                removed: [],
                changed: [thread],
                draftMode: modes.DraftMode.NotSupported
            });
        }
        updateAcceptInputCommand(commentThreadHandle, acceptInputCommand) {
            let thread = this.getKnownThread(commentThreadHandle);
            thread.acceptInputCommand = acceptInputCommand;
        }
        updateAdditionalCommands(commentThreadHandle, additionalCommands) {
            let thread = this.getKnownThread(commentThreadHandle);
            thread.additionalCommands = additionalCommands;
        }
        updateCollapsibleState(commentThreadHandle, collapseState) {
            let thread = this.getKnownThread(commentThreadHandle);
            thread.collapsibleState = collapseState;
        }
        updateCommentThreadRange(commentThreadHandle, range) {
            let thread = this.getKnownThread(commentThreadHandle);
            thread.range = range;
        }
        updateCommentThreadLabel(commentThreadHandle, label) {
            let thread = this.getKnownThread(commentThreadHandle);
            thread.label = label;
        }
        updateInput(input) {
            let thread = this.activeCommentThread;
            if (thread && thread.input) {
                let commentInput = thread.input;
                commentInput.value = input;
                thread.input = commentInput;
            }
        }
        getKnownThread(commentThreadHandle) {
            const thread = this._threads.get(commentThreadHandle);
            if (!thread) {
                throw new Error('unknown thread');
            }
            return thread;
        }
        getDocumentComments(resource, token) {
            return __awaiter(this, void 0, void 0, function* () {
                let ret = [];
                for (let thread of map_1.keys(this._threads)) {
                    const commentThread = this._threads.get(thread);
                    if (commentThread.resource === resource.toString()) {
                        ret.push(commentThread);
                    }
                }
                let commentingRanges = yield this._proxy.$provideCommentingRanges(this.handle, resource, token);
                return {
                    owner: this._uniqueId,
                    threads: ret,
                    commentingRanges: commentingRanges ?
                        {
                            resource: resource, ranges: commentingRanges, newCommentThreadCallback: (uri, range) => {
                                this._proxy.$createNewCommentWidgetCallback(this.handle, uri, range, token);
                            }
                        } : [],
                    draftMode: modes.DraftMode.NotSupported
                };
            });
        }
        getCommentingRanges(resource, token) {
            return __awaiter(this, void 0, void 0, function* () {
                let commentingRanges = yield this._proxy.$provideCommentingRanges(this.handle, resource, token);
                return commentingRanges || [];
            });
        }
        getReactionGroup() {
            return this._features.reactionGroup;
        }
        toggleReaction(uri, thread, comment, reaction, token) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._proxy.$toggleReaction(this._handle, thread.commentThreadHandle, uri, comment, reaction);
            });
        }
        getAllComments() {
            let ret = [];
            for (let thread of map_1.keys(this._threads)) {
                ret.push(this._threads.get(thread));
            }
            return ret;
        }
        toJSON() {
            return {
                $mid: 6,
                handle: this.handle
            };
        }
    }
    exports.MainThreadCommentController = MainThreadCommentController;
    let MainThreadComments = class MainThreadComments extends lifecycle_1.Disposable {
        constructor(extHostContext, _editorService, _commentService, _panelService, _telemetryService, _configurationService) {
            super();
            this._editorService = _editorService;
            this._commentService = _commentService;
            this._panelService = _panelService;
            this._telemetryService = _telemetryService;
            this._configurationService = _configurationService;
            this._documentProviders = new Map();
            this._workspaceProviders = new Map();
            this._handlers = new Map();
            this._commentControllers = new Map();
            this._disposables = [];
            this._activeCommentThreadDisposables = [];
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostComments);
            this._disposables.push(this._commentService.onDidChangeActiveCommentThread((thread) => __awaiter(this, void 0, void 0, function* () {
                let controller = thread.controller;
                if (!controller) {
                    return;
                }
                this._activeCommentThreadDisposables = lifecycle_1.dispose(this._activeCommentThreadDisposables);
                this._activeCommentThread = thread;
                controller.activeCommentThread = this._activeCommentThread;
                this._activeCommentThreadDisposables.push(this._activeCommentThread.onDidChangeInput(input => {
                    this._input = input;
                    this._proxy.$onCommentWidgetInputChange(controller.handle, this._input ? this._input.value : undefined);
                }));
                yield this._proxy.$onCommentWidgetInputChange(controller.handle, this._input ? this._input.value : undefined);
            })));
        }
        $registerCommentController(handle, id, label) {
            const providerId = uuid_1.generateUuid();
            this._handlers.set(handle, providerId);
            const provider = new MainThreadCommentController(this._proxy, this._commentService, handle, providerId, id, label, {});
            this._commentService.registerCommentController(providerId, provider);
            this._commentControllers.set(handle, provider);
            const commentsPanelAlreadyConstructed = this._panelService.getPanels().some(panel => panel.id === commentsPanel_1.COMMENTS_PANEL_ID);
            if (!commentsPanelAlreadyConstructed) {
                this.registerPanel(commentsPanelAlreadyConstructed);
                this.registerOpenPanelListener(commentsPanelAlreadyConstructed);
            }
            this._commentService.setWorkspaceComments(String(handle), []);
        }
        $updateCommentControllerFeatures(handle, features) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            provider.updateFeatures(features);
        }
        $createCommentThread(handle, commentThreadHandle, threadId, resource, range, comments, acceptInputCommand, additionalCommands, collapseState) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            return provider.createCommentThread(commentThreadHandle, threadId, resource, range, comments, acceptInputCommand, additionalCommands, collapseState);
        }
        $deleteCommentThread(handle, commentThreadHandle) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            return provider.deleteCommentThread(commentThreadHandle);
        }
        $updateComments(handle, commentThreadHandle, comments) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateComments(commentThreadHandle, comments);
        }
        $setInputValue(handle, input) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateInput(input);
        }
        $updateCommentThreadAcceptInputCommand(handle, commentThreadHandle, acceptInputCommand) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateAcceptInputCommand(commentThreadHandle, acceptInputCommand);
        }
        $updateCommentThreadAdditionalCommands(handle, commentThreadHandle, additionalCommands) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateAdditionalCommands(commentThreadHandle, additionalCommands);
        }
        $updateCommentThreadCollapsibleState(handle, commentThreadHandle, collapseState) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateCollapsibleState(commentThreadHandle, collapseState);
        }
        $updateCommentThreadRange(handle, commentThreadHandle, range) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateCommentThreadRange(commentThreadHandle, range);
        }
        $updateCommentThreadLabel(handle, commentThreadHandle, label) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateCommentThreadLabel(commentThreadHandle, label);
        }
        $registerDocumentCommentProvider(handle, features) {
            this._documentProviders.set(handle, undefined);
            const handler = new MainThreadDocumentCommentProvider(this._proxy, handle, features);
            const providerId = uuid_1.generateUuid();
            this._handlers.set(handle, providerId);
            this._commentService.registerDataProvider(providerId, handler);
        }
        registerPanel(commentsPanelAlreadyConstructed) {
            if (!commentsPanelAlreadyConstructed) {
                platform_1.Registry.as(panel_1.Extensions.Panels).registerPanel(new panel_1.PanelDescriptor(commentsPanel_1.CommentsPanel, commentsPanel_1.COMMENTS_PANEL_ID, commentsPanel_1.COMMENTS_PANEL_TITLE, 'commentsPanel', 10));
            }
        }
        /**
         * If the comments panel has never been opened, the constructor for it has not yet run so it has
         * no listeners for comment threads being set or updated. Listen for the panel opening for the
         * first time and send it comments then.
         */
        registerOpenPanelListener(commentsPanelAlreadyConstructed) {
            if (!commentsPanelAlreadyConstructed && !this._openPanelListener) {
                this._openPanelListener = this._panelService.onDidPanelOpen(e => {
                    if (e.panel.getId() === commentsPanel_1.COMMENTS_PANEL_ID) {
                        map_1.keys(this._workspaceProviders).forEach(handle => {
                            this._proxy.$provideWorkspaceComments(handle).then(commentThreads => {
                                if (commentThreads) {
                                    const providerId = this.getHandler(handle);
                                    this._commentService.setWorkspaceComments(providerId, commentThreads);
                                }
                            });
                        });
                        map_1.keys(this._commentControllers).forEach(handle => {
                            let threads = this._commentControllers.get(handle).getAllComments();
                            if (threads.length) {
                                const providerId = this.getHandler(handle);
                                this._commentService.setWorkspaceComments(providerId, threads);
                            }
                        });
                        if (this._openPanelListener) {
                            this._openPanelListener.dispose();
                            this._openPanelListener = null;
                        }
                    }
                });
            }
        }
        getHandler(handle) {
            if (!this._handlers.has(handle)) {
                throw new Error('Unknown handler');
            }
            return this._handlers.get(handle);
        }
        $registerWorkspaceCommentProvider(handle, extensionId) {
            this._workspaceProviders.set(handle, undefined);
            const providerId = uuid_1.generateUuid();
            this._handlers.set(handle, providerId);
            const commentsPanelAlreadyConstructed = this._panelService.getPanels().some(panel => panel.id === commentsPanel_1.COMMENTS_PANEL_ID);
            if (!commentsPanelAlreadyConstructed) {
                this.registerPanel(commentsPanelAlreadyConstructed);
            }
            const openPanel = this._configurationService.getValue('comments').openPanel;
            if (openPanel === 'neverOpen') {
                this.registerOpenPanelListener(commentsPanelAlreadyConstructed);
            }
            if (openPanel === 'openOnSessionStart') {
                this._panelService.openPanel(commentsPanel_1.COMMENTS_PANEL_ID);
            }
            this._proxy.$provideWorkspaceComments(handle).then(commentThreads => {
                if (commentThreads) {
                    if (openPanel === 'openOnSessionStartWithComments' && commentThreads.length) {
                        if (commentThreads.length) {
                            this._panelService.openPanel(commentsPanel_1.COMMENTS_PANEL_ID);
                        }
                        else {
                            this.registerOpenPanelListener(commentsPanelAlreadyConstructed);
                        }
                    }
                    this._commentService.setWorkspaceComments(providerId, commentThreads);
                }
            });
            /* __GDPR__
                "comments:registerWorkspaceCommentProvider" : {
                    "extensionId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this._telemetryService.publicLog('comments:registerWorkspaceCommentProvider', {
                extensionId: extensionId.value
            });
        }
        $unregisterDocumentCommentProvider(handle) {
            this._documentProviders.delete(handle);
            const handlerId = this.getHandler(handle);
            this._commentService.unregisterDataProvider(handlerId);
            this._handlers.delete(handle);
        }
        $unregisterWorkspaceCommentProvider(handle) {
            this._workspaceProviders.delete(handle);
            if (this._workspaceProviders.size === 0) {
                platform_1.Registry.as(panel_1.Extensions.Panels).deregisterPanel(commentsPanel_1.COMMENTS_PANEL_ID);
                if (this._openPanelListener) {
                    this._openPanelListener.dispose();
                    this._openPanelListener = null;
                }
            }
            const handlerId = this.getHandler(handle);
            this._commentService.removeWorkspaceComments(handlerId);
            this._handlers.delete(handle);
        }
        $onDidCommentThreadsChange(handle, event) {
            // notify comment service
            const providerId = this.getHandler(handle);
            this._commentService.updateComments(providerId, event);
        }
        getVisibleEditors() {
            let ret = [];
            this._editorService.visibleControls.forEach(control => {
                if (editorBrowser_1.isCodeEditor(control.getControl())) {
                    ret.push(control.getControl());
                }
                if (editorBrowser_1.isDiffEditor(control.getControl())) {
                    let diffEditor = control.getControl();
                    ret.push(diffEditor.getOriginalEditor(), diffEditor.getModifiedEditor());
                }
            });
            return ret;
        }
        provideWorkspaceComments() {
            return __awaiter(this, void 0, void 0, function* () {
                const result = [];
                for (const handle of map_1.keys(this._workspaceProviders)) {
                    const result = yield this._proxy.$provideWorkspaceComments(handle);
                    if (Array.isArray(result)) {
                        result.push(...result);
                    }
                }
                return result;
            });
        }
        provideDocumentComments(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = [];
                for (const handle of map_1.keys(this._documentProviders)) {
                    result.push(yield this._proxy.$provideDocumentComments(handle, resource));
                }
                return result;
            });
        }
        dispose() {
            this._disposables = lifecycle_1.dispose(this._disposables);
            this._activeCommentThreadDisposables = lifecycle_1.dispose(this._activeCommentThreadDisposables);
            this._workspaceProviders.forEach(value => lifecycle_1.dispose(value));
            this._workspaceProviders.clear();
            this._documentProviders.forEach(value => lifecycle_1.dispose(value));
            this._documentProviders.clear();
        }
    };
    MainThreadComments = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadComments),
        __param(1, editorService_1.IEditorService),
        __param(2, commentService_1.ICommentService),
        __param(3, panelService_1.IPanelService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, configuration_1.IConfigurationService)
    ], MainThreadComments);
    exports.MainThreadComments = MainThreadComments;
});
//# sourceMappingURL=mainThreadComments.js.map