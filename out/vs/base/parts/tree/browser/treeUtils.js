/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function collapseAll(tree, except) {
        const nav = tree.getNavigator();
        let cur;
        while (cur = nav.next()) {
            if (!except || !isEqualOrParent(tree, except, cur)) {
                tree.collapse(cur);
            }
        }
    }
    exports.collapseAll = collapseAll;
    function isEqualOrParent(tree, element, candidateParent) {
        const nav = tree.getNavigator(element);
        do {
            if (element === candidateParent) {
                return true;
            }
        } while (element = nav.parent());
        return false;
    }
    exports.isEqualOrParent = isEqualOrParent;
    function expandAll(tree) {
        const nav = tree.getNavigator();
        let cur;
        while (cur = nav.next()) {
            tree.expand(cur);
        }
    }
    exports.expandAll = expandAll;
});
//# sourceMappingURL=treeUtils.js.map