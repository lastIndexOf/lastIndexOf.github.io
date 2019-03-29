/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalActivityExtensions = 'workbench.contributions.globalActivities';
    class GlobalActivityRegistry {
        constructor() {
            this.activityDescriptors = new Set();
        }
        registerActivity(descriptor) {
            this.activityDescriptors.add(descriptor);
        }
        getActivities() {
            const result = [];
            this.activityDescriptors.forEach(d => result.push(d));
            return result;
        }
    }
    exports.GlobalActivityRegistry = GlobalActivityRegistry;
    platform_1.Registry.add(exports.GlobalActivityExtensions, new GlobalActivityRegistry());
});
//# sourceMappingURL=activity.js.map