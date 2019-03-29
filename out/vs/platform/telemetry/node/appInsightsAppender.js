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
define(["require", "exports", "applicationinsights", "vs/base/common/types", "vs/base/common/objects", "vs/platform/log/common/log"], function (require, exports, appInsights, types_1, objects_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getClient(aiKey) {
        let client;
        if (appInsights.defaultClient) {
            client = new appInsights.TelemetryClient(aiKey);
            client.channel.setUseDiskRetryCaching(true);
        }
        else {
            appInsights.setup(aiKey)
                .setAutoCollectRequests(false)
                .setAutoCollectPerformance(false)
                .setAutoCollectExceptions(false)
                .setAutoCollectDependencies(false)
                .setAutoDependencyCorrelation(false)
                .setAutoCollectConsole(false)
                .setInternalLogging(false, false)
                .setUseDiskRetryCaching(true)
                .start();
            client = appInsights.defaultClient;
        }
        if (aiKey.indexOf('AIF-') === 0) {
            client.config.endpointUrl = 'https://vortex.data.microsoft.com/collect/v1';
        }
        return client;
    }
    let AppInsightsAppender = class AppInsightsAppender {
        constructor(_eventPrefix, _defaultData, aiKeyOrClientFactory, // allow factory function for testing
        _logService) {
            this._eventPrefix = _eventPrefix;
            this._defaultData = _defaultData;
            this._logService = _logService;
            if (!this._defaultData) {
                this._defaultData = Object.create(null);
            }
            if (typeof aiKeyOrClientFactory === 'string') {
                this._aiClient = getClient(aiKeyOrClientFactory);
            }
            else if (typeof aiKeyOrClientFactory === 'function') {
                this._aiClient = aiKeyOrClientFactory();
            }
        }
        static _getData(data) {
            const properties = Object.create(null);
            const measurements = Object.create(null);
            const flat = Object.create(null);
            AppInsightsAppender._flaten(data, flat);
            for (let prop in flat) {
                // enforce property names less than 150 char, take the last 150 char
                prop = prop.length > 150 ? prop.substr(prop.length - 149) : prop;
                const value = flat[prop];
                if (typeof value === 'number') {
                    measurements[prop] = value;
                }
                else if (typeof value === 'boolean') {
                    measurements[prop] = value ? 1 : 0;
                }
                else if (typeof value === 'string') {
                    //enforce property value to be less than 1024 char, take the first 1024 char
                    properties[prop] = value.substring(0, 1023);
                }
                else if (typeof value !== 'undefined' && value !== null) {
                    properties[prop] = value;
                }
            }
            return {
                properties,
                measurements
            };
        }
        static _flaten(obj, result, order = 0, prefix) {
            if (!obj) {
                return;
            }
            for (let item of Object.getOwnPropertyNames(obj)) {
                const value = obj[item];
                const index = prefix ? prefix + item : item;
                if (Array.isArray(value)) {
                    result[index] = objects_1.safeStringify(value);
                }
                else if (value instanceof Date) {
                    // TODO unsure why this is here and not in _getData
                    result[index] = value.toISOString();
                }
                else if (types_1.isObject(value)) {
                    if (order < 2) {
                        AppInsightsAppender._flaten(value, result, order + 1, index + '.');
                    }
                    else {
                        result[index] = objects_1.safeStringify(value);
                    }
                }
                else {
                    result[index] = value;
                }
            }
        }
        log(eventName, data) {
            if (!this._aiClient) {
                return;
            }
            data = objects_1.mixin(data, this._defaultData);
            data = AppInsightsAppender._getData(data);
            if (this._logService) {
                this._logService.trace(`telemetry/${eventName}`, data);
            }
            this._aiClient.trackEvent({
                name: this._eventPrefix + '/' + eventName,
                properties: data.properties,
                measurements: data.measurements
            });
        }
        dispose() {
            if (this._aiClient) {
                return new Promise(resolve => {
                    this._aiClient.flush({
                        callback: () => {
                            // all data flushed
                            this._aiClient = undefined;
                            resolve(undefined);
                        }
                    });
                });
            }
            return undefined;
        }
    };
    AppInsightsAppender = __decorate([
        __param(3, log_1.ILogService)
    ], AppInsightsAppender);
    exports.AppInsightsAppender = AppInsightsAppender;
});
//# sourceMappingURL=appInsightsAppender.js.map