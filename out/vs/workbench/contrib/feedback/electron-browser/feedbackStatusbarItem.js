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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/feedback/electron-browser/feedback", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/product/node/product", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/browser/dom", "vs/nls", "vs/base/common/actions"], function (require, exports, lifecycle_1, feedback_1, contextView_1, instantiation_1, product_1, theme_1, themeService_1, workspace_1, configuration_1, dom_1, nls_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TwitterFeedbackService {
        combineHashTagsAsString() {
            return TwitterFeedbackService.HASHTAGS.join(',');
        }
        submitFeedback(feedback) {
            const queryString = `?${feedback.sentiment === 1 ? `hashtags=${this.combineHashTagsAsString()}&` : null}ref_src=twsrc%5Etfw&related=twitterapi%2Ctwitter&text=${encodeURIComponent(feedback.feedback)}&tw_p=tweetbutton&via=${TwitterFeedbackService.VIA_NAME}`;
            const url = TwitterFeedbackService.TWITTER_URL + queryString;
            window.open(url);
        }
        getCharacterLimit(sentiment) {
            let length = 0;
            if (sentiment === 1) {
                TwitterFeedbackService.HASHTAGS.forEach(element => {
                    length += element.length + 2;
                });
            }
            if (TwitterFeedbackService.VIA_NAME) {
                length += ` via @${TwitterFeedbackService.VIA_NAME}`.length;
            }
            return 280 - length;
        }
    }
    TwitterFeedbackService.TWITTER_URL = 'https://twitter.com/intent/tweet';
    TwitterFeedbackService.VIA_NAME = 'code';
    TwitterFeedbackService.HASHTAGS = ['HappyCoding'];
    let FeedbackStatusbarItem = class FeedbackStatusbarItem extends theme_1.Themable {
        constructor(instantiationService, contextViewService, contextService, contextMenuService, configurationService, themeService) {
            super(themeService);
            this.instantiationService = instantiationService;
            this.contextViewService = contextViewService;
            this.contextService = contextService;
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this.enabled = this.configurationService.getValue(feedback_1.FEEDBACK_VISIBLE_CONFIG);
            this.hideAction = this._register(this.instantiationService.createInstance(HideAction));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateStyles()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onConfigurationUpdated(event) {
            if (event.affectsConfiguration(feedback_1.FEEDBACK_VISIBLE_CONFIG)) {
                this.enabled = this.configurationService.getValue(feedback_1.FEEDBACK_VISIBLE_CONFIG);
                this.update();
            }
        }
        updateStyles() {
            super.updateStyles();
            if (this.dropdown && this.dropdown.label) {
                this.dropdown.label.style.backgroundColor = (this.getColor(this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? theme_1.STATUS_BAR_FOREGROUND : theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND));
            }
        }
        render(element) {
            this.container = element;
            // Prevent showing dropdown on anything but left click
            this.toDispose.push(dom_1.addDisposableListener(this.container, 'mousedown', (e) => {
                if (e.button !== 0) {
                    dom_1.EventHelper.stop(e, true);
                }
            }, true));
            // Offer context menu to hide status bar entry
            this.toDispose.push(dom_1.addDisposableListener(this.container, 'contextmenu', e => {
                dom_1.EventHelper.stop(e, true);
                this.contextMenuService.showContextMenu({
                    getAnchor: () => this.container,
                    getActions: () => [this.hideAction]
                });
            }));
            return this.update();
        }
        update() {
            const enabled = product_1.default.sendASmile && this.enabled;
            // Create
            if (enabled) {
                if (!this.dropdown) {
                    this.dropdown = this._register(this.instantiationService.createInstance(feedback_1.FeedbackDropdown, this.container, {
                        contextViewProvider: this.contextViewService,
                        feedbackService: this.instantiationService.createInstance(TwitterFeedbackService),
                        onFeedbackVisibilityChange: visible => {
                            if (visible) {
                                dom_1.addClass(this.container, 'has-beak');
                            }
                            else {
                                dom_1.removeClass(this.container, 'has-beak');
                            }
                        }
                    }));
                    this.updateStyles();
                    return this.dropdown;
                }
            }
            // Dispose
            else {
                lifecycle_1.dispose(this.dropdown);
                this.dropdown = undefined;
                dom_1.clearNode(this.container);
            }
            return lifecycle_1.Disposable.None;
        }
    };
    FeedbackStatusbarItem = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextView_1.IContextViewService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, themeService_1.IThemeService)
    ], FeedbackStatusbarItem);
    exports.FeedbackStatusbarItem = FeedbackStatusbarItem;
    let HideAction = class HideAction extends actions_1.Action {
        constructor(configurationService) {
            super('feedback.hide', nls_1.localize('hide', "Hide"));
            this.configurationService = configurationService;
        }
        run(extensionId) {
            return this.configurationService.updateValue(feedback_1.FEEDBACK_VISIBLE_CONFIG, false);
        }
    };
    HideAction = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], HideAction);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const statusBarItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND);
        if (statusBarItemHoverBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .statusbar-item .monaco-dropdown.send-feedback:hover { background-color: ${statusBarItemHoverBackground}; }`);
        }
    });
});
//# sourceMappingURL=feedbackStatusbarItem.js.map