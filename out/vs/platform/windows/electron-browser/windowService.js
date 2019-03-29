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
define(["require", "exports", "vs/base/common/event", "vs/platform/windows/common/windows", "vs/base/common/lifecycle", "vs/platform/workspaces/common/workspaces", "vs/platform/label/common/label"], function (require, exports, event_1, windows_1, lifecycle_1, workspaces_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WindowService = class WindowService extends lifecycle_1.Disposable {
        constructor(configuration, windowsService, labelService) {
            super();
            this.configuration = configuration;
            this.windowsService = windowsService;
            this.labelService = labelService;
            this.windowId = configuration.windowId;
            const onThisWindowFocus = event_1.Event.map(event_1.Event.filter(windowsService.onWindowFocus, id => id === this.windowId), _ => true);
            const onThisWindowBlur = event_1.Event.map(event_1.Event.filter(windowsService.onWindowBlur, id => id === this.windowId), _ => false);
            const onThisWindowMaximize = event_1.Event.map(event_1.Event.filter(windowsService.onWindowMaximize, id => id === this.windowId), _ => true);
            const onThisWindowUnmaximize = event_1.Event.map(event_1.Event.filter(windowsService.onWindowUnmaximize, id => id === this.windowId), _ => false);
            this.onDidChangeFocus = event_1.Event.any(onThisWindowFocus, onThisWindowBlur);
            this.onDidChangeMaximize = event_1.Event.any(onThisWindowMaximize, onThisWindowUnmaximize);
            this._hasFocus = document.hasFocus();
            this.isFocused().then(focused => this._hasFocus = focused);
            this._register(this.onDidChangeFocus(focus => this._hasFocus = focus));
        }
        get hasFocus() { return this._hasFocus; }
        getCurrentWindowId() {
            return this.windowId;
        }
        getConfiguration() {
            return this.configuration;
        }
        pickFileFolderAndOpen(options) {
            options.windowId = this.windowId;
            return this.windowsService.pickFileFolderAndOpen(options);
        }
        pickFileAndOpen(options) {
            options.windowId = this.windowId;
            return this.windowsService.pickFileAndOpen(options);
        }
        pickFolderAndOpen(options) {
            options.windowId = this.windowId;
            return this.windowsService.pickFolderAndOpen(options);
        }
        pickWorkspaceAndOpen(options) {
            options.windowId = this.windowId;
            return this.windowsService.pickWorkspaceAndOpen(options);
        }
        reloadWindow(args) {
            return this.windowsService.reloadWindow(this.windowId, args);
        }
        openDevTools(options) {
            return this.windowsService.openDevTools(this.windowId, options);
        }
        toggleDevTools() {
            return this.windowsService.toggleDevTools(this.windowId);
        }
        closeWorkspace() {
            return this.windowsService.closeWorkspace(this.windowId);
        }
        enterWorkspace(path) {
            return this.windowsService.enterWorkspace(this.windowId, path);
        }
        openWindow(uris, options) {
            if (!!this.configuration.remoteAuthority) {
                uris.forEach(u => u.label = u.label || this.getRecentLabel(u, !!(options && options.forceOpenWorkspaceAsFile)));
            }
            return this.windowsService.openWindow(this.windowId, uris, options);
        }
        closeWindow() {
            return this.windowsService.closeWindow(this.windowId);
        }
        toggleFullScreen() {
            return this.windowsService.toggleFullScreen(this.windowId);
        }
        setRepresentedFilename(fileName) {
            return this.windowsService.setRepresentedFilename(this.windowId, fileName);
        }
        getRecentlyOpened() {
            return this.windowsService.getRecentlyOpened(this.windowId);
        }
        focusWindow() {
            return this.windowsService.focusWindow(this.windowId);
        }
        isFocused() {
            return this.windowsService.isFocused(this.windowId);
        }
        isMaximized() {
            return this.windowsService.isMaximized(this.windowId);
        }
        maximizeWindow() {
            return this.windowsService.maximizeWindow(this.windowId);
        }
        unmaximizeWindow() {
            return this.windowsService.unmaximizeWindow(this.windowId);
        }
        minimizeWindow() {
            return this.windowsService.minimizeWindow(this.windowId);
        }
        onWindowTitleDoubleClick() {
            return this.windowsService.onWindowTitleDoubleClick(this.windowId);
        }
        setDocumentEdited(flag) {
            return this.windowsService.setDocumentEdited(this.windowId, flag);
        }
        show() {
            return this.windowsService.showWindow(this.windowId);
        }
        showMessageBox(options) {
            return this.windowsService.showMessageBox(this.windowId, options);
        }
        showSaveDialog(options) {
            return this.windowsService.showSaveDialog(this.windowId, options);
        }
        showOpenDialog(options) {
            return this.windowsService.showOpenDialog(this.windowId, options);
        }
        updateTouchBar(items) {
            return this.windowsService.updateTouchBar(this.windowId, items);
        }
        resolveProxy(url) {
            return this.windowsService.resolveProxy(this.windowId, url);
        }
        getRecentLabel(u, forceOpenWorkspaceAsFile) {
            if (u.typeHint === 'folder') {
                return this.labelService.getWorkspaceLabel(u.uri, { verbose: true });
            }
            else if (!forceOpenWorkspaceAsFile && workspaces_1.hasWorkspaceFileExtension(u.uri.path)) {
                return this.labelService.getWorkspaceLabel({ id: '', configPath: u.uri }, { verbose: true });
            }
            else {
                return this.labelService.getUriLabel(u.uri);
            }
        }
    };
    WindowService = __decorate([
        __param(1, windows_1.IWindowsService),
        __param(2, label_1.ILabelService)
    ], WindowService);
    exports.WindowService = WindowService;
});
//# sourceMappingURL=windowService.js.map