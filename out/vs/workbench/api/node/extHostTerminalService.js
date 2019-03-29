/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/platform/product/node/package", "os", "vs/base/common/uri", "vs/base/common/platform", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/base/common/event", "vs/workbench/api/node/extHost.protocol", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/node/terminalProcess", "vs/base/common/async", "vs/base/common/processes"], function (require, exports, package_1, os, uri_1, platform, terminalEnvironment, event_1, extHost_protocol_1, terminal_1, terminalProcess_1, async_1, processes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const RENDERER_NO_PROCESS_ID = -1;
    class BaseExtHostTerminal {
        constructor(_proxy, id) {
            this._proxy = _proxy;
            this._disposed = false;
            this._queuedRequests = [];
            this._idPromise = new Promise(c => {
                if (id !== undefined) {
                    this._id = id;
                    c(id);
                }
                else {
                    this._idPromiseComplete = c;
                }
            });
        }
        dispose() {
            if (!this._disposed) {
                this._disposed = true;
                this._queueApiRequest(this._proxy.$dispose, []);
            }
        }
        _checkDisposed() {
            if (this._disposed) {
                throw new Error('Terminal has already been disposed');
            }
        }
        _queueApiRequest(callback, args) {
            const request = new ApiRequest(callback, args);
            if (!this._id) {
                this._queuedRequests.push(request);
                return;
            }
            request.run(this._proxy, this._id);
        }
        _runQueuedRequests(id) {
            this._id = id;
            this._idPromiseComplete(id);
            this._queuedRequests.forEach((r) => {
                r.run(this._proxy, this._id);
            });
            this._queuedRequests.length = 0;
        }
    }
    exports.BaseExtHostTerminal = BaseExtHostTerminal;
    class ExtHostTerminal extends BaseExtHostTerminal {
        constructor(proxy, _name, id, pid) {
            super(proxy, id);
            this._name = _name;
            this._onData = new event_1.Emitter();
            this._pidPromise = new Promise(c => {
                if (pid === RENDERER_NO_PROCESS_ID) {
                    c(undefined);
                }
                else {
                    this._pidPromiseComplete = c;
                }
            });
        }
        get onDidWriteData() {
            // Tell the main side to start sending data if it's not already
            this._idPromise.then(c => {
                this._proxy.$registerOnDataListener(this._id);
            });
            return this._onData && this._onData.event;
        }
        create(shellPath, shellArgs, cwd, env, waitOnExit, strictEnv) {
            this._proxy.$createTerminal(this._name, shellPath, shellArgs, cwd, env, waitOnExit, strictEnv).then(terminal => {
                this._name = terminal.name;
                this._runQueuedRequests(terminal.id);
            });
        }
        get name() {
            return this._name;
        }
        set name(name) {
            this._name = name;
        }
        get dimensions() {
            if (this._cols === undefined && this._rows === undefined) {
                return undefined;
            }
            return {
                columns: this._cols,
                rows: this._rows
            };
        }
        setDimensions(cols, rows) {
            if (cols === this._cols && rows === this._rows) {
                // Nothing changed
                return false;
            }
            this._cols = cols;
            this._rows = rows;
            return true;
        }
        get processId() {
            return this._pidPromise;
        }
        sendText(text, addNewLine = true) {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$sendText, [text, addNewLine]);
        }
        show(preserveFocus) {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$show, [preserveFocus]);
        }
        hide() {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$hide, []);
        }
        _setProcessId(processId) {
            // The event may fire 2 times when the panel is restored
            if (this._pidPromiseComplete) {
                this._pidPromiseComplete(processId);
                this._pidPromiseComplete = null;
            }
            else {
                // Recreate the promise if this is the nth processId set (eg. reused task terminals)
                this._pidPromise.then(pid => {
                    if (pid !== processId) {
                        this._pidPromise = Promise.resolve(processId);
                    }
                });
            }
        }
        _fireOnData(data) {
            this._onData.fire(data);
        }
    }
    exports.ExtHostTerminal = ExtHostTerminal;
    class ExtHostTerminalRenderer extends BaseExtHostTerminal {
        constructor(proxy, _name, _terminal, id) {
            super(proxy, id);
            this._name = _name;
            this._terminal = _terminal;
            this._onInput = new event_1.Emitter();
            this._onDidChangeMaximumDimensions = new event_1.Emitter();
            if (!id) {
                this._proxy.$createTerminalRenderer(this._name).then(id => {
                    this._runQueuedRequests(id);
                    this._terminal._runQueuedRequests(id);
                });
            }
        }
        get name() { return this._name; }
        set name(newName) {
            this._name = newName;
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$terminalRendererSetName, [this._name]);
        }
        get onDidAcceptInput() {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$terminalRendererRegisterOnInputListener, [this._id]);
            // Tell the main side to start sending data if it's not already
            // this._proxy.$terminalRendererRegisterOnDataListener(this._id);
            return this._onInput && this._onInput.event;
        }
        get dimensions() { return this._dimensions; }
        set dimensions(dimensions) {
            this._checkDisposed();
            this._dimensions = dimensions;
            this._queueApiRequest(this._proxy.$terminalRendererSetDimensions, [dimensions]);
        }
        get maximumDimensions() {
            if (!this._maximumDimensions) {
                return undefined;
            }
            return {
                rows: this._maximumDimensions.rows,
                columns: this._maximumDimensions.columns
            };
        }
        get onDidChangeMaximumDimensions() {
            return this._onDidChangeMaximumDimensions && this._onDidChangeMaximumDimensions.event;
        }
        get terminal() {
            return this._terminal;
        }
        write(data) {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$terminalRendererWrite, [data]);
        }
        _fireOnInput(data) {
            this._onInput.fire(data);
        }
        _setMaximumDimensions(columns, rows) {
            if (this._maximumDimensions && this._maximumDimensions.columns === columns && this._maximumDimensions.rows === rows) {
                return;
            }
            this._maximumDimensions = { columns, rows };
            this._onDidChangeMaximumDimensions.fire(this.maximumDimensions);
        }
    }
    exports.ExtHostTerminalRenderer = ExtHostTerminalRenderer;
    class ExtHostTerminalService {
        constructor(mainContext, _extHostConfiguration, _logService) {
            this._extHostConfiguration = _extHostConfiguration;
            this._logService = _logService;
            this._terminals = [];
            this._terminalProcesses = {};
            this._terminalRenderers = [];
            this._getTerminalPromises = {};
            this._onDidCloseTerminal = new event_1.Emitter();
            this._onDidOpenTerminal = new event_1.Emitter();
            this._onDidChangeActiveTerminal = new event_1.Emitter();
            this._onDidChangeTerminalDimensions = new event_1.Emitter();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTerminalService);
        }
        get activeTerminal() { return this._activeTerminal; }
        get terminals() { return this._terminals; }
        get onDidCloseTerminal() { return this._onDidCloseTerminal && this._onDidCloseTerminal.event; }
        get onDidOpenTerminal() { return this._onDidOpenTerminal && this._onDidOpenTerminal.event; }
        get onDidChangeActiveTerminal() { return this._onDidChangeActiveTerminal && this._onDidChangeActiveTerminal.event; }
        get onDidChangeTerminalDimensions() { return this._onDidChangeTerminalDimensions && this._onDidChangeTerminalDimensions.event; }
        createTerminal(name, shellPath, shellArgs) {
            const terminal = new ExtHostTerminal(this._proxy, name);
            terminal.create(shellPath, shellArgs);
            this._terminals.push(terminal);
            return terminal;
        }
        createTerminalFromOptions(options) {
            const terminal = new ExtHostTerminal(this._proxy, options.name);
            terminal.create(options.shellPath, options.shellArgs, options.cwd, options.env, /*options.waitOnExit*/ undefined, options.strictEnv);
            this._terminals.push(terminal);
            return terminal;
        }
        createTerminalRenderer(name) {
            const terminal = new ExtHostTerminal(this._proxy, name);
            terminal._setProcessId(undefined);
            this._terminals.push(terminal);
            const renderer = new ExtHostTerminalRenderer(this._proxy, name, terminal);
            this._terminalRenderers.push(renderer);
            return renderer;
        }
        resolveTerminalRenderer(id) {
            return __awaiter(this, void 0, void 0, function* () {
                // Check to see if the extension host already knows about this terminal.
                for (const terminalRenderer of this._terminalRenderers) {
                    if (terminalRenderer._id === id) {
                        return terminalRenderer;
                    }
                }
                const terminal = this._getTerminalById(id);
                const renderer = new ExtHostTerminalRenderer(this._proxy, terminal.name, terminal, terminal._id);
                this._terminalRenderers.push(renderer);
                return renderer;
            });
        }
        $acceptActiveTerminalChanged(id) {
            const original = this._activeTerminal;
            if (id === null) {
                this._activeTerminal = undefined;
                if (original !== this._activeTerminal) {
                    this._onDidChangeActiveTerminal.fire(this._activeTerminal);
                }
            }
            this._performTerminalIdAction(id, terminal => {
                if (terminal) {
                    this._activeTerminal = terminal;
                    if (original !== this._activeTerminal) {
                        this._onDidChangeActiveTerminal.fire(this._activeTerminal);
                    }
                }
            });
        }
        $acceptTerminalProcessData(id, data) {
            this._getTerminalByIdEventually(id).then(terminal => {
                if (terminal) {
                    terminal._fireOnData(data);
                }
            });
        }
        $acceptTerminalDimensions(id, cols, rows) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminal = this._getTerminalById(id);
                if (terminal) {
                    if (terminal.setDimensions(cols, rows)) {
                        this._onDidChangeTerminalDimensions.fire({
                            terminal: terminal,
                            dimensions: terminal.dimensions
                        });
                    }
                }
                // When a terminal's dimensions change, a renderer's _maximum_ dimensions change
                const renderer = this._getTerminalRendererById(id);
                if (renderer) {
                    renderer._setMaximumDimensions(cols, rows);
                }
            });
        }
        $acceptTerminalRendererInput(id, data) {
            const renderer = this._getTerminalRendererById(id);
            if (renderer) {
                renderer._fireOnInput(data);
            }
        }
        $acceptTerminalTitleChange(id, name) {
            const extHostTerminal = this._getTerminalObjectById(this.terminals, id);
            if (extHostTerminal) {
                extHostTerminal.name = name;
            }
        }
        $acceptTerminalClosed(id) {
            const index = this._getTerminalObjectIndexById(this.terminals, id);
            if (index !== null) {
                const terminal = this._terminals.splice(index, 1)[0];
                this._onDidCloseTerminal.fire(terminal);
            }
        }
        $acceptTerminalOpened(id, name) {
            const index = this._getTerminalObjectIndexById(this._terminals, id);
            if (index !== null) {
                // The terminal has already been created (via createTerminal*), only fire the event
                this._onDidOpenTerminal.fire(this.terminals[index]);
                return;
            }
            const renderer = this._getTerminalRendererById(id);
            const terminal = new ExtHostTerminal(this._proxy, name, id, renderer ? RENDERER_NO_PROCESS_ID : undefined);
            this._terminals.push(terminal);
            this._onDidOpenTerminal.fire(terminal);
        }
        $acceptTerminalProcessId(id, processId) {
            this._performTerminalIdAction(id, terminal => terminal._setProcessId(processId));
        }
        _performTerminalIdAction(id, callback) {
            let terminal = this._getTerminalById(id);
            if (terminal) {
                callback(terminal);
            }
            else {
                // Retry one more time in case the terminal has not yet been initialized.
                setTimeout(() => {
                    terminal = this._getTerminalById(id);
                    if (terminal) {
                        callback(terminal);
                    }
                }, terminal_1.EXT_HOST_CREATION_DELAY);
            }
        }
        $createProcess(id, shellLaunchConfigDto, activeWorkspaceRootUriComponents, cols, rows) {
            return __awaiter(this, void 0, void 0, function* () {
                const shellLaunchConfig = {
                    name: shellLaunchConfigDto.name,
                    executable: shellLaunchConfigDto.executable,
                    args: shellLaunchConfigDto.args,
                    cwd: typeof shellLaunchConfigDto.cwd === 'string' ? shellLaunchConfigDto.cwd : uri_1.URI.revive(shellLaunchConfigDto.cwd),
                    env: shellLaunchConfigDto.env
                };
                // TODO: This function duplicates a lot of TerminalProcessManager.createProcess, ideally
                // they would be merged into a single implementation.
                const configProvider = yield this._extHostConfiguration.getConfigProvider();
                const terminalConfig = configProvider.getConfiguration('terminal.integrated');
                if (!shellLaunchConfig.executable) {
                    // TODO: This duplicates some of TerminalConfigHelper.mergeDefaultShellPathAndArgs and should be merged
                    // this._configHelper.mergeDefaultShellPathAndArgs(shellLaunchConfig);
                    const platformKey = platform.isWindows ? 'windows' : platform.isMacintosh ? 'osx' : 'linux';
                    const shellConfigValue = terminalConfig.get(`shell.${platformKey}`);
                    const shellArgsConfigValue = terminalConfig.get(`shellArgs.${platformKey}`);
                    shellLaunchConfig.executable = shellConfigValue;
                    shellLaunchConfig.args = shellArgsConfigValue;
                }
                // TODO: @daniel
                const activeWorkspaceRootUri = uri_1.URI.revive(activeWorkspaceRootUriComponents);
                const initialCwd = terminalEnvironment.getCwd(shellLaunchConfig, os.homedir(), activeWorkspaceRootUri, terminalConfig.cwd);
                // TODO: Pull in and resolve config settings
                // // Resolve env vars from config and shell
                // const lastActiveWorkspaceRoot = this._workspaceContextService.getWorkspaceFolder(lastActiveWorkspaceRootUri);
                const platformKey = platform.isWindows ? 'windows' : (platform.isMacintosh ? 'osx' : 'linux');
                // const envFromConfig = terminalEnvironment.resolveConfigurationVariables(this._configurationResolverService, { ...terminalConfig.env[platformKey] }, lastActiveWorkspaceRoot);
                const envFromConfig = Object.assign({}, terminalConfig.env[platformKey]);
                // const envFromShell = terminalEnvironment.resolveConfigurationVariables(this._configurationResolverService, { ...shellLaunchConfig.env }, lastActiveWorkspaceRoot);
                // Merge process env with the env from config
                const env = Object.assign({}, process.env);
                terminalEnvironment.mergeEnvironments(env, envFromConfig);
                terminalEnvironment.mergeEnvironments(env, shellLaunchConfig.env);
                // Sanitize the environment, removing any undesirable VS Code and Electron environment
                // variables
                processes_1.sanitizeProcessEnvironment(env, 'VSCODE_IPC_HOOK_CLI');
                // Continue env initialization, merging in the env from the launch
                // config and adding keys that are needed to create the process
                terminalEnvironment.addTerminalEnvironmentKeys(env, package_1.default.version, platform.locale, terminalConfig.get('setLocaleVariables'));
                // Fork the process and listen for messages
                this._logService.debug(`Terminal process launching on ext host`, shellLaunchConfig, initialCwd, cols, rows, env);
                const p = new terminalProcess_1.TerminalProcess(shellLaunchConfig, initialCwd, cols, rows, env, terminalConfig.get('windowsEnableConpty'));
                p.onProcessIdReady(pid => this._proxy.$sendProcessPid(id, pid));
                p.onProcessTitleChanged(title => this._proxy.$sendProcessTitle(id, title));
                p.onProcessData(data => this._proxy.$sendProcessData(id, data));
                p.onProcessExit((exitCode) => this._onProcessExit(id, exitCode));
                this._terminalProcesses[id] = p;
            });
        }
        $acceptProcessInput(id, data) {
            this._terminalProcesses[id].input(data);
        }
        $acceptProcessResize(id, cols, rows) {
            try {
                this._terminalProcesses[id].resize(cols, rows);
            }
            catch (error) {
                // We tried to write to a closed pipe / channel.
                if (error.code !== 'EPIPE' && error.code !== 'ERR_IPC_CHANNEL_CLOSED') {
                    throw (error);
                }
            }
        }
        $acceptProcessShutdown(id, immediate) {
            this._terminalProcesses[id].shutdown(immediate);
        }
        $acceptProcessRequestInitialCwd(id) {
            this._terminalProcesses[id].getInitialCwd().then(initialCwd => this._proxy.$sendProcessInitialCwd(id, initialCwd));
        }
        $acceptProcessRequestCwd(id) {
            this._terminalProcesses[id].getCwd().then(cwd => this._proxy.$sendProcessCwd(id, cwd));
        }
        _onProcessExit(id, exitCode) {
            // Remove listeners
            this._terminalProcesses[id].dispose();
            // Remove process reference
            delete this._terminalProcesses[id];
            // Send exit event to main side
            this._proxy.$sendProcessExit(id, exitCode);
        }
        _getTerminalByIdEventually(id, retries = 5) {
            if (!this._getTerminalPromises[id]) {
                this._getTerminalPromises[id] = this._createGetTerminalPromise(id, retries);
            }
            else {
                this._getTerminalPromises[id].then(c => {
                    return this._createGetTerminalPromise(id, retries);
                });
            }
            return this._getTerminalPromises[id];
        }
        _createGetTerminalPromise(id, retries = 5) {
            return new Promise(c => {
                if (retries === 0) {
                    c(undefined);
                    return;
                }
                const terminal = this._getTerminalById(id);
                if (terminal) {
                    c(terminal);
                }
                else {
                    // This should only be needed immediately after createTerminalRenderer is called as
                    // the ExtHostTerminal has not yet been iniitalized
                    async_1.timeout(200).then(() => c(this._getTerminalByIdEventually(id, retries - 1)));
                }
            });
        }
        _getTerminalById(id) {
            return this._getTerminalObjectById(this._terminals, id);
        }
        _getTerminalRendererById(id) {
            return this._getTerminalObjectById(this._terminalRenderers, id);
        }
        _getTerminalObjectById(array, id) {
            const index = this._getTerminalObjectIndexById(array, id);
            return index !== null ? array[index] : null;
        }
        _getTerminalObjectIndexById(array, id) {
            let index = null;
            array.some((item, i) => {
                const thisId = item._id;
                if (thisId === id) {
                    index = i;
                    return true;
                }
                return false;
            });
            return index;
        }
    }
    exports.ExtHostTerminalService = ExtHostTerminalService;
    class ApiRequest {
        constructor(callback, args) {
            this._callback = callback;
            this._args = args;
        }
        run(proxy, id) {
            this._callback.apply(proxy, [id].concat(this._args));
        }
    }
});
//# sourceMappingURL=extHostTerminalService.js.map