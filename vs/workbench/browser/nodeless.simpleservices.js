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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/services/backup/common/backup", "vs/platform/files/common/files", "vs/editor/common/model/textModel", "vs/base/common/map", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/clipboard/common/clipboardService", "vs/editor/standalone/browser/simpleServices", "vs/platform/dialogs/common/dialogs", "vs/platform/download/common/download", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensions", "vs/platform/url/common/url", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/platform/notification/common/notification", "vs/platform/lifecycle/common/lifecycleService", "vs/platform/log/common/log", "vs/platform/lifecycle/common/lifecycle", "vs/platform/menubar/common/menubar", "vs/platform/product/common/product", "vs/platform/remote/common/remoteAuthorityResolver", "vs/base/common/resources", "vs/base/common/path", "vs/workbench/services/search/common/search", "vs/editor/common/services/modelService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/untitled/common/untitledEditorService", "vs/base/common/arrays", "vs/base/common/network", "vs/workbench/services/search/common/searchHelpers", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/services/textMate/common/textMateService", "vs/platform/update/common/update", "vs/platform/windows/common/windows", "vs/base/common/platform", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/workspace/common/workspaceEditing", "vs/platform/workspace/common/workspace", "vs/editor/common/services/resourceConfiguration", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration"], function (require, exports, uri_1, backup_1, files_1, textModel_1, map_1, extensions_1, event_1, instantiation_1, clipboardService_1, simpleServices_1, dialogs_1, download_1, environment_1, extensionManagement_1, extensions_2, url_1, jsonEditing_1, contextkey_1, commands_1, telemetry_1, notification_1, lifecycleService_1, log_1, lifecycle_1, menubar_1, product_1, remoteAuthorityResolver_1, resources_1, path_1, search_1, modelService_1, editorService_1, untitledEditorService_1, arrays_1, network_1, searchHelpers_1, lifecycle_2, storage_1, textMateService_1, update_1, windows_1, platform_1, workspaces_1, workspaceEditing_1, workspace_1, resourceConfiguration_1, keybinding_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.workspaceResource = uri_1.URI.file(platform_1.isWindows ? 'C:\\simpleWorkspace' : '/simpleWorkspace');
    //#region Backup File
    class SimpleBackupFileService {
        constructor() {
            this.backups = new Map();
        }
        hasBackups() {
            return Promise.resolve(this.backups.size > 0);
        }
        loadBackupResource(resource) {
            const backupResource = this.toBackupResource(resource);
            if (this.backups.has(backupResource.toString())) {
                return Promise.resolve(backupResource);
            }
            return Promise.resolve(undefined);
        }
        backupResource(resource, content, versionId) {
            const backupResource = this.toBackupResource(resource);
            this.backups.set(backupResource.toString(), content);
            return Promise.resolve();
        }
        resolveBackupContent(backupResource) {
            const snapshot = this.backups.get(backupResource.toString());
            if (snapshot) {
                return Promise.resolve(textModel_1.createTextBufferFactoryFromSnapshot(snapshot));
            }
            return Promise.resolve(undefined);
        }
        getWorkspaceFileBackups() {
            return Promise.resolve(map_1.keys(this.backups).map(key => uri_1.URI.parse(key)));
        }
        discardResourceBackup(resource) {
            this.backups.delete(this.toBackupResource(resource).toString());
            return Promise.resolve();
        }
        discardAllWorkspaceBackups() {
            this.backups.clear();
            return Promise.resolve();
        }
        toBackupResource(resource) {
            return resource;
        }
    }
    exports.SimpleBackupFileService = SimpleBackupFileService;
    extensions_1.registerSingleton(backup_1.IBackupFileService, SimpleBackupFileService, true);
    //#endregion
    //#region Broadcast
    exports.IBroadcastService = instantiation_1.createDecorator('broadcastService');
    class SimpleBroadcastService {
        constructor() {
            this.onBroadcast = event_1.Event.None;
        }
        broadcast(b) { }
    }
    exports.SimpleBroadcastService = SimpleBroadcastService;
    extensions_1.registerSingleton(exports.IBroadcastService, SimpleBroadcastService, true);
    //#endregion
    //#region Clipboard
    class SimpleClipboardService {
        writeText(text, type) { }
        readText(type) {
            // @ts-ignore
            return undefined;
        }
        readFindText() {
            // @ts-ignore
            return undefined;
        }
        writeFindText(text) { }
        writeResources(resources) { }
        readResources() {
            return [];
        }
        hasResources() {
            return false;
        }
    }
    exports.SimpleClipboardService = SimpleClipboardService;
    extensions_1.registerSingleton(clipboardService_1.IClipboardService, SimpleClipboardService, true);
    //#endregion
    //#region Configuration
    class SimpleConfigurationService extends simpleServices_1.SimpleConfigurationService {
    }
    exports.SimpleConfigurationService = SimpleConfigurationService;
    extensions_1.registerSingleton(configuration_1.IConfigurationService, SimpleConfigurationService);
    //#endregion
    //#region Dialog
    class SimpleDialogService extends simpleServices_1.SimpleDialogService {
    }
    exports.SimpleDialogService = SimpleDialogService;
    extensions_1.registerSingleton(dialogs_1.IDialogService, SimpleDialogService, true);
    //#endregion
    //#region Download
    class SimpleDownloadService {
        download(uri, to, cancellationToken) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleDownloadService = SimpleDownloadService;
    extensions_1.registerSingleton(download_1.IDownloadService, SimpleDownloadService, true);
    //#endregion
    //#region Environment
    class SimpleEnvironmentService {
        constructor() {
            this.args = { _: [] };
            this.appRoot = '/nodeless/';
            this.appSettingsHome = '/nodeless/settings';
            this.appSettingsPath = '/nodeless/settings/settings.json';
            this.appKeybindingsPath = '/nodeless/settings/keybindings.json';
            this.logsPath = '/nodeless/logs';
        }
    }
    exports.SimpleEnvironmentService = SimpleEnvironmentService;
    extensions_1.registerSingleton(environment_1.IEnvironmentService, SimpleEnvironmentService);
    //#endregion
    //#region Extension Gallery
    class SimpleExtensionGalleryService {
        isEnabled() {
            return false;
        }
        query(options) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        download(extension, operation) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        reportStatistic(publisher, name, version, type) {
            return Promise.resolve(undefined);
        }
        getReadme(extension, token) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        getManifest(extension, token) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        getChangelog(extension, token) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        getCoreTranslation(extension, languageId) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        getAllVersions(extension, compatible) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        loadAllDependencies(dependencies, token) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        getExtensionsReport() {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        getCompatibleExtension(id, version) {
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleExtensionGalleryService = SimpleExtensionGalleryService;
    extensions_1.registerSingleton(extensionManagement_1.IExtensionGalleryService, SimpleExtensionGalleryService, true);
    //#endregion
    //#region Extension Management
    class SimpleExtensionManagementService {
        constructor() {
            this.onInstallExtension = event_1.Event.None;
            this.onDidInstallExtension = event_1.Event.None;
            this.onUninstallExtension = event_1.Event.None;
            this.onDidUninstallExtension = event_1.Event.None;
        }
        zip(extension) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        unzip(zipLocation, type) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        install(vsix) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        installFromGallery(extension) {
            return Promise.resolve(undefined);
        }
        uninstall(extension, force) {
            return Promise.resolve(undefined);
        }
        reinstallFromGallery(extension) {
            return Promise.resolve(undefined);
        }
        getInstalled(type) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        getExtensionsReport() {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        updateMetadata(local, metadata) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleExtensionManagementService = SimpleExtensionManagementService;
    extensions_1.registerSingleton(extensionManagement_1.IExtensionManagementService, SimpleExtensionManagementService);
    //#endregion
    //#region Extensions
    class SimpleExtensionService extends extensions_2.NullExtensionService {
    }
    exports.SimpleExtensionService = SimpleExtensionService;
    extensions_1.registerSingleton(extensions_2.IExtensionService, SimpleExtensionService);
    //#endregion
    //#region Extension URL Handler
    exports.IExtensionUrlHandler = instantiation_1.createDecorator('inactiveExtensionUrlHandler');
    class SimpleExtensionURLHandler {
        registerExtensionHandler(extensionId, handler) {
            throw new Error('Method not implemented.');
        }
        unregisterExtensionHandler(extensionId) {
            throw new Error('Method not implemented.');
        }
    }
    exports.SimpleExtensionURLHandler = SimpleExtensionURLHandler;
    extensions_1.registerSingleton(exports.IExtensionUrlHandler, SimpleExtensionURLHandler, true);
    //#endregion
    //#region File Dialog
    class SimpleFileDialogService {
        defaultFilePath(schemeFilter) {
            throw new Error('Method not implemented.');
        }
        defaultFolderPath(schemeFilter) {
            throw new Error('Method not implemented.');
        }
        defaultWorkspacePath(schemeFilter) {
            throw new Error('Method not implemented.');
        }
        pickFileFolderAndOpen(options) {
            throw new Error('Method not implemented.');
        }
        pickFileAndOpen(options) {
            throw new Error('Method not implemented.');
        }
        pickFolderAndOpen(options) {
            throw new Error('Method not implemented.');
        }
        pickWorkspaceAndOpen(options) {
            throw new Error('Method not implemented.');
        }
        showSaveDialog(options) {
            throw new Error('Method not implemented.');
        }
        showOpenDialog(options) {
            throw new Error('Method not implemented.');
        }
    }
    exports.SimpleFileDialogService = SimpleFileDialogService;
    extensions_1.registerSingleton(dialogs_1.IFileDialogService, SimpleFileDialogService, true);
    //#endregion
    //#region JSON Editing
    class SimpleJSONEditingService {
        write(resource, value, save) {
            return Promise.resolve();
        }
    }
    exports.SimpleJSONEditingService = SimpleJSONEditingService;
    extensions_1.registerSingleton(jsonEditing_1.IJSONEditingService, SimpleJSONEditingService, true);
    //#endregion
    //#region Keybinding
    let SimpleKeybindingService = class SimpleKeybindingService extends simpleServices_1.StandaloneKeybindingService {
        constructor(contextKeyService, commandService, telemetryService, notificationService) {
            super(contextKeyService, commandService, telemetryService, notificationService, window.document.body);
        }
    };
    SimpleKeybindingService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, notification_1.INotificationService)
    ], SimpleKeybindingService);
    exports.SimpleKeybindingService = SimpleKeybindingService;
    extensions_1.registerSingleton(keybinding_1.IKeybindingService, SimpleKeybindingService);
    //#endregion
    //#region Lifecycle
    let SimpleLifecycleService = class SimpleLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        constructor(logService) {
            super(logService);
            this.logService = logService;
            this.registerListeners();
        }
        registerListeners() {
            window.onbeforeunload = () => this.beforeUnload();
        }
        beforeUnload() {
            // Before Shutdown
            this._onBeforeShutdown.fire({
                veto(value) {
                    if (value === true) {
                        console.warn(new Error('Preventing onBeforeUnload currently not supported'));
                    }
                    else if (value instanceof Promise) {
                        console.warn(new Error('Long running onBeforeShutdown currently not supported'));
                    }
                },
                reason: 2 /* QUIT */
            });
            // Will Shutdown
            this._onWillShutdown.fire({
                join() {
                    console.warn(new Error('Long running onWillShutdown currently not supported'));
                },
                reason: 2 /* QUIT */
            });
            // @ts-ignore
            return null;
        }
    };
    SimpleLifecycleService = __decorate([
        __param(0, log_1.ILogService)
    ], SimpleLifecycleService);
    exports.SimpleLifecycleService = SimpleLifecycleService;
    extensions_1.registerSingleton(lifecycle_1.ILifecycleService, SimpleLifecycleService);
    //#endregion
    //#region Log
    class SimpleLogService extends log_1.NullLogService {
    }
    exports.SimpleLogService = SimpleLogService;
    //#endregion
    //#region Menu Bar
    class SimpleMenubarService {
        updateMenubar(windowId, menuData) {
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleMenubarService = SimpleMenubarService;
    extensions_1.registerSingleton(menubar_1.IMenubarService, SimpleMenubarService);
    //#endregion
    //#region Multi Extension Management
    class SimpleMultiExtensionsManagementService {
        constructor() {
            this.onInstallExtension = event_1.Event.None;
            this.onDidInstallExtension = event_1.Event.None;
            this.onUninstallExtension = event_1.Event.None;
            this.onDidUninstallExtension = event_1.Event.None;
        }
        zip(extension) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        unzip(zipLocation, type) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        install(vsix) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        installFromGallery(extension) {
            return Promise.resolve(undefined);
        }
        uninstall(extension, force) {
            return Promise.resolve(undefined);
        }
        reinstallFromGallery(extension) {
            return Promise.resolve(undefined);
        }
        getInstalled(type) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        getExtensionsReport() {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        updateMetadata(local, metadata) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleMultiExtensionsManagementService = SimpleMultiExtensionsManagementService;
    //#endregion
    //#region Product
    class SimpleProductService {
        constructor() {
            this.enableTelemetry = false;
        }
    }
    exports.SimpleProductService = SimpleProductService;
    extensions_1.registerSingleton(product_1.IProductService, SimpleProductService, true);
    //#endregion
    //#region Remote Agent
    exports.IRemoteAgentService = instantiation_1.createDecorator('remoteAgentService');
    class SimpleRemoteAgentService {
        getConnection() {
            // @ts-ignore
            return undefined;
        }
    }
    exports.SimpleRemoteAgentService = SimpleRemoteAgentService;
    extensions_1.registerSingleton(exports.IRemoteAgentService, SimpleRemoteAgentService);
    //#endregion
    //#region Remote Authority Resolver
    class SimpleRemoteAuthorityResolverService {
        resolveAuthority(authority) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        setResolvedAuthority(resolvedAuthority) { }
        setResolvedAuthorityError(authority, err) { }
    }
    exports.SimpleRemoteAuthorityResolverService = SimpleRemoteAuthorityResolverService;
    extensions_1.registerSingleton(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, SimpleRemoteAuthorityResolverService, true);
    //#endregion
    //#region File Servie
    const fileMap = new map_1.ResourceMap();
    const contentMap = new map_1.ResourceMap();
    initFakeFileSystem();
    class SimpleRemoteFileService {
        constructor() {
            this.onFileChanges = event_1.Event.None;
            this.onAfterOperation = event_1.Event.None;
            this.onDidChangeFileSystemProviderRegistrations = event_1.Event.None;
        }
        resolveFile(resource, options) {
            // @ts-ignore
            return Promise.resolve(fileMap.get(resource));
        }
        resolveFiles(toResolve) {
            return Promise.all(toResolve.map(resourceAndOption => this.resolveFile(resourceAndOption.resource, resourceAndOption.options))).then(stats => stats.map(stat => ({ stat, success: true })));
        }
        existsFile(resource) {
            return Promise.resolve(fileMap.has(resource));
        }
        resolveContent(resource, _options) {
            // @ts-ignore
            return Promise.resolve(contentMap.get(resource));
        }
        resolveStreamContent(resource, _options) {
            return Promise.resolve(contentMap.get(resource)).then(content => {
                return {
                    // @ts-ignore
                    resource: content.resource,
                    value: {
                        on: (event, callback) => {
                            if (event === 'data') {
                                // @ts-ignore
                                callback(content.value);
                            }
                            if (event === 'end') {
                                callback();
                            }
                        }
                    },
                    // @ts-ignore
                    etag: content.etag,
                    // @ts-ignore
                    encoding: content.encoding,
                    // @ts-ignore
                    mtime: content.mtime,
                    // @ts-ignore
                    name: content.name
                };
            });
        }
        updateContent(resource, value, _options) {
            // @ts-ignore
            return Promise.resolve(fileMap.get(resource)).then(file => {
                const content = contentMap.get(resource);
                if (typeof value === 'string') {
                    // @ts-ignore
                    content.value = value;
                }
                else {
                    // @ts-ignore
                    content.value = files_1.snapshotToString(value);
                }
                return file;
            });
        }
        moveFile(_source, _target, _overwrite) { return Promise.resolve(null); }
        copyFile(_source, _target, _overwrite) { throw new Error('not implemented'); }
        createFile(_resource, _content, _options) { throw new Error('not implemented'); }
        readFolder(_resource) { return Promise.resolve([]); }
        createFolder(_resource) { throw new Error('not implemented'); }
        registerProvider(_scheme, _provider) { return { dispose() { } }; }
        activateProvider(_scheme) { return Promise.resolve(undefined); }
        canHandleResource(resource) { return resource.scheme === 'file'; }
        del(_resource, _options) { return Promise.resolve(); }
        watchFileChanges(_resource) { }
        unwatchFileChanges(_resource) { }
        getWriteEncoding(_resource) { return { encoding: 'utf8', hasBOM: false }; }
        dispose() { }
    }
    exports.SimpleRemoteFileService = SimpleRemoteFileService;
    function initFakeFileSystem() {
        function createFile(parent, name, content) {
            const file = {
                resource: resources_1.joinPath(parent.resource, name),
                etag: Date.now().toString(),
                mtime: Date.now(),
                isDirectory: false,
                name
            };
            // @ts-ignore
            parent.children.push(file);
            fileMap.set(file.resource, file);
            contentMap.set(file.resource, {
                resource: resources_1.joinPath(parent.resource, name),
                etag: Date.now().toString(),
                mtime: Date.now(),
                value: content,
                encoding: 'utf8',
                name
            });
        }
        function createFolder(parent, name) {
            const folder = {
                resource: resources_1.joinPath(parent.resource, name),
                etag: Date.now().toString(),
                mtime: Date.now(),
                isDirectory: true,
                name,
                children: []
            };
            // @ts-ignore
            parent.children.push(folder);
            fileMap.set(folder.resource, folder);
            return folder;
        }
        const root = {
            resource: exports.workspaceResource,
            etag: Date.now().toString(),
            mtime: Date.now(),
            isDirectory: true,
            name: path_1.basename(exports.workspaceResource.fsPath),
            children: []
        };
        fileMap.set(root.resource, root);
        createFile(root, '.gitignore', `out
node_modules
.vscode-test/
*.vsix
`);
        createFile(root, '.vscodeignore', `.vscode/**
.vscode-test/**
out/test/**
src/**
.gitignore
vsc-extension-quickstart.md
**/tsconfig.json
**/tslint.json
**/*.map
**/*.ts`);
        createFile(root, 'CHANGELOG.md', `# Change Log
All notable changes to the "test-ts" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
- Initial release`);
        createFile(root, 'package.json', `{
	"name": "test-ts",
	"displayName": "test-ts",
	"description": "",
	"version": "0.0.1",
	"engines": {
		"vscode": "^1.31.0"
	},
	"categories": [
		"Other"
	],
	"activationEvents": [
		"onCommand:extension.helloWorld"
	],
	"main": "./out/extension.js",
	"contributes": {
		"commands": [
			{
				"command": "extension.helloWorld",
				"title": "Hello World"
			}
		]
	},
	"scripts": {
		"vscode:prepublish": "npm run compile",
		"compile": "tsc -p ./",
		"watch": "tsc -watch -p ./",
		"postinstall": "node ./node_modules/vscode/bin/install",
		"test": "npm run compile && node ./node_modules/vscode/bin/test"
	},
	"devDependencies": {
		"typescript": "^3.3.1",
		"vscode": "^1.1.28",
		"tslint": "^5.12.1",
		"@types/node": "^8.10.25",
		"@types/mocha": "^2.2.42"
	}
}
`);
        createFile(root, 'tsconfig.json', `{
	"compilerOptions": {
		"module": "commonjs",
		"target": "es6",
		"outDir": "out",
		"lib": [
			"es6"
		],
		"sourceMap": true,
		"rootDir": "src",
		"strict": true   /* enable all strict type-checking options */
		/* Additional Checks */
		// "noImplicitReturns": true, /* Report error when not all code paths in function return a value. */
		// "noFallthroughCasesInSwitch": true, /* Report errors for fallthrough cases in switch statement. */
		// "noUnusedParameters": true,  /* Report errors on unused parameters. */
	},
	"exclude": [
		"node_modules",
		".vscode-test"
	]
}
`);
        createFile(root, 'tslint.json', `{
	"rules": {
		"no-string-throw": true,
		"no-unused-expression": true,
		"no-duplicate-variable": true,
		"curly": true,
		"class-name": true,
		"semicolon": [
			true,
			"always"
		],
		"triple-equals": true
	},
	"defaultSeverity": "warning"
}
`);
        const src = createFolder(root, 'src');
        createFile(src, 'extension.ts', `// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "test-ts" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
`);
        const test = createFolder(src, 'test');
        createFile(test, 'extension.test.ts', `//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function () {

	// Defines a Mocha unit test
	test("Something 1", function() {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
	});
});`);
        createFile(test, 'index.ts', `//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.

import * as testRunner from 'vscode/lib/testrunner';

// You can directly control Mocha options by configuring the test runner below
// See https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options
// for more info
testRunner.configure({
	ui: 'tdd', 		// the TDD UI is being used in extension.test.ts (suite, test, etc.)
	useColors: true // colored output from test results
});

module.exports = testRunner;`);
    }
    extensions_1.registerSingleton(files_1.IFileService, SimpleRemoteFileService);
    //#endregion
    //#region Request
    exports.IRequestService = instantiation_1.createDecorator('requestService2');
    class SimpleRequestService {
        request(options, token) {
            return Promise.resolve(Object.create(null));
        }
    }
    exports.SimpleRequestService = SimpleRequestService;
    //#endregion
    //#region Search
    let SimpleSearchService = class SimpleSearchService {
        constructor(modelService, editorService, untitledEditorService) {
            this.modelService = modelService;
            this.editorService = editorService;
            this.untitledEditorService = untitledEditorService;
        }
        textSearch(query, token, onProgress) {
            // Get local results from dirty/untitled
            const localResults = this.getLocalResults(query);
            if (onProgress) {
                arrays_1.coalesce(localResults.values()).forEach(onProgress);
            }
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        fileSearch(query, token) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        clearCache(cacheKey) {
            return Promise.resolve(undefined);
        }
        registerSearchResultProvider(scheme, type, provider) {
            return lifecycle_2.Disposable.None;
        }
        getLocalResults(query) {
            const localResults = new map_1.ResourceMap();
            if (query.type === 2 /* Text */) {
                const models = this.modelService.getModels();
                models.forEach((model) => {
                    const resource = model.uri;
                    if (!resource) {
                        return;
                    }
                    if (!this.editorService.isOpen({ resource })) {
                        return;
                    }
                    // Support untitled files
                    if (resource.scheme === network_1.Schemas.untitled) {
                        if (!this.untitledEditorService.exists(resource)) {
                            return;
                        }
                    }
                    // Don't support other resource schemes than files for now
                    // todo@remote
                    // why is that? we should search for resources from other
                    // schemes
                    else if (resource.scheme !== network_1.Schemas.file) {
                        return;
                    }
                    if (!this.matches(resource, query)) {
                        return; // respect user filters
                    }
                    // Use editor API to find matches
                    // @ts-ignore
                    const matches = model.findMatches(query.contentPattern.pattern, false, query.contentPattern.isRegExp, query.contentPattern.isCaseSensitive, query.contentPattern.isWordMatch ? query.contentPattern.wordSeparators : null, false, query.maxResults);
                    if (matches.length) {
                        const fileMatch = new search_1.FileMatch(resource);
                        localResults.set(resource, fileMatch);
                        const textSearchResults = searchHelpers_1.editorMatchesToTextSearchResults(matches, model, query.previewOptions);
                        fileMatch.results = searchHelpers_1.addContextToEditorMatches(textSearchResults, model, query);
                    }
                    else {
                        // @ts-ignore
                        localResults.set(resource, null);
                    }
                });
            }
            return localResults;
        }
        matches(resource, query) {
            // includes
            if (query.includePattern) {
                if (resource.scheme !== network_1.Schemas.file) {
                    return false; // if we match on file patterns, we have to ignore non file resources
                }
            }
            return search_1.pathIncludedInQuery(query, resource.fsPath);
        }
    };
    SimpleSearchService = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, editorService_1.IEditorService),
        __param(2, untitledEditorService_1.IUntitledEditorService)
    ], SimpleSearchService);
    exports.SimpleSearchService = SimpleSearchService;
    extensions_1.registerSingleton(search_1.ISearchService, SimpleSearchService, true);
    //#endregion
    //#region Storage
    class SimpleStorageService extends storage_1.InMemoryStorageService {
    }
    exports.SimpleStorageService = SimpleStorageService;
    extensions_1.registerSingleton(storage_1.IStorageService, SimpleStorageService);
    //#endregion
    //#region Telemetry
    class SimpleTelemetryService {
        publicLog(eventName, data) {
            return Promise.resolve(undefined);
        }
        getTelemetryInfo() {
            return Promise.resolve({
                instanceId: 'someValue.instanceId',
                sessionId: 'someValue.sessionId',
                machineId: 'someValue.machineId'
            });
        }
    }
    exports.SimpleTelemetryService = SimpleTelemetryService;
    extensions_1.registerSingleton(telemetry_1.ITelemetryService, SimpleTelemetryService);
    //#endregion
    //#region Textmate
    class SimpleTextMateService {
        constructor() {
            this.onDidEncounterLanguage = event_1.Event.None;
        }
        createGrammar(modeId) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleTextMateService = SimpleTextMateService;
    extensions_1.registerSingleton(textMateService_1.ITextMateService, SimpleTextMateService, true);
    //#endregion
    //#region Text Resource Properties
    class SimpleTextResourcePropertiesService extends simpleServices_1.SimpleResourcePropertiesService {
    }
    exports.SimpleTextResourcePropertiesService = SimpleTextResourcePropertiesService;
    extensions_1.registerSingleton(resourceConfiguration_1.ITextResourcePropertiesService, SimpleTextResourcePropertiesService);
    //#endregion
    //#region Update
    class SimpleUpdateService {
        constructor() {
            this.onStateChange = event_1.Event.None;
        }
        checkForUpdates(context) {
            return Promise.resolve(undefined);
        }
        downloadUpdate() {
            return Promise.resolve(undefined);
        }
        applyUpdate() {
            return Promise.resolve(undefined);
        }
        quitAndInstall() {
            return Promise.resolve(undefined);
        }
        isLatestVersion() {
            return Promise.resolve(true);
        }
    }
    exports.SimpleUpdateService = SimpleUpdateService;
    extensions_1.registerSingleton(update_1.IUpdateService, SimpleUpdateService);
    //#endregion
    //#region URL
    class SimpleURLService {
        open(url) {
            return Promise.resolve(false);
        }
        registerHandler(handler) {
            return lifecycle_2.Disposable.None;
        }
    }
    exports.SimpleURLService = SimpleURLService;
    extensions_1.registerSingleton(url_1.IURLService, SimpleURLService);
    //#endregion
    //#region Window
    class SimpleWindowConfiguration {
    }
    exports.SimpleWindowConfiguration = SimpleWindowConfiguration;
    class SimpleWindowService {
        constructor() {
            this.onDidChangeFocus = event_1.Event.None;
            this.onDidChangeMaximize = event_1.Event.None;
            this.hasFocus = true;
            this.configuration = new SimpleWindowConfiguration();
        }
        isFocused() {
            return Promise.resolve(false);
        }
        isMaximized() {
            return Promise.resolve(false);
        }
        getConfiguration() {
            return this.configuration;
        }
        getCurrentWindowId() {
            return 0;
        }
        pickFileFolderAndOpen(_options) {
            return Promise.resolve();
        }
        pickFileAndOpen(_options) {
            return Promise.resolve();
        }
        pickFolderAndOpen(_options) {
            return Promise.resolve();
        }
        pickWorkspaceAndOpen(_options) {
            return Promise.resolve();
        }
        reloadWindow() {
            return Promise.resolve();
        }
        openDevTools() {
            return Promise.resolve();
        }
        toggleDevTools() {
            return Promise.resolve();
        }
        closeWorkspace() {
            return Promise.resolve();
        }
        enterWorkspace(_path) {
            return Promise.resolve(undefined);
        }
        toggleFullScreen() {
            return Promise.resolve();
        }
        setRepresentedFilename(_fileName) {
            return Promise.resolve();
        }
        getRecentlyOpened() {
            return Promise.resolve({
                workspaces: [],
                files: []
            });
        }
        focusWindow() {
            return Promise.resolve();
        }
        maximizeWindow() {
            return Promise.resolve();
        }
        unmaximizeWindow() {
            return Promise.resolve();
        }
        minimizeWindow() {
            return Promise.resolve();
        }
        openWindow(_uris, _options) {
            return Promise.resolve();
        }
        closeWindow() {
            return Promise.resolve();
        }
        setDocumentEdited(_flag) {
            return Promise.resolve();
        }
        onWindowTitleDoubleClick() {
            return Promise.resolve();
        }
        show() {
            return Promise.resolve();
        }
        showMessageBox(_options) {
            return Promise.resolve({ button: 0 });
        }
        showSaveDialog(_options) {
            throw new Error('not implemented');
        }
        showOpenDialog(_options) {
            throw new Error('not implemented');
        }
        updateTouchBar(_items) {
            return Promise.resolve();
        }
        resolveProxy(url) {
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleWindowService = SimpleWindowService;
    extensions_1.registerSingleton(windows_1.IWindowService, SimpleWindowService);
    //#endregion
    //#region Window
    class SimpleWindowsService {
        constructor() {
            this.windowCount = 1;
            this.onWindowOpen = event_1.Event.None;
            this.onWindowFocus = event_1.Event.None;
            this.onWindowBlur = event_1.Event.None;
            this.onWindowMaximize = event_1.Event.None;
            this.onWindowUnmaximize = event_1.Event.None;
            this.onRecentlyOpenedChange = event_1.Event.None;
        }
        isFocused(_windowId) {
            return Promise.resolve(false);
        }
        pickFileFolderAndOpen(_options) {
            return Promise.resolve();
        }
        pickFileAndOpen(_options) {
            return Promise.resolve();
        }
        pickFolderAndOpen(_options) {
            return Promise.resolve();
        }
        pickWorkspaceAndOpen(_options) {
            return Promise.resolve();
        }
        reloadWindow(_windowId) {
            return Promise.resolve();
        }
        openDevTools(_windowId) {
            return Promise.resolve();
        }
        toggleDevTools(_windowId) {
            return Promise.resolve();
        }
        closeWorkspace(_windowId) {
            return Promise.resolve();
        }
        enterWorkspace(_windowId, _path) {
            return Promise.resolve(undefined);
        }
        toggleFullScreen(_windowId) {
            return Promise.resolve();
        }
        setRepresentedFilename(_windowId, _fileName) {
            return Promise.resolve();
        }
        addRecentlyOpened(recents) {
            return Promise.resolve();
        }
        removeFromRecentlyOpened(_paths) {
            return Promise.resolve();
        }
        clearRecentlyOpened() {
            return Promise.resolve();
        }
        getRecentlyOpened(_windowId) {
            return Promise.resolve({
                workspaces: [],
                files: []
            });
        }
        focusWindow(_windowId) {
            return Promise.resolve();
        }
        closeWindow(_windowId) {
            return Promise.resolve();
        }
        isMaximized(_windowId) {
            return Promise.resolve(false);
        }
        maximizeWindow(_windowId) {
            return Promise.resolve();
        }
        minimizeWindow(_windowId) {
            return Promise.resolve();
        }
        unmaximizeWindow(_windowId) {
            return Promise.resolve();
        }
        onWindowTitleDoubleClick(_windowId) {
            return Promise.resolve();
        }
        setDocumentEdited(_windowId, _flag) {
            return Promise.resolve();
        }
        quit() {
            return Promise.resolve();
        }
        relaunch(_options) {
            return Promise.resolve();
        }
        whenSharedProcessReady() {
            return Promise.resolve();
        }
        toggleSharedProcess() {
            return Promise.resolve();
        }
        // Global methods
        openWindow(_windowId, _uris, _options) {
            return Promise.resolve();
        }
        openNewWindow() {
            return Promise.resolve();
        }
        showWindow(_windowId) {
            return Promise.resolve();
        }
        getWindows() {
            throw new Error('not implemented');
        }
        getWindowCount() {
            return Promise.resolve(this.windowCount);
        }
        log(_severity, ..._messages) {
            return Promise.resolve();
        }
        showItemInFolder(_path) {
            return Promise.resolve();
        }
        newWindowTab() {
            return Promise.resolve();
        }
        showPreviousWindowTab() {
            return Promise.resolve();
        }
        showNextWindowTab() {
            return Promise.resolve();
        }
        moveWindowTabToNewWindow() {
            return Promise.resolve();
        }
        mergeAllWindowTabs() {
            return Promise.resolve();
        }
        toggleWindowTabsBar() {
            return Promise.resolve();
        }
        updateTouchBar(_windowId, _items) {
            return Promise.resolve();
        }
        getActiveWindowId() {
            return Promise.resolve(undefined);
        }
        // This needs to be handled from browser process to prevent
        // foreground ordering issues on Windows
        openExternal(_url) {
            return Promise.resolve(true);
        }
        // TODO: this is a bit backwards
        startCrashReporter(_config) {
            return Promise.resolve();
        }
        showMessageBox(_windowId, _options) {
            throw new Error('not implemented');
        }
        showSaveDialog(_windowId, _options) {
            throw new Error('not implemented');
        }
        showOpenDialog(_windowId, _options) {
            throw new Error('not implemented');
        }
        openAboutDialog() {
            return Promise.resolve();
        }
        resolveProxy(windowId, url) {
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleWindowsService = SimpleWindowsService;
    extensions_1.registerSingleton(windows_1.IWindowsService, SimpleWindowsService);
    //#endregion
    //#region Workspace Editing
    class SimpleWorkspaceEditingService {
        addFolders(folders, donotNotifyError) {
            return Promise.resolve(undefined);
        }
        removeFolders(folders, donotNotifyError) {
            return Promise.resolve(undefined);
        }
        updateFolders(index, deleteCount, foldersToAdd, donotNotifyError) {
            return Promise.resolve(undefined);
        }
        enterWorkspace(path) {
            return Promise.resolve(undefined);
        }
        createAndEnterWorkspace(folders, path) {
            return Promise.resolve(undefined);
        }
        saveAndEnterWorkspace(path) {
            return Promise.resolve(undefined);
        }
        copyWorkspaceSettings(toWorkspace) {
            return Promise.resolve(undefined);
        }
        pickNewWorkspacePath() {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleWorkspaceEditingService = SimpleWorkspaceEditingService;
    extensions_1.registerSingleton(workspaceEditing_1.IWorkspaceEditingService, SimpleWorkspaceEditingService, true);
    //#endregion
    //#region Workspace
    class SimpleWorkspaceService {
        constructor() {
            this.onDidChangeWorkspaceName = event_1.Event.None;
            this.onDidChangeWorkspaceFolders = event_1.Event.None;
            this.onDidChangeWorkbenchState = event_1.Event.None;
            this.workspace = new workspace_1.Workspace(exports.workspaceResource.toString(), workspace_1.toWorkspaceFolders([{ path: exports.workspaceResource.fsPath }]));
        }
        getFolders() {
            return this.workspace ? this.workspace.folders : [];
        }
        getWorkbenchState() {
            if (this.workspace.configuration) {
                return 3 /* WORKSPACE */;
            }
            if (this.workspace.folders.length) {
                return 2 /* FOLDER */;
            }
            return 1 /* EMPTY */;
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        isInsideWorkspace(resource) {
            if (resource && this.workspace) {
                return resources_1.isEqualOrParent(resource, this.workspace.folders[0].uri);
            }
            return false;
        }
        isCurrentWorkspace(workspaceIdentifier) {
            return workspaces_1.isSingleFolderWorkspaceIdentifier(workspaceIdentifier) && resources_1.isEqual(this.workspace.folders[0].uri, workspaceIdentifier);
        }
    }
    exports.SimpleWorkspaceService = SimpleWorkspaceService;
    extensions_1.registerSingleton(workspace_1.IWorkspaceContextService, SimpleWorkspaceService);
    //#endregion
    //#region Workspaces
    class SimpleWorkspacesService {
        createUntitledWorkspace(folders) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        deleteUntitledWorkspace(workspace) {
            return Promise.resolve(undefined);
        }
        getWorkspaceIdentifier(workspacePath) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleWorkspacesService = SimpleWorkspacesService;
    extensions_1.registerSingleton(workspaces_1.IWorkspacesService, SimpleWorkspacesService);
});
//#endregion
//# sourceMappingURL=nodeless.simpleservices.js.map