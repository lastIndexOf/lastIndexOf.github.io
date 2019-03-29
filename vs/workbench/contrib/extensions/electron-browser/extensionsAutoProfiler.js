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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "vs/platform/telemetry/common/telemetry", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/base/common/errors", "os", "vs/base/common/path", "vs/base/node/pfs", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsEditor", "vs/platform/notification/common/notification", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsInput", "vs/base/common/uuid", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensions/common/extensions"], function (require, exports, extensions_1, telemetry_1, lifecycle_1, log_1, cancellation_1, errors_1, os_1, path_1, pfs_1, runtimeExtensionsEditor_1, notification_1, nls_1, editorService_1, runtimeExtensionsInput_1, uuid_1, extensions_2, extensions_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionsAutoProfiler = class ExtensionsAutoProfiler extends lifecycle_1.Disposable {
        constructor(_extensionService, _extensionProfileService, _anotherExtensionService, _telemetryService, _logService, _notificationService, _editorService) {
            super();
            this._extensionService = _extensionService;
            this._extensionProfileService = _extensionProfileService;
            this._anotherExtensionService = _anotherExtensionService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._notificationService = _notificationService;
            this._editorService = _editorService;
            this._session = new Map();
            this._blame = new Set();
            this._register(_extensionService.onDidChangeResponsiveChange(this._onDidChangeResponsiveChange, this));
        }
        _onDidChangeResponsiveChange(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const { target } = event;
                if (!target.canProfileExtensionHost()) {
                    return;
                }
                if (event.isResponsive && this._session.has(target)) {
                    // stop profiling when responsive again
                    this._session.get(target).cancel();
                }
                else if (!event.isResponsive && !this._session.has(target)) {
                    // start profiling if not yet profiling
                    const token = new cancellation_1.CancellationTokenSource();
                    this._session.set(target, token);
                    let session;
                    try {
                        session = yield target.startExtensionHostProfile();
                    }
                    catch (err) {
                        this._session.delete(target);
                        // fail silent as this is often
                        // caused by another party being
                        // connected already
                        return;
                    }
                    // wait 5 seconds or until responsive again
                    yield new Promise(resolve => {
                        token.token.onCancellationRequested(resolve);
                        setTimeout(resolve, 5e3);
                    });
                    try {
                        // stop profiling and analyse results
                        this._processCpuProfile(yield session.stop());
                    }
                    catch (err) {
                        errors_1.onUnexpectedError(err);
                    }
                    finally {
                        this._session.delete(target);
                    }
                }
            });
        }
        _processCpuProfile(profile) {
            return __awaiter(this, void 0, void 0, function* () {
                let data = [];
                for (let i = 0; i < profile.ids.length; i++) {
                    let id = profile.ids[i];
                    let total = profile.deltas[i];
                    data.push({ id, total, percentage: 0 });
                }
                // merge data by identifier
                let anchor = 0;
                data.sort((a, b) => a.id.localeCompare(b.id));
                for (let i = 1; i < data.length; i++) {
                    if (data[anchor].id === data[i].id) {
                        data[anchor].total += data[i].total;
                    }
                    else {
                        anchor += 1;
                        data[anchor] = data[i];
                    }
                }
                data = data.slice(0, anchor + 1);
                const duration = profile.endTime - profile.startTime;
                const percentage = duration / 100;
                let top;
                for (const slice of data) {
                    slice.percentage = Math.round(slice.total / percentage);
                    if (!top || top.percentage < slice.percentage) {
                        top = slice;
                    }
                }
                if (!top) {
                    return;
                }
                const extension = yield this._extensionService.getExtension(top.id);
                if (!extension) {
                    // not an extension => idle, gc, self?
                    return;
                }
                // add to running extensions view
                this._extensionProfileService.setUnresponsiveProfile(extension.identifier, profile);
                // print message to log
                const path = path_1.join(os_1.tmpdir(), `exthost-${Math.random().toString(16).slice(2, 8)}.cpuprofile`);
                yield pfs_1.writeFile(path, JSON.stringify(profile.data));
                this._logService.warn(`UNRESPONSIVE extension host, '${top.id}' took ${top.percentage}% of ${duration / 1e3}ms, saved PROFILE here: '${path}'`, data);
                // send telemetry
                const id = uuid_1.generateUuid();
                /* __GDPR__
                    "exthostunresponsive" : {
                        "id" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                        "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                        "data": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                    }
                */
                this._telemetryService.publicLog('exthostunresponsive', {
                    id,
                    duration,
                    data,
                });
                // prompt: when really slow/greedy
                if (!(top.percentage >= 99 && top.total >= 5e6)) {
                    return;
                }
                // prompt: only when you can file an issue
                const reportAction = new runtimeExtensionsEditor_1.ReportExtensionIssueAction({
                    marketplaceInfo: this._anotherExtensionService.local.filter(value => extensions_3.ExtensionIdentifier.equals(value.identifier.id, extension.identifier))[0],
                    description: extension,
                    unresponsiveProfile: profile,
                    status: undefined,
                });
                if (!reportAction.enabled) {
                    return;
                }
                // only blame once per extension, don't blame too often
                if (this._blame.has(extensions_3.ExtensionIdentifier.toKey(extension.identifier)) || this._blame.size >= 3) {
                    return;
                }
                this._blame.add(extensions_3.ExtensionIdentifier.toKey(extension.identifier));
                // user-facing message when very bad...
                this._notificationService.prompt(notification_1.Severity.Warning, nls_1.localize('unresponsive-exthost', "The extension '{0}' took a very long time to complete its last operation and it has prevented other extensions from running.", extension.displayName || extension.name), [{
                        label: nls_1.localize('show', 'Show Extensions'),
                        run: () => this._editorService.openEditor(new runtimeExtensionsInput_1.RuntimeExtensionsInput())
                    },
                    {
                        label: nls_1.localize('report', "Report Issue"),
                        run: () => {
                            /* __GDPR__
                                "exthostunresponsive/report" : {
                                    "id" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                                }
                            */
                            this._telemetryService.publicLog('exthostunresponsive/report', { id });
                            return reportAction.run();
                        }
                    }], { silent: true });
            });
        }
    };
    ExtensionsAutoProfiler = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, runtimeExtensionsEditor_1.IExtensionHostProfileService),
        __param(2, extensions_2.IExtensionsWorkbenchService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, log_1.ILogService),
        __param(5, notification_1.INotificationService),
        __param(6, editorService_1.IEditorService)
    ], ExtensionsAutoProfiler);
    exports.ExtensionsAutoProfiler = ExtensionsAutoProfiler;
});
//# sourceMappingURL=extensionsAutoProfiler.js.map