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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/electron-browser/extHostCustomers", "vs/base/common/uri"], function (require, exports, lifecycle_1, terminal_1, extHost_protocol_1, extHostCustomers_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadTerminalService = class MainThreadTerminalService {
        constructor(extHostContext, terminalService) {
            this.terminalService = terminalService;
            this._toDispose = [];
            this._terminalProcesses = {};
            this._terminalOnDidWriteDataListeners = {};
            this._terminalOnDidAcceptInputListeners = {};
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTerminalService);
            this._remoteAuthority = extHostContext.remoteAuthority;
            this._toDispose.push(terminalService.onInstanceCreated((instance) => {
                // Delay this message so the TerminalInstance constructor has a chance to finish and
                // return the ID normally to the extension host. The ID that is passed here will be used
                // to register non-extension API terminals in the extension host.
                setTimeout(() => {
                    this._onTerminalOpened(instance);
                    this._onInstanceDimensionsChanged(instance);
                }, terminal_1.EXT_HOST_CREATION_DELAY);
            }));
            this._toDispose.push(terminalService.onInstanceDisposed(instance => this._onTerminalDisposed(instance)));
            this._toDispose.push(terminalService.onInstanceProcessIdReady(instance => this._onTerminalProcessIdReady(instance)));
            this._toDispose.push(terminalService.onInstanceDimensionsChanged(instance => this._onInstanceDimensionsChanged(instance)));
            this._toDispose.push(terminalService.onInstanceRequestExtHostProcess(request => this._onTerminalRequestExtHostProcess(request)));
            this._toDispose.push(terminalService.onActiveInstanceChanged(instance => this._onActiveTerminalChanged(instance ? instance.id : null)));
            this._toDispose.push(terminalService.onInstanceTitleChanged(instance => this._onTitleChanged(instance.id, instance.title)));
            // Set initial ext host state
            this.terminalService.terminalInstances.forEach(t => {
                this._onTerminalOpened(t);
                t.processReady.then(() => this._onTerminalProcessIdReady(t));
            });
            const activeInstance = this.terminalService.getActiveInstance();
            if (activeInstance) {
                this._proxy.$acceptActiveTerminalChanged(activeInstance.id);
            }
        }
        dispose() {
            this._toDispose = lifecycle_1.dispose(this._toDispose);
            // TODO@Daniel: Should all the previously created terminals be disposed
            // when the extension host process goes down ?
        }
        $createTerminal(name, shellPath, shellArgs, cwd, env, waitOnExit, strictEnv) {
            const shellLaunchConfig = {
                name,
                executable: shellPath,
                args: shellArgs,
                cwd: typeof cwd === 'string' ? cwd : uri_1.URI.revive(cwd),
                waitOnExit,
                ignoreConfigurationCwd: true,
                env,
                strictEnv
            };
            const terminal = this.terminalService.createTerminal(shellLaunchConfig);
            return Promise.resolve({
                id: terminal.id,
                name: terminal.title
            });
        }
        $createTerminalRenderer(name) {
            const instance = this.terminalService.createTerminalRenderer(name);
            return Promise.resolve(instance.id);
        }
        $show(terminalId, preserveFocus) {
            const terminalInstance = this.terminalService.getInstanceFromId(terminalId);
            if (terminalInstance) {
                this.terminalService.setActiveInstance(terminalInstance);
                this.terminalService.showPanel(!preserveFocus);
            }
        }
        $hide(terminalId) {
            const instance = this.terminalService.getActiveInstance();
            if (instance && instance.id === terminalId) {
                this.terminalService.hidePanel();
            }
        }
        $dispose(terminalId) {
            const terminalInstance = this.terminalService.getInstanceFromId(terminalId);
            if (terminalInstance) {
                terminalInstance.dispose();
            }
        }
        $terminalRendererWrite(terminalId, text) {
            const terminalInstance = this.terminalService.getInstanceFromId(terminalId);
            if (terminalInstance && terminalInstance.shellLaunchConfig.isRendererOnly) {
                terminalInstance.write(text);
            }
        }
        $terminalRendererSetName(terminalId, name) {
            const terminalInstance = this.terminalService.getInstanceFromId(terminalId);
            if (terminalInstance && terminalInstance.shellLaunchConfig.isRendererOnly) {
                terminalInstance.setTitle(name, false);
            }
        }
        $terminalRendererSetDimensions(terminalId, dimensions) {
            const terminalInstance = this.terminalService.getInstanceFromId(terminalId);
            if (terminalInstance && terminalInstance.shellLaunchConfig.isRendererOnly) {
                terminalInstance.setDimensions(dimensions);
            }
        }
        $terminalRendererRegisterOnInputListener(terminalId) {
            const terminalInstance = this.terminalService.getInstanceFromId(terminalId);
            if (!terminalInstance) {
                return;
            }
            // Listener already registered
            if (this._terminalOnDidAcceptInputListeners.hasOwnProperty(terminalId)) {
                return;
            }
            // Register
            this._terminalOnDidAcceptInputListeners[terminalId] = terminalInstance.onRendererInput(data => this._onTerminalRendererInput(terminalId, data));
            terminalInstance.addDisposable(this._terminalOnDidAcceptInputListeners[terminalId]);
        }
        $sendText(terminalId, text, addNewLine) {
            const terminalInstance = this.terminalService.getInstanceFromId(terminalId);
            if (terminalInstance) {
                terminalInstance.sendText(text, addNewLine);
            }
        }
        $registerOnDataListener(terminalId) {
            const terminalInstance = this.terminalService.getInstanceFromId(terminalId);
            if (!terminalInstance) {
                return;
            }
            // Listener already registered
            if (this._terminalOnDidWriteDataListeners[terminalId]) {
                return;
            }
            // Register
            this._terminalOnDidWriteDataListeners[terminalId] = terminalInstance.onData(data => {
                this._onTerminalData(terminalId, data);
            });
            terminalInstance.addDisposable(this._terminalOnDidWriteDataListeners[terminalId]);
        }
        _onActiveTerminalChanged(terminalId) {
            this._proxy.$acceptActiveTerminalChanged(terminalId);
        }
        _onTerminalData(terminalId, data) {
            this._proxy.$acceptTerminalProcessData(terminalId, data);
        }
        _onTitleChanged(terminalId, name) {
            this._proxy.$acceptTerminalTitleChange(terminalId, name);
        }
        _onTerminalRendererInput(terminalId, data) {
            this._proxy.$acceptTerminalRendererInput(terminalId, data);
        }
        _onTerminalDisposed(terminalInstance) {
            this._proxy.$acceptTerminalClosed(terminalInstance.id);
        }
        _onTerminalOpened(terminalInstance) {
            if (terminalInstance.title) {
                this._proxy.$acceptTerminalOpened(terminalInstance.id, terminalInstance.title);
            }
            else {
                terminalInstance.waitForTitle().then(title => {
                    this._proxy.$acceptTerminalOpened(terminalInstance.id, title);
                });
            }
        }
        _onTerminalProcessIdReady(terminalInstance) {
            if (terminalInstance.processId === undefined) {
                return;
            }
            this._proxy.$acceptTerminalProcessId(terminalInstance.id, terminalInstance.processId);
        }
        _onInstanceDimensionsChanged(instance) {
            this._proxy.$acceptTerminalDimensions(instance.id, instance.cols, instance.rows);
        }
        _onTerminalRequestExtHostProcess(request) {
            // Only allow processes on remote ext hosts
            if (!this._remoteAuthority) {
                return;
            }
            this._terminalProcesses[request.proxy.terminalId] = request.proxy;
            const shellLaunchConfigDto = {
                name: request.shellLaunchConfig.name,
                executable: request.shellLaunchConfig.executable,
                args: request.shellLaunchConfig.args,
                cwd: request.shellLaunchConfig.cwd,
                env: request.shellLaunchConfig.env
            };
            this._proxy.$createProcess(request.proxy.terminalId, shellLaunchConfigDto, request.activeWorkspaceRootUri, request.cols, request.rows);
            request.proxy.onInput(data => this._proxy.$acceptProcessInput(request.proxy.terminalId, data));
            request.proxy.onResize(dimensions => this._proxy.$acceptProcessResize(request.proxy.terminalId, dimensions.cols, dimensions.rows));
            request.proxy.onShutdown(immediate => this._proxy.$acceptProcessShutdown(request.proxy.terminalId, immediate));
            request.proxy.onRequestCwd(() => this._proxy.$acceptProcessRequestCwd(request.proxy.terminalId));
            request.proxy.onRequestInitialCwd(() => this._proxy.$acceptProcessRequestInitialCwd(request.proxy.terminalId));
        }
        $sendProcessTitle(terminalId, title) {
            this._terminalProcesses[terminalId].emitTitle(title);
        }
        $sendProcessData(terminalId, data) {
            this._terminalProcesses[terminalId].emitData(data);
        }
        $sendProcessPid(terminalId, pid) {
            this._terminalProcesses[terminalId].emitPid(pid);
        }
        $sendProcessExit(terminalId, exitCode) {
            this._terminalProcesses[terminalId].emitExit(exitCode);
            delete this._terminalProcesses[terminalId];
        }
        $sendProcessInitialCwd(terminalId, initialCwd) {
            this._terminalProcesses[terminalId].emitInitialCwd(initialCwd);
        }
        $sendProcessCwd(terminalId, cwd) {
            this._terminalProcesses[terminalId].emitCwd(cwd);
        }
    };
    MainThreadTerminalService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadTerminalService),
        __param(1, terminal_1.ITerminalService)
    ], MainThreadTerminalService);
    exports.MainThreadTerminalService = MainThreadTerminalService;
});
//# sourceMappingURL=mainThreadTerminalService.js.map