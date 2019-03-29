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
define(["require", "exports", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/product/common/product", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/telemetry/node/telemetryIpc", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/windows/common/windows", "vs/platform/telemetry/node/workbenchCommonProperties", "vs/platform/telemetry/common/telemetryService"], function (require, exports, telemetryUtils_1, configuration_1, lifecycle_1, environment_1, product_1, sharedProcessService_1, telemetryIpc_1, log_1, storage_1, windows_1, workbenchCommonProperties_1, telemetryService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TelemetryService = class TelemetryService extends lifecycle_1.Disposable {
        constructor(environmentService, productService, sharedProcessService, logService, storageService, configurationService, windowService) {
            super();
            if (!environmentService.isExtensionDevelopment && !environmentService.args['disable-telemetry'] && !!productService.enableTelemetry) {
                const channel = sharedProcessService.getChannel('telemetryAppender');
                const config = {
                    appender: telemetryUtils_1.combinedAppender(new telemetryIpc_1.TelemetryAppenderClient(channel), new telemetryUtils_1.LogAppender(logService)),
                    commonProperties: workbenchCommonProperties_1.resolveWorkbenchCommonProperties(storageService, productService.commit, productService.version, windowService.getConfiguration().machineId, environmentService.installSourcePath),
                    piiPaths: [environmentService.appRoot, environmentService.extensionsPath]
                };
                this.impl = this._register(new telemetryService_1.TelemetryService(config, configurationService));
            }
            else {
                this.impl = telemetryUtils_1.NullTelemetryService;
            }
        }
        get isOptedIn() {
            return this.impl.isOptedIn;
        }
        publicLog(eventName, data, anonymizeFilePaths) {
            return this.impl.publicLog(eventName, data, anonymizeFilePaths);
        }
        getTelemetryInfo() {
            return this.impl.getTelemetryInfo();
        }
    };
    TelemetryService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, product_1.IProductService),
        __param(2, sharedProcessService_1.ISharedProcessService),
        __param(3, log_1.ILogService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, windows_1.IWindowService)
    ], TelemetryService);
    exports.TelemetryService = TelemetryService;
});
//# sourceMappingURL=telemetryService.js.map