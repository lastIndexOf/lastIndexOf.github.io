/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/objects", "vs/base/common/platform", "vs/platform/product/node/product", "vs/platform/environment/node/argvHelper", "vs/platform/environment/node/argv", "vs/base/node/pfs", "vs/code/node/paths", "vs/platform/lifecycle/electron-main/lifecycleMain", "vs/base/parts/ipc/node/ipc.net", "vs/platform/launch/electron-main/launchService", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/common/descriptors", "vs/platform/log/common/log", "vs/platform/state/node/stateService", "vs/platform/state/common/state", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/node/configurationService", "vs/platform/request/node/request", "vs/platform/request/electron-main/requestService", "fs", "vs/code/electron-main/app", "vs/nls", "vs/base/common/labels", "vs/platform/log/node/spdlogService", "vs/platform/diagnostics/electron-main/diagnosticsService", "vs/platform/log/common/bufferLog", "vs/code/electron-main/logUploader", "vs/base/common/errors", "vs/code/code.main"], function (require, exports, electron_1, objects_1, platform, product_1, argvHelper_1, argv_1, pfs_1, paths_1, lifecycleMain_1, ipc_net_1, launchService_1, instantiation_1, instantiationService_1, serviceCollection_1, descriptors_1, log_1, stateService_1, state_1, environment_1, environmentService_1, configuration_1, configurationService_1, request_1, requestService_1, fs, app_1, nls_1, labels_1, spdlogService_1, diagnosticsService_1, bufferLog_1, logUploader_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExpectedError extends Error {
        constructor() {
            super(...arguments);
            this.isExpected = true;
        }
    }
    function setupIPC(accessor) {
        const logService = accessor.get(log_1.ILogService);
        const environmentService = accessor.get(environment_1.IEnvironmentService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        function allowSetForegroundWindow(service) {
            let promise = Promise.resolve();
            if (platform.isWindows) {
                promise = service.getMainProcessId()
                    .then(processId => {
                    logService.trace('Sending some foreground love to the running instance:', processId);
                    try {
                        const { allowSetForegroundWindow } = require.__$__nodeRequire('windows-foreground-love');
                        allowSetForegroundWindow(processId);
                    }
                    catch (e) {
                        // noop
                    }
                });
            }
            return promise;
        }
        function setup(retry) {
            return ipc_net_1.serve(environmentService.mainIPCHandle).then(server => {
                // Print --status usage info
                if (environmentService.args.status) {
                    logService.warn('Warning: The --status argument can only be used if Code is already running. Please run it again after Code has started.');
                    throw new ExpectedError('Terminating...');
                }
                // Log uploader usage info
                if (typeof environmentService.args['upload-logs'] !== 'undefined') {
                    logService.warn('Warning: The --upload-logs argument can only be used if Code is already running. Please run it again after Code has started.');
                    throw new ExpectedError('Terminating...');
                }
                // dock might be hidden at this case due to a retry
                if (platform.isMacintosh) {
                    electron_1.app.dock.show();
                }
                // Set the VSCODE_PID variable here when we are sure we are the first
                // instance to startup. Otherwise we would wrongly overwrite the PID
                process.env['VSCODE_PID'] = String(process.pid);
                return server;
            }, err => {
                // Handle unexpected errors (the only expected error is EADDRINUSE that
                // indicates a second instance of Code is running)
                if (err.code !== 'EADDRINUSE') {
                    // Show a dialog for errors that can be resolved by the user
                    handleStartupDataDirError(environmentService, err);
                    // Any other runtime error is just printed to the console
                    return Promise.reject(err);
                }
                // Since we are the second instance, we do not want to show the dock
                if (platform.isMacintosh) {
                    electron_1.app.dock.hide();
                }
                // there's a running instance, let's connect to it
                return ipc_net_1.connect(environmentService.mainIPCHandle, 'main').then(client => {
                    // Tests from CLI require to be the only instance currently
                    if (environmentService.extensionTestsLocationURI && !environmentService.debugExtensionHost.break) {
                        const msg = 'Running extension tests from the command line is currently only supported if no other instance of Code is running.';
                        logService.error(msg);
                        client.dispose();
                        return Promise.reject(new Error(msg));
                    }
                    // Show a warning dialog after some timeout if it takes long to talk to the other instance
                    // Skip this if we are running with --wait where it is expected that we wait for a while.
                    // Also skip when gathering diagnostics (--status) which can take a longer time.
                    let startupWarningDialogHandle;
                    if (!environmentService.wait && !environmentService.status && !environmentService.args['upload-logs']) {
                        startupWarningDialogHandle = setTimeout(() => {
                            showStartupWarningDialog(nls_1.localize('secondInstanceNoResponse', "Another instance of {0} is running but not responding", product_1.default.nameShort), nls_1.localize('secondInstanceNoResponseDetail', "Please close all other instances and try again."));
                        }, 10000);
                    }
                    const channel = client.getChannel('launch');
                    const service = new launchService_1.LaunchChannelClient(channel);
                    // Process Info
                    if (environmentService.args.status) {
                        return service.getMainProcessInfo().then(info => {
                            return instantiationService.invokeFunction(accessor => {
                                return accessor.get(diagnosticsService_1.IDiagnosticsService).printDiagnostics(info).then(() => Promise.reject(new ExpectedError()));
                            });
                        });
                    }
                    // Log uploader
                    if (typeof environmentService.args['upload-logs'] !== 'undefined') {
                        return instantiationService.invokeFunction(accessor => {
                            return logUploader_1.uploadLogs(service, accessor.get(request_1.IRequestService), environmentService)
                                .then(() => Promise.reject(new ExpectedError()));
                        });
                    }
                    logService.trace('Sending env to running instance...');
                    return allowSetForegroundWindow(service)
                        .then(() => service.start(environmentService.args, process.env))
                        .then(() => client.dispose())
                        .then(() => {
                        // Now that we started, make sure the warning dialog is prevented
                        if (startupWarningDialogHandle) {
                            clearTimeout(startupWarningDialogHandle);
                        }
                        return Promise.reject(new ExpectedError('Sent env to running instance. Terminating...'));
                    });
                }, err => {
                    if (!retry || platform.isWindows || err.code !== 'ECONNREFUSED') {
                        if (err.code === 'EPERM') {
                            showStartupWarningDialog(nls_1.localize('secondInstanceAdmin', "A second instance of {0} is already running as administrator.", product_1.default.nameShort), nls_1.localize('secondInstanceAdminDetail', "Please close the other instance and try again."));
                        }
                        return Promise.reject(err);
                    }
                    // it happens on Linux and OS X that the pipe is left behind
                    // let's delete it, since we can't connect to it
                    // and then retry the whole thing
                    try {
                        fs.unlinkSync(environmentService.mainIPCHandle);
                    }
                    catch (e) {
                        logService.warn('Could not delete obsolete instance handle', e);
                        return Promise.reject(e);
                    }
                    return setup(false);
                });
            });
        }
        return setup(true);
    }
    function showStartupWarningDialog(message, detail) {
        electron_1.dialog.showMessageBox({
            title: product_1.default.nameLong,
            type: 'warning',
            buttons: [labels_1.mnemonicButtonLabel(nls_1.localize({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"))],
            message,
            detail,
            noLink: true
        });
    }
    function handleStartupDataDirError(environmentService, error) {
        if (error.code === 'EACCES' || error.code === 'EPERM') {
            showStartupWarningDialog(nls_1.localize('startupDataDirError', "Unable to write program user data."), nls_1.localize('startupDataDirErrorDetail', "Please make sure the directories {0} and {1} are writeable.", environmentService.userDataPath, environmentService.extensionsPath));
        }
    }
    function quit(accessor, reason) {
        const logService = accessor.get(log_1.ILogService);
        const lifecycleService = accessor.get(lifecycleMain_1.ILifecycleService);
        let exitCode = 0;
        if (reason) {
            if (reason.isExpected) {
                if (reason.message) {
                    logService.trace(reason.message);
                }
            }
            else {
                exitCode = 1; // signal error to the outside
                if (reason.stack) {
                    logService.error(reason.stack);
                }
                else {
                    logService.error(`Startup error: ${reason.toString()}`);
                }
            }
        }
        lifecycleService.kill(exitCode);
    }
    function patchEnvironment(environmentService) {
        const instanceEnvironment = {
            VSCODE_IPC_HOOK: environmentService.mainIPCHandle,
            VSCODE_NLS_CONFIG: process.env['VSCODE_NLS_CONFIG'],
            VSCODE_LOGS: process.env['VSCODE_LOGS']
        };
        if (process.env['VSCODE_PORTABLE']) {
            instanceEnvironment['VSCODE_PORTABLE'] = process.env['VSCODE_PORTABLE'];
        }
        objects_1.assign(process.env, instanceEnvironment);
        return instanceEnvironment;
    }
    function startup(args) {
        // We need to buffer the spdlog logs until we are sure
        // we are the only instance running, otherwise we'll have concurrent
        // log file access on Windows (https://github.com/Microsoft/vscode/issues/41218)
        const bufferLogService = new bufferLog_1.BufferLogService();
        const instantiationService = createServices(args, bufferLogService);
        instantiationService.invokeFunction(accessor => {
            const environmentService = accessor.get(environment_1.IEnvironmentService);
            const stateService = accessor.get(state_1.IStateService);
            // Patch `process.env` with the instance's environment
            const instanceEnvironment = patchEnvironment(environmentService);
            // Startup
            return initServices(environmentService, stateService)
                .then(() => instantiationService.invokeFunction(setupIPC), error => {
                // Show a dialog for errors that can be resolved by the user
                handleStartupDataDirError(environmentService, error);
                return Promise.reject(error);
            })
                .then(mainIpcServer => {
                bufferLogService.logger = spdlogService_1.createSpdLogService('main', bufferLogService.getLevel(), environmentService.logsPath);
                return instantiationService.createInstance(app_1.CodeApplication, mainIpcServer, instanceEnvironment).startup();
            });
        }).then(() => {
            console.log('didloadMainBundle');
        }, err => instantiationService.invokeFunction(quit, err));
    }
    function createServices(args, bufferLogService) {
        const services = new serviceCollection_1.ServiceCollection();
        const environmentService = new environmentService_1.EnvironmentService(args, process.execPath);
        const logService = new log_1.MultiplexLogService([new log_1.ConsoleLogMainService(log_1.getLogLevel(environmentService)), bufferLogService]);
        process.once('exit', () => logService.dispose());
        services.set(environment_1.IEnvironmentService, environmentService);
        services.set(log_1.ILogService, logService);
        services.set(lifecycleMain_1.ILifecycleService, new descriptors_1.SyncDescriptor(lifecycleMain_1.LifecycleService));
        services.set(state_1.IStateService, new descriptors_1.SyncDescriptor(stateService_1.StateService));
        services.set(configuration_1.IConfigurationService, new descriptors_1.SyncDescriptor(configurationService_1.ConfigurationService));
        services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
        services.set(diagnosticsService_1.IDiagnosticsService, new descriptors_1.SyncDescriptor(diagnosticsService_1.DiagnosticsService));
        return new instantiationService_1.InstantiationService(services, true);
    }
    function initServices(environmentService, stateService) {
        // Ensure paths for environment service exist
        const environmentServiceInitialization = Promise.all([
            environmentService.extensionsPath,
            environmentService.nodeCachedDataDir,
            environmentService.logsPath,
            environmentService.globalStorageHome,
            environmentService.workspaceStorageHome,
            environmentService.backupHome
        ].map((path) => path ? pfs_1.mkdirp(path) : undefined));
        // State service
        const stateServiceInitialization = stateService.init();
        return Promise.all([environmentServiceInitialization, stateServiceInitialization]);
    }
    function main() {
        // Set the error handler early enough so that we are not getting the
        // default electron error dialog popping up
        errors_1.setUnexpectedErrorHandler(err => console.error(err));
        // Parse arguments
        let args;
        try {
            args = argvHelper_1.parseMainProcessArgv(process.argv);
            args = paths_1.validatePaths(args);
        }
        catch (err) {
            console.error(err.message);
            electron_1.app.exit(1);
            return undefined;
        }
        // If we are started with --wait create a random temporary file
        // and pass it over to the starting instance. We can use this file
        // to wait for it to be deleted to monitor that the edited file
        // is closed and then exit the waiting process.
        //
        // Note: we are not doing this if the wait marker has been already
        // added as argument. This can happen if Code was started from CLI.
        if (args.wait && !args.waitMarkerFilePath) {
            argvHelper_1.createWaitMarkerFile(args.verbose).then(waitMarkerFilePath => {
                if (waitMarkerFilePath) {
                    argv_1.addArg(process.argv, '--waitMarkerFilePath', waitMarkerFilePath);
                    args.waitMarkerFilePath = waitMarkerFilePath;
                }
                startup(args);
            });
        }
        // Otherwise just startup normally
        else {
            startup(args);
        }
    }
    main();
});
//# sourceMappingURL=main.js.map