/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors"], function (require, exports, platform_1, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StatusbarItemDescriptor {
        constructor(ctor, alignment, priority) {
            this.syncDescriptor = descriptors_1.createSyncDescriptor(ctor);
            this.alignment = alignment || 0 /* LEFT */;
            this.priority = priority || 0;
        }
    }
    exports.StatusbarItemDescriptor = StatusbarItemDescriptor;
    class StatusbarRegistry {
        constructor() {
            this._items = [];
        }
        get items() {
            return this._items;
        }
        registerStatusbarItem(descriptor) {
            this._items.push(descriptor);
        }
    }
    exports.Extensions = {
        Statusbar: 'workbench.contributions.statusbar'
    };
    platform_1.Registry.add(exports.Extensions.Statusbar, new StatusbarRegistry());
});
//# sourceMappingURL=statusbar.js.map