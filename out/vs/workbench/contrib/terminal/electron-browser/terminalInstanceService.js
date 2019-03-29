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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/terminal/node/windowsShellHelper", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalProcessManager", "vs/workbench/contrib/terminal/node/terminalProcess"], function (require, exports, nls, windowsShellHelper_1, instantiation_1, terminalProcessManager_1, terminalProcess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let Terminal;
    /**
     * A service used by TerminalInstance (and components owned by it) that allows it to break its
     * dependency on electron-browser and node layers, while at the same time avoiding a cyclic
     * dependency on ITerminalService.
     */
    let TerminalInstanceService = class TerminalInstanceService {
        constructor(_instantiationService) {
            this._instantiationService = _instantiationService;
        }
        getXtermConstructor() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!Terminal) {
                    Terminal = (yield new Promise((resolve_1, reject_1) => { require(['vscode-xterm'], resolve_1, reject_1); })).Terminal;
                    // Enable xterm.js addons
                    Terminal.applyAddon(require.__$__nodeRequire('vscode-xterm/lib/addons/search/search'));
                    Terminal.applyAddon(require.__$__nodeRequire('vscode-xterm/lib/addons/webLinks/webLinks'));
                    Terminal.applyAddon(require.__$__nodeRequire('vscode-xterm/lib/addons/winptyCompat/winptyCompat'));
                    // Localize strings
                    Terminal.strings.blankLine = nls.localize('terminal.integrated.a11yBlankLine', 'Blank line');
                    Terminal.strings.promptLabel = nls.localize('terminal.integrated.a11yPromptLabel', 'Terminal input');
                    Terminal.strings.tooMuchOutput = nls.localize('terminal.integrated.a11yTooMuchOutput', 'Too much output to announce, navigate to rows manually to read');
                }
                return Terminal;
            });
        }
        createWindowsShellHelper(shellProcessId, instance, xterm) {
            return new windowsShellHelper_1.WindowsShellHelper(shellProcessId, instance, xterm);
        }
        createTerminalProcessManager(id, configHelper) {
            return this._instantiationService.createInstance(terminalProcessManager_1.TerminalProcessManager, id, configHelper);
        }
        createTerminalProcess(shellLaunchConfig, cwd, cols, rows, env, windowsEnableConpty) {
            return new terminalProcess_1.TerminalProcess(shellLaunchConfig, cwd, cols, rows, env, windowsEnableConpty);
        }
    };
    TerminalInstanceService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], TerminalInstanceService);
    exports.TerminalInstanceService = TerminalInstanceService;
});
//# sourceMappingURL=terminalInstanceService.js.map