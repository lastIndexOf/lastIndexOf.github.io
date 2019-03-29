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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/parts/ipc/node/ipc", "vs/platform/environment/common/environment", "vs/platform/notification/common/notification", "vs/platform/remote/node/remoteAgentConnection", "vs/platform/windows/common/windows", "vs/workbench/services/remote/node/remoteAgentEnvironmentChannel", "vs/workbench/services/remote/node/remoteAgentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/instantiation/common/extensions", "vs/platform/lifecycle/common/lifecycle", "vs/platform/dialogs/node/dialogIpc", "vs/platform/download/node/downloadIpc", "vs/platform/log/node/logIpc", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, lifecycle_1, ipc_1, environment_1, notification_1, remoteAgentConnection_1, windows_1, remoteAgentEnvironmentChannel_1, remoteAgentService_1, remoteAuthorityResolver_1, extensions_1, lifecycle_2, dialogIpc_1, downloadIpc_1, logIpc_1, log_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RemoteAgentService = class RemoteAgentService {
        constructor(windowService, notificationService, environmentService, remoteAuthorityResolverService, lifecycleService, logService, instantiationService) {
            this._connection = null;
            const { remoteAuthority } = windowService.getConfiguration();
            if (remoteAuthority) {
                const connection = this._connection = new RemoteAgentConnection(remoteAuthority, notificationService, environmentService, remoteAuthorityResolverService);
                lifecycleService.when(2 /* Ready */).then(() => {
                    connection.registerChannel('dialog', instantiationService.createInstance(dialogIpc_1.DialogChannel));
                    connection.registerChannel('download', new downloadIpc_1.DownloadServiceChannel());
                    connection.registerChannel('loglevel', new logIpc_1.LogLevelSetterChannel(logService));
                });
            }
        }
        getConnection() {
            return this._connection;
        }
    };
    RemoteAgentService = __decorate([
        __param(0, windows_1.IWindowService),
        __param(1, notification_1.INotificationService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, log_1.ILogService),
        __param(6, instantiation_1.IInstantiationService)
    ], RemoteAgentService);
    exports.RemoteAgentService = RemoteAgentService;
    class RemoteAgentConnection extends lifecycle_1.Disposable {
        constructor(remoteAuthority, _notificationService, _environmentService, _remoteAuthorityResolverService) {
            super();
            this._notificationService = _notificationService;
            this._environmentService = _environmentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this.remoteAuthority = remoteAuthority;
            this._connection = null;
            this._environment = null;
        }
        getEnvironment() {
            if (!this._environment) {
                const client = new remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient(this.getChannel('remoteextensionsenvironment'));
                // Let's cover the case where connecting to fetch the remote extension info fails
                this._environment = client.getEnvironmentData(this.remoteAuthority, this._environmentService.extensionDevelopmentLocationURI)
                    .then(undefined, err => { this._notificationService.error(nls_1.localize('connectionError', "Failed to connect to the remote extension host agent (Error: {0})", err ? err.message : '')); return null; });
            }
            return this._environment;
        }
        getChannel(channelName) {
            return ipc_1.getDelayedChannel(this._getOrCreateConnection().then(c => c.getChannel(channelName)));
        }
        registerChannel(channelName, channel) {
            this._getOrCreateConnection().then(client => client.registerChannel(channelName, channel));
        }
        _getOrCreateConnection() {
            if (!this._connection) {
                this._connection = this._remoteAuthorityResolverService.resolveAuthority(this.remoteAuthority).then((resolvedAuthority) => {
                    return remoteAgentConnection_1.connectRemoteAgentManagement(this.remoteAuthority, resolvedAuthority.host, resolvedAuthority.port, `renderer`, this._environmentService.isBuilt);
                });
            }
            return this._connection;
        }
    }
    extensions_1.registerSingleton(remoteAgentService_1.IRemoteAgentService, RemoteAgentService);
});
//# sourceMappingURL=remoteAgentServiceImpl.js.map