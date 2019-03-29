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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/node/extfs", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/async", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/services/output/common/outputChannelModel", "vs/workbench/services/output/node/outputAppender", "vs/platform/environment/common/environment", "vs/platform/windows/common/windows", "vs/base/common/date", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/extensions"], function (require, exports, instantiation_1, extfs, path_1, uri_1, async_1, files_1, modelService_1, modeService_1, lifecycle_1, log_1, outputChannelModel_1, outputAppender_1, environment_1, windows_1, date_1, telemetry_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let watchingOutputDir = false;
    let callbacks = [];
    function watchOutputDirectory(outputDir, logService, onChange) {
        callbacks.push(onChange);
        if (!watchingOutputDir) {
            const watcherDisposable = extfs.watch(outputDir, (eventType, fileName) => {
                for (const callback of callbacks) {
                    callback(eventType, fileName);
                }
            }, (error) => {
                logService.error(error);
            });
            watchingOutputDir = true;
            return lifecycle_1.toDisposable(() => {
                callbacks = [];
                watcherDisposable.dispose();
            });
        }
        return lifecycle_1.toDisposable(() => { });
    }
    let OutputChannelBackedByFile = class OutputChannelBackedByFile extends outputChannelModel_1.AbstractFileOutputChannelModel {
        constructor(id, modelUri, mimeType, windowService, environmentService, fileService, modelService, modeService, logService) {
            const outputDir = path_1.join(environmentService.logsPath, `output_${windowService.getCurrentWindowId()}_${date_1.toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '')}`);
            super(modelUri, mimeType, uri_1.URI.file(path_1.join(outputDir, `${id}.log`)), fileService, modelService, modeService);
            this.appendedMessage = '';
            this.loadingFromFileInProgress = false;
            // Use one rotating file to check for main file reset
            this.appender = new outputAppender_1.OutputAppender(id, this.file.fsPath);
            this.rotatingFilePath = `${id}.1.log`;
            this._register(watchOutputDirectory(path_1.dirname(this.file.fsPath), logService, (eventType, file) => this.onFileChangedInOutputDirector(eventType, file)));
            this.resettingDelayer = new async_1.ThrottledDelayer(50);
        }
        append(message) {
            // update end offset always as message is read
            this.endOffset = this.endOffset + Buffer.from(message).byteLength;
            if (this.loadingFromFileInProgress) {
                this.appendedMessage += message;
            }
            else {
                this.write(message);
                if (this.model) {
                    this.appendedMessage += message;
                    if (!this.modelUpdater.isScheduled()) {
                        this.modelUpdater.schedule();
                    }
                }
            }
        }
        clear(till) {
            super.clear(till);
            this.appendedMessage = '';
        }
        loadModel() {
            this.loadingFromFileInProgress = true;
            if (this.modelUpdater.isScheduled()) {
                this.modelUpdater.cancel();
            }
            this.appendedMessage = '';
            return this.loadFile()
                .then(content => {
                if (this.endOffset !== this.startOffset + Buffer.from(content).byteLength) {
                    // Queue content is not written into the file
                    // Flush it and load file again
                    this.flush();
                    return this.loadFile();
                }
                return content;
            })
                .then(content => {
                if (this.appendedMessage) {
                    this.write(this.appendedMessage);
                    this.appendedMessage = '';
                }
                this.loadingFromFileInProgress = false;
                return this.createModel(content);
            });
        }
        resetModel() {
            this.startOffset = 0;
            this.endOffset = 0;
            if (this.model) {
                return this.loadModel().then(() => undefined);
            }
            return Promise.resolve(undefined);
        }
        loadFile() {
            return this.fileService.resolveContent(this.file, { position: this.startOffset, encoding: 'utf8' })
                .then(content => this.appendedMessage ? content.value + this.appendedMessage : content.value);
        }
        updateModel() {
            if (this.model && this.appendedMessage) {
                this.appendToModel(this.appendedMessage);
                this.appendedMessage = '';
            }
        }
        onFileChangedInOutputDirector(eventType, fileName) {
            // Check if rotating file has changed. It changes only when the main file exceeds its limit.
            if (this.rotatingFilePath === fileName) {
                this.resettingDelayer.trigger(() => this.resetModel());
            }
        }
        write(content) {
            this.appender.append(content);
        }
        flush() {
            this.appender.flush();
        }
    };
    OutputChannelBackedByFile = __decorate([
        __param(3, windows_1.IWindowService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService),
        __param(8, log_1.ILogService)
    ], OutputChannelBackedByFile);
    let OutputChannelModelService = class OutputChannelModelService extends outputChannelModel_1.AsbtractOutputChannelModelService {
        constructor(instantiationService, logService, telemetryService) {
            super(instantiationService);
            this.logService = logService;
            this.telemetryService = telemetryService;
        }
        createOutputChannelModel(id, modelUri, mimeType, file) {
            if (!file) {
                try {
                    return this.instantiationService.createInstance(OutputChannelBackedByFile, id, modelUri, mimeType);
                }
                catch (e) {
                    // Do not crash if spdlog rotating logger cannot be loaded (workaround for https://github.com/Microsoft/vscode/issues/47883)
                    this.logService.error(e);
                    /* __GDPR__
                        "output.channel.creation.error" : {}
                    */
                    this.telemetryService.publicLog('output.channel.creation.error');
                }
            }
            return super.createOutputChannelModel(id, modelUri, mimeType, file);
        }
    };
    OutputChannelModelService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService),
        __param(2, telemetry_1.ITelemetryService)
    ], OutputChannelModelService);
    exports.OutputChannelModelService = OutputChannelModelService;
    extensions_1.registerSingleton(outputChannelModel_1.IOutputChannelModelService, OutputChannelModelService);
});
//# sourceMappingURL=outputChannelModelService.js.map