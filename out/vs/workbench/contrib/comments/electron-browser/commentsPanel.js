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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/parts/tree/browser/treeDefaults", "vs/editor/browser/editorBrowser", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/panel", "vs/workbench/contrib/comments/common/commentModel", "vs/workbench/contrib/comments/electron-browser/commentsEditorContribution", "vs/workbench/contrib/comments/electron-browser/commentsTreeViewer", "vs/workbench/contrib/comments/electron-browser/commentService", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/platform/theme/common/colorRegistry", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/workbench/browser/labels", "vs/css!./media/panel"], function (require, exports, dom, event_1, treeDefaults_1, editorBrowser_1, instantiation_1, listService_1, telemetry_1, themeService_1, panel_1, commentModel_1, commentsEditorContribution_1, commentsTreeViewer_1, commentService_1, editorService_1, commands_1, colorRegistry_1, opener_1, storage_1, labels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COMMENTS_PANEL_ID = 'workbench.panel.comments';
    exports.COMMENTS_PANEL_TITLE = 'Comments';
    let CommentsPanel = class CommentsPanel extends panel_1.Panel {
        constructor(instantiationService, commentService, editorService, commandService, openerService, telemetryService, themeService, storageService) {
            super(exports.COMMENTS_PANEL_ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.commentService = commentService;
            this.editorService = editorService;
            this.commandService = commandService;
            this.openerService = openerService;
        }
        create(parent) {
            super.create(parent);
            dom.addClass(parent, 'comments-panel');
            let container = dom.append(parent, dom.$('.comments-panel-container'));
            this.treeContainer = dom.append(container, dom.$('.tree-container'));
            this.commentsModel = new commentModel_1.CommentsModel();
            this.createTree();
            this.createMessageBox(container);
            this._register(this.commentService.onDidSetAllCommentThreads(this.onAllCommentsChanged, this));
            this._register(this.commentService.onDidUpdateCommentThreads(this.onCommentsUpdated, this));
            const styleElement = dom.createStyleSheet(parent);
            this.applyStyles(styleElement);
            this._register(this.themeService.onThemeChange(_ => this.applyStyles(styleElement)));
            this._register(this.onDidChangeVisibility(visible => {
                if (visible) {
                    this.refresh();
                }
            }));
            this.render();
        }
        applyStyles(styleElement) {
            const content = [];
            const theme = this.themeService.getTheme();
            const linkColor = theme.getColor(colorRegistry_1.textLinkForeground);
            if (linkColor) {
                content.push(`.comments-panel .comments-panel-container a { color: ${linkColor}; }`);
            }
            const linkActiveColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
            if (linkActiveColor) {
                content.push(`.comments-panel .comments-panel-container a:hover, a:active { color: ${linkActiveColor}; }`);
            }
            const focusColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusColor) {
                content.push(`.comments-panel .commenst-panel-container a:focus { outline-color: ${focusColor}; }`);
            }
            const codeTextForegroundColor = theme.getColor(colorRegistry_1.textPreformatForeground);
            if (codeTextForegroundColor) {
                content.push(`.comments-panel .comments-panel-container .text code { color: ${codeTextForegroundColor}; }`);
            }
            styleElement.innerHTML = content.join('\n');
        }
        render() {
            return __awaiter(this, void 0, void 0, function* () {
                dom.toggleClass(this.treeContainer, 'hidden', !this.commentsModel.hasCommentThreads());
                yield this.tree.setInput(this.commentsModel);
                this.renderMessage();
            });
        }
        getActions() {
            if (!this.collapseAllAction) {
                this.collapseAllAction = this.instantiationService.createInstance(treeDefaults_1.CollapseAllAction, this.tree, this.commentsModel.hasCommentThreads());
                this._register(this.collapseAllAction);
            }
            return [this.collapseAllAction];
        }
        layout(dimensions) {
            this.tree.layout(dimensions.height, dimensions.width);
        }
        getTitle() {
            return exports.COMMENTS_PANEL_TITLE;
        }
        createMessageBox(parent) {
            this.messageBoxContainer = dom.append(parent, dom.$('.message-box-container'));
            this.messageBox = dom.append(this.messageBoxContainer, dom.$('span'));
            this.messageBox.setAttribute('tabindex', '0');
        }
        renderMessage() {
            this.messageBox.textContent = this.commentsModel.getMessage();
            dom.toggleClass(this.messageBoxContainer, 'hidden', this.commentsModel.hasCommentThreads());
        }
        createTree() {
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            this.tree = this._register(this.instantiationService.createInstance(listService_1.WorkbenchTree, this.treeContainer, {
                dataSource: new commentsTreeViewer_1.CommentsDataSource(),
                renderer: new commentsTreeViewer_1.CommentsModelRenderer(this.treeLabels, this.openerService),
                accessibilityProvider: new treeDefaults_1.DefaultAccessibilityProvider,
                controller: new treeDefaults_1.DefaultController(),
                dnd: new treeDefaults_1.DefaultDragAndDrop(),
                filter: new commentsTreeViewer_1.CommentsDataFilter()
            }, {
                twistiePixels: 20,
                ariaLabel: exports.COMMENTS_PANEL_TITLE
            }));
            const commentsNavigator = this._register(new listService_1.TreeResourceNavigator(this.tree, { openOnFocus: true }));
            this._register(event_1.Event.debounce(commentsNavigator.openResource, (last, event) => event, 100, true)(options => {
                this.openFile(options.element, options.editorOptions.pinned, options.editorOptions.preserveFocus, options.sideBySide);
            }));
        }
        openFile(element, pinned, preserveFocus, sideBySide) {
            if (!element) {
                return false;
            }
            if (!(element instanceof commentModel_1.ResourceWithCommentThreads || element instanceof commentModel_1.CommentNode)) {
                return false;
            }
            const range = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].range : element.range;
            const activeEditor = this.editorService.activeEditor;
            let currentActiveResource = activeEditor ? activeEditor.getResource() : undefined;
            if (currentActiveResource && currentActiveResource.toString() === element.resource.toString()) {
                const threadToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].threadId : element.threadId;
                const commentToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].comment.commentId : element.comment.commentId;
                const control = this.editorService.activeTextEditorWidget;
                if (threadToReveal && editorBrowser_1.isCodeEditor(control)) {
                    const controller = commentsEditorContribution_1.ReviewController.get(control);
                    controller.revealCommentThread(threadToReveal, commentToReveal, false);
                }
                return true;
            }
            const threadToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].threadId : element.threadId;
            const commentToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].comment : element.comment;
            if (commentToReveal.selectCommand) {
                this.commandService.executeCommand(commentToReveal.selectCommand.id, ...(commentToReveal.selectCommand.arguments || [])).then(_ => {
                    let activeWidget = this.editorService.activeTextEditorWidget;
                    if (editorBrowser_1.isDiffEditor(activeWidget)) {
                        const originalEditorWidget = activeWidget.getOriginalEditor();
                        const modifiedEditorWidget = activeWidget.getModifiedEditor();
                        let controller;
                        if (originalEditorWidget.getModel().uri.toString() === element.resource.toString()) {
                            controller = commentsEditorContribution_1.ReviewController.get(originalEditorWidget);
                        }
                        else if (modifiedEditorWidget.getModel().uri.toString() === element.resource.toString()) {
                            controller = commentsEditorContribution_1.ReviewController.get(modifiedEditorWidget);
                        }
                        if (controller) {
                            controller.revealCommentThread(threadToReveal, commentToReveal.commentId, true);
                        }
                    }
                    else {
                        let activeEditor = this.editorService.activeEditor;
                        let currentActiveResource = activeEditor ? activeEditor.getResource() : undefined;
                        if (currentActiveResource && currentActiveResource.toString() === element.resource.toString()) {
                            const control = this.editorService.activeTextEditorWidget;
                            if (threadToReveal && editorBrowser_1.isCodeEditor(control)) {
                                const controller = commentsEditorContribution_1.ReviewController.get(control);
                                controller.revealCommentThread(threadToReveal, commentToReveal.commentId, true);
                            }
                        }
                    }
                    return true;
                });
            }
            else {
                this.editorService.openEditor({
                    resource: element.resource,
                    options: {
                        pinned: pinned,
                        preserveFocus: preserveFocus,
                        selection: range
                    }
                }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => {
                    if (editor) {
                        const control = editor.getControl();
                        if (threadToReveal && editorBrowser_1.isCodeEditor(control)) {
                            const controller = commentsEditorContribution_1.ReviewController.get(control);
                            controller.revealCommentThread(threadToReveal, commentToReveal.commentId, true);
                        }
                    }
                });
            }
            return true;
        }
        refresh() {
            if (this.isVisible()) {
                this.collapseAllAction.enabled = this.commentsModel.hasCommentThreads();
                dom.toggleClass(this.treeContainer, 'hidden', !this.commentsModel.hasCommentThreads());
                this.tree.refresh().then(() => {
                    this.renderMessage();
                }, (e) => {
                    console.log(e);
                });
            }
        }
        onAllCommentsChanged(e) {
            this.commentsModel.setCommentThreads(e.ownerId, e.commentThreads);
            this.refresh();
        }
        onCommentsUpdated(e) {
            const didUpdate = this.commentsModel.updateCommentThreads(e);
            if (didUpdate) {
                this.refresh();
            }
        }
    };
    CommentsPanel = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, commentService_1.ICommentService),
        __param(2, editorService_1.IEditorService),
        __param(3, commands_1.ICommandService),
        __param(4, opener_1.IOpenerService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, themeService_1.IThemeService),
        __param(7, storage_1.IStorageService)
    ], CommentsPanel);
    exports.CommentsPanel = CommentsPanel;
});
//# sourceMappingURL=commentsPanel.js.map