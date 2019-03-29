/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/node/stream", "vs/base/common/amd"], function (require, exports, assert, stream, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Stream', () => {
        test('readExactlyByFile - ANSI', function () {
            const file = amd_1.getPathFromAmdModule(require, './fixtures/file.css');
            return stream.readExactlyByFile(file, 10).then(({ buffer, bytesRead }) => {
                assert.equal(bytesRead, 10);
                assert.equal(buffer.toString(), '/*--------');
            });
        });
        test('readExactlyByFile - empty', function () {
            const file = amd_1.getPathFromAmdModule(require, './fixtures/empty.txt');
            return stream.readExactlyByFile(file, 10).then(({ bytesRead }) => {
                assert.equal(bytesRead, 0);
            });
        });
        test('readToMatchingString - ANSI', function () {
            const file = amd_1.getPathFromAmdModule(require, './fixtures/file.css');
            return stream.readToMatchingString(file, '\n', 10, 100).then((result) => {
                // \r may be present on Windows
                assert.equal(result.replace('\r', ''), '/*---------------------------------------------------------------------------------------------');
            });
        });
        test('readToMatchingString - empty', function () {
            const file = amd_1.getPathFromAmdModule(require, './fixtures/empty.txt');
            return stream.readToMatchingString(file, '\n', 10, 100).then((result) => {
                assert.equal(result, null);
            });
        });
    });
});
//# sourceMappingURL=stream.test.js.map