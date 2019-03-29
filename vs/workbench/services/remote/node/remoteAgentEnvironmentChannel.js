/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, platform, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoteExtensionEnvironmentChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        getEnvironmentData(remoteAuthority, extensionDevelopmentPath) {
            const args = {
                language: platform.language,
                remoteAuthority,
                extensionDevelopmentPath
            };
            return this.channel.call('getEnvironmentData', args)
                .then((data) => {
                return {
                    pid: data.pid,
                    appRoot: uri_1.URI.revive(data.appRoot),
                    appSettingsHome: uri_1.URI.revive(data.appSettingsHome),
                    logsPath: uri_1.URI.revive(data.logsPath),
                    extensionsPath: uri_1.URI.revive(data.extensionsPath),
                    extensionHostLogsPath: uri_1.URI.revive(data.extensionHostLogsPath),
                    globalStorageHome: uri_1.URI.revive(data.globalStorageHome),
                    userHome: uri_1.URI.revive(data.userHome),
                    extensions: data.extensions.map(ext => { ext.extensionLocation = uri_1.URI.revive(ext.extensionLocation); return ext; }),
                    os: data.os,
                    syncExtensions: data.syncExtensions
                };
            });
        }
    }
    exports.RemoteExtensionEnvironmentChannelClient = RemoteExtensionEnvironmentChannelClient;
});
//# sourceMappingURL=remoteAgentEnvironmentChannel.js.map