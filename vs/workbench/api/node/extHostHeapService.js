/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostHeapService {
        constructor() {
            this._data = new Map();
        }
        keep(obj) {
            const id = ExtHostHeapService._idPool++;
            this._data.set(id, obj);
            return id;
        }
        delete(id) {
            return this._data.delete(id);
        }
        get(id) {
            return this._data.get(id);
        }
        $onGarbageCollection(ids) {
            for (const id of ids) {
                this.delete(id);
            }
        }
    }
    ExtHostHeapService._idPool = 0;
    exports.ExtHostHeapService = ExtHostHeapService;
});
//# sourceMappingURL=extHostHeapService.js.map