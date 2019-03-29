/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/electron-browser/terminalInstanceService", "vs/workbench/contrib/terminal/electron-browser/terminalService", "vs/workbench/contrib/terminal/node/terminal"], function (require, exports, nls, configurationRegistry_1, extensions_1, platform_1, terminal_1, terminal_2, terminalInstanceService_1, terminalService_1, terminal_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'terminal',
        order: 100,
        title: nls.localize('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
        type: 'object',
        properties: {
            'terminal.integrated.shell.linux': {
                markdownDescription: nls.localize('terminal.integrated.shell.linux', "The path of the shell that the terminal uses on Linux. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                type: 'string',
                default: terminal_3.getDefaultShell(2 /* Linux */)
            },
            'terminal.integrated.shell.osx': {
                markdownDescription: nls.localize('terminal.integrated.shell.osx', "The path of the shell that the terminal uses on macOS. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                type: 'string',
                default: terminal_3.getDefaultShell(1 /* Mac */)
            },
            'terminal.integrated.shell.windows': {
                markdownDescription: nls.localize('terminal.integrated.shell.windows', "The path of the shell that the terminal uses on Windows. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                type: 'string',
                default: terminal_3.getDefaultShell(3 /* Windows */)
            }
        }
    });
    extensions_1.registerSingleton(terminal_2.ITerminalService, terminalService_1.TerminalService, true);
    extensions_1.registerSingleton(terminal_1.ITerminalInstanceService, terminalInstanceService_1.TerminalInstanceService, true);
});
//# sourceMappingURL=terminal.contribution.js.map