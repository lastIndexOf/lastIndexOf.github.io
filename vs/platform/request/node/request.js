/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, nls_1, instantiation_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IRequestService = instantiation_1.createDecorator('requestService2');
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'http',
        order: 15,
        title: nls_1.localize('httpConfigurationTitle', "HTTP"),
        type: 'object',
        properties: {
            'http.proxy': {
                type: 'string',
                pattern: '^https?://([^:]*(:[^@]*)?@)?([^:]+)(:\\d+)?/?$|^$',
                description: nls_1.localize('proxy', "The proxy setting to use. If not set will be taken from the http_proxy and https_proxy environment variables.")
            },
            'http.proxyStrictSSL': {
                type: 'boolean',
                default: true,
                description: nls_1.localize('strictSSL', "Controls whether the proxy server certificate should be verified against the list of supplied CAs.")
            },
            'http.proxyAuthorization': {
                type: ['null', 'string'],
                default: null,
                description: nls_1.localize('proxyAuthorization', "The value to send as the 'Proxy-Authorization' header for every network request.")
            },
            'http.proxySupport': {
                type: 'string',
                enum: ['off', 'on', 'override'],
                enumDescriptions: [
                    nls_1.localize('proxySupportOff', "Disable proxy support for extensions."),
                    nls_1.localize('proxySupportOn', "Enable proxy support for extensions."),
                    nls_1.localize('proxySupportOverride', "Enable proxy support for extensions, override request options."),
                ],
                default: 'override',
                description: nls_1.localize('proxySupport', "Use the proxy support for extensions.")
            },
            'http.systemCertificates': {
                type: 'boolean',
                default: true,
                description: nls_1.localize('systemCertificates', "Controls whether CA certificates should be loaded from the OS.")
            }
        }
    });
});
//# sourceMappingURL=request.js.map