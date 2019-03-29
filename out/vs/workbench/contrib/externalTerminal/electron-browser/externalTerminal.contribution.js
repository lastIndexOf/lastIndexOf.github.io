/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/base/common/path", "vs/workbench/contrib/externalTerminal/common/externalTerminal", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/externalTerminal/electron-browser/externalTerminal", "vs/workbench/contrib/externalTerminal/electron-browser/externalTerminalService", "vs/workbench/services/history/common/history", "vs/workbench/common/resources", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/workbench/contrib/files/browser/files", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, env, platform_1, configuration_1, extensions_1, paths, externalTerminal_1, actions_1, configurationRegistry_1, terminal_1, externalTerminal_2, externalTerminalService_1, history_1, resources_1, keybindingsRegistry_1, files_1, listService_1, files_2, commands_1, network_1, arrays_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    if (env.isWindows) {
        extensions_1.registerSingleton(externalTerminal_1.IExternalTerminalService, externalTerminalService_1.WindowsExternalTerminalService, true);
    }
    else if (env.isMacintosh) {
        extensions_1.registerSingleton(externalTerminal_1.IExternalTerminalService, externalTerminalService_1.MacExternalTerminalService, true);
    }
    else if (env.isLinux) {
        extensions_1.registerSingleton(externalTerminal_1.IExternalTerminalService, externalTerminalService_1.LinuxExternalTerminalService, true);
    }
    externalTerminal_2.getDefaultTerminalLinuxReady().then(defaultTerminalLinux => {
        let configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration({
            id: 'externalTerminal',
            order: 100,
            title: nls.localize('terminalConfigurationTitle', "External Terminal"),
            type: 'object',
            properties: {
                'terminal.explorerKind': {
                    type: 'string',
                    enum: [
                        'integrated',
                        'external'
                    ],
                    enumDescriptions: [
                        nls.localize('terminal.explorerKind.integrated', "Use VS Code's integrated terminal."),
                        nls.localize('terminal.explorerKind.external', "Use the configured external terminal.")
                    ],
                    description: nls.localize('explorer.openInTerminalKind', "Customizes what kind of terminal to launch."),
                    default: 'integrated'
                },
                'terminal.external.windowsExec': {
                    type: 'string',
                    description: nls.localize('terminal.external.windowsExec', "Customizes which terminal to run on Windows."),
                    default: externalTerminal_2.getDefaultTerminalWindows(),
                    scope: 1 /* APPLICATION */
                },
                'terminal.external.osxExec': {
                    type: 'string',
                    description: nls.localize('terminal.external.osxExec', "Customizes which terminal application to run on macOS."),
                    default: externalTerminal_2.DEFAULT_TERMINAL_OSX,
                    scope: 1 /* APPLICATION */
                },
                'terminal.external.linuxExec': {
                    type: 'string',
                    description: nls.localize('terminal.external.linuxExec', "Customizes which terminal to run on Linux."),
                    default: defaultTerminalLinux,
                    scope: 1 /* APPLICATION */
                }
            }
        });
    });
    const OPEN_IN_TERMINAL_COMMAND_ID = 'openInTerminal';
    commands_1.CommandsRegistry.registerCommand({
        id: OPEN_IN_TERMINAL_COMMAND_ID,
        handler: (accessor, resource) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const integratedTerminalService = accessor.get(terminal_1.ITerminalService);
            const terminalService = accessor.get(externalTerminal_1.IExternalTerminalService);
            const resources = files_2.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), editorService);
            return fileService.resolveFiles(resources.map(r => ({ resource: r }))).then(stats => {
                const directoriesToOpen = arrays_1.distinct(stats.filter(data => data.success).map(({ stat }) => stat.isDirectory ? stat.resource.fsPath : paths.dirname(stat.resource.fsPath)));
                return directoriesToOpen.map(dir => {
                    if (configurationService.getValue().terminal.explorerKind === 'integrated') {
                        const instance = integratedTerminalService.createTerminal({ cwd: dir }, true);
                        if (instance && (resources.length === 1 || !resource || dir === resource.fsPath || dir === paths.dirname(resource.fsPath))) {
                            integratedTerminalService.setActiveInstance(instance);
                            integratedTerminalService.showPanel(true);
                        }
                    }
                    else {
                        terminalService.openTerminal(dir);
                    }
                });
            });
        }
    });
    const OPEN_NATIVE_CONSOLE_COMMAND_ID = 'workbench.action.terminal.openNativeConsole';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 33 /* KEY_C */,
        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_NOT_FOCUSED,
        weight: 200 /* WorkbenchContrib */,
        handler: (accessor) => {
            const historyService = accessor.get(history_1.IHistoryService);
            const terminalService = accessor.get(externalTerminal_1.IExternalTerminalService);
            const root = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            if (root) {
                terminalService.openTerminal(root.fsPath);
            }
            else {
                // Opens current file's folder, if no folder is open in editor
                const activeFile = historyService.getLastActiveFile(network_1.Schemas.file);
                if (activeFile) {
                    terminalService.openTerminal(paths.dirname(activeFile.fsPath));
                }
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
            title: { value: nls.localize('globalConsoleAction', "Open New Terminal"), original: 'Open New Terminal' }
        }
    });
    const openConsoleCommand = {
        id: OPEN_IN_TERMINAL_COMMAND_ID,
        title: nls.localize('scopedConsoleAction', "Open in Terminal")
    };
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: 'navigation',
        order: 30,
        command: openConsoleCommand,
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: 'navigation',
        order: 30,
        command: openConsoleCommand,
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file)
    });
});
//# sourceMappingURL=externalTerminal.contribution.js.map