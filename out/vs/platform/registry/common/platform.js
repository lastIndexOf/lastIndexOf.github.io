/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/assert"], function (require, exports, Types, Assert) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RegistryImpl {
        constructor() {
            this.data = {};
        }
        add(id, data) {
            Assert.ok(Types.isString(id));
            Assert.ok(Types.isObject(data));
            Assert.ok(!this.data.hasOwnProperty(id), 'There is already an extension with this id');
            this.data[id] = data;
        }
        knows(id) {
            return this.data.hasOwnProperty(id);
        }
        as(id) {
            return this.data[id] || null;
        }
    }
    exports.Registry = new RegistryImpl();
});
//# sourceMappingURL=platform.js.map