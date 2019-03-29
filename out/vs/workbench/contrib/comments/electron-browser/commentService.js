/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/cancellation", "vs/base/common/objects"], function (require, exports, instantiation_1, event_1, lifecycle_1, map_1, cancellation_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ICommentService = instantiation_1.createDecorator('commentService');
    class CommentService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidSetDataProvider = this._register(new event_1.Emitter());
            this.onDidSetDataProvider = this._onDidSetDataProvider.event;
            this._onDidDeleteDataProvider = this._register(new event_1.Emitter());
            this.onDidDeleteDataProvider = this._onDidDeleteDataProvider.event;
            this._onDidSetResourceCommentInfos = this._register(new event_1.Emitter());
            this.onDidSetResourceCommentInfos = this._onDidSetResourceCommentInfos.event;
            this._onDidSetAllCommentThreads = this._register(new event_1.Emitter());
            this.onDidSetAllCommentThreads = this._onDidSetAllCommentThreads.event;
            this._onDidUpdateCommentThreads = this._register(new event_1.Emitter());
            this.onDidUpdateCommentThreads = this._onDidUpdateCommentThreads.event;
            this._onDidChangeActiveCommentThread = this._register(new event_1.Emitter());
            this.onDidChangeActiveCommentThread = this._onDidChangeActiveCommentThread.event;
            this._onDidChangeInput = this._register(new event_1.Emitter());
            this.onDidChangeInput = this._onDidChangeInput.event;
            this._onDidChangeActiveCommentingRange = this._register(new event_1.Emitter());
            this.onDidChangeActiveCommentingRange = this._onDidChangeActiveCommentingRange.event;
            this._commentProviders = new Map();
            this._commentControls = new Map();
        }
        setActiveCommentThread(commentThread) {
            this._onDidChangeActiveCommentThread.fire(commentThread);
        }
        setInput(input) {
            this._onDidChangeInput.fire(input);
        }
        setDocumentComments(resource, commentInfos) {
            this._onDidSetResourceCommentInfos.fire({ resource, commentInfos });
        }
        setWorkspaceComments(owner, commentsByResource) {
            this._onDidSetAllCommentThreads.fire({ ownerId: owner, commentThreads: commentsByResource });
        }
        removeWorkspaceComments(owner) {
            this._onDidSetAllCommentThreads.fire({ ownerId: owner, commentThreads: [] });
        }
        registerCommentController(owner, commentControl) {
            this._commentControls.set(owner, commentControl);
            this._onDidSetDataProvider.fire();
        }
        registerDataProvider(owner, commentProvider) {
            this._commentProviders.set(owner, commentProvider);
            this._onDidSetDataProvider.fire();
        }
        unregisterDataProvider(owner) {
            this._commentProviders.delete(owner);
            this._onDidDeleteDataProvider.fire(owner);
        }
        updateComments(ownerId, event) {
            const evt = objects_1.assign({}, event, { owner: ownerId });
            this._onDidUpdateCommentThreads.fire(evt);
        }
        createNewCommentThread(owner, resource, range, text) {
            return __awaiter(this, void 0, void 0, function* () {
                const commentProvider = this._commentProviders.get(owner);
                if (commentProvider) {
                    return yield commentProvider.createNewCommentThread(resource, range, text, cancellation_1.CancellationToken.None);
                }
                return null;
            });
        }
        replyToCommentThread(owner, resource, range, thread, text) {
            return __awaiter(this, void 0, void 0, function* () {
                const commentProvider = this._commentProviders.get(owner);
                if (commentProvider) {
                    return yield commentProvider.replyToCommentThread(resource, range, thread, text, cancellation_1.CancellationToken.None);
                }
                return null;
            });
        }
        editComment(owner, resource, comment, text) {
            const commentProvider = this._commentProviders.get(owner);
            if (commentProvider) {
                return commentProvider.editComment(resource, comment, text, cancellation_1.CancellationToken.None);
            }
            return Promise.resolve(undefined);
        }
        deleteComment(owner, resource, comment) {
            const commentProvider = this._commentProviders.get(owner);
            if (commentProvider) {
                return commentProvider.deleteComment(resource, comment, cancellation_1.CancellationToken.None).then(() => true);
            }
            return Promise.resolve(false);
        }
        startDraft(owner, resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const commentProvider = this._commentProviders.get(owner);
                if (commentProvider && commentProvider.startDraft) {
                    return commentProvider.startDraft(resource, cancellation_1.CancellationToken.None);
                }
                else {
                    throw new Error('Not supported');
                }
            });
        }
        deleteDraft(owner, resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const commentProvider = this._commentProviders.get(owner);
                if (commentProvider && commentProvider.deleteDraft) {
                    return commentProvider.deleteDraft(resource, cancellation_1.CancellationToken.None);
                }
                else {
                    throw new Error('Not supported');
                }
            });
        }
        finishDraft(owner, resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const commentProvider = this._commentProviders.get(owner);
                if (commentProvider && commentProvider.finishDraft) {
                    return commentProvider.finishDraft(resource, cancellation_1.CancellationToken.None);
                }
                else {
                    throw new Error('Not supported');
                }
            });
        }
        addReaction(owner, resource, comment, reaction) {
            return __awaiter(this, void 0, void 0, function* () {
                const commentProvider = this._commentProviders.get(owner);
                if (commentProvider && commentProvider.addReaction) {
                    return commentProvider.addReaction(resource, comment, reaction, cancellation_1.CancellationToken.None);
                }
                else {
                    throw new Error('Not supported');
                }
            });
        }
        deleteReaction(owner, resource, comment, reaction) {
            return __awaiter(this, void 0, void 0, function* () {
                const commentProvider = this._commentProviders.get(owner);
                if (commentProvider && commentProvider.deleteReaction) {
                    return commentProvider.deleteReaction(resource, comment, reaction, cancellation_1.CancellationToken.None);
                }
                else {
                    throw new Error('Not supported');
                }
            });
        }
        toggleReaction(owner, resource, thread, comment, reaction) {
            return __awaiter(this, void 0, void 0, function* () {
                const commentController = this._commentControls.get(owner);
                if (commentController) {
                    return commentController.toggleReaction(resource, thread, comment, reaction, cancellation_1.CancellationToken.None);
                }
                else {
                    throw new Error('Not supported');
                }
            });
        }
        getReactionGroup(owner) {
            const commentProvider = this._commentControls.get(owner);
            if (commentProvider) {
                return commentProvider.getReactionGroup();
            }
            const commentController = this._commentControls.get(owner);
            if (commentController) {
                return commentController.getReactionGroup();
            }
            return undefined;
        }
        getStartDraftLabel(owner) {
            const commentProvider = this._commentProviders.get(owner);
            if (commentProvider) {
                return commentProvider.startDraftLabel;
            }
            return undefined;
        }
        getDeleteDraftLabel(owner) {
            const commentProvider = this._commentProviders.get(owner);
            if (commentProvider) {
                return commentProvider.deleteDraftLabel;
            }
            return undefined;
        }
        getFinishDraftLabel(owner) {
            const commentProvider = this._commentProviders.get(owner);
            if (commentProvider) {
                return commentProvider.finishDraftLabel;
            }
            return undefined;
        }
        getComments(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = [];
                for (const owner of map_1.keys(this._commentProviders)) {
                    const provider = this._commentProviders.get(owner);
                    if (provider && provider.provideDocumentComments) {
                        result.push(provider.provideDocumentComments(resource, cancellation_1.CancellationToken.None).then(commentInfo => {
                            if (commentInfo) {
                                return {
                                    owner: owner,
                                    threads: commentInfo.threads,
                                    commentingRanges: commentInfo.commentingRanges,
                                    reply: commentInfo.reply,
                                    draftMode: commentInfo.draftMode
                                };
                            }
                            else {
                                return null;
                            }
                        }));
                    }
                }
                let commentControlResult = [];
                this._commentControls.forEach(control => {
                    commentControlResult.push(control.getDocumentComments(resource, cancellation_1.CancellationToken.None));
                });
                let ret = [...yield Promise.all(result), ...yield Promise.all(commentControlResult)];
                return ret;
            });
        }
        getCommentingRanges(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                let commentControlResult = [];
                this._commentControls.forEach(control => {
                    commentControlResult.push(control.getCommentingRanges(resource, cancellation_1.CancellationToken.None));
                });
                let ret = yield Promise.all(commentControlResult);
                return ret.reduce((prev, curr) => { prev.push(...curr); return prev; }, []);
            });
        }
    }
    exports.CommentService = CommentService;
});
//# sourceMappingURL=commentService.js.map