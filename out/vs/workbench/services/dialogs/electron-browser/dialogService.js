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
define(["require", "exports", "vs/nls", "vs/platform/product/node/product", "vs/base/common/severity", "vs/base/common/platform", "vs/platform/windows/common/windows", "vs/base/common/labels", "vs/platform/dialogs/common/dialogs", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/workbench/services/history/common/history", "vs/platform/environment/common/environment", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/dialogs/electron-browser/remoteFileDialog", "vs/platform/workspaces/common/workspaces", "vs/platform/remote/common/remoteHosts", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/dialogs/node/dialogIpc"], function (require, exports, nls, product_1, severity_1, platform_1, windows_1, labels_1, dialogs_1, log_1, workspace_1, history_1, environment_1, uri_1, network_1, resources, instantiation_1, remoteFileDialog_1, workspaces_1, remoteHosts_1, configuration_1, extensions_1, sharedProcessService_1, dialogIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DialogService = class DialogService {
        constructor(windowService, logService, sharedProcessService) {
            this.windowService = windowService;
            this.logService = logService;
            sharedProcessService.registerChannel('dialog', new dialogIpc_1.DialogChannel(this));
        }
        confirm(confirmation) {
            this.logService.trace('DialogService#confirm', confirmation.message);
            const { options, buttonIndexMap } = this.massageMessageBoxOptions(this.getConfirmOptions(confirmation));
            return this.windowService.showMessageBox(options).then(result => {
                return {
                    confirmed: buttonIndexMap[result.button] === 0 ? true : false,
                    checkboxChecked: result.checkboxChecked
                };
            });
        }
        getConfirmOptions(confirmation) {
            const buttons = [];
            if (confirmation.primaryButton) {
                buttons.push(confirmation.primaryButton);
            }
            else {
                buttons.push(nls.localize({ key: 'yesButton', comment: ['&& denotes a mnemonic'] }, "&&Yes"));
            }
            if (confirmation.secondaryButton) {
                buttons.push(confirmation.secondaryButton);
            }
            else if (typeof confirmation.secondaryButton === 'undefined') {
                buttons.push(nls.localize('cancelButton', "Cancel"));
            }
            const opts = {
                title: confirmation.title,
                message: confirmation.message,
                buttons,
                cancelId: 1
            };
            if (confirmation.detail) {
                opts.detail = confirmation.detail;
            }
            if (confirmation.type) {
                opts.type = confirmation.type;
            }
            if (confirmation.checkbox) {
                opts.checkboxLabel = confirmation.checkbox.label;
                opts.checkboxChecked = confirmation.checkbox.checked;
            }
            return opts;
        }
        show(severity, message, buttons, dialogOptions) {
            this.logService.trace('DialogService#show', message);
            const { options, buttonIndexMap } = this.massageMessageBoxOptions({
                message,
                buttons,
                type: (severity === severity_1.default.Info) ? 'question' : (severity === severity_1.default.Error) ? 'error' : (severity === severity_1.default.Warning) ? 'warning' : 'none',
                cancelId: dialogOptions ? dialogOptions.cancelId : undefined,
                detail: dialogOptions ? dialogOptions.detail : undefined
            });
            return this.windowService.showMessageBox(options).then(result => buttonIndexMap[result.button]);
        }
        massageMessageBoxOptions(options) {
            let buttonIndexMap = (options.buttons || []).map((button, index) => index);
            let buttons = (options.buttons || []).map(button => labels_1.mnemonicButtonLabel(button));
            let cancelId = options.cancelId;
            // Linux: order of buttons is reverse
            // macOS: also reverse, but the OS handles this for us!
            if (platform_1.isLinux) {
                buttons = buttons.reverse();
                buttonIndexMap = buttonIndexMap.reverse();
            }
            // Default Button (always first one)
            options.defaultId = buttonIndexMap[0];
            // Cancel Button
            if (typeof cancelId === 'number') {
                // Ensure the cancelId is the correct one from our mapping
                cancelId = buttonIndexMap[cancelId];
                // macOS/Linux: the cancel button should always be to the left of the primary action
                // if we see more than 2 buttons, move the cancel one to the left of the primary
                if (!platform_1.isWindows && buttons.length > 2 && cancelId !== 1) {
                    const cancelButton = buttons[cancelId];
                    buttons.splice(cancelId, 1);
                    buttons.splice(1, 0, cancelButton);
                    const cancelButtonIndex = buttonIndexMap[cancelId];
                    buttonIndexMap.splice(cancelId, 1);
                    buttonIndexMap.splice(1, 0, cancelButtonIndex);
                    cancelId = 1;
                }
            }
            options.buttons = buttons;
            options.cancelId = cancelId;
            options.noLink = true;
            options.title = options.title || product_1.default.nameLong;
            return { options, buttonIndexMap };
        }
    };
    DialogService = __decorate([
        __param(0, windows_1.IWindowService),
        __param(1, log_1.ILogService),
        __param(2, sharedProcessService_1.ISharedProcessService)
    ], DialogService);
    exports.DialogService = DialogService;
    let FileDialogService = class FileDialogService {
        constructor(windowService, contextService, historyService, environmentService, instantiationService, configurationService) {
            this.windowService = windowService;
            this.contextService = contextService;
            this.historyService = historyService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
        }
        defaultFilePath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for last active file first...
            let candidate = this.historyService.getLastActiveFile(schemeFilter);
            // ...then for last active file root
            if (!candidate) {
                candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            }
            return candidate && resources.dirname(candidate) || undefined;
        }
        defaultFolderPath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for last active file root first...
            let candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            // ...then for last active file
            if (!candidate) {
                candidate = this.historyService.getLastActiveFile(schemeFilter);
            }
            return candidate && resources.dirname(candidate) || undefined;
        }
        defaultWorkspacePath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for current workspace config file first...
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                const configuration = this.contextService.getWorkspace().configuration;
                if (configuration && !isUntitledWorkspace(configuration, this.environmentService)) {
                    return resources.dirname(configuration) || undefined;
                }
            }
            // ...then fallback to default folder path
            return this.defaultFolderPath(schemeFilter);
        }
        toNativeOpenDialogOptions(options) {
            return {
                forceNewWindow: options.forceNewWindow,
                telemetryExtraData: options.telemetryExtraData,
                dialogOptions: {
                    defaultPath: options.defaultUri && options.defaultUri.fsPath
                }
            };
        }
        shouldUseSimplified(schema) {
            return (schema !== network_1.Schemas.file) || (this.configurationService.getValue('workbench.dialogs.useSimplified') === 'true');
        }
        ensureFileSchema(schema) {
            return schema !== network_1.Schemas.file ? [schema, network_1.Schemas.file] : [schema];
        }
        pickFileFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFilePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                const title = nls.localize('openFileOrFolder.title', 'Open File Or Folder');
                const availableFileSystems = this.ensureFileSchema(schema); // always allow file as well
                return this.pickRemoteResourceAndOpen({ canSelectFiles: true, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems }, !!options.forceNewWindow, true);
            }
            return this.windowService.pickFileFolderAndOpen(this.toNativeOpenDialogOptions(options));
        }
        pickFileAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFilePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                const title = nls.localize('openFile.title', 'Open File');
                const availableFileSystems = this.ensureFileSchema(schema); // always allow file as well
                return this.pickRemoteResourceAndOpen({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems }, !!options.forceNewWindow, true);
            }
            return this.windowService.pickFileAndOpen(this.toNativeOpenDialogOptions(options));
        }
        pickFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFolderPath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                const title = nls.localize('openFolder.title', 'Open Folder');
                const availableFileSystems = this.ensureFileSchema(schema); // always allow file as well
                return this.pickRemoteResourceAndOpen({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems }, !!options.forceNewWindow, false);
            }
            return this.windowService.pickFolderAndOpen(this.toNativeOpenDialogOptions(options));
        }
        pickWorkspaceAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultWorkspacePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                const title = nls.localize('openWorkspace.title', 'Open Workspace');
                const filters = [{ name: nls.localize('filterName.workspace', 'Workspace'), extensions: [workspaces_1.WORKSPACE_EXTENSION] }];
                const availableFileSystems = this.ensureFileSchema(schema); // always allow file as well
                return this.pickRemoteResourceAndOpen({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, filters, availableFileSystems }, !!options.forceNewWindow, false);
            }
            return this.windowService.pickWorkspaceAndOpen(this.toNativeOpenDialogOptions(options));
        }
        toNativeSaveDialogOptions(options) {
            return {
                defaultPath: options.defaultUri && options.defaultUri.fsPath,
                buttonLabel: options.saveLabel,
                filters: options.filters,
                title: options.title
            };
        }
        showSaveDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema)) {
                if (!options.availableFileSystems) {
                    options.availableFileSystems = [schema]; // by default only allow saving in the own file system
                }
                return this.saveRemoteResource(options);
            }
            return this.windowService.showSaveDialog(this.toNativeSaveDialogOptions(options)).then(result => {
                if (result) {
                    return uri_1.URI.file(result);
                }
                return undefined;
            });
        }
        showOpenDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (schema !== network_1.Schemas.file) {
                if (!options.availableFileSystems) {
                    options.availableFileSystems = [schema]; // by default only allow loading in the own file system
                }
                return this.pickRemoteResource(options).then(urisToOpen => {
                    return urisToOpen && urisToOpen.map(uto => uto.uri);
                });
            }
            const defaultUri = options.defaultUri;
            const newOptions = {
                title: options.title,
                defaultPath: defaultUri && defaultUri.fsPath,
                buttonLabel: options.openLabel,
                filters: options.filters,
                properties: []
            };
            newOptions.properties.push('createDirectory');
            if (options.canSelectFiles) {
                newOptions.properties.push('openFile');
            }
            if (options.canSelectFolders) {
                newOptions.properties.push('openDirectory');
            }
            if (options.canSelectMany) {
                newOptions.properties.push('multiSelections');
            }
            return this.windowService.showOpenDialog(newOptions).then(result => result ? result.map(uri_1.URI.file) : undefined);
        }
        pickRemoteResourceAndOpen(options, forceNewWindow, forceOpenWorkspaceAsFile) {
            return this.pickRemoteResource(options).then(urisToOpen => {
                if (urisToOpen) {
                    return this.windowService.openWindow(urisToOpen, { forceNewWindow, forceOpenWorkspaceAsFile });
                }
                return undefined;
            });
        }
        pickRemoteResource(options) {
            const remoteFileDialog = this.instantiationService.createInstance(remoteFileDialog_1.RemoteFileDialog);
            return remoteFileDialog.showOpenDialog(options);
        }
        saveRemoteResource(options) {
            const remoteFileDialog = this.instantiationService.createInstance(remoteFileDialog_1.RemoteFileDialog);
            return remoteFileDialog.showSaveDialog(options);
        }
        getSchemeFilterForWindow() {
            return !this.windowService.getConfiguration().remoteAuthority ? network_1.Schemas.file : remoteHosts_1.REMOTE_HOST_SCHEME;
        }
        getFileSystemSchema(options) {
            return options.availableFileSystems && options.availableFileSystems[0] || options.defaultUri && options.defaultUri.scheme || this.getSchemeFilterForWindow();
        }
    };
    FileDialogService = __decorate([
        __param(0, windows_1.IWindowService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, history_1.IHistoryService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService)
    ], FileDialogService);
    exports.FileDialogService = FileDialogService;
    function isUntitledWorkspace(path, environmentService) {
        return resources.isEqualOrParent(path, environmentService.untitledWorkspacesHome);
    }
    extensions_1.registerSingleton(dialogs_1.IFileDialogService, FileDialogService, true);
    extensions_1.registerSingleton(dialogs_1.IDialogService, DialogService, true);
});
//# sourceMappingURL=dialogService.js.map