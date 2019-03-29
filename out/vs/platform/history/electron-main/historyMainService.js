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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/platform/state/common/state", "electron", "vs/platform/log/common/log", "vs/base/common/labels", "vs/base/common/event", "vs/base/common/platform", "vs/platform/workspaces/common/workspaces", "vs/platform/history/common/history", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/network", "vs/platform/environment/common/environment", "vs/platform/label/common/label", "vs/platform/history/electron-main/historyStorage", "vs/base/node/pfs"], function (require, exports, nls, arrays, state_1, electron_1, log_1, labels_1, event_1, platform_1, workspaces_1, history_1, async_1, resources_1, uri_1, network_1, environment_1, label_1, historyStorage_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let HistoryMainService = class HistoryMainService {
        constructor(stateService, logService, workspacesMainService, environmentService) {
            this.stateService = stateService;
            this.logService = logService;
            this.workspacesMainService = workspacesMainService;
            this.environmentService = environmentService;
            this._onRecentlyOpenedChange = new event_1.Emitter();
            this.onRecentlyOpenedChange = this._onRecentlyOpenedChange.event;
            this.macOSRecentDocumentsUpdater = new async_1.ThrottledDelayer(800);
        }
        addRecentlyOpened(newlyAdded) {
            const mru = this.getRecentlyOpened();
            for (let curr of newlyAdded) {
                if (history_1.isRecentWorkspace(curr)) {
                    if (!this.workspacesMainService.isUntitledWorkspace(curr.workspace) && indexOfWorkspace(mru.workspaces, curr.workspace) === -1) {
                        mru.workspaces.unshift(curr);
                    }
                }
                else if (history_1.isRecentFolder(curr)) {
                    if (indexOfFolder(mru.workspaces, curr.folderUri) === -1) {
                        mru.workspaces.unshift(curr);
                    }
                }
                else {
                    if (indexOfFile(mru.files, curr.fileUri) === -1) {
                        mru.files.unshift(curr);
                        // Add to recent documents (Windows only, macOS later)
                        if (platform_1.isWindows && curr.fileUri.scheme === network_1.Schemas.file) {
                            electron_1.app.addRecentDocument(curr.fileUri.fsPath);
                        }
                    }
                }
                // Make sure its bounded
                mru.workspaces = mru.workspaces.slice(0, HistoryMainService.MAX_TOTAL_RECENT_ENTRIES);
                mru.files = mru.files.slice(0, HistoryMainService.MAX_TOTAL_RECENT_ENTRIES);
                this.saveRecentlyOpened(mru);
                this._onRecentlyOpenedChange.fire();
                // Schedule update to recent documents on macOS dock
                if (platform_1.isMacintosh) {
                    this.macOSRecentDocumentsUpdater.trigger(() => this.updateMacOSRecentDocuments());
                }
            }
        }
        removeFromRecentlyOpened(toRemove) {
            const keep = (recent) => {
                const uri = location(recent);
                for (const r of toRemove) {
                    if (resources_1.isEqual(r, uri)) {
                        return false;
                    }
                }
                return true;
            };
            const mru = this.getRecentlyOpened();
            const workspaces = mru.workspaces.filter(keep);
            const files = mru.files.filter(keep);
            if (workspaces.length !== mru.workspaces.length || files.length !== mru.files.length) {
                this.saveRecentlyOpened({ files, workspaces });
                this._onRecentlyOpenedChange.fire();
                // Schedule update to recent documents on macOS dock
                if (platform_1.isMacintosh) {
                    this.macOSRecentDocumentsUpdater.trigger(() => this.updateMacOSRecentDocuments());
                }
            }
        }
        updateMacOSRecentDocuments() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!platform_1.isMacintosh) {
                    return;
                }
                // macOS recent documents in the dock are behaving strangely. the entries seem to get
                // out of sync quickly over time. the attempted fix is to always set the list fresh
                // from our MRU history data. So we clear the documents first and then set the documents
                // again.
                electron_1.app.clearRecentDocuments();
                const mru = this.getRecentlyOpened();
                // Fill in workspaces
                for (let i = 0, entries = 0; i < mru.workspaces.length && entries < HistoryMainService.MAX_MACOS_DOCK_RECENT_FOLDERS; i++) {
                    const loc = location(mru.workspaces[i]);
                    if (loc.scheme === network_1.Schemas.file) {
                        const workspacePath = resources_1.originalFSPath(loc);
                        if (yield pfs_1.exists(workspacePath)) {
                            electron_1.app.addRecentDocument(workspacePath);
                            entries++;
                        }
                    }
                }
                // Fill in files
                for (let i = 0, entries = 0; i < mru.files.length && entries < HistoryMainService.MAX_MACOS_DOCK_RECENT_FILES; i++) {
                    const loc = location(mru.files[i]);
                    if (loc.scheme === network_1.Schemas.file) {
                        const filePath = resources_1.originalFSPath(loc);
                        if (yield pfs_1.exists(filePath)) {
                            electron_1.app.addRecentDocument(filePath);
                            entries++;
                        }
                    }
                }
            });
        }
        clearRecentlyOpened() {
            this.saveRecentlyOpened({ workspaces: [], files: [] });
            electron_1.app.clearRecentDocuments();
            // Event
            this._onRecentlyOpenedChange.fire();
        }
        getRecentlyOpened(currentWorkspace, currentFolder, currentFiles) {
            const workspaces = [];
            const files = [];
            // Add current workspace to beginning if set
            if (currentWorkspace && !this.workspacesMainService.isUntitledWorkspace(currentWorkspace)) {
                workspaces.push({ workspace: currentWorkspace });
            }
            if (currentFolder) {
                workspaces.push({ folderUri: currentFolder });
            }
            // Add currently files to open to the beginning if any
            if (currentFiles) {
                for (let currentFile of currentFiles) {
                    const fileUri = currentFile.fileUri;
                    if (fileUri && indexOfFile(files, fileUri) === -1) {
                        files.push({ fileUri });
                    }
                }
            }
            // Get from storage
            let recents = this.getRecentlyOpenedFromStorage();
            for (let recent of recents.workspaces) {
                let index = history_1.isRecentFolder(recent) ? indexOfFolder(workspaces, recent.folderUri) : indexOfWorkspace(workspaces, recent.workspace);
                if (index >= 0) {
                    workspaces[index].label = workspaces[index].label || recent.label;
                }
                else {
                    workspaces.push(recent);
                }
            }
            for (let recent of recents.files) {
                let index = indexOfFile(files, recent.fileUri);
                if (index >= 0) {
                    files[index].label = files[index].label || recent.label;
                }
                else {
                    files.push(recent);
                }
            }
            return { workspaces, files };
        }
        getRecentlyOpenedFromStorage() {
            const storedRecents = this.stateService.getItem(HistoryMainService.recentlyOpenedStorageKey);
            return historyStorage_1.restoreRecentlyOpened(storedRecents);
        }
        saveRecentlyOpened(recent) {
            const serialized = historyStorage_1.toStoreData(recent);
            this.stateService.setItem(HistoryMainService.recentlyOpenedStorageKey, serialized);
        }
        updateWindowsJumpList() {
            if (!platform_1.isWindows) {
                return; // only on windows
            }
            const jumpList = [];
            // Tasks
            jumpList.push({
                type: 'tasks',
                items: [
                    {
                        type: 'task',
                        title: nls.localize('newWindow', "New Window"),
                        description: nls.localize('newWindowDesc', "Opens a new window"),
                        program: process.execPath,
                        args: '-n',
                        iconPath: process.execPath,
                        iconIndex: 0
                    }
                ]
            });
            // Recent Workspaces
            if (this.getRecentlyOpened().workspaces.length > 0) {
                // The user might have meanwhile removed items from the jump list and we have to respect that
                // so we need to update our list of recent paths with the choice of the user to not add them again
                // Also: Windows will not show our custom category at all if there is any entry which was removed
                // by the user! See https://github.com/Microsoft/vscode/issues/15052
                let toRemove = [];
                for (let item of electron_1.app.getJumpListSettings().removedItems) {
                    const args = item.args;
                    if (args) {
                        const match = /^--(folder|file)-uri\s+"([^"]+)"$/.exec(args);
                        if (match) {
                            toRemove.push(uri_1.URI.parse(match[2]));
                        }
                    }
                }
                this.removeFromRecentlyOpened(toRemove);
                // Add entries
                jumpList.push({
                    type: 'custom',
                    name: nls.localize('recentFolders', "Recent Workspaces"),
                    items: arrays.coalesce(this.getRecentlyOpened().workspaces.slice(0, 7 /* limit number of entries here */).map(recent => {
                        const workspace = history_1.isRecentWorkspace(recent) ? recent.workspace : recent.folderUri;
                        const title = recent.label || label_1.getSimpleWorkspaceLabel(workspace, this.environmentService.untitledWorkspacesHome);
                        let description;
                        let args;
                        if (workspaces_1.isSingleFolderWorkspaceIdentifier(workspace)) {
                            const parentFolder = resources_1.dirname(workspace);
                            description = nls.localize('folderDesc', "{0} {1}", labels_1.getBaseLabel(workspace), labels_1.getPathLabel(parentFolder, this.environmentService));
                            args = `--folder-uri "${workspace.toString()}"`;
                        }
                        else {
                            description = nls.localize('codeWorkspace', "Code Workspace");
                            args = `--file-uri "${workspace.configPath.toString()}"`;
                        }
                        return {
                            type: 'task',
                            title,
                            description,
                            program: process.execPath,
                            args,
                            iconPath: 'explorer.exe',
                            iconIndex: 0
                        };
                    }))
                });
            }
            // Recent
            jumpList.push({
                type: 'recent' // this enables to show files in the "recent" category
            });
            try {
                electron_1.app.setJumpList(jumpList);
            }
            catch (error) {
                this.logService.warn('#setJumpList', error); // since setJumpList is relatively new API, make sure to guard for errors
            }
        }
    };
    HistoryMainService.MAX_TOTAL_RECENT_ENTRIES = 100;
    HistoryMainService.MAX_MACOS_DOCK_RECENT_FOLDERS = 10;
    HistoryMainService.MAX_MACOS_DOCK_RECENT_FILES = 5;
    HistoryMainService.recentlyOpenedStorageKey = 'openedPathsList';
    HistoryMainService = __decorate([
        __param(0, state_1.IStateService),
        __param(1, log_1.ILogService),
        __param(2, workspaces_1.IWorkspacesMainService),
        __param(3, environment_1.IEnvironmentService)
    ], HistoryMainService);
    exports.HistoryMainService = HistoryMainService;
    function location(recent) {
        if (history_1.isRecentFolder(recent)) {
            return recent.folderUri;
        }
        if (history_1.isRecentFile(recent)) {
            return recent.fileUri;
        }
        return recent.workspace.configPath;
    }
    function indexOfWorkspace(arr, workspace) {
        return arrays.firstIndex(arr, w => history_1.isRecentWorkspace(w) && w.workspace.id === workspace.id);
    }
    function indexOfFolder(arr, folderURI) {
        return arrays.firstIndex(arr, f => history_1.isRecentFolder(f) && resources_1.isEqual(f.folderUri, folderURI));
    }
    function indexOfFile(arr, fileURI) {
        return arrays.firstIndex(arr, f => resources_1.isEqual(f.fileUri, fileURI));
    }
});
//# sourceMappingURL=historyMainService.js.map