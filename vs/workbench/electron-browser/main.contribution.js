/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "os", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/actions", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/workbench/electron-browser/actions/helpActions", "vs/workbench/electron-browser/actions/developerActions", "vs/workbench/electron-browser/actions/windowActions", "vs/workbench/browser/actions/workspaceActions", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/quickopen/quickopen", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/common/contextkeys", "vs/workbench/common/editor", "vs/platform/windows/common/windows", "vs/platform/storage/node/storageService"], function (require, exports, platform_1, nls, os, actions_1, configurationRegistry_1, actions_2, keyCodes_1, platform_2, helpActions_1, developerActions_1, windowActions_1, workspaceActions_1, contextkey_1, quickopen_1, keybindingsRegistry_1, commands_1, instantiation_1, workspaceCommands_1, contextkeys_1, editor_1, windows_1, storageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Actions
    (function registerActions() {
        const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
        // Actions: File
        (function registerFileActions() {
            const fileCategory = nls.localize('file', "File");
            if (platform_2.isMacintosh) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.OpenFileFolderAction, workspaceActions_1.OpenFileFolderAction.ID, workspaceActions_1.OpenFileFolderAction.LABEL, { primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */ }), 'File: Open...', fileCategory);
            }
            else {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.OpenFileAction, workspaceActions_1.OpenFileAction.ID, workspaceActions_1.OpenFileAction.LABEL, { primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */ }), 'File: Open File...', fileCategory);
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.OpenFolderAction, workspaceActions_1.OpenFolderAction.ID, workspaceActions_1.OpenFolderAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 45 /* KEY_O */) }), 'File: Open Folder...', fileCategory);
            }
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.QuickOpenRecentAction, windowActions_1.QuickOpenRecentAction.ID, windowActions_1.QuickOpenRecentAction.LABEL), 'File: Quick Open Recent...', fileCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.OpenRecentAction, windowActions_1.OpenRecentAction.ID, windowActions_1.OpenRecentAction.LABEL, { primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */, mac: { primary: 256 /* WinCtrl */ | 48 /* KEY_R */ } }), 'File: Open Recent...', fileCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.CloseWorkspaceAction, workspaceActions_1.CloseWorkspaceAction.ID, workspaceActions_1.CloseWorkspaceAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 36 /* KEY_F */) }), 'File: Close Workspace', fileCategory);
            const recentFilesPickerContext = contextkey_1.ContextKeyExpr.and(quickopen_1.inQuickOpenContext, contextkey_1.ContextKeyExpr.has(windowActions_1.inRecentFilesPickerContextKey));
            const quickOpenNavigateNextInRecentFilesPickerId = 'workbench.action.quickOpenNavigateNextInRecentFilesPicker';
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: quickOpenNavigateNextInRecentFilesPickerId,
                weight: 200 /* WorkbenchContrib */ + 50,
                handler: quickopen_1.getQuickNavigateHandler(quickOpenNavigateNextInRecentFilesPickerId, true),
                when: recentFilesPickerContext,
                primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */,
                mac: { primary: 256 /* WinCtrl */ | 48 /* KEY_R */ }
            });
            const quickOpenNavigatePreviousInRecentFilesPicker = 'workbench.action.quickOpenNavigatePreviousInRecentFilesPicker';
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: quickOpenNavigatePreviousInRecentFilesPicker,
                weight: 200 /* WorkbenchContrib */ + 50,
                handler: quickopen_1.getQuickNavigateHandler(quickOpenNavigatePreviousInRecentFilesPicker, false),
                when: recentFilesPickerContext,
                primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 48 /* KEY_R */,
                mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 48 /* KEY_R */ }
            });
        })();
        // Actions: View
        (function registerViewActions() {
            const viewCategory = nls.localize('view', "View");
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ZoomInAction, windowActions_1.ZoomInAction.ID, windowActions_1.ZoomInAction.LABEL, { primary: 2048 /* CtrlCmd */ | 81 /* US_EQUAL */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 81 /* US_EQUAL */, 2048 /* CtrlCmd */ | 104 /* NUMPAD_ADD */] }), 'View: Zoom In', viewCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ZoomOutAction, windowActions_1.ZoomOutAction.ID, windowActions_1.ZoomOutAction.LABEL, { primary: 2048 /* CtrlCmd */ | 83 /* US_MINUS */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 83 /* US_MINUS */, 2048 /* CtrlCmd */ | 106 /* NUMPAD_SUBTRACT */], linux: { primary: 2048 /* CtrlCmd */ | 83 /* US_MINUS */, secondary: [2048 /* CtrlCmd */ | 106 /* NUMPAD_SUBTRACT */] } }), 'View: Zoom Out', viewCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ZoomResetAction, windowActions_1.ZoomResetAction.ID, windowActions_1.ZoomResetAction.LABEL, { primary: 2048 /* CtrlCmd */ | 93 /* NUMPAD_0 */ }), 'View: Reset Zoom', viewCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ToggleFullScreenAction, windowActions_1.ToggleFullScreenAction.ID, windowActions_1.ToggleFullScreenAction.LABEL, { primary: 69 /* F11 */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 36 /* KEY_F */ } }), 'View: Toggle Full Screen', viewCategory);
        })();
        // Actions: Window
        (function registerWindowActions() {
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.NewWindowAction, windowActions_1.NewWindowAction.ID, windowActions_1.NewWindowAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 44 /* KEY_N */ }), 'New Window');
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.CloseCurrentWindowAction, windowActions_1.CloseCurrentWindowAction.ID, windowActions_1.CloseCurrentWindowAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 53 /* KEY_W */ }), 'Close Window');
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.SwitchWindow, windowActions_1.SwitchWindow.ID, windowActions_1.SwitchWindow.LABEL, { primary: 0, mac: { primary: 256 /* WinCtrl */ | 53 /* KEY_W */ } }), 'Switch Window...');
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.QuickSwitchWindow, windowActions_1.QuickSwitchWindow.ID, windowActions_1.QuickSwitchWindow.LABEL), 'Quick Switch Window...');
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: 'workbench.action.closeWindow',
                weight: 200 /* WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(editor_1.NoEditorsVisibleContext, editor_1.SingleEditorGroupsContext),
                primary: 2048 /* CtrlCmd */ | 53 /* KEY_W */,
                handler: accessor => {
                    const windowService = accessor.get(windows_1.IWindowService);
                    windowService.closeWindow();
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: 'workbench.action.quit',
                weight: 200 /* WorkbenchContrib */,
                handler(accessor) {
                    const windowsService = accessor.get(windows_1.IWindowsService);
                    windowsService.quit();
                },
                when: undefined,
                mac: { primary: 2048 /* CtrlCmd */ | 47 /* KEY_Q */ },
                linux: { primary: 2048 /* CtrlCmd */ | 47 /* KEY_Q */ }
            });
        })();
        // Actions: Workspaces
        (function registerWorkspaceActions() {
            const workspacesCategory = nls.localize('workspaces', "Workspaces");
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.AddRootFolderAction, workspaceActions_1.AddRootFolderAction.ID, workspaceActions_1.AddRootFolderAction.LABEL), 'Workspaces: Add Folder to Workspace...', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.GlobalRemoveRootFolderAction, workspaceActions_1.GlobalRemoveRootFolderAction.ID, workspaceActions_1.GlobalRemoveRootFolderAction.LABEL), 'Workspaces: Remove Folder from Workspace...', workspacesCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.OpenWorkspaceAction, workspaceActions_1.OpenWorkspaceAction.ID, workspaceActions_1.OpenWorkspaceAction.LABEL), 'Workspaces: Open Workspace...', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.SaveWorkspaceAsAction, workspaceActions_1.SaveWorkspaceAsAction.ID, workspaceActions_1.SaveWorkspaceAsAction.LABEL), 'Workspaces: Save Workspace As...', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.DuplicateWorkspaceInNewWindowAction, workspaceActions_1.DuplicateWorkspaceInNewWindowAction.ID, workspaceActions_1.DuplicateWorkspaceInNewWindowAction.LABEL), 'Workspaces: Duplicate Workspace in New Window', workspacesCategory);
            commands_1.CommandsRegistry.registerCommand(workspaceActions_1.OpenWorkspaceConfigFileAction.ID, serviceAccessor => {
                serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(workspaceActions_1.OpenWorkspaceConfigFileAction, workspaceActions_1.OpenWorkspaceConfigFileAction.ID, workspaceActions_1.OpenWorkspaceConfigFileAction.LABEL).run();
            });
            actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: workspaceActions_1.OpenWorkspaceConfigFileAction.ID,
                    title: { value: `${workspacesCategory}: ${workspaceActions_1.OpenWorkspaceConfigFileAction.LABEL}`, original: 'Workspaces: Open Workspace Configuration File' },
                },
                when: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
            });
        })();
        // Actions: macOS Native Tabs
        (function registerMacOSNativeTabsActions() {
            if (platform_2.isMacintosh) {
                [
                    { handler: windowActions_1.NewWindowTabHandler, id: 'workbench.action.newWindowTab', title: { value: nls.localize('newTab', "New Window Tab"), original: 'New Window Tab' } },
                    { handler: windowActions_1.ShowPreviousWindowTabHandler, id: 'workbench.action.showPreviousWindowTab', title: { value: nls.localize('showPreviousTab', "Show Previous Window Tab"), original: 'Show Previous Window Tab' } },
                    { handler: windowActions_1.ShowNextWindowTabHandler, id: 'workbench.action.showNextWindowTab', title: { value: nls.localize('showNextWindowTab', "Show Next Window Tab"), original: 'Show Next Window Tab' } },
                    { handler: windowActions_1.MoveWindowTabToNewWindowHandler, id: 'workbench.action.moveWindowTabToNewWindow', title: { value: nls.localize('moveWindowTabToNewWindow', "Move Window Tab to New Window"), original: 'Move Window Tab to New Window' } },
                    { handler: windowActions_1.MergeWindowTabsHandlerHandler, id: 'workbench.action.mergeAllWindowTabs', title: { value: nls.localize('mergeAllWindowTabs', "Merge All Windows"), original: 'Merge All Windows' } },
                    { handler: windowActions_1.ToggleWindowTabsBarHandler, id: 'workbench.action.toggleWindowTabsBar', title: { value: nls.localize('toggleWindowTabsBar', "Toggle Window Tabs Bar"), original: 'Toggle Window Tabs Bar' } }
                ].forEach(command => {
                    commands_1.CommandsRegistry.registerCommand(command.id, command.handler);
                    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                        command,
                        when: contextkeys_1.HasMacNativeTabsContext
                    });
                });
            }
        })();
        // Actions: Developer
        (function registerDeveloperActions() {
            const developerCategory = nls.localize('developer', "Developer");
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(developerActions_1.ToggleSharedProcessAction, developerActions_1.ToggleSharedProcessAction.ID, developerActions_1.ToggleSharedProcessAction.LABEL), 'Developer: Toggle Shared Process', developerCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(developerActions_1.InspectContextKeysAction, developerActions_1.InspectContextKeysAction.ID, developerActions_1.InspectContextKeysAction.LABEL), 'Developer: Inspect Context Keys', developerCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(developerActions_1.ToggleScreencastModeAction, developerActions_1.ToggleScreencastModeAction.ID, developerActions_1.ToggleScreencastModeAction.LABEL), 'Developer: Toggle Mouse Clicks', developerCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ReloadWindowWithExtensionsDisabledAction, windowActions_1.ReloadWindowWithExtensionsDisabledAction.ID, windowActions_1.ReloadWindowWithExtensionsDisabledAction.LABEL), 'Developer: Reload Window Without Extensions', developerCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(storageService_1.LogStorageAction, storageService_1.LogStorageAction.ID, storageService_1.LogStorageAction.LABEL), 'Developer: Log Storage', developerCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ReloadWindowAction, windowActions_1.ReloadWindowAction.ID, windowActions_1.ReloadWindowAction.LABEL), 'Developer: Reload Window', developerCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(developerActions_1.ToggleDevToolsAction, developerActions_1.ToggleDevToolsAction.ID, developerActions_1.ToggleDevToolsAction.LABEL), 'Developer: Toggle Developer Tools', developerCategory);
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: windowActions_1.ReloadWindowAction.ID,
                weight: 200 /* WorkbenchContrib */ + 50,
                when: contextkeys_1.IsDevelopmentContext,
                primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: developerActions_1.ToggleDevToolsAction.ID,
                weight: 200 /* WorkbenchContrib */ + 50,
                when: contextkeys_1.IsDevelopmentContext,
                primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 39 /* KEY_I */,
                mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 39 /* KEY_I */ }
            });
        })();
        // Actions: help
        (function registerHelpActions() {
            const helpCategory = nls.localize('help', "Help");
            if (helpActions_1.KeybindingsReferenceAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.KeybindingsReferenceAction, helpActions_1.KeybindingsReferenceAction.ID, helpActions_1.KeybindingsReferenceAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 48 /* KEY_R */) }), 'Help: Keyboard Shortcuts Reference', helpCategory);
            }
            if (helpActions_1.OpenDocumentationUrlAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenDocumentationUrlAction, helpActions_1.OpenDocumentationUrlAction.ID, helpActions_1.OpenDocumentationUrlAction.LABEL), 'Help: Documentation', helpCategory);
            }
            if (helpActions_1.OpenIntroductoryVideosUrlAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenIntroductoryVideosUrlAction, helpActions_1.OpenIntroductoryVideosUrlAction.ID, helpActions_1.OpenIntroductoryVideosUrlAction.LABEL), 'Help: Introductory Videos', helpCategory);
            }
            if (helpActions_1.OpenTipsAndTricksUrlAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenTipsAndTricksUrlAction, helpActions_1.OpenTipsAndTricksUrlAction.ID, helpActions_1.OpenTipsAndTricksUrlAction.LABEL), 'Help: Tips and Tricks', helpCategory);
            }
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenTwitterUrlAction, helpActions_1.OpenTwitterUrlAction.ID, helpActions_1.OpenTwitterUrlAction.LABEL), 'Help: Join Us on Twitter', helpCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenRequestFeatureUrlAction, helpActions_1.OpenRequestFeatureUrlAction.ID, helpActions_1.OpenRequestFeatureUrlAction.LABEL), 'Help: Search Feature Requests', helpCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenLicenseUrlAction, helpActions_1.OpenLicenseUrlAction.ID, helpActions_1.OpenLicenseUrlAction.LABEL), 'Help: View License', helpCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenPrivacyStatementUrlAction, helpActions_1.OpenPrivacyStatementUrlAction.ID, helpActions_1.OpenPrivacyStatementUrlAction.LABEL), 'Help: Privacy Statement', helpCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ShowAboutDialogAction, windowActions_1.ShowAboutDialogAction.ID, windowActions_1.ShowAboutDialogAction.LABEL), 'Help: About', helpCategory);
        })();
    })();
    // Menu
    (function registerMenu() {
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '1_new',
            command: {
                id: windowActions_1.NewWindowAction.ID,
                title: nls.localize({ key: 'miNewWindow', comment: ['&& denotes a mnemonic'] }, "New &&Window")
            },
            order: 2
        });
        if (platform_2.isMacintosh) {
            actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
                group: '2_open',
                command: {
                    id: workspaceActions_1.OpenFileFolderAction.ID,
                    title: nls.localize({ key: 'miOpen', comment: ['&& denotes a mnemonic'] }, "&&Open...")
                },
                order: 1
            });
        }
        else {
            actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
                group: '2_open',
                command: {
                    id: workspaceActions_1.OpenFileAction.ID,
                    title: nls.localize({ key: 'miOpenFile', comment: ['&& denotes a mnemonic'] }, "&&Open File...")
                },
                order: 1
            });
            actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
                group: '2_open',
                command: {
                    id: workspaceActions_1.OpenFolderAction.ID,
                    title: nls.localize({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
                },
                order: 2
            });
        }
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '2_open',
            command: {
                id: workspaceActions_1.OpenWorkspaceAction.ID,
                title: nls.localize({ key: 'miOpenWorkspace', comment: ['&& denotes a mnemonic'] }, "Open Wor&&kspace...")
            },
            order: 3,
            when: contextkeys_1.SupportsWorkspacesContext
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            title: nls.localize({ key: 'miOpenRecent', comment: ['&& denotes a mnemonic'] }, "Open &&Recent"),
            submenu: 21 /* MenubarRecentMenu */,
            group: '2_open',
            order: 4
        });
        // More
        actions_1.MenuRegistry.appendMenuItem(21 /* MenubarRecentMenu */, {
            group: 'y_more',
            command: {
                id: windowActions_1.OpenRecentAction.ID,
                title: nls.localize({ key: 'miMore', comment: ['&& denotes a mnemonic'] }, "&&More...")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '3_workspace',
            command: {
                id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
                title: nls.localize({ key: 'miAddFolderToWorkspace', comment: ['&& denotes a mnemonic'] }, "A&&dd Folder to Workspace...")
            },
            order: 1,
            when: contextkeys_1.SupportsWorkspacesContext
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '3_workspace',
            command: {
                id: workspaceActions_1.SaveWorkspaceAsAction.ID,
                title: nls.localize('miSaveWorkspaceAs', "Save Workspace As...")
            },
            order: 2,
            when: contextkeys_1.SupportsWorkspacesContext
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            title: nls.localize({ key: 'miPreferences', comment: ['&& denotes a mnemonic'] }, "&&Preferences"),
            submenu: 20 /* MenubarPreferencesMenu */,
            group: '5_autosave',
            order: 2,
            when: contextkeys_1.IsMacContext.toNegated()
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '6_close',
            command: {
                id: workspaceActions_1.CloseWorkspaceAction.ID,
                title: nls.localize({ key: 'miCloseFolder', comment: ['&& denotes a mnemonic'] }, "Close &&Folder"),
                precondition: contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0')
            },
            order: 3,
            when: contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace')
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '6_close',
            command: {
                id: workspaceActions_1.CloseWorkspaceAction.ID,
                title: nls.localize({ key: 'miCloseWorkspace', comment: ['&& denotes a mnemonic'] }, "Close &&Workspace")
            },
            order: 3,
            when: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '6_close',
            command: {
                id: windowActions_1.CloseCurrentWindowAction.ID,
                title: nls.localize({ key: 'miCloseWindow', comment: ['&& denotes a mnemonic'] }, "Clos&&e Window")
            },
            order: 4
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: 'z_Exit',
            command: {
                id: 'workbench.action.quit',
                title: nls.localize({ key: 'miExit', comment: ['&& denotes a mnemonic'] }, "E&&xit")
            },
            order: 1,
            when: contextkeys_1.IsMacContext.toNegated()
        });
        // Appereance menu
        actions_1.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
            group: '2_appearance',
            title: nls.localize({ key: 'miAppearance', comment: ['&& denotes a mnemonic'] }, "&&Appearance"),
            submenu: 12 /* MenubarAppearanceMenu */,
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
            group: '1_toggle_view',
            command: {
                id: windowActions_1.ToggleFullScreenAction.ID,
                title: nls.localize({ key: 'miToggleFullScreen', comment: ['&& denotes a mnemonic'] }, "Toggle &&Full Screen")
            },
            order: 1
        });
        // Zoom
        actions_1.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
            group: '3_zoom',
            command: {
                id: windowActions_1.ZoomInAction.ID,
                title: nls.localize({ key: 'miZoomIn', comment: ['&& denotes a mnemonic'] }, "&&Zoom In")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
            group: '3_zoom',
            command: {
                id: windowActions_1.ZoomOutAction.ID,
                title: nls.localize({ key: 'miZoomOut', comment: ['&& denotes a mnemonic'] }, "&&Zoom Out")
            },
            order: 2
        });
        actions_1.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
            group: '3_zoom',
            command: {
                id: windowActions_1.ZoomResetAction.ID,
                title: nls.localize({ key: 'miZoomReset', comment: ['&& denotes a mnemonic'] }, "&&Reset Zoom")
            },
            order: 3
        });
        // Help
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '1_welcome',
            command: {
                id: 'workbench.action.openDocumentationUrl',
                title: nls.localize({ key: 'miDocumentation', comment: ['&& denotes a mnemonic'] }, "&&Documentation")
            },
            order: 3
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '1_welcome',
            command: {
                id: 'update.showCurrentReleaseNotes',
                title: nls.localize({ key: 'miReleaseNotes', comment: ['&& denotes a mnemonic'] }, "&&Release Notes")
            },
            order: 4
        });
        // Reference
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '2_reference',
            command: {
                id: 'workbench.action.keybindingsReference',
                title: nls.localize({ key: 'miKeyboardShortcuts', comment: ['&& denotes a mnemonic'] }, "&&Keyboard Shortcuts Reference")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '2_reference',
            command: {
                id: 'workbench.action.openIntroductoryVideosUrl',
                title: nls.localize({ key: 'miIntroductoryVideos', comment: ['&& denotes a mnemonic'] }, "Introductory &&Videos")
            },
            order: 2
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '2_reference',
            command: {
                id: 'workbench.action.openTipsAndTricksUrl',
                title: nls.localize({ key: 'miTipsAndTricks', comment: ['&& denotes a mnemonic'] }, "Tips and Tri&&cks")
            },
            order: 3
        });
        // Feedback
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '3_feedback',
            command: {
                id: 'workbench.action.openTwitterUrl',
                title: nls.localize({ key: 'miTwitter', comment: ['&& denotes a mnemonic'] }, "&&Join Us on Twitter")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '3_feedback',
            command: {
                id: 'workbench.action.openRequestFeatureUrl',
                title: nls.localize({ key: 'miUserVoice', comment: ['&& denotes a mnemonic'] }, "&&Search Feature Requests")
            },
            order: 2
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '3_feedback',
            command: {
                id: 'workbench.action.openIssueReporter',
                title: nls.localize({ key: 'miReportIssue', comment: ['&& denotes a mnemonic', 'Translate this to "Report Issue in English" in all languages please!'] }, "Report &&Issue")
            },
            order: 3
        });
        // Legal
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '4_legal',
            command: {
                id: 'workbench.action.openLicenseUrl',
                title: nls.localize({ key: 'miLicense', comment: ['&& denotes a mnemonic'] }, "View &&License")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '4_legal',
            command: {
                id: 'workbench.action.openPrivacyStatementUrl',
                title: nls.localize({ key: 'miPrivacyStatement', comment: ['&& denotes a mnemonic'] }, "Privac&&y Statement")
            },
            order: 2
        });
        // Tools
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '5_tools',
            command: {
                id: 'workbench.action.toggleDevTools',
                title: nls.localize({ key: 'miToggleDevTools', comment: ['&& denotes a mnemonic'] }, "&&Toggle Developer Tools")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '5_tools',
            command: {
                id: 'workbench.action.openProcessExplorer',
                title: nls.localize({ key: 'miOpenProcessExplorerer', comment: ['&& denotes a mnemonic'] }, "Open &&Process Explorer")
            },
            order: 2
        });
        // About
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: 'z_about',
            command: {
                id: 'workbench.action.showAboutDialog',
                title: nls.localize({ key: 'miAbout', comment: ['&& denotes a mnemonic'] }, "&&About")
            },
            order: 1,
            when: contextkeys_1.IsMacContext.toNegated()
        });
    })();
    // Configuration
    (function registerConfiguration() {
        const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        // Window
        registry.registerConfiguration({
            'id': 'window',
            'order': 8,
            'title': nls.localize('windowConfigurationTitle', "Window"),
            'type': 'object',
            'properties': {
                'window.openFilesInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        nls.localize('window.openFilesInNewWindow.on', "Files will open in a new window."),
                        nls.localize('window.openFilesInNewWindow.off', "Files will open in the window with the files' folder open or the last active window."),
                        platform_2.isMacintosh ?
                            nls.localize('window.openFilesInNewWindow.defaultMac', "Files will open in the window with the files' folder open or the last active window unless opened via the Dock or from Finder.") :
                            nls.localize('window.openFilesInNewWindow.default', "Files will open in a new window unless picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'off',
                    'scope': 1 /* APPLICATION */,
                    'markdownDescription': platform_2.isMacintosh ?
                        nls.localize('openFilesInNewWindowMac', "Controls whether files should open in a new window. \nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).") :
                        nls.localize('openFilesInNewWindow', "Controls whether files should open in a new window.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.openFoldersInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        nls.localize('window.openFoldersInNewWindow.on', "Folders will open in a new window."),
                        nls.localize('window.openFoldersInNewWindow.off', "Folders will replace the last active window."),
                        nls.localize('window.openFoldersInNewWindow.default', "Folders will open in a new window unless a folder is picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'default',
                    'scope': 1 /* APPLICATION */,
                    'markdownDescription': nls.localize('openFoldersInNewWindow', "Controls whether folders should open in a new window or replace the last active window.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.openWithoutArgumentsInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off'],
                    'enumDescriptions': [
                        nls.localize('window.openWithoutArgumentsInNewWindow.on', "Open a new empty window."),
                        nls.localize('window.openWithoutArgumentsInNewWindow.off', "Focus the last active running instance.")
                    ],
                    'default': platform_2.isMacintosh ? 'off' : 'on',
                    'scope': 1 /* APPLICATION */,
                    'markdownDescription': nls.localize('openWithoutArgumentsInNewWindow', "Controls whether a new empty window should open when starting a second instance without arguments or if the last running instance should get focus.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.restoreWindows': {
                    'type': 'string',
                    'enum': ['all', 'folders', 'one', 'none'],
                    'enumDescriptions': [
                        nls.localize('window.reopenFolders.all', "Reopen all windows."),
                        nls.localize('window.reopenFolders.folders', "Reopen all folders. Empty workspaces will not be restored."),
                        nls.localize('window.reopenFolders.one', "Reopen the last active window."),
                        nls.localize('window.reopenFolders.none', "Never reopen a window. Always start with an empty one.")
                    ],
                    'default': 'one',
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('restoreWindows', "Controls how windows are being reopened after a restart.")
                },
                'window.restoreFullscreen': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('restoreFullscreen', "Controls whether a window should restore to full screen mode if it was exited in full screen mode.")
                },
                'window.zoomLevel': {
                    'type': 'number',
                    'default': 0,
                    'description': nls.localize('zoomLevel', "Adjust the zoom level of the window. The original size is 0 and each increment above (e.g. 1) or below (e.g. -1) represents zooming 20% larger or smaller. You can also enter decimals to adjust the zoom level with a finer granularity.")
                },
                'window.newWindowDimensions': {
                    'type': 'string',
                    'enum': ['default', 'inherit', 'maximized', 'fullscreen'],
                    'enumDescriptions': [
                        nls.localize('window.newWindowDimensions.default', "Open new windows in the center of the screen."),
                        nls.localize('window.newWindowDimensions.inherit', "Open new windows with same dimension as last active one."),
                        nls.localize('window.newWindowDimensions.maximized', "Open new windows maximized."),
                        nls.localize('window.newWindowDimensions.fullscreen', "Open new windows in full screen mode.")
                    ],
                    'default': 'default',
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('newWindowDimensions', "Controls the dimensions of opening a new window when at least one window is already opened. Note that this setting does not have an impact on the first window that is opened. The first window will always restore the size and location as you left it before closing.")
                },
                'window.closeWhenEmpty': {
                    'type': 'boolean',
                    'default': false,
                    'description': nls.localize('closeWhenEmpty', "Controls whether closing the last editor should also close the window. This setting only applies for windows that do not show folders.")
                },
                'window.menuBarVisibility': {
                    'type': 'string',
                    'enum': ['default', 'visible', 'toggle', 'hidden'],
                    'enumDescriptions': [
                        nls.localize('window.menuBarVisibility.default', "Menu is only hidden in full screen mode."),
                        nls.localize('window.menuBarVisibility.visible', "Menu is always visible even in full screen mode."),
                        nls.localize('window.menuBarVisibility.toggle', "Menu is hidden but can be displayed via Alt key."),
                        nls.localize('window.menuBarVisibility.hidden', "Menu is always hidden.")
                    ],
                    'default': 'default',
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('menuBarVisibility', "Control the visibility of the menu bar. A setting of 'toggle' means that the menu bar is hidden and a single press of the Alt key will show it. By default, the menu bar will be visible, unless the window is full screen."),
                    'included': platform_2.isWindows || platform_2.isLinux
                },
                'window.enableMenuBarMnemonics': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('enableMenuBarMnemonics', "If enabled, the main menus can be opened via Alt-key shortcuts. Disabling mnemonics allows to bind these Alt-key shortcuts to editor commands instead."),
                    'included': platform_2.isWindows || platform_2.isLinux
                },
                'window.autoDetectHighContrast': {
                    'type': 'boolean',
                    'default': true,
                    'description': nls.localize('autoDetectHighContrast', "If enabled, will automatically change to high contrast theme if Windows is using a high contrast theme, and to dark theme when switching away from a Windows high contrast theme."),
                    'included': platform_2.isWindows
                },
                'window.doubleClickIconToClose': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* APPLICATION */,
                    'markdownDescription': nls.localize('window.doubleClickIconToClose', "If enabled, double clicking the application icon in the title bar will close the window and the window cannot be dragged by the icon. This setting only has an effect when `#window.titleBarStyle#` is set to `custom`.")
                },
                'window.titleBarStyle': {
                    'type': 'string',
                    'enum': ['native', 'custom'],
                    'default': platform_2.isLinux ? 'native' : 'custom',
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('titleBarStyle', "Adjust the appearance of the window title bar. On Linux and Windows, this setting also affects the application and context menu appearances. Changes require a full restart to apply.")
                },
                'window.nativeTabs': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('window.nativeTabs', "Enables macOS Sierra window tabs. Note that changes require a full restart to apply and that native tabs will disable a custom title bar style if configured."),
                    'included': platform_2.isMacintosh && parseFloat(os.release()) >= 16 // Minimum: macOS Sierra (10.12.x = darwin 16.x)
                },
                'window.nativeFullScreen': {
                    'type': 'boolean',
                    'default': true,
                    'description': nls.localize('window.nativeFullScreen', "Controls if native full-screen should be used on macOS. Disable this option to prevent macOS from creating a new space when going full-screen."),
                    'included': platform_2.isMacintosh
                },
                'window.clickThroughInactive': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('window.clickThroughInactive', "If enabled, clicking on an inactive window will both activate the window and trigger the element under the mouse if it is clickable. If disabled, clicking anywhere on an inactive window will activate it only and a second click is required on the element."),
                    'included': platform_2.isMacintosh
                }
            }
        });
        // Telemetry
        registry.registerConfiguration({
            'id': 'telemetry',
            'order': 110,
            title: nls.localize('telemetryConfigurationTitle', "Telemetry"),
            'type': 'object',
            'properties': {
                'telemetry.enableCrashReporter': {
                    'type': 'boolean',
                    'description': nls.localize('telemetry.enableCrashReporting', "Enable crash reports to be sent to a Microsoft online service. \nThis option requires restart to take effect."),
                    'default': true,
                    'tags': ['usesOnlineServices']
                }
            }
        });
    })();
});
//# sourceMappingURL=main.contribution.js.map