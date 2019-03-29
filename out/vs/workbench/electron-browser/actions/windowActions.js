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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/actions", "vs/platform/windows/common/windows", "vs/nls", "vs/platform/workspace/common/workspace", "vs/base/common/platform", "vs/base/browser/browser", "vs/platform/keybinding/common/keybinding", "electron", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/platform/product/node/product", "vs/platform/configuration/common/configuration", "vs/platform/history/common/history", "vs/base/common/labels", "vs/css!./media/actions"], function (require, exports, uri_1, actions_1, windows_1, nls, workspace_1, platform_1, browser, keybinding_1, electron_1, files_1, label_1, modelService_1, modeService_1, quickInput_1, getIconClasses_1, product_1, configuration_1, history_1, labels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CloseCurrentWindowAction = class CloseCurrentWindowAction extends actions_1.Action {
        constructor(id, label, windowService) {
            super(id, label);
            this.windowService = windowService;
        }
        run() {
            this.windowService.closeWindow();
            return Promise.resolve(true);
        }
    };
    CloseCurrentWindowAction.ID = 'workbench.action.closeWindow';
    CloseCurrentWindowAction.LABEL = nls.localize('closeWindow', "Close Window");
    CloseCurrentWindowAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], CloseCurrentWindowAction);
    exports.CloseCurrentWindowAction = CloseCurrentWindowAction;
    let NewWindowAction = class NewWindowAction extends actions_1.Action {
        constructor(id, label, windowsService) {
            super(id, label);
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.openNewWindow();
        }
    };
    NewWindowAction.ID = 'workbench.action.newWindow';
    NewWindowAction.LABEL = nls.localize('newWindow', "New Window");
    NewWindowAction = __decorate([
        __param(2, windows_1.IWindowsService)
    ], NewWindowAction);
    exports.NewWindowAction = NewWindowAction;
    let ToggleFullScreenAction = class ToggleFullScreenAction extends actions_1.Action {
        constructor(id, label, windowService) {
            super(id, label);
            this.windowService = windowService;
        }
        run() {
            return this.windowService.toggleFullScreen();
        }
    };
    ToggleFullScreenAction.ID = 'workbench.action.toggleFullScreen';
    ToggleFullScreenAction.LABEL = nls.localize('toggleFullScreen', "Toggle Full Screen");
    ToggleFullScreenAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], ToggleFullScreenAction);
    exports.ToggleFullScreenAction = ToggleFullScreenAction;
    let BaseZoomAction = class BaseZoomAction extends actions_1.Action {
        constructor(id, label, configurationService) {
            super(id, label);
            this.configurationService = configurationService;
        }
        setConfiguredZoomLevel(level) {
            level = Math.round(level); // when reaching smallest zoom, prevent fractional zoom levels
            const applyZoom = () => {
                electron_1.webFrame.setZoomLevel(level);
                browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
                // See https://github.com/Microsoft/vscode/issues/26151
                // Cannot be trusted because the webFrame might take some time
                // until it really applies the new zoom level
                browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
            };
            this.configurationService.updateValue(BaseZoomAction.SETTING_KEY, level).then(() => applyZoom());
        }
    };
    BaseZoomAction.SETTING_KEY = 'window.zoomLevel';
    BaseZoomAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], BaseZoomAction);
    exports.BaseZoomAction = BaseZoomAction;
    let ZoomInAction = class ZoomInAction extends BaseZoomAction {
        constructor(id, label, configurationService) {
            super(id, label, configurationService);
        }
        run() {
            this.setConfiguredZoomLevel(electron_1.webFrame.getZoomLevel() + 1);
            return Promise.resolve(true);
        }
    };
    ZoomInAction.ID = 'workbench.action.zoomIn';
    ZoomInAction.LABEL = nls.localize('zoomIn', "Zoom In");
    ZoomInAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ZoomInAction);
    exports.ZoomInAction = ZoomInAction;
    let ZoomOutAction = class ZoomOutAction extends BaseZoomAction {
        constructor(id, label, configurationService) {
            super(id, label, configurationService);
        }
        run() {
            this.setConfiguredZoomLevel(electron_1.webFrame.getZoomLevel() - 1);
            return Promise.resolve(true);
        }
    };
    ZoomOutAction.ID = 'workbench.action.zoomOut';
    ZoomOutAction.LABEL = nls.localize('zoomOut', "Zoom Out");
    ZoomOutAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ZoomOutAction);
    exports.ZoomOutAction = ZoomOutAction;
    let ZoomResetAction = class ZoomResetAction extends BaseZoomAction {
        constructor(id, label, configurationService) {
            super(id, label, configurationService);
        }
        run() {
            this.setConfiguredZoomLevel(0);
            return Promise.resolve(true);
        }
    };
    ZoomResetAction.ID = 'workbench.action.zoomReset';
    ZoomResetAction.LABEL = nls.localize('zoomReset', "Reset Zoom");
    ZoomResetAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ZoomResetAction);
    exports.ZoomResetAction = ZoomResetAction;
    let ReloadWindowAction = class ReloadWindowAction extends actions_1.Action {
        constructor(id, label, windowService) {
            super(id, label);
            this.windowService = windowService;
        }
        run() {
            return this.windowService.reloadWindow().then(() => true);
        }
    };
    ReloadWindowAction.ID = 'workbench.action.reloadWindow';
    ReloadWindowAction.LABEL = nls.localize('reloadWindow', "Reload Window");
    ReloadWindowAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], ReloadWindowAction);
    exports.ReloadWindowAction = ReloadWindowAction;
    let ReloadWindowWithExtensionsDisabledAction = class ReloadWindowWithExtensionsDisabledAction extends actions_1.Action {
        constructor(id, label, windowService) {
            super(id, label);
            this.windowService = windowService;
        }
        run() {
            return this.windowService.reloadWindow({ _: [], 'disable-extensions': true }).then(() => true);
        }
    };
    ReloadWindowWithExtensionsDisabledAction.ID = 'workbench.action.reloadWindowWithExtensionsDisabled';
    ReloadWindowWithExtensionsDisabledAction.LABEL = nls.localize('reloadWindowWithExntesionsDisabled', "Reload Window With Extensions Disabled");
    ReloadWindowWithExtensionsDisabledAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], ReloadWindowWithExtensionsDisabledAction);
    exports.ReloadWindowWithExtensionsDisabledAction = ReloadWindowWithExtensionsDisabledAction;
    class BaseSwitchWindow extends actions_1.Action {
        constructor(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService) {
            super(id, label);
            this.windowsService = windowsService;
            this.windowService = windowService;
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.closeWindowAction = {
                iconClass: 'action-remove-from-recently-opened',
                tooltip: nls.localize('close', "Close Window")
            };
        }
        run() {
            const currentWindowId = this.windowService.getCurrentWindowId();
            return this.windowsService.getWindows().then(windows => {
                const placeHolder = nls.localize('switchWindowPlaceHolder', "Select a window to switch to");
                const picks = windows.map(win => {
                    const resource = win.filename ? uri_1.URI.file(win.filename) : win.folderUri ? win.folderUri : win.workspace ? win.workspace.configPath : undefined;
                    const fileKind = win.filename ? files_1.FileKind.FILE : win.workspace ? files_1.FileKind.ROOT_FOLDER : win.folderUri ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
                    return {
                        payload: win.id,
                        label: win.title,
                        iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, fileKind),
                        description: (currentWindowId === win.id) ? nls.localize('current', "Current Window") : undefined,
                        buttons: (!this.isQuickNavigate() && currentWindowId !== win.id) ? [this.closeWindowAction] : undefined
                    };
                });
                const autoFocusIndex = (picks.indexOf(picks.filter(pick => pick.payload === currentWindowId)[0]) + 1) % picks.length;
                return this.quickInputService.pick(picks, {
                    contextKey: 'inWindowsPicker',
                    activeItem: picks[autoFocusIndex],
                    placeHolder,
                    quickNavigate: this.isQuickNavigate() ? { keybindings: this.keybindingService.lookupKeybindings(this.id) } : undefined,
                    onDidTriggerItemButton: context => {
                        this.windowsService.closeWindow(context.item.payload).then(() => {
                            context.removeItem();
                        });
                    }
                });
            }).then(pick => {
                if (pick) {
                    this.windowsService.showWindow(pick.payload);
                }
            });
        }
    }
    exports.BaseSwitchWindow = BaseSwitchWindow;
    let SwitchWindow = class SwitchWindow extends BaseSwitchWindow {
        constructor(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService) {
            super(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService);
        }
        isQuickNavigate() {
            return false;
        }
    };
    SwitchWindow.ID = 'workbench.action.switchWindow';
    SwitchWindow.LABEL = nls.localize('switchWindow', "Switch Window...");
    SwitchWindow = __decorate([
        __param(2, windows_1.IWindowsService),
        __param(3, windows_1.IWindowService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService)
    ], SwitchWindow);
    exports.SwitchWindow = SwitchWindow;
    let QuickSwitchWindow = class QuickSwitchWindow extends BaseSwitchWindow {
        constructor(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService) {
            super(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService);
        }
        isQuickNavigate() {
            return true;
        }
    };
    QuickSwitchWindow.ID = 'workbench.action.quickSwitchWindow';
    QuickSwitchWindow.LABEL = nls.localize('quickSwitchWindow', "Quick Switch Window...");
    QuickSwitchWindow = __decorate([
        __param(2, windows_1.IWindowsService),
        __param(3, windows_1.IWindowService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService)
    ], QuickSwitchWindow);
    exports.QuickSwitchWindow = QuickSwitchWindow;
    exports.inRecentFilesPickerContextKey = 'inRecentFilesPicker';
    class BaseOpenRecentAction extends actions_1.Action {
        constructor(id, label, windowService, windowsService, quickInputService, contextService, labelService, keybindingService, modelService, modeService) {
            super(id, label);
            this.windowService = windowService;
            this.windowsService = windowsService;
            this.quickInputService = quickInputService;
            this.contextService = contextService;
            this.labelService = labelService;
            this.keybindingService = keybindingService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.removeFromRecentlyOpened = {
                iconClass: 'action-remove-from-recently-opened',
                tooltip: nls.localize('remove', "Remove from Recently Opened")
            };
        }
        run() {
            return this.windowService.getRecentlyOpened()
                .then(({ workspaces, files }) => this.openRecent(workspaces, files));
        }
        openRecent(recentWorkspaces, recentFiles) {
            const toPick = (recent, labelService, buttons) => {
                let resource;
                let fullLabel;
                let fileKind;
                if (history_1.isRecentFolder(recent)) {
                    resource = recent.folderUri;
                    fullLabel = recent.label || labelService.getWorkspaceLabel(recent.folderUri, { verbose: true });
                    fileKind = files_1.FileKind.FOLDER;
                }
                else if (history_1.isRecentWorkspace(recent)) {
                    resource = recent.workspace.configPath;
                    fullLabel = recent.label || labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
                    fileKind = files_1.FileKind.ROOT_FOLDER;
                }
                else {
                    resource = recent.fileUri;
                    fullLabel = recent.label || labelService.getUriLabel(recent.fileUri);
                    fileKind = files_1.FileKind.FILE;
                }
                const { name, parentPath } = labels_1.splitName(fullLabel);
                return {
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, fileKind),
                    label: name,
                    description: parentPath,
                    buttons,
                    resource,
                    fileKind,
                };
            };
            const runPick = (uri, isFile, keyMods) => {
                const forceNewWindow = keyMods.ctrlCmd;
                return this.windowService.openWindow([{ uri, typeHint: isFile ? 'file' : 'folder' }], { forceNewWindow, forceOpenWorkspaceAsFile: isFile });
            };
            const workspacePicks = recentWorkspaces.map(workspace => toPick(workspace, this.labelService, !this.isQuickNavigate() ? [this.removeFromRecentlyOpened] : undefined));
            const filePicks = recentFiles.map(p => toPick(p, this.labelService, !this.isQuickNavigate() ? [this.removeFromRecentlyOpened] : undefined));
            // focus second entry if the first recent workspace is the current workspace
            const firstEntry = recentWorkspaces[0];
            let autoFocusSecondEntry = firstEntry && this.contextService.isCurrentWorkspace(history_1.isRecentWorkspace(firstEntry) ? firstEntry.workspace : firstEntry.folderUri);
            let keyMods;
            const workspaceSeparator = { type: 'separator', label: nls.localize('workspaces', "workspaces") };
            const fileSeparator = { type: 'separator', label: nls.localize('files', "files") };
            const picks = [workspaceSeparator, ...workspacePicks, fileSeparator, ...filePicks];
            this.quickInputService.pick(picks, {
                contextKey: exports.inRecentFilesPickerContextKey,
                activeItem: [...workspacePicks, ...filePicks][autoFocusSecondEntry ? 1 : 0],
                placeHolder: platform_1.isMacintosh ? nls.localize('openRecentPlaceHolderMac', "Select to open (hold Cmd-key to open in new window)") : nls.localize('openRecentPlaceHolder', "Select to open (hold Ctrl-key to open in new window)"),
                matchOnDescription: true,
                onKeyMods: mods => keyMods = mods,
                quickNavigate: this.isQuickNavigate() ? { keybindings: this.keybindingService.lookupKeybindings(this.id) } : undefined,
                onDidTriggerItemButton: context => {
                    this.windowsService.removeFromRecentlyOpened([context.item.resource]).then(() => context.removeItem());
                }
            }).then((pick) => {
                if (pick) {
                    return runPick(pick.resource, pick.fileKind === files_1.FileKind.FILE, keyMods);
                }
            });
        }
    }
    exports.BaseOpenRecentAction = BaseOpenRecentAction;
    let OpenRecentAction = class OpenRecentAction extends BaseOpenRecentAction {
        constructor(id, label, windowService, windowsService, quickInputService, contextService, keybindingService, modelService, modeService, labelService) {
            super(id, label, windowService, windowsService, quickInputService, contextService, labelService, keybindingService, modelService, modeService);
        }
        isQuickNavigate() {
            return false;
        }
    };
    OpenRecentAction.ID = 'workbench.action.openRecent';
    OpenRecentAction.LABEL = nls.localize('openRecent', "Open Recent...");
    OpenRecentAction = __decorate([
        __param(2, windows_1.IWindowService),
        __param(3, windows_1.IWindowsService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, modelService_1.IModelService),
        __param(8, modeService_1.IModeService),
        __param(9, label_1.ILabelService)
    ], OpenRecentAction);
    exports.OpenRecentAction = OpenRecentAction;
    let QuickOpenRecentAction = class QuickOpenRecentAction extends BaseOpenRecentAction {
        constructor(id, label, windowService, windowsService, quickInputService, contextService, keybindingService, modelService, modeService, labelService) {
            super(id, label, windowService, windowsService, quickInputService, contextService, labelService, keybindingService, modelService, modeService);
        }
        isQuickNavigate() {
            return true;
        }
    };
    QuickOpenRecentAction.ID = 'workbench.action.quickOpenRecent';
    QuickOpenRecentAction.LABEL = nls.localize('quickOpenRecent', "Quick Open Recent...");
    QuickOpenRecentAction = __decorate([
        __param(2, windows_1.IWindowService),
        __param(3, windows_1.IWindowsService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, modelService_1.IModelService),
        __param(8, modeService_1.IModeService),
        __param(9, label_1.ILabelService)
    ], QuickOpenRecentAction);
    exports.QuickOpenRecentAction = QuickOpenRecentAction;
    let ShowAboutDialogAction = class ShowAboutDialogAction extends actions_1.Action {
        constructor(id, label, windowsService) {
            super(id, label);
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.openAboutDialog();
        }
    };
    ShowAboutDialogAction.ID = 'workbench.action.showAboutDialog';
    ShowAboutDialogAction.LABEL = nls.localize('about', "About {0}", product_1.default.applicationName);
    ShowAboutDialogAction = __decorate([
        __param(2, windows_1.IWindowsService)
    ], ShowAboutDialogAction);
    exports.ShowAboutDialogAction = ShowAboutDialogAction;
    exports.NewWindowTabHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).newWindowTab();
    };
    exports.ShowPreviousWindowTabHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).showPreviousWindowTab();
    };
    exports.ShowNextWindowTabHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).showNextWindowTab();
    };
    exports.MoveWindowTabToNewWindowHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).moveWindowTabToNewWindow();
    };
    exports.MergeWindowTabsHandlerHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).mergeAllWindowTabs();
    };
    exports.ToggleWindowTabsBarHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).toggleWindowTabsBar();
    };
});
//# sourceMappingURL=windowActions.js.map