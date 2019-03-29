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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/contrib/goToDefinition/clickLinkGesture", "vs/editor/contrib/links/getLinks", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./links"], function (require, exports, nls, async, cancellation_1, errors_1, htmlContent_1, lifecycle_1, platform, editorExtensions_1, textModel_1, modes_1, clickLinkGesture_1, getLinks_1, notification_1, opener_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const HOVER_MESSAGE_GENERAL_META = new htmlContent_1.MarkdownString().appendText(platform.isMacintosh
        ? nls.localize('links.navigate.mac', "Cmd + click to follow link")
        : nls.localize('links.navigate', "Ctrl + click to follow link"));
    const HOVER_MESSAGE_COMMAND_META = new htmlContent_1.MarkdownString().appendText(platform.isMacintosh
        ? nls.localize('links.command.mac', "Cmd + click to execute command")
        : nls.localize('links.command', "Ctrl + click to execute command"));
    const HOVER_MESSAGE_GENERAL_ALT = new htmlContent_1.MarkdownString().appendText(platform.isMacintosh
        ? nls.localize('links.navigate.al.mac', "Option + click to follow link")
        : nls.localize('links.navigate.al', "Alt + click to follow link"));
    const HOVER_MESSAGE_COMMAND_ALT = new htmlContent_1.MarkdownString().appendText(platform.isMacintosh
        ? nls.localize('links.command.al.mac', "Option + click to execute command")
        : nls.localize('links.command.al', "Alt + click to execute command"));
    const decoration = {
        meta: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link',
            hoverMessage: HOVER_MESSAGE_GENERAL_META
        }),
        metaActive: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link-active',
            hoverMessage: HOVER_MESSAGE_GENERAL_META
        }),
        alt: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link',
            hoverMessage: HOVER_MESSAGE_GENERAL_ALT
        }),
        altActive: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link-active',
            hoverMessage: HOVER_MESSAGE_GENERAL_ALT
        }),
        altCommand: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link',
            hoverMessage: HOVER_MESSAGE_COMMAND_ALT
        }),
        altCommandActive: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link-active',
            hoverMessage: HOVER_MESSAGE_COMMAND_ALT
        }),
        metaCommand: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link',
            hoverMessage: HOVER_MESSAGE_COMMAND_META
        }),
        metaCommandActive: textModel_1.ModelDecorationOptions.register({
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link-active',
            hoverMessage: HOVER_MESSAGE_COMMAND_META
        }),
    };
    class LinkOccurrence {
        static decoration(link, useMetaKey) {
            return {
                range: link.range,
                options: LinkOccurrence._getOptions(link, useMetaKey, false)
            };
        }
        static _getOptions(link, useMetaKey, isActive) {
            if (link.url && /^command:/i.test(link.url.toString())) {
                if (useMetaKey) {
                    return (isActive ? decoration.metaCommandActive : decoration.metaCommand);
                }
                else {
                    return (isActive ? decoration.altCommandActive : decoration.altCommand);
                }
            }
            else {
                if (useMetaKey) {
                    return (isActive ? decoration.metaActive : decoration.meta);
                }
                else {
                    return (isActive ? decoration.altActive : decoration.alt);
                }
            }
        }
        constructor(link, decorationId) {
            this.link = link;
            this.decorationId = decorationId;
        }
        activate(changeAccessor, useMetaKey) {
            changeAccessor.changeDecorationOptions(this.decorationId, LinkOccurrence._getOptions(this.link, useMetaKey, true));
        }
        deactivate(changeAccessor, useMetaKey) {
            changeAccessor.changeDecorationOptions(this.decorationId, LinkOccurrence._getOptions(this.link, useMetaKey, false));
        }
    }
    let LinkDetector = class LinkDetector {
        constructor(editor, openerService, notificationService) {
            this.editor = editor;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.listenersToRemove = [];
            let clickLinkGesture = new clickLinkGesture_1.ClickLinkGesture(editor);
            this.listenersToRemove.push(clickLinkGesture);
            this.listenersToRemove.push(clickLinkGesture.onMouseMoveOrRelevantKeyDown(([mouseEvent, keyboardEvent]) => {
                this._onEditorMouseMove(mouseEvent, keyboardEvent);
            }));
            this.listenersToRemove.push(clickLinkGesture.onExecute((e) => {
                this.onEditorMouseUp(e);
            }));
            this.listenersToRemove.push(clickLinkGesture.onCancel((e) => {
                this.cleanUpActiveLinkDecoration();
            }));
            this.enabled = editor.getConfiguration().contribInfo.links;
            this.listenersToRemove.push(editor.onDidChangeConfiguration((e) => {
                let enabled = editor.getConfiguration().contribInfo.links;
                if (this.enabled === enabled) {
                    // No change in our configuration option
                    return;
                }
                this.enabled = enabled;
                // Remove any links (for the getting disabled case)
                this.updateDecorations([]);
                // Stop any computation (for the getting disabled case)
                this.stop();
                // Start computing (for the getting enabled case)
                this.beginCompute();
            }));
            this.listenersToRemove.push(editor.onDidChangeModelContent((e) => this.onChange()));
            this.listenersToRemove.push(editor.onDidChangeModel((e) => this.onModelChanged()));
            this.listenersToRemove.push(editor.onDidChangeModelLanguage((e) => this.onModelModeChanged()));
            this.listenersToRemove.push(modes_1.LinkProviderRegistry.onDidChange((e) => this.onModelModeChanged()));
            this.timeout = new async.TimeoutTimer();
            this.computePromise = null;
            this.currentOccurrences = {};
            this.activeLinkDecorationId = null;
            this.beginCompute();
        }
        static get(editor) {
            return editor.getContribution(LinkDetector.ID);
        }
        getId() {
            return LinkDetector.ID;
        }
        onModelChanged() {
            this.currentOccurrences = {};
            this.activeLinkDecorationId = null;
            this.stop();
            this.beginCompute();
        }
        onModelModeChanged() {
            this.stop();
            this.beginCompute();
        }
        onChange() {
            this.timeout.setIfNotSet(() => this.beginCompute(), LinkDetector.RECOMPUTE_TIME);
        }
        beginCompute() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this.editor.hasModel() || !this.enabled) {
                    return;
                }
                const model = this.editor.getModel();
                if (!modes_1.LinkProviderRegistry.has(model)) {
                    return;
                }
                this.computePromise = async.createCancelablePromise(token => getLinks_1.getLinks(model, token));
                try {
                    const links = yield this.computePromise;
                    this.updateDecorations(links);
                }
                catch (err) {
                    errors_1.onUnexpectedError(err);
                }
                finally {
                    this.computePromise = null;
                }
            });
        }
        updateDecorations(links) {
            const useMetaKey = (this.editor.getConfiguration().multiCursorModifier === 'altKey');
            let oldDecorations = [];
            let keys = Object.keys(this.currentOccurrences);
            for (let i = 0, len = keys.length; i < len; i++) {
                let decorationId = keys[i];
                let occurance = this.currentOccurrences[decorationId];
                oldDecorations.push(occurance.decorationId);
            }
            let newDecorations = [];
            if (links) {
                // Not sure why this is sometimes null
                for (const link of links) {
                    newDecorations.push(LinkOccurrence.decoration(link, useMetaKey));
                }
            }
            let decorations = this.editor.deltaDecorations(oldDecorations, newDecorations);
            this.currentOccurrences = {};
            this.activeLinkDecorationId = null;
            for (let i = 0, len = decorations.length; i < len; i++) {
                let occurance = new LinkOccurrence(links[i], decorations[i]);
                this.currentOccurrences[occurance.decorationId] = occurance;
            }
        }
        _onEditorMouseMove(mouseEvent, withKey) {
            const useMetaKey = (this.editor.getConfiguration().multiCursorModifier === 'altKey');
            if (this.isEnabled(mouseEvent, withKey)) {
                this.cleanUpActiveLinkDecoration(); // always remove previous link decoration as their can only be one
                const occurrence = this.getLinkOccurrence(mouseEvent.target.position);
                if (occurrence) {
                    this.editor.changeDecorations((changeAccessor) => {
                        occurrence.activate(changeAccessor, useMetaKey);
                        this.activeLinkDecorationId = occurrence.decorationId;
                    });
                }
            }
            else {
                this.cleanUpActiveLinkDecoration();
            }
        }
        cleanUpActiveLinkDecoration() {
            const useMetaKey = (this.editor.getConfiguration().multiCursorModifier === 'altKey');
            if (this.activeLinkDecorationId) {
                const occurrence = this.currentOccurrences[this.activeLinkDecorationId];
                if (occurrence) {
                    this.editor.changeDecorations((changeAccessor) => {
                        occurrence.deactivate(changeAccessor, useMetaKey);
                    });
                }
                this.activeLinkDecorationId = null;
            }
        }
        onEditorMouseUp(mouseEvent) {
            if (!this.isEnabled(mouseEvent)) {
                return;
            }
            const occurrence = this.getLinkOccurrence(mouseEvent.target.position);
            if (!occurrence) {
                return;
            }
            this.openLinkOccurrence(occurrence, mouseEvent.hasSideBySideModifier);
        }
        openLinkOccurrence(occurrence, openToSide) {
            if (!this.openerService) {
                return;
            }
            const { link } = occurrence;
            link.resolve(cancellation_1.CancellationToken.None).then(uri => {
                // open the uri
                return this.openerService.open(uri, { openToSide });
            }, err => {
                // different error cases
                if (err === 'invalid') {
                    this.notificationService.warn(nls.localize('invalid.url', 'Failed to open this link because it is not well-formed: {0}', link.url.toString()));
                }
                else if (err === 'missing') {
                    this.notificationService.warn(nls.localize('missing.url', 'Failed to open this link because its target is missing.'));
                }
                else {
                    errors_1.onUnexpectedError(err);
                }
            });
        }
        getLinkOccurrence(position) {
            if (!this.editor.hasModel() || !position) {
                return null;
            }
            const decorations = this.editor.getModel().getDecorationsInRange({
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            }, 0, true);
            for (const decoration of decorations) {
                const currentOccurrence = this.currentOccurrences[decoration.id];
                if (currentOccurrence) {
                    return currentOccurrence;
                }
            }
            return null;
        }
        isEnabled(mouseEvent, withKey) {
            return Boolean((mouseEvent.target.type === 6 /* CONTENT_TEXT */)
                && (mouseEvent.hasTriggerModifier || (withKey && withKey.keyCodeIsTriggerKey)));
        }
        stop() {
            this.timeout.cancel();
            if (this.computePromise) {
                this.computePromise.cancel();
                this.computePromise = null;
            }
        }
        dispose() {
            this.listenersToRemove = lifecycle_1.dispose(this.listenersToRemove);
            this.stop();
            this.timeout.dispose();
        }
    };
    LinkDetector.ID = 'editor.linkDetector';
    LinkDetector.RECOMPUTE_TIME = 1000; // ms
    LinkDetector = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, notification_1.INotificationService)
    ], LinkDetector);
    class OpenLinkAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.openLink',
                label: nls.localize('label', "Open Link"),
                alias: 'Open Link',
                precondition: null
            });
        }
        run(accessor, editor) {
            let linkDetector = LinkDetector.get(editor);
            if (!linkDetector) {
                return;
            }
            if (!editor.hasModel()) {
                return;
            }
            let selections = editor.getSelections();
            for (let sel of selections) {
                let link = linkDetector.getLinkOccurrence(sel.getEndPosition());
                if (link) {
                    linkDetector.openLinkOccurrence(link, false);
                }
            }
        }
    }
    editorExtensions_1.registerEditorContribution(LinkDetector);
    editorExtensions_1.registerEditorAction(OpenLinkAction);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const activeLinkForeground = theme.getColor(colorRegistry_1.editorActiveLinkForeground);
        if (activeLinkForeground) {
            collector.addRule(`.monaco-editor .detected-link-active { color: ${activeLinkForeground} !important; }`);
        }
    });
});
//# sourceMappingURL=links.js.map