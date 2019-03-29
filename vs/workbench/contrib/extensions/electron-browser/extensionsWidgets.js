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
define(["require", "exports", "vs/base/common/lifecycle", "../common/extensions", "vs/base/browser/dom", "vs/base/common/platform", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/label/common/label", "vs/workbench/contrib/extensions/electron-browser/extensionsActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/workspace/common/workspace", "vs/platform/remote/common/remoteHosts", "vs/platform/windows/common/windows", "vs/css!./media/extensionsWidgets"], function (require, exports, lifecycle_1, extensions_1, dom_1, platform, nls_1, extensionManagement_1, label_1, extensionsActions_1, themeService_1, theme_1, workspace_1, remoteHosts_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionWidget extends lifecycle_1.Disposable {
        get extension() { return this._extension; }
        set extension(extension) { this._extension = extension; this.update(); }
        update() { this.render(); }
    }
    exports.ExtensionWidget = ExtensionWidget;
    let Label = class Label extends ExtensionWidget {
        constructor(element, fn, extensionsWorkbenchService) {
            super();
            this.element = element;
            this.fn = fn;
            this.render();
        }
        render() {
            this.element.textContent = this.extension ? this.fn(this.extension) : '';
        }
    };
    Label = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService)
    ], Label);
    exports.Label = Label;
    let InstallCountWidget = class InstallCountWidget extends ExtensionWidget {
        constructor(container, small, extensionsWorkbenchService) {
            super();
            this.container = container;
            this.small = small;
            dom_1.addClass(container, 'extension-install-count');
            this.render();
        }
        render() {
            this.container.innerHTML = '';
            if (!this.extension) {
                return;
            }
            const installCount = this.extension.installCount;
            if (installCount === undefined) {
                return;
            }
            let installLabel;
            if (this.small) {
                if (installCount > 1000000) {
                    installLabel = `${Math.floor(installCount / 100000) / 10}M`;
                }
                else if (installCount > 1000) {
                    installLabel = `${Math.floor(installCount / 1000)}K`;
                }
                else {
                    installLabel = String(installCount);
                }
            }
            else {
                installLabel = installCount.toLocaleString(platform.locale);
            }
            dom_1.append(this.container, dom_1.$('span.octicon.octicon-cloud-download'));
            const count = dom_1.append(this.container, dom_1.$('span.count'));
            count.textContent = installLabel;
        }
    };
    InstallCountWidget = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService)
    ], InstallCountWidget);
    exports.InstallCountWidget = InstallCountWidget;
    class RatingsWidget extends ExtensionWidget {
        constructor(container, small) {
            super();
            this.container = container;
            this.small = small;
            dom_1.addClass(container, 'extension-ratings');
            if (this.small) {
                dom_1.addClass(container, 'small');
            }
            this.render();
        }
        render() {
            this.container.innerHTML = '';
            if (!this.extension) {
                return;
            }
            if (this.extension.rating === undefined) {
                return;
            }
            if (this.small && !this.extension.ratingCount) {
                return;
            }
            const rating = Math.round(this.extension.rating * 2) / 2;
            if (this.small) {
                dom_1.append(this.container, dom_1.$('span.full.star'));
                const count = dom_1.append(this.container, dom_1.$('span.count'));
                count.textContent = String(rating);
            }
            else {
                for (let i = 1; i <= 5; i++) {
                    if (rating >= i) {
                        dom_1.append(this.container, dom_1.$('span.full.star'));
                    }
                    else if (rating >= i - 0.5) {
                        dom_1.append(this.container, dom_1.$('span.half.star'));
                    }
                    else {
                        dom_1.append(this.container, dom_1.$('span.empty.star'));
                    }
                }
            }
            this.container.title = this.extension.ratingCount === 1 ? nls_1.localize('ratedBySingleUser', "Rated by 1 user")
                : typeof this.extension.ratingCount === 'number' && this.extension.ratingCount > 1 ? nls_1.localize('ratedByUsers', "Rated by {0} users", this.extension.ratingCount) : nls_1.localize('noRating', "No rating");
        }
    }
    exports.RatingsWidget = RatingsWidget;
    let RecommendationWidget = class RecommendationWidget extends ExtensionWidget {
        constructor(parent, themeService, extensionTipsService) {
            super();
            this.parent = parent;
            this.themeService = themeService;
            this.extensionTipsService = extensionTipsService;
            this.disposables = [];
            this.render();
            this._register(lifecycle_1.toDisposable(() => this.clear()));
        }
        clear() {
            this.parent.title = '';
            this.parent.setAttribute('aria-label', this.extension ? nls_1.localize('viewExtensionDetailsAria', "{0}. Press enter for extension details.", this.extension.displayName) : '');
            if (this.element) {
                this.parent.removeChild(this.element);
            }
            this.element = undefined;
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
        render() {
            this.clear();
            if (!this.extension) {
                return;
            }
            const updateRecommendationMarker = () => {
                this.clear();
                const extRecommendations = this.extensionTipsService.getAllRecommendationsWithReason();
                if (extRecommendations[this.extension.identifier.id.toLowerCase()]) {
                    this.element = dom_1.append(this.parent, dom_1.$('div.bookmark'));
                    const recommendation = dom_1.append(this.element, dom_1.$('.recommendation'));
                    dom_1.append(recommendation, dom_1.$('span.octicon.octicon-star'));
                    const applyBookmarkStyle = (theme) => {
                        const bgColor = theme.getColor(extensionsActions_1.extensionButtonProminentBackground);
                        const fgColor = theme.getColor(extensionsActions_1.extensionButtonProminentForeground);
                        recommendation.style.borderTopColor = bgColor ? bgColor.toString() : 'transparent';
                        recommendation.style.color = fgColor ? fgColor.toString() : 'white';
                    };
                    applyBookmarkStyle(this.themeService.getTheme());
                    this.themeService.onThemeChange(applyBookmarkStyle, this, this.disposables);
                    this.parent.title = extRecommendations[this.extension.identifier.id.toLowerCase()].reasonText;
                    this.parent.setAttribute('aria-label', nls_1.localize('viewRecommendedExtensionDetailsAria', "{0}. {1} Press enter for extension details.", this.extension.displayName, extRecommendations[this.extension.identifier.id.toLowerCase()].reasonText));
                }
            };
            updateRecommendationMarker();
            this.extensionTipsService.onRecommendationChange(() => updateRecommendationMarker(), this, this.disposables);
        }
    };
    RecommendationWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, extensionManagement_1.IExtensionTipsService)
    ], RecommendationWidget);
    exports.RecommendationWidget = RecommendationWidget;
    let RemoteBadgeWidget = class RemoteBadgeWidget extends ExtensionWidget {
        constructor(parent, labelService, themeService, extensionManagementServerService, workspaceContextService, windowService) {
            super();
            this.parent = parent;
            this.labelService = labelService;
            this.themeService = themeService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.workspaceContextService = workspaceContextService;
            this.windowService = windowService;
            this.disposables = [];
            this.render();
            this._register(lifecycle_1.toDisposable(() => this.clear()));
        }
        clear() {
            if (this.element) {
                this.parent.removeChild(this.element);
            }
            this.element = null;
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
        render() {
            this.clear();
            if (!this.extension || !this.extension.local) {
                return;
            }
            const server = this.extensionManagementServerService.getExtensionManagementServer(this.extension.local.location);
            if (server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                this.element = dom_1.append(this.parent, dom_1.$('div.extension-remote-badge'));
                dom_1.append(this.element, dom_1.$('span.octicon.octicon-file-symlink-directory'));
                const applyBadgeStyle = () => {
                    if (!this.element) {
                        return;
                    }
                    const bgColor = this.themeService.getTheme().getColor(theme_1.STATUS_BAR_HOST_NAME_BACKGROUND);
                    const fgColor = this.workspaceContextService.getWorkbenchState() === 1 /* EMPTY */ ? this.themeService.getTheme().getColor(theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND) : this.themeService.getTheme().getColor(theme_1.STATUS_BAR_FOREGROUND);
                    this.element.style.backgroundColor = bgColor ? bgColor.toString() : '';
                    this.element.style.color = fgColor ? fgColor.toString() : '';
                };
                applyBadgeStyle();
                this.themeService.onThemeChange(applyBadgeStyle, this, this.disposables);
                this.workspaceContextService.onDidChangeWorkbenchState(applyBadgeStyle, this, this.disposables);
                const updateTitle = () => {
                    if (this.element) {
                        this.element.title = nls_1.localize('remote extension title', "Extension in {0}", this.labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, this.windowService.getConfiguration().remoteAuthority));
                    }
                };
                this.labelService.onDidChangeFormatters(() => updateTitle(), this, this.disposables);
                updateTitle();
            }
        }
    };
    RemoteBadgeWidget = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, themeService_1.IThemeService),
        __param(3, extensionManagement_1.IExtensionManagementServerService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, windows_1.IWindowService)
    ], RemoteBadgeWidget);
    exports.RemoteBadgeWidget = RemoteBadgeWidget;
});
//# sourceMappingURL=extensionsWidgets.js.map