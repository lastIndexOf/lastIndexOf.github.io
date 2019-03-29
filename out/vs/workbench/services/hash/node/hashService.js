/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "vs/workbench/services/hash/common/hashService", "vs/platform/instantiation/common/extensions"], function (require, exports, crypto_1, hashService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HashService {
        createSHA1(content) {
            return Promise.resolve(crypto_1.createHash('sha1').update(content).digest('hex'));
        }
    }
    exports.HashService = HashService;
    extensions_1.registerSingleton(hashService_1.IHashService, HashService, true);
});
//# sourceMappingURL=hashService.js.map