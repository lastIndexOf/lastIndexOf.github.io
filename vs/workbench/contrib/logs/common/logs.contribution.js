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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/output/common/output", "vs/platform/environment/common/environment", "vs/platform/windows/common/windows", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/contrib/logs/common/logConstants", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/common/logsActions", "vs/platform/log/common/log"], function (require, exports, nls, path_1, platform_1, contributions_1, output_1, environment_1, windows_1, lifecycle_1, uri_1, Constants, actions_1, actions_2, logsActions_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LogOutputChannels = class LogOutputChannels extends lifecycle_1.Disposable {
        constructor(windowService, environmentService, logService) {
            super();
            let outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
            outputChannelRegistry.registerChannel({ id: Constants.mainLogChannelId, label: nls.localize('mainLog', "Main"), file: uri_1.URI.file(path_1.join(environmentService.logsPath, `main.log`)), log: true });
            outputChannelRegistry.registerChannel({ id: Constants.sharedLogChannelId, label: nls.localize('sharedLog', "Shared"), file: uri_1.URI.file(path_1.join(environmentService.logsPath, `sharedprocess.log`)), log: true });
            outputChannelRegistry.registerChannel({ id: Constants.rendererLogChannelId, label: nls.localize('rendererLog', "Window"), file: uri_1.URI.file(path_1.join(environmentService.logsPath, `renderer${windowService.getCurrentWindowId()}.log`)), log: true });
            const registerTelemetryChannel = (level) => {
                if (level === log_1.LogLevel.Trace && !outputChannelRegistry.getChannel(Constants.telemetryLogChannelId)) {
                    outputChannelRegistry.registerChannel({ id: Constants.telemetryLogChannelId, label: nls.localize('telemetryLog', "Telemetry"), file: uri_1.URI.file(path_1.join(environmentService.logsPath, `telemetry.log`)), log: true });
                }
            };
            registerTelemetryChannel(logService.getLevel());
            logService.onDidChangeLogLevel(registerTelemetryChannel);
            const workbenchActionsRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
            const devCategory = nls.localize('developer', "Developer");
            workbenchActionsRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(logsActions_1.OpenLogsFolderAction, logsActions_1.OpenLogsFolderAction.ID, logsActions_1.OpenLogsFolderAction.LABEL), 'Developer: Open Log Folder', devCategory);
            workbenchActionsRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(logsActions_1.SetLogLevelAction, logsActions_1.SetLogLevelAction.ID, logsActions_1.SetLogLevelAction.LABEL), 'Developer: Set Log Level', devCategory);
        }
    };
    LogOutputChannels = __decorate([
        __param(0, windows_1.IWindowService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService)
    ], LogOutputChannels);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LogOutputChannels, 4 /* Eventually */);
});
//# sourceMappingURL=logs.contribution.js.map