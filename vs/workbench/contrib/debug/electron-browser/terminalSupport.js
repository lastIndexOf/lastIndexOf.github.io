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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/externalTerminal/common/externalTerminal", "vs/workbench/contrib/debug/node/terminals"], function (require, exports, nls, terminal_1, externalTerminal_1, terminals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalLauncher = class TerminalLauncher {
        constructor(terminalService, externalTerminalService) {
            this.terminalService = terminalService;
            this.externalTerminalService = externalTerminalService;
        }
        runInTerminal(args, config) {
            if (args.kind === 'external') {
                return this.externalTerminalService.runInTerminal(args.title || '', args.cwd, args.args, args.env || {});
            }
            if (!this.terminalDisposedListener) {
                // React on terminal disposed and check if that is the debug terminal #12956
                this.terminalDisposedListener = this.terminalService.onInstanceDisposed(terminal => {
                    if (this.integratedTerminalInstance && this.integratedTerminalInstance.id === terminal.id) {
                        this.integratedTerminalInstance = undefined;
                    }
                });
            }
            let t = this.integratedTerminalInstance;
            if ((t && (typeof t.processId === 'number') && terminals_1.hasChildProcesses(t.processId)) || !t) {
                t = this.terminalService.createTerminal({ name: args.title || nls.localize('debug.terminal.title', "debuggee") });
                this.integratedTerminalInstance = t;
            }
            this.terminalService.setActiveInstance(t);
            this.terminalService.showPanel(true);
            return new Promise((resolve, error) => {
                if (t && typeof t.processId === 'number') {
                    // no need to wait
                    resolve(t.processId);
                }
                // shell not ready: wait for ready event
                const toDispose = t.onProcessIdReady(t => {
                    toDispose.dispose();
                    resolve(t.processId);
                });
                // do not wait longer than 5 seconds
                setTimeout(_ => {
                    error(new Error('terminal shell timeout'));
                }, 5000);
            }).then(shellProcessId => {
                const command = terminals_1.prepareCommand(args, config);
                t.sendText(command, true);
                return shellProcessId;
            });
        }
    };
    TerminalLauncher = __decorate([
        __param(0, terminal_1.ITerminalService),
        __param(1, externalTerminal_1.IExternalTerminalService)
    ], TerminalLauncher);
    exports.TerminalLauncher = TerminalLauncher;
});
//# sourceMappingURL=terminalSupport.js.map