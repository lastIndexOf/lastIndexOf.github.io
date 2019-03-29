/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/telemetry/node/commonProperties"], function (require, exports, commonProperties_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.instanceStorageKey = 'telemetry.instanceId';
    exports.currentSessionDateStorageKey = 'telemetry.currentSessionDate';
    exports.firstSessionDateStorageKey = 'telemetry.firstSessionDate';
    exports.lastSessionDateStorageKey = 'telemetry.lastSessionDate';
    function resolveWorkbenchCommonProperties(storageService, commit, version, machineId, installSourcePath) {
        return commonProperties_1.resolveCommonProperties(commit, version, machineId, installSourcePath).then(result => {
            const instanceId = storageService.get(exports.instanceStorageKey, 0 /* GLOBAL */);
            const firstSessionDate = storageService.get(exports.firstSessionDateStorageKey, 0 /* GLOBAL */);
            const lastSessionDate = storageService.get(exports.lastSessionDateStorageKey, 0 /* GLOBAL */);
            // __GDPR__COMMON__ "common.version.shell" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
            result['common.version.shell'] = process.versions && process.versions['electron'];
            // __GDPR__COMMON__ "common.version.renderer" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
            result['common.version.renderer'] = process.versions && process.versions['chrome'];
            // __GDPR__COMMON__ "common.firstSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.firstSessionDate'] = firstSessionDate;
            // __GDPR__COMMON__ "common.lastSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.lastSessionDate'] = lastSessionDate || '';
            // __GDPR__COMMON__ "common.isNewSession" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.isNewSession'] = !lastSessionDate ? '1' : '0';
            // __GDPR__COMMON__ "common.instanceId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.instanceId'] = instanceId;
            return result;
        });
    }
    exports.resolveWorkbenchCommonProperties = resolveWorkbenchCommonProperties;
});
//# sourceMappingURL=workbenchCommonProperties.js.map