/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/uri", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/node/extHostConfiguration", "vs/workbench/api/node/extHostExtensionService", "vs/workbench/api/node/extHostLogService", "vs/workbench/api/node/extHostWorkspace", "vs/workbench/services/extensions/node/rpcProtocol"], function (require, exports, async_1, errors, lifecycle_1, numbers_1, uri_1, extHost_protocol_1, extHostConfiguration_1, extHostExtensionService_1, extHostLogService_1, extHostWorkspace_1, rpcProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // we don't (yet) throw when extensions parse
    // uris that have no scheme
    uri_1.setUriThrowOnMissingScheme(false);
    const nativeExit = process.exit.bind(process);
    function patchProcess(allowExit) {
        process.exit = function (code) {
            if (allowExit) {
                exit(code);
            }
            else {
                const err = new Error('An extension called process.exit() and this was prevented.');
                console.warn(err.stack);
            }
        };
        process.crash = function () {
            const err = new Error('An extension called process.crash() and this was prevented.');
            console.warn(err.stack);
        };
    }
    function exit(code) {
        nativeExit(code);
    }
    exports.exit = exit;
    class ExtensionHostMain {
        constructor(protocol, initData) {
            this.disposables = [];
            this._isTerminating = false;
            const uriTransformer = null;
            const rpcProtocol = new rpcProtocol_1.RPCProtocol(protocol, null, uriTransformer);
            // ensure URIs are transformed and revived
            initData = this.transform(initData, rpcProtocol);
            this._environment = initData.environment;
            const allowExit = !!this._environment.extensionTestsLocationURI; // to support other test frameworks like Jasmin that use process.exit (https://github.com/Microsoft/vscode/issues/37708)
            patchProcess(allowExit);
            this._patchPatchedConsole(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadConsole));
            // services
            this._extHostLogService = new extHostLogService_1.ExtHostLogService(initData.logLevel, initData.logsLocation.fsPath);
            this.disposables.push(this._extHostLogService);
            this._searchRequestIdProvider = new numbers_1.Counter();
            const extHostWorkspace = new extHostWorkspace_1.ExtHostWorkspace(rpcProtocol, this._extHostLogService, this._searchRequestIdProvider, initData.workspace);
            this._extHostLogService.info('extension host started');
            this._extHostLogService.trace('initData', initData);
            const extHostConfiguraiton = new extHostConfiguration_1.ExtHostConfiguration(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadConfiguration), extHostWorkspace);
            this._extensionService = new extHostExtensionService_1.ExtHostExtensionService(nativeExit, initData, rpcProtocol, extHostWorkspace, extHostConfiguraiton, this._extHostLogService);
            // error forwarding and stack trace scanning
            Error.stackTraceLimit = 100; // increase number of stack frames (from 10, https://github.com/v8/v8/wiki/Stack-Trace-API)
            const extensionErrors = new WeakMap();
            this._extensionService.getExtensionPathIndex().then(map => {
                Error.prepareStackTrace = (error, stackTrace) => {
                    let stackTraceMessage = '';
                    let extension;
                    let fileName;
                    for (const call of stackTrace) {
                        stackTraceMessage += `\n\tat ${call.toString()}`;
                        fileName = call.getFileName();
                        if (!extension && fileName) {
                            extension = map.findSubstr(fileName);
                        }
                    }
                    extensionErrors.set(error, extension);
                    return `${error.name || 'Error'}: ${error.message || ''}${stackTraceMessage}`;
                };
            });
            const mainThreadExtensions = rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            const mainThreadErrors = rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadErrors);
            errors.setUnexpectedErrorHandler(err => {
                const data = errors.transformErrorForSerialization(err);
                const extension = extensionErrors.get(err);
                if (extension) {
                    mainThreadExtensions.$onExtensionRuntimeError(extension.identifier, data);
                }
                else {
                    mainThreadErrors.$onUnexpectedError(data);
                }
            });
        }
        _patchPatchedConsole(mainThreadConsole) {
            // The console is already patched to use `process.send()`
            const nativeProcessSend = process.send;
            process.send = (...args) => {
                if (args.length === 0 || !args[0] || args[0].type !== '__$console') {
                    return nativeProcessSend.apply(process, args);
                }
                mainThreadConsole.$logExtensionHostMessage(args[0]);
            };
        }
        terminate() {
            if (this._isTerminating) {
                // we are already shutting down...
                return;
            }
            this._isTerminating = true;
            this.disposables = lifecycle_1.dispose(this.disposables);
            errors.setUnexpectedErrorHandler((err) => {
                // TODO: write to log once we have one
            });
            const extensionsDeactivated = this._extensionService.deactivateAll();
            // Give extensions 1 second to wrap up any async dispose, then exit in at most 4 seconds
            setTimeout(() => {
                Promise.race([async_1.timeout(4000), extensionsDeactivated]).then(() => exit(), () => exit());
            }, 1000);
        }
        transform(initData, rpcProtocol) {
            initData.extensions.forEach((ext) => ext.extensionLocation = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(ext.extensionLocation)));
            initData.environment.appRoot = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.appRoot));
            initData.environment.appSettingsHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.appSettingsHome));
            initData.environment.extensionDevelopmentLocationURI = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.extensionDevelopmentLocationURI));
            initData.environment.extensionTestsLocationURI = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.extensionTestsLocationURI));
            initData.environment.globalStorageHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.globalStorageHome));
            initData.environment.userHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.userHome));
            initData.logsLocation = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.logsLocation));
            initData.workspace = rpcProtocol.transformIncomingURIs(initData.workspace);
            return initData;
        }
    }
    exports.ExtensionHostMain = ExtensionHostMain;
});
//# sourceMappingURL=extensionHostMain.js.map