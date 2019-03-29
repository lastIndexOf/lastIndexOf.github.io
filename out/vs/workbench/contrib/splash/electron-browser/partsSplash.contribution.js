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
define(["require", "exports", "vs/base/common/path", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/broadcast/electron-browser/broadcastService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/contributions", "vs/workbench/common/theme", "vs/workbench/services/layout/browser/layoutService", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration"], function (require, exports, path_1, browser_1, dom_1, color_1, event_1, lifecycle_1, broadcastService_1, lifecycle_2, platform_1, colorRegistry_1, themeService_1, editor_1, contributions_1, themes, layoutService_1, environment_1, files_1, uri_1, editorGroupsService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let PartsSplash = class PartsSplash {
        constructor(_themeService, _layoutService, _fileService, _envService, _broadcastService, lifecycleService, editorGroupsService, configService) {
            this._themeService = _themeService;
            this._layoutService = _layoutService;
            this._fileService = _fileService;
            this._envService = _envService;
            this._broadcastService = _broadcastService;
            this._disposables = [];
            lifecycleService.when(3 /* Restored */).then(_ => this._removePartsSplash());
            event_1.Event.debounce(event_1.Event.any(browser_1.onDidChangeFullscreen, editorGroupsService.onDidLayout), () => { }, 800)(this._savePartsSplash, this, this._disposables);
            configService.onDidChangeConfiguration(e => {
                this._didChangeTitleBarStyle = e.affectsConfiguration('window.titleBarStyle');
            }, this, this._disposables);
        }
        dispose() {
            lifecycle_1.dispose(this._disposables);
        }
        _savePartsSplash() {
            const baseTheme = themeService_1.getThemeTypeSelector(this._themeService.getTheme().type);
            const colorInfo = {
                foreground: this._getThemeColor(colorRegistry_1.foreground),
                editorBackground: this._getThemeColor(colorRegistry_1.editorBackground),
                titleBarBackground: this._getThemeColor(themes.TITLE_BAR_ACTIVE_BACKGROUND),
                activityBarBackground: this._getThemeColor(themes.ACTIVITY_BAR_BACKGROUND),
                sideBarBackground: this._getThemeColor(themes.SIDE_BAR_BACKGROUND),
                statusBarBackground: this._getThemeColor(themes.STATUS_BAR_BACKGROUND),
                statusBarNoFolderBackground: this._getThemeColor(themes.STATUS_BAR_NO_FOLDER_BACKGROUND),
            };
            const layoutInfo = !this._shouldSaveLayoutInfo() ? undefined : {
                sideBarSide: this._layoutService.getSideBarPosition() === 1 /* RIGHT */ ? 'right' : 'left',
                editorPartMinWidth: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.width,
                titleBarHeight: dom_1.getTotalHeight(this._layoutService.getContainer("workbench.parts.titlebar" /* TITLEBAR_PART */)),
                activityBarWidth: dom_1.getTotalWidth(this._layoutService.getContainer("workbench.parts.activitybar" /* ACTIVITYBAR_PART */)),
                sideBarWidth: dom_1.getTotalWidth(this._layoutService.getContainer("workbench.parts.sidebar" /* SIDEBAR_PART */)),
                statusBarHeight: dom_1.getTotalHeight(this._layoutService.getContainer("workbench.parts.statusbar" /* STATUSBAR_PART */)),
            };
            this._fileService.updateContent(uri_1.URI.file(path_1.join(this._envService.userDataPath, 'rapid_render.json')), JSON.stringify({
                id: PartsSplash._splashElementId,
                colorInfo,
                layoutInfo,
                baseTheme
            }), { encoding: 'utf8' });
            if (baseTheme !== this._lastBaseTheme || colorInfo.editorBackground !== this._lastBackground) {
                // notify the main window on background color changes: the main window sets the background color to new windows
                this._lastBaseTheme = baseTheme;
                this._lastBackground = colorInfo.editorBackground;
                // the color needs to be in hex
                const backgroundColor = this._themeService.getTheme().getColor(colorRegistry_1.editorBackground) || themes.WORKBENCH_BACKGROUND(this._themeService.getTheme());
                this._broadcastService.broadcast({ channel: 'vscode:changeColorTheme', payload: JSON.stringify({ baseTheme, background: color_1.Color.Format.CSS.formatHex(backgroundColor) }) });
            }
        }
        _getThemeColor(id) {
            const theme = this._themeService.getTheme();
            const color = theme.getColor(id);
            return color ? color.toString() : undefined;
        }
        _shouldSaveLayoutInfo() {
            return !browser_1.isFullscreen() && !this._envService.isExtensionDevelopment && !this._didChangeTitleBarStyle;
        }
        _removePartsSplash() {
            let element = document.getElementById(PartsSplash._splashElementId);
            if (element) {
                element.style.display = 'none';
            }
            // remove initial colors
            let defaultStyles = document.head.getElementsByClassName('initialShellColors');
            if (defaultStyles.length) {
                document.head.removeChild(defaultStyles[0]);
            }
        }
    };
    PartsSplash._splashElementId = 'monaco-parts-splash';
    PartsSplash = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, broadcastService_1.IBroadcastService),
        __param(5, lifecycle_2.ILifecycleService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, configuration_1.IConfigurationService)
    ], PartsSplash);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(PartsSplash, 1 /* Starting */);
});
//# sourceMappingURL=partsSplash.contribution.js.map