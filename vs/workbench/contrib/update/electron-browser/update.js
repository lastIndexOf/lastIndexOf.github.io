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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/product/node/package", "vs/platform/product/node/product", "vs/base/common/uri", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/commands/common/commands", "vs/platform/storage/common/storage", "vs/platform/update/common/update", "semver", "vs/platform/environment/common/environment", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/windows/common/windows", "./releaseNotesEditor", "vs/base/common/platform", "vs/platform/configuration/common/configuration"], function (require, exports, nls, severity_1, actions_1, lifecycle_1, actionbar_1, package_1, product_1, uri_1, activity_1, instantiation_1, opener_1, commands_1, storage_1, update_1, semver, environment_1, notification_1, dialogs_1, windows_1, releaseNotesEditor_1, platform_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let releaseNotesManager = undefined;
    function showReleaseNotes(instantiationService, version) {
        if (!releaseNotesManager) {
            releaseNotesManager = instantiationService.createInstance(releaseNotesEditor_1.ReleaseNotesManager);
        }
        return instantiationService.invokeFunction(accessor => releaseNotesManager.show(accessor, version));
    }
    let OpenLatestReleaseNotesInBrowserAction = class OpenLatestReleaseNotesInBrowserAction extends actions_1.Action {
        constructor(openerService) {
            super('update.openLatestReleaseNotes', nls.localize('releaseNotes', "Release Notes"), undefined, true);
            this.openerService = openerService;
        }
        run() {
            if (product_1.default.releaseNotesUrl) {
                const uri = uri_1.URI.parse(product_1.default.releaseNotesUrl);
                return this.openerService.open(uri);
            }
            return Promise.resolve(false);
        }
    };
    OpenLatestReleaseNotesInBrowserAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], OpenLatestReleaseNotesInBrowserAction);
    exports.OpenLatestReleaseNotesInBrowserAction = OpenLatestReleaseNotesInBrowserAction;
    let AbstractShowReleaseNotesAction = class AbstractShowReleaseNotesAction extends actions_1.Action {
        constructor(id, label, version, instantiationService) {
            super(id, label, undefined, true);
            this.version = version;
            this.instantiationService = instantiationService;
        }
        run() {
            if (!this.enabled) {
                return Promise.resolve(false);
            }
            this.enabled = false;
            return showReleaseNotes(this.instantiationService, this.version)
                .then(undefined, () => {
                const action = this.instantiationService.createInstance(OpenLatestReleaseNotesInBrowserAction);
                return action.run().then(() => false);
            });
        }
    };
    AbstractShowReleaseNotesAction = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], AbstractShowReleaseNotesAction);
    exports.AbstractShowReleaseNotesAction = AbstractShowReleaseNotesAction;
    let ShowReleaseNotesAction = class ShowReleaseNotesAction extends AbstractShowReleaseNotesAction {
        constructor(version, instantiationService) {
            super('update.showReleaseNotes', nls.localize('releaseNotes', "Release Notes"), version, instantiationService);
        }
    };
    ShowReleaseNotesAction = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ShowReleaseNotesAction);
    exports.ShowReleaseNotesAction = ShowReleaseNotesAction;
    let ShowCurrentReleaseNotesAction = class ShowCurrentReleaseNotesAction extends AbstractShowReleaseNotesAction {
        constructor(id = ShowCurrentReleaseNotesAction.ID, label = ShowCurrentReleaseNotesAction.LABEL, instantiationService) {
            super(id, label, package_1.default.version, instantiationService);
        }
    };
    ShowCurrentReleaseNotesAction.ID = 'update.showCurrentReleaseNotes';
    ShowCurrentReleaseNotesAction.LABEL = nls.localize('showReleaseNotes', "Show Release Notes");
    ShowCurrentReleaseNotesAction = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], ShowCurrentReleaseNotesAction);
    exports.ShowCurrentReleaseNotesAction = ShowCurrentReleaseNotesAction;
    let ProductContribution = class ProductContribution {
        constructor(storageService, instantiationService, notificationService, environmentService, openerService, configurationService) {
            const lastVersion = storageService.get(ProductContribution.KEY, 0 /* GLOBAL */, '');
            const shouldShowReleaseNotes = configurationService.getValue('update.showReleaseNotes');
            // was there an update? if so, open release notes
            if (shouldShowReleaseNotes && !environmentService.skipReleaseNotes && product_1.default.releaseNotesUrl && lastVersion && package_1.default.version !== lastVersion) {
                showReleaseNotes(instantiationService, package_1.default.version)
                    .then(undefined, () => {
                    notificationService.prompt(severity_1.default.Info, nls.localize('read the release notes', "Welcome to {0} v{1}! Would you like to read the Release Notes?", product_1.default.nameLong, package_1.default.version), [{
                            label: nls.localize('releaseNotes', "Release Notes"),
                            run: () => {
                                const uri = uri_1.URI.parse(product_1.default.releaseNotesUrl);
                                openerService.open(uri);
                            }
                        }], { sticky: true });
                });
            }
            // should we show the new license?
            if (product_1.default.licenseUrl && lastVersion && semver.satisfies(lastVersion, '<1.0.0') && semver.satisfies(package_1.default.version, '>=1.0.0')) {
                notificationService.info(nls.localize('licenseChanged', "Our license terms have changed, please click [here]({0}) to go through them.", product_1.default.licenseUrl));
            }
            storageService.store(ProductContribution.KEY, package_1.default.version, 0 /* GLOBAL */);
        }
    };
    ProductContribution.KEY = 'releaseNotes/lastVersion';
    ProductContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, opener_1.IOpenerService),
        __param(5, configuration_1.IConfigurationService)
    ], ProductContribution);
    exports.ProductContribution = ProductContribution;
    let NeverShowAgain = class NeverShowAgain {
        constructor(key, storageService) {
            this.storageService = storageService;
            this.action = new actions_1.Action(`neverShowAgain:${this.key}`, nls.localize('neveragain', "Don't Show Again"), undefined, true, (notification) => {
                // Hide notification
                notification.close();
                this.storageService.store(this.key, true, 0 /* GLOBAL */);
                return Promise.resolve(true);
            });
            this.key = `neverShowAgain:${key}`;
        }
        shouldShow() {
            return !this.storageService.getBoolean(this.key, 0 /* GLOBAL */, false);
        }
    };
    NeverShowAgain = __decorate([
        __param(1, storage_1.IStorageService)
    ], NeverShowAgain);
    let Win3264BitContribution = class Win3264BitContribution {
        constructor(storageService, notificationService, environmentService) {
            if (environmentService.disableUpdates) {
                return;
            }
            const neverShowAgain = new NeverShowAgain(Win3264BitContribution.KEY, storageService);
            if (!neverShowAgain.shouldShow()) {
                return;
            }
            const url = product_1.default.quality === 'insider'
                ? Win3264BitContribution.INSIDER_URL
                : Win3264BitContribution.URL;
            const handle = notificationService.prompt(severity_1.default.Info, nls.localize('64bitisavailable', "{0} for 64-bit Windows is now available! Click [here]({1}) to learn more.", product_1.default.nameShort, url), [{
                    label: nls.localize('neveragain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        neverShowAgain.action.run(handle);
                        neverShowAgain.action.dispose();
                    }
                }], { sticky: true });
        }
    };
    Win3264BitContribution.KEY = 'update/win32-64bits';
    Win3264BitContribution.URL = 'https://code.visualstudio.com/updates/v1_15#_windows-64-bit';
    Win3264BitContribution.INSIDER_URL = 'https://github.com/Microsoft/vscode-docs/blob/vnext/release-notes/v1_15.md#windows-64-bit';
    Win3264BitContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, environment_1.IEnvironmentService)
    ], Win3264BitContribution);
    exports.Win3264BitContribution = Win3264BitContribution;
    let Linux32BitContribution = class Linux32BitContribution {
        constructor(storageService, notificationService, environmentService) {
            if (environmentService.disableUpdates) {
                return;
            }
            const neverShowAgain = new NeverShowAgain(Linux32BitContribution.KEY, storageService);
            if (!neverShowAgain.shouldShow()) {
                return;
            }
            const url = product_1.default.quality === 'insider'
                ? Linux32BitContribution.INSIDER_URL
                : Linux32BitContribution.URL;
            const handle = notificationService.prompt(severity_1.default.Info, nls.localize('linux64bits', "{0} for 32-bit Linux will soon be discontinued. Please update to the 64-bit version.", product_1.default.nameShort, url), [{
                    label: nls.localize('learnmore', "Learn More"),
                    run: () => {
                        window.open(url);
                    }
                },
                {
                    label: nls.localize('neveragain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        neverShowAgain.action.run(handle);
                        neverShowAgain.action.dispose();
                    }
                }], { sticky: true });
        }
    };
    Linux32BitContribution.KEY = 'update/linux32-64bits';
    Linux32BitContribution.URL = 'https://code.visualstudio.com/updates/v1_32#_linux-32-bit-support-ends-soon';
    Linux32BitContribution.INSIDER_URL = 'https://github.com/Microsoft/vscode-docs/blob/vnext/release-notes/v1_32.md#linux-32-bit-support-ends-soon';
    Linux32BitContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, environment_1.IEnvironmentService)
    ], Linux32BitContribution);
    exports.Linux32BitContribution = Linux32BitContribution;
    let CommandAction = class CommandAction extends actions_1.Action {
        constructor(commandId, label, commandService) {
            super(`command-action:${commandId}`, label, undefined, true, () => commandService.executeCommand(commandId));
        }
    };
    CommandAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CommandAction);
    let UpdateContribution = class UpdateContribution {
        constructor(storageService, commandService, instantiationService, notificationService, dialogService, updateService, activityService, windowService) {
            this.storageService = storageService;
            this.commandService = commandService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.updateService = updateService;
            this.activityService = activityService;
            this.windowService = windowService;
            this.badgeDisposable = lifecycle_1.Disposable.None;
            this.disposables = [];
            this.state = updateService.state;
            updateService.onStateChange(this.onUpdateStateChange, this, this.disposables);
            this.onUpdateStateChange(this.updateService.state);
            /*
            The `update/lastKnownVersion` and `update/updateNotificationTime` storage keys are used in
            combination to figure out when to show a message to the user that he should update.
    
            This message should appear if the user has received an update notification but hasn't
            updated since 5 days.
            */
            const currentVersion = product_1.default.commit;
            const lastKnownVersion = this.storageService.get('update/lastKnownVersion', 0 /* GLOBAL */);
            // if current version != stored version, clear both fields
            if (currentVersion !== lastKnownVersion) {
                this.storageService.remove('update/lastKnownVersion', 0 /* GLOBAL */);
                this.storageService.remove('update/updateNotificationTime', 0 /* GLOBAL */);
            }
        }
        get id() { return 'vs.update'; }
        get name() { return nls.localize('manage', "Manage"); }
        get cssClass() { return 'update-activity'; }
        onUpdateStateChange(state) {
            switch (state.type) {
                case "idle" /* Idle */:
                    if (state.error) {
                        this.onError(state.error);
                    }
                    else if (this.state.type === "checking for updates" /* CheckingForUpdates */ && this.state.context && this.state.context.windowId === this.windowService.getCurrentWindowId()) {
                        this.onUpdateNotAvailable();
                    }
                    break;
                case "available for download" /* AvailableForDownload */:
                    this.onUpdateAvailable(state.update);
                    break;
                case "downloaded" /* Downloaded */:
                    this.onUpdateDownloaded(state.update);
                    break;
                case "updating" /* Updating */:
                    this.onUpdateUpdating(state.update);
                    break;
                case "ready" /* Ready */:
                    this.onUpdateReady(state.update);
                    break;
            }
            let badge = undefined;
            let clazz;
            if (state.type === "available for download" /* AvailableForDownload */ || state.type === "downloaded" /* Downloaded */ || state.type === "ready" /* Ready */) {
                badge = new activity_1.NumberBadge(1, () => nls.localize('updateIsReady', "New {0} update available.", product_1.default.nameShort));
            }
            else if (state.type === "checking for updates" /* CheckingForUpdates */ || state.type === "downloading" /* Downloading */ || state.type === "updating" /* Updating */) {
                badge = new activity_1.ProgressBadge(() => nls.localize('updateIsReady', "New {0} update available.", product_1.default.nameShort));
                clazz = 'progress-badge';
            }
            this.badgeDisposable.dispose();
            if (badge) {
                this.badgeDisposable = this.activityService.showActivity(this.id, badge, clazz);
            }
            this.state = state;
        }
        onError(error) {
            error = error.replace(/See https:\/\/github\.com\/Squirrel\/Squirrel\.Mac\/issues\/182 for more information/, 'See [this link](https://github.com/Microsoft/vscode/issues/7426#issuecomment-425093469) for more information');
            this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: error,
                source: nls.localize('update service', "Update Service"),
            });
        }
        onUpdateNotAvailable() {
            this.dialogService.show(severity_1.default.Info, nls.localize('noUpdatesAvailable', "There are currently no updates available."), [nls.localize('ok', "OK")]);
        }
        // linux
        onUpdateAvailable(update) {
            if (!this.shouldShowNotification()) {
                return;
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('thereIsUpdateAvailable', "There is an available update."), [{
                    label: nls.localize('download now', "Download Now"),
                    run: () => this.updateService.downloadUpdate()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }, {
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                }], { sticky: true });
        }
        // windows fast updates (target === system)
        onUpdateDownloaded(update) {
            if (!this.shouldShowNotification()) {
                return;
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateAvailable', "There's an update available: {0} {1}", product_1.default.nameLong, update.productVersion), [{
                    label: nls.localize('installUpdate', "Install Update"),
                    run: () => this.updateService.applyUpdate()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }, {
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                }], { sticky: true });
        }
        // windows fast updates
        onUpdateUpdating(update) {
            if (platform_1.isWindows && product_1.default.target === 'user') {
                return;
            }
            // windows fast updates (target === system)
            const neverShowAgain = new NeverShowAgain('update/win32-fast-updates', this.storageService);
            if (!neverShowAgain.shouldShow()) {
                return;
            }
            const handle = this.notificationService.prompt(severity_1.default.Info, nls.localize('updateInstalling', "{0} {1} is being installed in the background; we'll let you know when it's done.", product_1.default.nameLong, update.productVersion), [{
                    label: nls.localize('neveragain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        neverShowAgain.action.run(handle);
                        neverShowAgain.action.dispose();
                    }
                }]);
        }
        // windows and mac
        onUpdateReady(update) {
            if (!(platform_1.isWindows && product_1.default.target !== 'user') && !this.shouldShowNotification()) {
                return;
            }
            const actions = [{
                    label: nls.localize('updateNow', "Update Now"),
                    run: () => this.updateService.quitAndInstall()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }];
            // TODO@joao check why snap updates send `update` as falsy
            if (update.productVersion) {
                actions.push({
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                });
            }
            // windows user fast updates and mac
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateAvailableAfterRestart', "Restart {0} to apply the latest update.", product_1.default.nameLong), actions, { sticky: true });
        }
        shouldShowNotification() {
            const currentVersion = product_1.default.commit;
            const currentMillis = new Date().getTime();
            const lastKnownVersion = this.storageService.get('update/lastKnownVersion', 0 /* GLOBAL */);
            // if version != stored version, save version and date
            if (currentVersion !== lastKnownVersion) {
                this.storageService.store('update/lastKnownVersion', currentVersion, 0 /* GLOBAL */);
                this.storageService.store('update/updateNotificationTime', currentMillis, 0 /* GLOBAL */);
            }
            const updateNotificationMillis = this.storageService.getNumber('update/updateNotificationTime', 0 /* GLOBAL */, currentMillis);
            const diffDays = (currentMillis - updateNotificationMillis) / (1000 * 60 * 60 * 24);
            return diffDays > 5;
        }
        getActions() {
            const result = [
                new CommandAction(UpdateContribution.showCommandsId, nls.localize('commandPalette', "Command Palette..."), this.commandService),
                new actionbar_1.Separator(),
                new CommandAction(UpdateContribution.openSettingsId, nls.localize('settings', "Settings"), this.commandService),
                new CommandAction(UpdateContribution.showExtensionsId, nls.localize('showExtensions', "Extensions"), this.commandService),
                new CommandAction(UpdateContribution.openKeybindingsId, nls.localize('keyboardShortcuts', "Keyboard Shortcuts"), this.commandService),
                new actionbar_1.Separator(),
                new CommandAction(UpdateContribution.openUserSnippets, nls.localize('userSnippets', "User Snippets"), this.commandService),
                new actionbar_1.Separator(),
                new CommandAction(UpdateContribution.selectColorThemeId, nls.localize('selectTheme.label', "Color Theme"), this.commandService),
                new CommandAction(UpdateContribution.selectIconThemeId, nls.localize('themes.selectIconTheme.label', "File Icon Theme"), this.commandService)
            ];
            const updateAction = this.getUpdateAction();
            if (updateAction) {
                result.push(new actionbar_1.Separator(), updateAction);
            }
            return result;
        }
        getUpdateAction() {
            const state = this.updateService.state;
            switch (state.type) {
                case "uninitialized" /* Uninitialized */:
                    return null;
                case "idle" /* Idle */:
                    const windowId = this.windowService.getCurrentWindowId();
                    return new actions_1.Action('update.check', nls.localize('checkForUpdates', "Check for Updates..."), undefined, true, () => this.updateService.checkForUpdates({ windowId }));
                case "checking for updates" /* CheckingForUpdates */:
                    return new actions_1.Action('update.checking', nls.localize('checkingForUpdates', "Checking For Updates..."), undefined, false);
                case "available for download" /* AvailableForDownload */:
                    return new actions_1.Action('update.downloadNow', nls.localize('download now', "Download Now"), undefined, true, () => this.updateService.downloadUpdate());
                case "downloading" /* Downloading */:
                    return new actions_1.Action('update.downloading', nls.localize('DownloadingUpdate', "Downloading Update..."), undefined, false);
                case "downloaded" /* Downloaded */:
                    return new actions_1.Action('update.install', nls.localize('installUpdate...', "Install Update..."), undefined, true, () => this.updateService.applyUpdate());
                case "updating" /* Updating */:
                    return new actions_1.Action('update.updating', nls.localize('installingUpdate', "Installing Update..."), undefined, false);
                case "ready" /* Ready */:
                    return new actions_1.Action('update.restart', nls.localize('restartToUpdate', "Restart to Update"), undefined, true, () => this.updateService.quitAndInstall());
            }
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    UpdateContribution.showCommandsId = 'workbench.action.showCommands';
    UpdateContribution.openSettingsId = 'workbench.action.openSettings';
    UpdateContribution.openKeybindingsId = 'workbench.action.openGlobalKeybindings';
    UpdateContribution.openUserSnippets = 'workbench.action.openSnippets';
    UpdateContribution.selectColorThemeId = 'workbench.action.selectTheme';
    UpdateContribution.selectIconThemeId = 'workbench.action.selectIconTheme';
    UpdateContribution.showExtensionsId = 'workbench.view.extensions';
    UpdateContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, commands_1.ICommandService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, update_1.IUpdateService),
        __param(6, activity_1.IActivityService),
        __param(7, windows_1.IWindowService)
    ], UpdateContribution);
    exports.UpdateContribution = UpdateContribution;
});
//# sourceMappingURL=update.js.map