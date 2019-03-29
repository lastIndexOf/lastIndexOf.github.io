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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/browser/htmlContentRenderer", "vs/base/common/errors", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/workbench/contrib/comments/common/commentModel"], function (require, exports, dom, nls, htmlContentRenderer_1, errors_1, uri_1, opener_1, commentModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CommentsDataSource {
        getId(tree, element) {
            if (element instanceof commentModel_1.CommentsModel) {
                return 'root';
            }
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return element.id;
            }
            if (element instanceof commentModel_1.CommentNode) {
                return `${element.resource.toString()}-${element.comment.commentId}`;
            }
            return '';
        }
        hasChildren(tree, element) {
            return element instanceof commentModel_1.CommentsModel || element instanceof commentModel_1.ResourceWithCommentThreads || (element instanceof commentModel_1.CommentNode && !!element.replies.length);
        }
        getChildren(tree, element) {
            if (element instanceof commentModel_1.CommentsModel) {
                return Promise.resolve(element.resourceCommentThreads);
            }
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return Promise.resolve(element.commentThreads);
            }
            if (element instanceof commentModel_1.CommentNode) {
                return Promise.resolve(element.replies);
            }
            return Promise.resolve([]);
        }
        getParent(tree, element) {
            return Promise.resolve(undefined);
        }
        shouldAutoexpand(tree, element) {
            return true;
        }
    }
    exports.CommentsDataSource = CommentsDataSource;
    let CommentsModelRenderer = class CommentsModelRenderer {
        constructor(labels, openerService) {
            this.labels = labels;
            this.openerService = openerService;
        }
        getHeight(tree, element) {
            return 22;
        }
        getTemplateId(tree, element) {
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return CommentsModelRenderer.RESOURCE_ID;
            }
            if (element instanceof commentModel_1.CommentNode) {
                return CommentsModelRenderer.COMMENT_ID;
            }
            return '';
        }
        renderTemplate(ITree, templateId, container) {
            switch (templateId) {
                case CommentsModelRenderer.RESOURCE_ID:
                    return this.renderResourceTemplate(container);
                case CommentsModelRenderer.COMMENT_ID:
                    return this.renderCommentTemplate(container);
            }
        }
        disposeTemplate(tree, templateId, templateData) {
            switch (templateId) {
                case CommentsModelRenderer.RESOURCE_ID:
                    templateData.resourceLabel.dispose();
                    break;
                case CommentsModelRenderer.COMMENT_ID:
                    templateData.disposables.forEach(disposeable => disposeable.dispose());
                    break;
            }
        }
        renderElement(tree, element, templateId, templateData) {
            switch (templateId) {
                case CommentsModelRenderer.RESOURCE_ID:
                    return this.renderResourceElement(tree, element, templateData);
                case CommentsModelRenderer.COMMENT_ID:
                    return this.renderCommentElement(tree, element, templateData);
            }
        }
        renderResourceTemplate(container) {
            const data = Object.create(null);
            const labelContainer = dom.append(container, dom.$('.resource-container'));
            data.resourceLabel = this.labels.create(labelContainer);
            return data;
        }
        renderCommentTemplate(container) {
            const data = Object.create(null);
            const labelContainer = dom.append(container, dom.$('.comment-container'));
            data.userName = dom.append(labelContainer, dom.$('.user'));
            data.commentText = dom.append(labelContainer, dom.$('.text'));
            data.disposables = [];
            return data;
        }
        renderResourceElement(tree, element, templateData) {
            templateData.resourceLabel.setFile(element.resource);
        }
        renderCommentElement(tree, element, templateData) {
            templateData.userName.textContent = element.comment.userName;
            templateData.commentText.innerHTML = '';
            const renderedComment = htmlContentRenderer_1.renderMarkdown(element.comment.body, {
                inline: true,
                actionHandler: {
                    callback: (content) => {
                        try {
                            const uri = uri_1.URI.parse(content);
                            this.openerService.open(uri).catch(errors_1.onUnexpectedError);
                        }
                        catch (err) {
                            // ignore
                        }
                    },
                    disposeables: templateData.disposables
                }
            });
            const images = renderedComment.getElementsByTagName('img');
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const textDescription = dom.$('');
                textDescription.textContent = image.alt ? nls.localize('imageWithLabel', "Image: {0}", image.alt) : nls.localize('image', "Image");
                image.parentNode.replaceChild(textDescription, image);
            }
            templateData.commentText.appendChild(renderedComment);
        }
    };
    CommentsModelRenderer.RESOURCE_ID = 'resource-with-comments';
    CommentsModelRenderer.COMMENT_ID = 'comment-node';
    CommentsModelRenderer = __decorate([
        __param(1, opener_1.IOpenerService)
    ], CommentsModelRenderer);
    exports.CommentsModelRenderer = CommentsModelRenderer;
    class CommentsDataFilter {
        isVisible(tree, element) {
            if (element instanceof commentModel_1.CommentsModel) {
                return element.resourceCommentThreads.length > 0;
            }
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return element.commentThreads.length > 0;
            }
            return true;
        }
    }
    exports.CommentsDataFilter = CommentsDataFilter;
});
//# sourceMappingURL=commentsTreeViewer.js.map