/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/product/node/product", "vs/platform/product/node/package"], function (require, exports, product_1, package_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ProductService {
        get version() { return package_1.default.version; }
        get commit() { return product_1.default.commit; }
        get enableTelemetry() { return product_1.default.enableTelemetry; }
    }
    exports.ProductService = ProductService;
});
//# sourceMappingURL=productService.js.map