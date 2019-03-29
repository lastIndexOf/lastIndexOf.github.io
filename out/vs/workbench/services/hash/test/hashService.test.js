/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/workbench/services/hash/common/hashService"], function (require, exports, assert, hashService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Hash Service', () => {
        test('computeSHA1Hash', () => __awaiter(this, void 0, void 0, function* () {
            const service = new hashService_1.HashService();
            assert.equal(yield service.createSHA1(''), 'da39a3ee5e6b4b0d3255bfef95601890afd80709');
            assert.equal(yield service.createSHA1('hello world'), '2aae6c35c94fcfb415dbe95f408b9ce91ee846ed');
            assert.equal(yield service.createSHA1('da39a3ee5e6b4b0d3255bfef95601890afd80709'), '10a34637ad661d98ba3344717656fcc76209c2f8');
            assert.equal(yield service.createSHA1('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed'), 'd6b0d82cea4269b51572b8fab43adcee9fc3cf9a');
            assert.equal(yield service.createSHA1('öäü_?ß()<>ÖÄÜ'), 'b64beaeff9e317b0193c8e40a2431b210388eba9');
        }));
    });
});
//# sourceMappingURL=hashService.test.js.map