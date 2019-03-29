/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getByName(root, name) {
        if (root.children === undefined) {
            return null;
        }
        for (const child of root.children) {
            if (child.name === name) {
                return child;
            }
        }
        return null;
    }
    exports.getByName = getByName;
});
//# sourceMappingURL=utils.js.map