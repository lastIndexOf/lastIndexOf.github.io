/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/common/actions", "vs/workbench/contrib/extensions/electron-browser/extensionTipsService", "vs/workbench/common/contributions", "vs/workbench/contrib/output/common/output", "vs/platform/instantiation/common/descriptors", "../common/extensions", "vs/workbench/contrib/extensions/node/extensionsWorkbenchService", "vs/workbench/contrib/extensions/electron-browser/extensionsActions", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/workbench/browser/viewlet", "vs/workbench/contrib/extensions/electron-browser/extensionEditor", "vs/workbench/contrib/extensions/electron-browser/extensionsViewlet", "vs/workbench/browser/quickopen", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensionsUtils", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/browser/extensionsQuickOpen", "vs/workbench/browser/editor", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsEditor", "vs/workbench/common/editor", "vs/workbench/contrib/extensions/electron-browser/extensionProfileService", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsInput", "vs/base/common/uri", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/extensions/electron-browser/extensionsActivationProgress", "vs/workbench/contrib/extensions/electron-browser/extensionsAutoProfiler", "vs/css!./media/extensions"], function (require, exports, nls_1, keyCodes_1, platform_1, actions_1, extensions_1, extensionManagement_1, actions_2, extensionTipsService_1, contributions_1, output_1, descriptors_1, extensions_2, extensionsWorkbenchService_1, extensionsActions_1, extensionsInput_1, viewlet_1, extensionEditor_1, extensionsViewlet_1, quickopen_1, configurationRegistry_1, jsonContributionRegistry, extensionsFileTemplate_1, commands_1, instantiation_1, extensionsUtils_1, extensionManagementUtil_1, extensionsQuickOpen_1, editor_1, runtimeExtensionsEditor_1, editor_2, extensionProfileService_1, runtimeExtensionsInput_1, uri_1, contextkey_1, extensionsActivationProgress_1, extensionsAutoProfiler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Singletons
    extensions_1.registerSingleton(extensions_2.IExtensionsWorkbenchService, extensionsWorkbenchService_1.ExtensionsWorkbenchService);
    extensions_1.registerSingleton(extensionManagement_1.IExtensionTipsService, extensionTipsService_1.ExtensionTipsService);
    extensions_1.registerSingleton(runtimeExtensionsEditor_1.IExtensionHostProfileService, extensionProfileService_1.ExtensionHostProfileService, true);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.StatusUpdater, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.MaliciousExtensionChecker, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsActions_1.ConfigureRecommendedExtensionsCommandsContributor, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsUtils_1.KeymapExtensions, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.ExtensionsViewletViewsContribution, 1 /* Starting */);
    workbenchRegistry.registerWorkbenchContribution(extensionsActivationProgress_1.ExtensionActivationProgress, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsAutoProfiler_1.ExtensionsAutoProfiler, 4 /* Eventually */);
    platform_1.Registry.as(output_1.Extensions.OutputChannels)
        .registerChannel({ id: extensionManagement_1.ExtensionsChannelId, label: extensionManagement_1.ExtensionsLabel, log: false });
    // Quickopen
    platform_1.Registry.as(quickopen_1.Extensions.Quickopen).registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(extensionsQuickOpen_1.ExtensionsHandler, extensionsQuickOpen_1.ExtensionsHandler.ID, 'ext ', undefined, nls_1.localize('extensionsCommands', "Manage Extensions"), true));
    platform_1.Registry.as(quickopen_1.Extensions.Quickopen).registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(extensionsQuickOpen_1.GalleryExtensionsHandler, extensionsQuickOpen_1.GalleryExtensionsHandler.ID, 'ext install ', undefined, nls_1.localize('galleryExtensionsCommands', "Install Gallery Extensions"), true));
    // Editor
    const editorDescriptor = new editor_1.EditorDescriptor(extensionEditor_1.ExtensionEditor, extensionEditor_1.ExtensionEditor.ID, nls_1.localize('extension', "Extension"));
    platform_1.Registry.as(editor_1.Extensions.Editors)
        .registerEditor(editorDescriptor, [new descriptors_1.SyncDescriptor(extensionsInput_1.ExtensionsInput)]);
    // Running Extensions Editor
    const runtimeExtensionsEditorDescriptor = new editor_1.EditorDescriptor(runtimeExtensionsEditor_1.RuntimeExtensionsEditor, runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID, nls_1.localize('runtimeExtension', "Running Extensions"));
    platform_1.Registry.as(editor_1.Extensions.Editors)
        .registerEditor(runtimeExtensionsEditorDescriptor, [new descriptors_1.SyncDescriptor(runtimeExtensionsInput_1.RuntimeExtensionsInput)]);
    class RuntimeExtensionsInputFactory {
        serialize(editorInput) {
            return '';
        }
        deserialize(instantiationService, serializedEditorInput) {
            return new runtimeExtensionsInput_1.RuntimeExtensionsInput();
        }
    }
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(runtimeExtensionsInput_1.RuntimeExtensionsInput.ID, RuntimeExtensionsInputFactory);
    // Viewlet
    const viewletDescriptor = new viewlet_1.ViewletDescriptor(extensionsViewlet_1.ExtensionsViewlet, extensions_2.VIEWLET_ID, nls_1.localize('extensions', "Extensions"), 'extensions', 4);
    platform_1.Registry.as(viewlet_1.Extensions.Viewlets)
        .registerViewlet(viewletDescriptor);
    // Global actions
    const actionRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    const openViewletActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.OpenExtensionsViewletAction, extensionsActions_1.OpenExtensionsViewletAction.ID, extensionsActions_1.OpenExtensionsViewletAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 54 /* KEY_X */ });
    actionRegistry.registerWorkbenchAction(openViewletActionDescriptor, 'View: Show Extensions', nls_1.localize('view', "View"));
    const installActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.InstallExtensionsAction, extensionsActions_1.InstallExtensionsAction.ID, extensionsActions_1.InstallExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(installActionDescriptor, 'Extensions: Install Extensions', extensionManagement_1.ExtensionsLabel);
    const listOutdatedActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowOutdatedExtensionsAction, extensionsActions_1.ShowOutdatedExtensionsAction.ID, extensionsActions_1.ShowOutdatedExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(listOutdatedActionDescriptor, 'Extensions: Show Outdated Extensions', extensionManagement_1.ExtensionsLabel);
    const recommendationsActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowRecommendedExtensionsAction, extensionsActions_1.ShowRecommendedExtensionsAction.ID, extensionsActions_1.ShowRecommendedExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(recommendationsActionDescriptor, 'Extensions: Show Recommended Extensions', extensionManagement_1.ExtensionsLabel);
    const keymapRecommendationsActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowRecommendedKeymapExtensionsAction, extensionsActions_1.ShowRecommendedKeymapExtensionsAction.ID, extensionsActions_1.ShowRecommendedKeymapExtensionsAction.SHORT_LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 43 /* KEY_M */) });
    actionRegistry.registerWorkbenchAction(keymapRecommendationsActionDescriptor, 'Preferences: Keymaps', extensionManagement_1.PreferencesLabel);
    const languageExtensionsActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowLanguageExtensionsAction, extensionsActions_1.ShowLanguageExtensionsAction.ID, extensionsActions_1.ShowLanguageExtensionsAction.SHORT_LABEL);
    actionRegistry.registerWorkbenchAction(languageExtensionsActionDescriptor, 'Preferences: Language Extensions', extensionManagement_1.PreferencesLabel);
    const azureExtensionsActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowAzureExtensionsAction, extensionsActions_1.ShowAzureExtensionsAction.ID, extensionsActions_1.ShowAzureExtensionsAction.SHORT_LABEL);
    actionRegistry.registerWorkbenchAction(azureExtensionsActionDescriptor, 'Preferences: Azure Extensions', extensionManagement_1.PreferencesLabel);
    const popularActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowPopularExtensionsAction, extensionsActions_1.ShowPopularExtensionsAction.ID, extensionsActions_1.ShowPopularExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(popularActionDescriptor, 'Extensions: Show Popular Extensions', extensionManagement_1.ExtensionsLabel);
    const enabledActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowEnabledExtensionsAction, extensionsActions_1.ShowEnabledExtensionsAction.ID, extensionsActions_1.ShowEnabledExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(enabledActionDescriptor, 'Extensions: Show Enabled Extensions', extensionManagement_1.ExtensionsLabel);
    const installedActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowInstalledExtensionsAction, extensionsActions_1.ShowInstalledExtensionsAction.ID, extensionsActions_1.ShowInstalledExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(installedActionDescriptor, 'Extensions: Show Installed Extensions', extensionManagement_1.ExtensionsLabel);
    const disabledActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowDisabledExtensionsAction, extensionsActions_1.ShowDisabledExtensionsAction.ID, extensionsActions_1.ShowDisabledExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(disabledActionDescriptor, 'Extensions: Show Disabled Extensions', extensionManagement_1.ExtensionsLabel);
    const builtinActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowBuiltInExtensionsAction, extensionsActions_1.ShowBuiltInExtensionsAction.ID, extensionsActions_1.ShowBuiltInExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(builtinActionDescriptor, 'Extensions: Show Built-in Extensions', extensionManagement_1.ExtensionsLabel);
    const updateAllActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.UpdateAllAction, extensionsActions_1.UpdateAllAction.ID, extensionsActions_1.UpdateAllAction.LABEL);
    actionRegistry.registerWorkbenchAction(updateAllActionDescriptor, 'Extensions: Update All Extensions', extensionManagement_1.ExtensionsLabel);
    const openExtensionsFolderActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.OpenExtensionsFolderAction, extensionsActions_1.OpenExtensionsFolderAction.ID, extensionsActions_1.OpenExtensionsFolderAction.LABEL);
    actionRegistry.registerWorkbenchAction(openExtensionsFolderActionDescriptor, 'Extensions: Open Extensions Folder', extensionManagement_1.ExtensionsLabel);
    const installVSIXActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.InstallVSIXAction, extensionsActions_1.InstallVSIXAction.ID, extensionsActions_1.InstallVSIXAction.LABEL);
    actionRegistry.registerWorkbenchAction(installVSIXActionDescriptor, 'Extensions: Install from VSIX...', extensionManagement_1.ExtensionsLabel);
    const disableAllAction = new actions_1.SyncActionDescriptor(extensionsActions_1.DisableAllAction, extensionsActions_1.DisableAllAction.ID, extensionsActions_1.DisableAllAction.LABEL);
    actionRegistry.registerWorkbenchAction(disableAllAction, 'Extensions: Disable All Installed Extensions', extensionManagement_1.ExtensionsLabel);
    const disableAllWorkspaceAction = new actions_1.SyncActionDescriptor(extensionsActions_1.DisableAllWorkpsaceAction, extensionsActions_1.DisableAllWorkpsaceAction.ID, extensionsActions_1.DisableAllWorkpsaceAction.LABEL);
    actionRegistry.registerWorkbenchAction(disableAllWorkspaceAction, 'Extensions: Disable All Installed Extensions for this Workspace', extensionManagement_1.ExtensionsLabel);
    const enableAllAction = new actions_1.SyncActionDescriptor(extensionsActions_1.EnableAllAction, extensionsActions_1.EnableAllAction.ID, extensionsActions_1.EnableAllAction.LABEL);
    actionRegistry.registerWorkbenchAction(enableAllAction, 'Extensions: Enable All Installed Extensions', extensionManagement_1.ExtensionsLabel);
    const enableAllWorkspaceAction = new actions_1.SyncActionDescriptor(extensionsActions_1.EnableAllWorkpsaceAction, extensionsActions_1.EnableAllWorkpsaceAction.ID, extensionsActions_1.EnableAllWorkpsaceAction.LABEL);
    actionRegistry.registerWorkbenchAction(enableAllWorkspaceAction, 'Extensions: Enable All Installed Extensions for this Workspace', extensionManagement_1.ExtensionsLabel);
    const checkForUpdatesAction = new actions_1.SyncActionDescriptor(extensionsActions_1.CheckForUpdatesAction, extensionsActions_1.CheckForUpdatesAction.ID, extensionsActions_1.CheckForUpdatesAction.LABEL);
    actionRegistry.registerWorkbenchAction(checkForUpdatesAction, `Extensions: Check for Updates`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(extensionsActions_1.EnableAutoUpdateAction, extensionsActions_1.EnableAutoUpdateAction.ID, extensionsActions_1.EnableAutoUpdateAction.LABEL), `Extensions: Enable Auto Updating Extensions`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(extensionsActions_1.DisableAutoUpdateAction, extensionsActions_1.DisableAutoUpdateAction.ID, extensionsActions_1.DisableAutoUpdateAction.LABEL), `Extensions: Disable Auto Updating Extensions`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(extensionsActions_1.InstallSpecificVersionOfExtensionAction, extensionsActions_1.InstallSpecificVersionOfExtensionAction.ID, extensionsActions_1.InstallSpecificVersionOfExtensionAction.LABEL), 'Install Specific Version of Extension...', extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(runtimeExtensionsEditor_1.ShowRuntimeExtensionsAction, runtimeExtensionsEditor_1.ShowRuntimeExtensionsAction.ID, runtimeExtensionsEditor_1.ShowRuntimeExtensionsAction.LABEL), 'Show Running Extensions', nls_1.localize('developer', "Developer"));
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(extensionsActions_1.ReinstallAction, extensionsActions_1.ReinstallAction.ID, extensionsActions_1.ReinstallAction.LABEL), 'Reinstall Extension...', nls_1.localize('developer', "Developer"));
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'extensions',
        order: 30,
        title: nls_1.localize('extensionsConfigurationTitle', "Extensions"),
        type: 'object',
        properties: {
            'extensions.autoUpdate': {
                type: 'boolean',
                description: nls_1.localize('extensionsAutoUpdate', "When enabled, automatically installs updates for extensions. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.autoCheckUpdates': {
                type: 'boolean',
                description: nls_1.localize('extensionsCheckUpdates', "When enabled, automatically checks extensions for updates. If an extension has an update, it is marked as outdated in the Extensions view. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.ignoreRecommendations': {
                type: 'boolean',
                description: nls_1.localize('extensionsIgnoreRecommendations', "When enabled, the notifications for extension recommendations will not be shown."),
                default: false
            },
            'extensions.showRecommendationsOnlyOnDemand': {
                type: 'boolean',
                description: nls_1.localize('extensionsShowRecommendationsOnlyOnDemand', "When enabled, recommendations will not be fetched or shown unless specifically requested by the user. Some recommendations are fetched from a Microsoft online service."),
                default: false,
                tags: ['usesOnlineServices']
            },
            'extensions.closeExtensionDetailsOnViewChange': {
                type: 'boolean',
                description: nls_1.localize('extensionsCloseExtensionDetailsOnViewChange', "When enabled, editors with extension details will be automatically closed upon navigating away from the Extensions View."),
                default: false
            }
        }
    });
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(extensionsFileTemplate_1.ExtensionsConfigurationSchemaId, extensionsFileTemplate_1.ExtensionsConfigurationSchema);
    // Register Commands
    commands_1.CommandsRegistry.registerCommand('_extensions.manage', (accessor, extensionId) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        const extension = extensionService.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id: extensionId }));
        if (extension.length === 1) {
            extensionService.open(extension[0]);
        }
    });
    commands_1.CommandsRegistry.registerCommand('extension.open', (accessor, extensionId) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        return extensionService.queryGallery({ names: [extensionId], pageSize: 1 }).then(pager => {
            if (pager.total !== 1) {
                return;
            }
            extensionService.open(pager.firstPage[0]);
        });
    });
    commands_1.CommandsRegistry.registerCommand(runtimeExtensionsEditor_1.DebugExtensionHostAction.ID, (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        instantiationService.createInstance(runtimeExtensionsEditor_1.DebugExtensionHostAction).run();
    });
    commands_1.CommandsRegistry.registerCommand(runtimeExtensionsEditor_1.StartExtensionHostProfileAction.ID, (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        instantiationService.createInstance(runtimeExtensionsEditor_1.StartExtensionHostProfileAction, runtimeExtensionsEditor_1.StartExtensionHostProfileAction.ID, runtimeExtensionsEditor_1.StartExtensionHostProfileAction.LABEL).run();
    });
    commands_1.CommandsRegistry.registerCommand(runtimeExtensionsEditor_1.StopExtensionHostProfileAction.ID, (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        instantiationService.createInstance(runtimeExtensionsEditor_1.StopExtensionHostProfileAction, runtimeExtensionsEditor_1.StopExtensionHostProfileAction.ID, runtimeExtensionsEditor_1.StopExtensionHostProfileAction.LABEL).run();
    });
    commands_1.CommandsRegistry.registerCommand(runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.ID, (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        instantiationService.createInstance(runtimeExtensionsEditor_1.SaveExtensionHostProfileAction, runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.ID, runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.LABEL).run();
    });
    // File menu registration
    actions_1.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '2_keybindings',
        command: {
            id: extensionsActions_1.ShowRecommendedKeymapExtensionsAction.ID,
            title: nls_1.localize({ key: 'miOpenKeymapExtensions', comment: ['&& denotes a mnemonic'] }, "&&Keymaps")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '1_settings',
        command: {
            id: extensions_2.VIEWLET_ID,
            title: nls_1.localize({ key: 'miPreferencesExtensions', comment: ['&& denotes a mnemonic'] }, "&&Extensions")
        },
        order: 2
    });
    // View menu
    actions_1.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '3_views',
        command: {
            id: extensions_2.VIEWLET_ID,
            title: nls_1.localize({ key: 'miViewExtensions', comment: ['&& denotes a mnemonic'] }, "E&&xtensions")
        },
        order: 5
    });
    // Running extensions
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: runtimeExtensionsEditor_1.DebugExtensionHostAction.ID,
            title: runtimeExtensionsEditor_1.DebugExtensionHostAction.LABEL,
            iconLocation: {
                dark: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/extensions/electron-browser/media/start-inverse.svg`)),
                light: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/extensions/electron-browser/media/start.svg`)),
            }
        },
        group: 'navigation',
        when: editor_2.ActiveEditorContext.isEqualTo(runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID)
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: runtimeExtensionsEditor_1.StartExtensionHostProfileAction.ID,
            title: runtimeExtensionsEditor_1.StartExtensionHostProfileAction.LABEL,
            iconLocation: {
                dark: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/extensions/electron-browser/media/profile-start-inverse.svg`)),
                light: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/extensions/electron-browser/media/profile-start.svg`)),
            }
        },
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(editor_2.ActiveEditorContext.isEqualTo(runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID), runtimeExtensionsEditor_1.CONTEXT_PROFILE_SESSION_STATE.notEqualsTo('running'))
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: runtimeExtensionsEditor_1.StopExtensionHostProfileAction.ID,
            title: runtimeExtensionsEditor_1.StopExtensionHostProfileAction.LABEL,
            iconLocation: {
                dark: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/extensions/electron-browser/media/profile-stop-inverse.svg`)),
                light: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/extensions/electron-browser/media/profile-stop.svg`)),
            }
        },
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(editor_2.ActiveEditorContext.isEqualTo(runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID), runtimeExtensionsEditor_1.CONTEXT_PROFILE_SESSION_STATE.isEqualTo('running'))
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.ID,
            title: runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.LABEL,
            iconLocation: {
                dark: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/extensions/electron-browser/media/save-inverse.svg`)),
                light: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/extensions/electron-browser/media/save.svg`)),
            },
            precondition: runtimeExtensionsEditor_1.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED
        },
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(editor_2.ActiveEditorContext.isEqualTo(runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID))
    });
});
//# sourceMappingURL=extensions.contribution.js.map