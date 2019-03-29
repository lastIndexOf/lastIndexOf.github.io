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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/objects", "vs/platform/files/common/files", "vs/platform/quickinput/common/quickInput", "vs/base/common/uri", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/platform/remote/common/remoteHosts", "vs/platform/windows/common/windows", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "vs/platform/notification/common/notification", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/getIconClasses", "vs/base/common/network"], function (require, exports, nls, resources, objects, files_1, quickInput_1, uri_1, platform_1, dialogs_1, remoteHosts_1, windows_1, label_1, workspace_1, notification_1, modelService_1, modeService_1, getIconClasses_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Reference: https://en.wikipedia.org/wiki/Filename
    const INVALID_FILE_CHARS = platform_1.isWindows ? /[\\/:\*\?"<>\|]/g : /[\\/]/g;
    const WINDOWS_FORBIDDEN_NAMES = /^(con|prn|aux|clock\$|nul|lpt[0-9]|com[0-9])$/i;
    let RemoteFileDialog = class RemoteFileDialog {
        constructor(remoteFileService, quickInputService, windowService, labelService, workspaceContextService, notificationService, fileDialogService, modelService, modeService) {
            this.remoteFileService = remoteFileService;
            this.quickInputService = quickInputService;
            this.windowService = windowService;
            this.labelService = labelService;
            this.workspaceContextService = workspaceContextService;
            this.notificationService = notificationService;
            this.fileDialogService = fileDialogService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.scheme = remoteHosts_1.REMOTE_HOST_SCHEME;
            this.shouldOverwriteFile = false;
            this.remoteAuthority = this.windowService.getConfiguration().remoteAuthority;
        }
        showOpenDialog(options = {}) {
            return __awaiter(this, void 0, void 0, function* () {
                this.scheme = this.getScheme(options.defaultUri, options.availableFileSystems);
                const newOptions = this.getOptions(options);
                if (!newOptions) {
                    return Promise.resolve(undefined);
                }
                this.options = newOptions;
                const openFileString = nls.localize('remoteFileDialog.localFileFallback', '(Open Local File)');
                const openFolderString = nls.localize('remoteFileDialog.localFolderFallback', '(Open Local Folder)');
                const openFileFolderString = nls.localize('remoteFileDialog.localFileFolderFallback', '(Open Local File or Folder)');
                let fallbackLabel = options.canSelectFiles ? (options.canSelectFolders ? openFileFolderString : openFileString) : openFolderString;
                this.fallbackListItem = this.getFallbackFileSystem(fallbackLabel);
                return this.pickResource().then((fileFolderUri) => __awaiter(this, void 0, void 0, function* () {
                    if (fileFolderUri) {
                        const stat = yield this.remoteFileService.resolveFile(fileFolderUri);
                        return [{ uri: fileFolderUri, typeHint: stat.isDirectory ? 'folder' : 'file' }];
                    }
                    return Promise.resolve(undefined);
                }));
            });
        }
        showSaveDialog(options) {
            this.scheme = this.getScheme(options.defaultUri, options.availableFileSystems);
            this.requiresTrailing = true;
            const newOptions = this.getOptions(options);
            if (!newOptions) {
                return Promise.resolve(undefined);
            }
            this.options = newOptions;
            this.options.canSelectFolders = true;
            this.options.canSelectFiles = true;
            this.fallbackListItem = this.getFallbackFileSystem(nls.localize('remoteFileDialog.localSaveFallback', '(Save Local File)'));
            return new Promise((resolve) => {
                this.pickResource(true).then(folderUri => {
                    resolve(folderUri);
                });
            });
        }
        getOptions(options) {
            const defaultUri = options.defaultUri ? options.defaultUri : uri_1.URI.from({ scheme: this.scheme, authority: this.remoteAuthority, path: '/' });
            if ((this.scheme !== network_1.Schemas.file) && !this.remoteFileService.canHandleResource(defaultUri)) {
                this.notificationService.info(nls.localize('remoteFileDialog.notConnectedToRemote', 'File system provider for {0} is not available.', defaultUri.toString()));
                return undefined;
            }
            const newOptions = objects.deepClone(options);
            newOptions.defaultUri = defaultUri;
            return newOptions;
        }
        remoteUriFrom(path) {
            path = path.replace(/\\/g, '/');
            return uri_1.URI.from({ scheme: this.scheme, authority: this.remoteAuthority, path });
        }
        getScheme(defaultUri, available) {
            return defaultUri ? defaultUri.scheme : (available ? available[0] : network_1.Schemas.file);
        }
        getFallbackFileSystem(label) {
            if (this.options && this.options.availableFileSystems && (this.options.availableFileSystems.length > 1)) {
                return { label: label, uri: uri_1.URI.from({ scheme: this.options.availableFileSystems[1] }), isFolder: true };
            }
            return undefined;
        }
        pickResource(isSave = false) {
            return __awaiter(this, void 0, void 0, function* () {
                this.allowFolderSelection = !!this.options.canSelectFolders;
                this.allowFileSelection = !!this.options.canSelectFiles;
                this.hidden = false;
                let homedir = this.options.defaultUri ? this.options.defaultUri : this.workspaceContextService.getWorkspace().folders[0].uri;
                let trailing;
                let stat;
                let ext = resources.extname(homedir);
                if (this.options.defaultUri) {
                    try {
                        stat = yield this.remoteFileService.resolveFile(this.options.defaultUri);
                    }
                    catch (e) {
                        // The file or folder doesn't exist
                    }
                    if (!stat || !stat.isDirectory) {
                        homedir = resources.dirname(this.options.defaultUri);
                        trailing = resources.basename(this.options.defaultUri);
                    }
                    // append extension
                    if (isSave && !ext && this.options.filters) {
                        for (let i = 0; i < this.options.filters.length; i++) {
                            if (this.options.filters[i].extensions[0] !== '*') {
                                ext = '.' + this.options.filters[i].extensions[0];
                                trailing = trailing ? trailing + ext : ext;
                                break;
                            }
                        }
                    }
                }
                this.acceptButton = { iconPath: this.getDialogIcons('accept'), tooltip: this.options.title };
                return new Promise((resolve) => {
                    this.filePickBox = this.quickInputService.createQuickPick();
                    this.filePickBox.matchOnLabel = false;
                    this.filePickBox.autoFocusOnList = false;
                    let isResolving = false;
                    let isAcceptHandled = false;
                    this.currentFolder = homedir;
                    this.filePickBox.buttons = [this.acceptButton];
                    this.filePickBox.onDidTriggerButton(_ => {
                        // accept button
                        const resolveValue = this.remoteUriFrom(this.filePickBox.value);
                        this.validate(resolveValue).then(validated => {
                            if (validated) {
                                isResolving = true;
                                this.filePickBox.hide();
                                resolve(resolveValue);
                            }
                        });
                    });
                    this.filePickBox.title = this.options.title;
                    this.filePickBox.value = this.pathFromUri(this.currentFolder);
                    this.filePickBox.items = [];
                    this.filePickBox.onDidAccept(_ => {
                        if (isAcceptHandled || this.filePickBox.busy) {
                            return;
                        }
                        isAcceptHandled = true;
                        isResolving = true;
                        this.onDidAccept().then(resolveValue => {
                            if (resolveValue) {
                                this.filePickBox.hide();
                                resolve(resolveValue);
                            }
                            else if (this.hidden) {
                                resolve(undefined);
                            }
                            else {
                                isResolving = false;
                                isAcceptHandled = false;
                            }
                        });
                    });
                    this.filePickBox.onDidChangeActive(i => {
                        isAcceptHandled = false;
                    });
                    this.filePickBox.onDidChangeValue((value) => __awaiter(this, void 0, void 0, function* () {
                        if (value !== this.userValue) {
                            this.filePickBox.validationMessage = undefined;
                            this.shouldOverwriteFile = false;
                            const trimmedPickBoxValue = ((this.filePickBox.value.length > 1) && this.endsWithSlash(this.filePickBox.value)) ? this.filePickBox.value.substr(0, this.filePickBox.value.length - 1) : this.filePickBox.value;
                            const valueUri = this.remoteUriFrom(trimmedPickBoxValue);
                            if (!resources.isEqual(this.currentFolder, valueUri, true)) {
                                yield this.tryUpdateItems(value, this.remoteUriFrom(this.filePickBox.value));
                            }
                            this.setActiveItems(value);
                            this.userValue = value;
                        }
                        else {
                            this.filePickBox.activeItems = [];
                        }
                    }));
                    this.filePickBox.onDidHide(() => {
                        this.hidden = true;
                        if (!isResolving) {
                            resolve(undefined);
                        }
                        this.filePickBox.dispose();
                    });
                    this.filePickBox.show();
                    this.updateItems(homedir, trailing);
                    if (trailing) {
                        this.filePickBox.valueSelection = [this.filePickBox.value.length - trailing.length, this.filePickBox.value.length - ext.length];
                    }
                    this.userValue = this.filePickBox.value;
                });
            });
        }
        onDidAccept() {
            return __awaiter(this, void 0, void 0, function* () {
                // Check if Open Local has been selected
                const selectedItems = this.filePickBox.selectedItems;
                if (selectedItems && (selectedItems.length > 0) && (selectedItems[0] === this.fallbackListItem)) {
                    if (this.options.availableFileSystems && (this.options.availableFileSystems.length > 1)) {
                        this.options.availableFileSystems.shift();
                    }
                    if (this.requiresTrailing) {
                        return this.fileDialogService.showSaveDialog(this.options).then(result => {
                            return result;
                        });
                    }
                    else {
                        return this.fileDialogService.showOpenDialog(this.options).then(result => {
                            return result ? result[0] : undefined;
                        });
                    }
                }
                let resolveValue;
                let navigateValue;
                const trimmedPickBoxValue = ((this.filePickBox.value.length > 1) && this.endsWithSlash(this.filePickBox.value)) ? this.filePickBox.value.substr(0, this.filePickBox.value.length - 1) : this.filePickBox.value;
                const inputUri = this.remoteUriFrom(trimmedPickBoxValue);
                const inputUriDirname = resources.dirname(inputUri);
                let stat;
                let statDirname;
                try {
                    statDirname = yield this.remoteFileService.resolveFile(inputUriDirname);
                    stat = yield this.remoteFileService.resolveFile(inputUri);
                }
                catch (e) {
                    // do nothing
                }
                // Find resolve value
                if (this.filePickBox.activeItems.length === 0) {
                    if (!this.requiresTrailing && resources.isEqual(this.currentFolder, inputUri, true)) {
                        resolveValue = inputUri;
                    }
                    else if (statDirname && statDirname.isDirectory) {
                        resolveValue = inputUri;
                    }
                    else if (stat && stat.isDirectory) {
                        navigateValue = inputUri;
                    }
                }
                else if (this.filePickBox.activeItems.length === 1) {
                    const item = this.filePickBox.selectedItems[0];
                    if (item) {
                        if (!item.isFolder) {
                            resolveValue = item.uri;
                        }
                        else {
                            navigateValue = item.uri;
                        }
                    }
                }
                if (resolveValue) {
                    if (yield this.validate(resolveValue)) {
                        return Promise.resolve(resolveValue);
                    }
                }
                else if (navigateValue) {
                    // Try to navigate into the folder
                    this.updateItems(navigateValue);
                }
                else {
                    // validation error. Path does not exist.
                }
                return Promise.resolve(undefined);
            });
        }
        tryUpdateItems(value, valueUri) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.endsWithSlash(value) || (!resources.isEqual(this.currentFolder, resources.dirname(valueUri), true) && resources.isEqualOrParent(this.currentFolder, resources.dirname(valueUri), true))) {
                    let stat;
                    try {
                        stat = yield this.remoteFileService.resolveFile(valueUri);
                    }
                    catch (e) {
                        // do nothing
                    }
                    if (stat && stat.isDirectory && (resources.basename(valueUri) !== '.')) {
                        this.updateItems(valueUri);
                    }
                    else {
                        const inputUriDirname = resources.dirname(valueUri);
                        if (!resources.isEqual(this.currentFolder, inputUriDirname, true)) {
                            let statWithoutTrailing;
                            try {
                                statWithoutTrailing = yield this.remoteFileService.resolveFile(inputUriDirname);
                            }
                            catch (e) {
                                // do nothing
                            }
                            if (statWithoutTrailing && statWithoutTrailing.isDirectory && (resources.basename(valueUri) !== '.')) {
                                this.updateItems(inputUriDirname, resources.basename(valueUri));
                            }
                        }
                    }
                }
            });
        }
        setActiveItems(value) {
            if (!this.userValue || (value !== this.userValue.substring(0, value.length))) {
                const inputBasename = resources.basename(this.remoteUriFrom(value));
                let hasMatch = false;
                for (let i = 0; i < this.filePickBox.items.length; i++) {
                    const item = this.filePickBox.items[i];
                    const itemBasename = (item.label === '..') ? item.label : resources.basename(item.uri);
                    if ((itemBasename.length >= inputBasename.length) && (itemBasename.substr(0, inputBasename.length).toLowerCase() === inputBasename.toLowerCase())) {
                        this.filePickBox.activeItems = [item];
                        this.filePickBox.value = this.filePickBox.value + itemBasename.substr(inputBasename.length);
                        this.filePickBox.valueSelection = [value.length, this.filePickBox.value.length];
                        hasMatch = true;
                        break;
                    }
                }
                if (!hasMatch) {
                    this.filePickBox.activeItems = [];
                }
            }
        }
        validate(uri) {
            return __awaiter(this, void 0, void 0, function* () {
                let stat;
                let statDirname;
                try {
                    statDirname = yield this.remoteFileService.resolveFile(resources.dirname(uri));
                    stat = yield this.remoteFileService.resolveFile(uri);
                }
                catch (e) {
                    // do nothing
                }
                if (this.requiresTrailing) { // save
                    if (stat && stat.isDirectory) {
                        // Can't do this
                        this.filePickBox.validationMessage = nls.localize('remoteFileDialog.validateFolder', 'The folder already exists. Please use a new file name.');
                        return Promise.resolve(false);
                    }
                    else if (stat && !this.shouldOverwriteFile) {
                        // Replacing a file.
                        this.shouldOverwriteFile = true;
                        this.filePickBox.validationMessage = nls.localize('remoteFileDialog.validateExisting', '{0} already exists. Are you sure you want to overwrite it?', resources.basename(uri));
                        return Promise.resolve(false);
                    }
                    else if (!this.isValidBaseName(resources.basename(uri))) {
                        // Filename not allowed
                        this.filePickBox.validationMessage = nls.localize('remoteFileDialog.validateBadFilename', 'Please enter a valid file name.');
                        return Promise.resolve(false);
                    }
                    else if (!statDirname || !statDirname.isDirectory) {
                        // Folder to save in doesn't exist
                        this.filePickBox.validationMessage = nls.localize('remoteFileDialog.validateNonexistentDir', 'Please enter a path that exists.');
                        return Promise.resolve(false);
                    }
                }
                else { // open
                    if (!stat) {
                        // File or folder doesn't exist
                        this.filePickBox.validationMessage = nls.localize('remoteFileDialog.validateNonexistentDir', 'Please enter a path that exists.');
                        return Promise.resolve(false);
                    }
                    else if (stat.isDirectory && !this.allowFolderSelection) {
                        // Folder selected when folder selection not permitted
                        this.filePickBox.validationMessage = nls.localize('remoteFileDialog.validateFileOnly', 'Please select a file.');
                        return Promise.resolve(false);
                    }
                    else if (!stat.isDirectory && !this.allowFileSelection) {
                        // File selected when file selection not permitted
                        this.filePickBox.validationMessage = nls.localize('remoteFileDialog.validateFolderOnly', 'Please select a folder.');
                        return Promise.resolve(false);
                    }
                }
                return Promise.resolve(true);
            });
        }
        updateItems(newFolder, trailing) {
            this.currentFolder = newFolder;
            this.filePickBox.value = trailing ? this.pathFromUri(resources.joinPath(newFolder, trailing)) : this.pathFromUri(newFolder, true);
            this.filePickBox.busy = true;
            this.createItems(this.currentFolder).then(items => {
                this.filePickBox.items = items;
                if (this.allowFolderSelection) {
                    this.filePickBox.activeItems = [];
                }
                this.filePickBox.busy = false;
            });
        }
        pathFromUri(uri, endWithSeparator = false) {
            const sep = this.labelService.getSeparator(uri.scheme, uri.authority);
            let result;
            if (sep === '/') {
                result = uri.fsPath.replace(/\\/g, sep);
            }
            else {
                result = uri.fsPath.replace(/\//g, sep);
            }
            if (endWithSeparator && !this.endsWithSlash(result)) {
                result = result + sep;
            }
            return result;
        }
        isValidBaseName(name) {
            if (!name || name.length === 0 || /^\s+$/.test(name)) {
                return false; // require a name that is not just whitespace
            }
            INVALID_FILE_CHARS.lastIndex = 0; // the holy grail of software development
            if (INVALID_FILE_CHARS.test(name)) {
                return false; // check for certain invalid file characters
            }
            if (platform_1.isWindows && WINDOWS_FORBIDDEN_NAMES.test(name)) {
                return false; // check for certain invalid file names
            }
            if (name === '.' || name === '..') {
                return false; // check for reserved values
            }
            if (platform_1.isWindows && name[name.length - 1] === '.') {
                return false; // Windows: file cannot end with a "."
            }
            if (platform_1.isWindows && name.length !== name.trim().length) {
                return false; // Windows: file cannot end with a whitespace
            }
            return true;
        }
        endsWithSlash(s) {
            return /[\/\\]$/.test(s);
        }
        basenameWithTrailingSlash(fullPath) {
            const child = this.pathFromUri(fullPath, true);
            const parent = this.pathFromUri(resources.dirname(fullPath), true);
            return child.substring(parent.length);
        }
        createBackItem(currFolder) {
            const parentFolder = resources.dirname(currFolder);
            if (!resources.isEqual(currFolder, parentFolder, true)) {
                return { label: '..', uri: resources.dirname(currFolder), isFolder: true };
            }
            return null;
        }
        createItems(currentFolder) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = [];
                const backDir = this.createBackItem(currentFolder);
                try {
                    const fileNames = yield this.remoteFileService.readFolder(currentFolder);
                    const items = yield Promise.all(fileNames.map(fileName => this.createItem(fileName, currentFolder)));
                    for (let item of items) {
                        if (item) {
                            result.push(item);
                        }
                    }
                }
                catch (e) {
                    // ignore
                    console.log(e);
                }
                const sorted = result.sort((i1, i2) => {
                    if (i1.isFolder !== i2.isFolder) {
                        return i1.isFolder ? -1 : 1;
                    }
                    const trimmed1 = this.endsWithSlash(i1.label) ? i1.label.substr(0, i1.label.length - 1) : i1.label;
                    const trimmed2 = this.endsWithSlash(i2.label) ? i2.label.substr(0, i2.label.length - 1) : i2.label;
                    return trimmed1.localeCompare(trimmed2);
                });
                if (backDir) {
                    sorted.unshift(backDir);
                }
                if (this.fallbackListItem) {
                    sorted.unshift(this.fallbackListItem);
                }
                return sorted;
            });
        }
        filterFile(file) {
            if (this.filters) {
                const ext = resources.extname(file);
                for (let i = 0; i < this.filters.length; i++) {
                    for (let j = 0; j < this.filters[i].extensions.length; j++) {
                        if (ext === ('.' + this.filters[i].extensions[j])) {
                            return true;
                        }
                    }
                }
                return false;
            }
            return true;
        }
        createItem(filename, parent) {
            return __awaiter(this, void 0, void 0, function* () {
                let fullPath = resources.joinPath(parent, filename);
                try {
                    const stat = yield this.remoteFileService.resolveFile(fullPath);
                    if (stat.isDirectory) {
                        filename = this.basenameWithTrailingSlash(fullPath);
                        return { label: filename, uri: fullPath, isFolder: true, iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, fullPath || undefined, files_1.FileKind.FOLDER) };
                    }
                    else if (!stat.isDirectory && this.allowFileSelection && this.filterFile(fullPath)) {
                        return { label: filename, uri: fullPath, isFolder: false, iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, fullPath || undefined) };
                    }
                    return undefined;
                }
                catch (e) {
                    return undefined;
                }
            });
        }
        getDialogIcons(name) {
            return {
                dark: uri_1.URI.parse(require.toUrl(`vs/workbench/services/dialogs/electron-browser/media/dark/${name}.svg`)),
                light: uri_1.URI.parse(require.toUrl(`vs/workbench/services/dialogs/electron-browser/media/light/${name}.svg`))
            };
        }
    };
    RemoteFileDialog = __decorate([
        __param(0, files_1.IFileService),
        __param(1, quickInput_1.IQuickInputService),
        __param(2, windows_1.IWindowService),
        __param(3, label_1.ILabelService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, notification_1.INotificationService),
        __param(6, dialogs_1.IFileDialogService),
        __param(7, modelService_1.IModelService),
        __param(8, modeService_1.IModeService)
    ], RemoteFileDialog);
    exports.RemoteFileDialog = RemoteFileDialog;
});
//# sourceMappingURL=remoteFileDialog.js.map