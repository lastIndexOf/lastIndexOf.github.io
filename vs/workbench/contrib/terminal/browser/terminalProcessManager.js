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
define(["require", "exports", "vs/base/common/platform", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/platform/log/common/log", "vs/base/common/event", "vs/workbench/services/history/common/history", "vs/workbench/contrib/terminal/common/terminalProcessExtHostProxy", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/platform/windows/common/windows", "vs/base/common/network", "vs/platform/remote/common/remoteHosts", "vs/base/common/processes", "vs/platform/environment/common/environment", "vs/platform/product/common/product", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/configuration/common/configuration"], function (require, exports, platform, terminalEnvironment, log_1, event_1, history_1, terminalProcessExtHostProxy_1, instantiation_1, workspace_1, configurationResolver_1, windows_1, network_1, remoteHosts_1, processes_1, environment_1, product_1, terminal_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** The amount of time to consider terminal errors to be related to the launch */
    const LAUNCHING_DURATION = 500;
    /**
     * Holds all state related to the creation and management of terminal processes.
     *
     * Internal definitions:
     * - Process: The process launched with the terminalProcess.ts file, or the pty as a whole
     * - Pty Process: The pseudoterminal master process (or the winpty agent process)
     * - Shell Process: The pseudoterminal slave process (ie. the shell)
     */
    let TerminalProcessManager = class TerminalProcessManager {
        constructor(_terminalId, _configHelper, _historyService, _instantiationService, _logService, _workspaceContextService, _configurationResolverService, _windowService, _workspaceConfigurationService, _environmentService, _productService, _terminalInstanceService) {
            this._terminalId = _terminalId;
            this._configHelper = _configHelper;
            this._historyService = _historyService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._workspaceContextService = _workspaceContextService;
            this._configurationResolverService = _configurationResolverService;
            this._windowService = _windowService;
            this._workspaceConfigurationService = _workspaceConfigurationService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._terminalInstanceService = _terminalInstanceService;
            this.processState = 0 /* UNINITIALIZED */;
            this._process = null;
            this._preLaunchInputQueue = [];
            this._disposables = [];
            this._onProcessReady = new event_1.Emitter();
            this._onProcessData = new event_1.Emitter();
            this._onProcessTitle = new event_1.Emitter();
            this._onProcessExit = new event_1.Emitter();
            this.ptyProcessReady = new Promise(c => {
                this.onProcessReady(() => {
                    this._logService.debug(`Terminal process ready (shellProcessId: ${this.shellProcessId})`);
                    c(undefined);
                });
            });
        }
        get onProcessReady() { return this._onProcessReady.event; }
        get onProcessData() { return this._onProcessData.event; }
        get onProcessTitle() { return this._onProcessTitle.event; }
        get onProcessExit() { return this._onProcessExit.event; }
        dispose(immediate = false) {
            if (this._process) {
                // If the process was still connected this dispose came from
                // within VS Code, not the process, so mark the process as
                // killed by the user.
                this.processState = 4 /* KILLED_BY_USER */;
                this._process.shutdown(immediate);
                this._process = null;
            }
            this._disposables.forEach(d => d.dispose());
            this._disposables.length = 0;
        }
        addDisposable(disposable) {
            this._disposables.push(disposable);
        }
        createProcess(shellLaunchConfig, cols, rows) {
            let launchRemotely = false;
            const forceExtHostProcess = this._configHelper.config.extHostProcess;
            if (shellLaunchConfig.cwd && typeof shellLaunchConfig.cwd === 'object') {
                launchRemotely = !!remoteHosts_1.getRemoteAuthority(shellLaunchConfig.cwd);
            }
            else {
                launchRemotely = !!this._windowService.getConfiguration().remoteAuthority;
            }
            if (launchRemotely || forceExtHostProcess) {
                const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(forceExtHostProcess ? undefined : remoteHosts_1.REMOTE_HOST_SCHEME);
                this._process = this._instantiationService.createInstance(terminalProcessExtHostProxy_1.TerminalProcessExtHostProxy, this._terminalId, shellLaunchConfig, activeWorkspaceRootUri, cols, rows);
            }
            else {
                if (!shellLaunchConfig.executable) {
                    this._configHelper.mergeDefaultShellPathAndArgs(shellLaunchConfig);
                }
                const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
                const initialCwd = terminalEnvironment.getCwd(shellLaunchConfig, this._environmentService.userHome, activeWorkspaceRootUri, this._configHelper.config.cwd);
                // Compel type system as process.env should not have any undefined entries
                let env = {};
                if (shellLaunchConfig.strictEnv) {
                    // Only base the terminal process environment on this environment and add the
                    // various mixins when strictEnv is false
                    env = Object.assign({}, shellLaunchConfig.env);
                }
                else {
                    // Merge process env with the env from config and from shellLaunchConfig
                    env = Object.assign({}, process.env);
                    // Resolve env vars from config and shell
                    const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) : null;
                    const platformKey = platform.isWindows ? 'windows' : (platform.isMacintosh ? 'osx' : 'linux');
                    const isWorkspaceShellAllowed = this._configHelper.checkWorkspaceShellPermissions();
                    const envFromConfigValue = this._workspaceConfigurationService.inspect(`terminal.integrated.env.${platformKey}`);
                    const allowedEnvFromConfig = (isWorkspaceShellAllowed ? envFromConfigValue.value : envFromConfigValue.user);
                    const envFromConfig = terminalEnvironment.resolveConfigurationVariables(this._configurationResolverService, Object.assign({}, allowedEnvFromConfig), lastActiveWorkspaceRoot);
                    const envFromShell = terminalEnvironment.resolveConfigurationVariables(this._configurationResolverService, Object.assign({}, shellLaunchConfig.env), lastActiveWorkspaceRoot);
                    shellLaunchConfig.env = envFromShell;
                    terminalEnvironment.mergeEnvironments(env, envFromConfig);
                    terminalEnvironment.mergeEnvironments(env, shellLaunchConfig.env);
                    // Sanitize the environment, removing any undesirable VS Code and Electron environment
                    // variables
                    processes_1.sanitizeProcessEnvironment(env, 'VSCODE_IPC_HOOK_CLI');
                    // Adding other env keys necessary to create the process
                    terminalEnvironment.addTerminalEnvironmentKeys(env, this._productService.version, platform.locale, this._configHelper.config.setLocaleVariables);
                }
                this._logService.debug(`Terminal process launching`, shellLaunchConfig, initialCwd, cols, rows, env);
                this._process = this._terminalInstanceService.createTerminalProcess(shellLaunchConfig, initialCwd, cols, rows, env, this._configHelper.config.windowsEnableConpty);
            }
            this.processState = 1 /* LAUNCHING */;
            // The process is non-null, but TS isn't clever enough to know
            const p = this._process;
            p.onProcessData(data => {
                this._onProcessData.fire(data);
            });
            p.onProcessIdReady(pid => {
                this.shellProcessId = pid;
                this._onProcessReady.fire();
                // Send any queued data that's waiting
                if (this._preLaunchInputQueue.length > 0) {
                    p.input(this._preLaunchInputQueue.join(''));
                    this._preLaunchInputQueue.length = 0;
                }
            });
            p.onProcessTitleChanged(title => this._onProcessTitle.fire(title));
            p.onProcessExit(exitCode => this._onExit(exitCode));
            setTimeout(() => {
                if (this.processState === 1 /* LAUNCHING */) {
                    this.processState = 2 /* RUNNING */;
                }
            }, LAUNCHING_DURATION);
        }
        setDimensions(cols, rows) {
            if (!this._process) {
                return;
            }
            // The child process could already be terminated
            try {
                this._process.resize(cols, rows);
            }
            catch (error) {
                // We tried to write to a closed pipe / channel.
                if (error.code !== 'EPIPE' && error.code !== 'ERR_IPC_CHANNEL_CLOSED') {
                    throw (error);
                }
            }
        }
        write(data) {
            if (this.shellProcessId) {
                if (this._process) {
                    // Send data if the pty is ready
                    this._process.input(data);
                }
            }
            else {
                // If the pty is not ready, queue the data received to send later
                this._preLaunchInputQueue.push(data);
            }
        }
        getInitialCwd() {
            if (!this._process) {
                return Promise.resolve('');
            }
            return this._process.getInitialCwd();
        }
        getCwd() {
            if (!this._process) {
                return Promise.resolve('');
            }
            return this._process.getCwd();
        }
        _onExit(exitCode) {
            this._process = null;
            // If the process is marked as launching then mark the process as killed
            // during launch. This typically means that there is a problem with the
            // shell and args.
            if (this.processState === 1 /* LAUNCHING */) {
                this.processState = 3 /* KILLED_DURING_LAUNCH */;
            }
            // If TerminalInstance did not know about the process exit then it was
            // triggered by the process, not on VS Code's side.
            if (this.processState === 2 /* RUNNING */) {
                this.processState = 5 /* KILLED_BY_PROCESS */;
            }
            this._onProcessExit.fire(exitCode);
        }
    };
    TerminalProcessManager = __decorate([
        __param(2, history_1.IHistoryService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, configurationResolver_1.IConfigurationResolverService),
        __param(7, windows_1.IWindowService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, environment_1.IEnvironmentService),
        __param(10, product_1.IProductService),
        __param(11, terminal_1.ITerminalInstanceService)
    ], TerminalProcessManager);
    exports.TerminalProcessManager = TerminalProcessManager;
});
//# sourceMappingURL=terminalProcessManager.js.map