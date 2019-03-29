/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions"], function (require, exports, instantiation_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IHashService = instantiation_1.createDecorator('hashService');
    class HashService {
        createSHA1(content) {
            return crypto.subtle.digest('SHA-1', new TextEncoder().encode(content)).then(buffer => {
                // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#Converting_a_digest_to_a_hex_string
                return Array.prototype.map.call(new Uint8Array(buffer), value => `00${value.toString(16)}`.slice(-2)).join('');
            });
        }
    }
    exports.HashService = HashService;
    extensions_1.registerSingleton(exports.IHashService, HashService, true);
});
//# sourceMappingURL=hashService.js.map