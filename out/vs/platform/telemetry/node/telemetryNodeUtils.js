/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/product/node/product"], function (require, exports, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function addGAParameters(telemetryService, environmentService, uri, origin, experiment = '1') {
        if (environmentService.isBuilt && !environmentService.isExtensionDevelopment && !environmentService.args['disable-telemetry'] && !!product_1.default.enableTelemetry) {
            if (uri.scheme === 'https' && uri.authority === 'code.visualstudio.com') {
                return telemetryService.getTelemetryInfo()
                    .then(info => {
                    return uri.with({ query: `${uri.query ? uri.query + '&' : ''}utm_source=VsCode&utm_medium=${encodeURIComponent(origin)}&utm_campaign=${encodeURIComponent(info.instanceId)}&utm_content=${encodeURIComponent(experiment)}` });
                });
            }
        }
        return Promise.resolve(uri);
    }
    exports.addGAParameters = addGAParameters;
});
//# sourceMappingURL=telemetryNodeUtils.js.map