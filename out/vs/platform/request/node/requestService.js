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
define(["require", "exports", "vs/base/common/objects", "vs/base/node/request", "vs/base/node/proxy", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log"], function (require, exports, objects_1, request_1, proxy_1, configuration_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This service exposes the `request` API, while using the global
     * or configured proxy settings.
     */
    let RequestService = class RequestService {
        constructor(configurationService, logService) {
            this.logService = logService;
            this.disposables = [];
            this.configure(configurationService.getValue());
            configurationService.onDidChangeConfiguration(() => this.configure(configurationService.getValue()), this, this.disposables);
        }
        configure(config) {
            this.proxyUrl = config.http && config.http.proxy;
            this.strictSSL = !!(config.http && config.http.proxyStrictSSL);
            this.authorization = config.http && config.http.proxyAuthorization;
        }
        request(options, token, requestFn = request_1.request) {
            this.logService.trace('RequestService#request', options.url);
            const { proxyUrl, strictSSL } = this;
            const agentPromise = options.agent ? Promise.resolve(options.agent) : Promise.resolve(proxy_1.getProxyAgent(options.url || '', { proxyUrl, strictSSL }));
            return agentPromise.then(agent => {
                options.agent = agent;
                options.strictSSL = strictSSL;
                if (this.authorization) {
                    options.headers = objects_1.assign(options.headers || {}, { 'Proxy-Authorization': this.authorization });
                }
                return requestFn(options, token);
            });
        }
    };
    RequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILogService)
    ], RequestService);
    exports.RequestService = RequestService;
});
//# sourceMappingURL=requestService.js.map