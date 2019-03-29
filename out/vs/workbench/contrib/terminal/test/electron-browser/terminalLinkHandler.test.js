/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/terminal/browser/terminalLinkHandler", "vs/base/common/strings", "vs/base/common/path", "sinon"], function (require, exports, assert, terminalLinkHandler_1, strings, path, sinon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalLinkHandler extends terminalLinkHandler_1.TerminalLinkHandler {
        get localLinkRegex() {
            return this._localLinkRegex;
        }
        get gitDiffLinkPreImageRegex() {
            return this._gitDiffPreImageRegex;
        }
        get gitDiffLinkPostImageRegex() {
            return this._gitDiffPostImageRegex;
        }
        preprocessPath(link) {
            return this._preprocessPath(link);
        }
    }
    class TestXterm {
        webLinksInit() { }
        registerLinkMatcher() { }
    }
    suite('Workbench - TerminalLinkHandler', () => {
        suite('localLinkRegex', () => {
            test('Windows', () => {
                const terminalLinkHandler = new TestTerminalLinkHandler(new TestXterm(), 3 /* Windows */, null, null, null, null, null);
                function testLink(link, linkUrl, lineNo, columnNo) {
                    assert.equal(terminalLinkHandler.extractLinkUrl(link), linkUrl);
                    assert.equal(terminalLinkHandler.extractLinkUrl(`:${link}:`), linkUrl);
                    assert.equal(terminalLinkHandler.extractLinkUrl(`;${link};`), linkUrl);
                    assert.equal(terminalLinkHandler.extractLinkUrl(`(${link})`), linkUrl);
                    if (lineNo) {
                        const lineColumnInfo = terminalLinkHandler.extractLineColumnInfo(link);
                        assert.equal(lineColumnInfo.lineNumber, lineNo);
                        if (columnNo) {
                            assert.equal(lineColumnInfo.columnNumber, columnNo);
                        }
                    }
                }
                function generateAndTestLinks() {
                    const linkUrls = [
                        'c:\\foo',
                        'c:/foo',
                        '.\\foo',
                        './foo',
                        '..\\foo',
                        '~\\foo',
                        '~/foo',
                        'c:/a/long/path',
                        'c:\\a\\long\\path',
                        'c:\\mixed/slash\\path',
                        'a/relative/path',
                        'plain/path',
                        'plain\\path'
                    ];
                    const supportedLinkFormats = [
                        { urlFormat: '{0}' },
                        { urlFormat: '{0} on line {1}', line: '5' },
                        { urlFormat: '{0} on line {1}, column {2}', line: '5', column: '3' },
                        { urlFormat: '{0}:line {1}', line: '5' },
                        { urlFormat: '{0}:line {1}, column {2}', line: '5', column: '3' },
                        { urlFormat: '{0}({1})', line: '5' },
                        { urlFormat: '{0} ({1})', line: '5' },
                        { urlFormat: '{0}({1},{2})', line: '5', column: '3' },
                        { urlFormat: '{0} ({1},{2})', line: '5', column: '3' },
                        { urlFormat: '{0}({1}, {2})', line: '5', column: '3' },
                        { urlFormat: '{0} ({1}, {2})', line: '5', column: '3' },
                        { urlFormat: '{0}:{1}', line: '5' },
                        { urlFormat: '{0}:{1}:{2}', line: '5', column: '3' },
                        { urlFormat: '{0}[{1}]', line: '5' },
                        { urlFormat: '{0} [{1}]', line: '5' },
                        { urlFormat: '{0}[{1},{2}]', line: '5', column: '3' },
                        { urlFormat: '{0} [{1},{2}]', line: '5', column: '3' },
                        { urlFormat: '{0}[{1}, {2}]', line: '5', column: '3' },
                        { urlFormat: '{0} [{1}, {2}]', line: '5', column: '3' }
                    ];
                    linkUrls.forEach(linkUrl => {
                        supportedLinkFormats.forEach(linkFormatInfo => {
                            testLink(strings.format(linkFormatInfo.urlFormat, linkUrl, linkFormatInfo.line, linkFormatInfo.column), linkUrl, linkFormatInfo.line, linkFormatInfo.column);
                        });
                    });
                }
                generateAndTestLinks();
            });
            test('Linux', () => {
                const terminalLinkHandler = new TestTerminalLinkHandler(new TestXterm(), 2 /* Linux */, null, null, null, null, null);
                function testLink(link, linkUrl, lineNo, columnNo) {
                    assert.equal(terminalLinkHandler.extractLinkUrl(link), linkUrl);
                    assert.equal(terminalLinkHandler.extractLinkUrl(`:${link}:`), linkUrl);
                    assert.equal(terminalLinkHandler.extractLinkUrl(`;${link};`), linkUrl);
                    assert.equal(terminalLinkHandler.extractLinkUrl(`(${link})`), linkUrl);
                    if (lineNo) {
                        const lineColumnInfo = terminalLinkHandler.extractLineColumnInfo(link);
                        assert.equal(lineColumnInfo.lineNumber, lineNo);
                        if (columnNo) {
                            assert.equal(lineColumnInfo.columnNumber, columnNo);
                        }
                    }
                }
                function generateAndTestLinks() {
                    const linkUrls = [
                        '/foo',
                        '~/foo',
                        './foo',
                        '../foo',
                        '/a/long/path',
                        'a/relative/path'
                    ];
                    const supportedLinkFormats = [
                        { urlFormat: '{0}' },
                        { urlFormat: '{0} on line {1}', line: '5' },
                        { urlFormat: '{0} on line {1}, column {2}', line: '5', column: '3' },
                        { urlFormat: '{0}:line {1}', line: '5' },
                        { urlFormat: '{0}:line {1}, column {2}', line: '5', column: '3' },
                        { urlFormat: '{0}({1})', line: '5' },
                        { urlFormat: '{0} ({1})', line: '5' },
                        { urlFormat: '{0}({1},{2})', line: '5', column: '3' },
                        { urlFormat: '{0} ({1},{2})', line: '5', column: '3' },
                        { urlFormat: '{0}:{1}', line: '5' },
                        { urlFormat: '{0}:{1}:{2}', line: '5', column: '3' },
                        { urlFormat: '{0}[{1}]', line: '5' },
                        { urlFormat: '{0} [{1}]', line: '5' },
                        { urlFormat: '{0}[{1},{2}]', line: '5', column: '3' },
                        { urlFormat: '{0} [{1},{2}]', line: '5', column: '3' }
                    ];
                    linkUrls.forEach(linkUrl => {
                        supportedLinkFormats.forEach(linkFormatInfo => {
                            // console.log('linkFormatInfo: ', linkFormatInfo);
                            testLink(strings.format(linkFormatInfo.urlFormat, linkUrl, linkFormatInfo.line, linkFormatInfo.column), linkUrl, linkFormatInfo.line, linkFormatInfo.column);
                        });
                    });
                }
                generateAndTestLinks();
            });
        });
        suite('preprocessPath', () => {
            test('Windows', () => {
                const linkHandler = new TestTerminalLinkHandler(new TestXterm(), 3 /* Windows */, null, null, null, null, null);
                linkHandler.processCwd = 'C:\\base';
                let stub = sinon.stub(path, 'join', function (arg1, arg2) {
                    return arg1 + '\\' + arg2;
                });
                assert.equal(linkHandler.preprocessPath('./src/file1'), 'C:\\base\\./src/file1');
                assert.equal(linkHandler.preprocessPath('src\\file2'), 'C:\\base\\src\\file2');
                assert.equal(linkHandler.preprocessPath('C:\\absolute\\path\\file3'), 'C:\\absolute\\path\\file3');
                stub.restore();
            });
            test('Windows - spaces', () => {
                const linkHandler = new TestTerminalLinkHandler(new TestXterm(), 3 /* Windows */, null, null, null, null, null);
                linkHandler.processCwd = 'C:\\base dir';
                let stub = sinon.stub(path, 'join', function (arg1, arg2) {
                    return arg1 + '\\' + arg2;
                });
                assert.equal(linkHandler.preprocessPath('./src/file1'), 'C:\\base dir\\./src/file1');
                assert.equal(linkHandler.preprocessPath('src\\file2'), 'C:\\base dir\\src\\file2');
                assert.equal(linkHandler.preprocessPath('C:\\absolute\\path\\file3'), 'C:\\absolute\\path\\file3');
                stub.restore();
            });
            test('Linux', () => {
                const linkHandler = new TestTerminalLinkHandler(new TestXterm(), 2 /* Linux */, null, null, null, null, null);
                linkHandler.processCwd = '/base';
                let stub = sinon.stub(path, 'join', function (arg1, arg2) {
                    return arg1 + '/' + arg2;
                });
                assert.equal(linkHandler.preprocessPath('./src/file1'), '/base/./src/file1');
                assert.equal(linkHandler.preprocessPath('src/file2'), '/base/src/file2');
                assert.equal(linkHandler.preprocessPath('/absolute/path/file3'), '/absolute/path/file3');
                stub.restore();
            });
            test('No Workspace', () => {
                const linkHandler = new TestTerminalLinkHandler(new TestXterm(), 2 /* Linux */, null, null, null, null, null);
                assert.equal(linkHandler.preprocessPath('./src/file1'), null);
                assert.equal(linkHandler.preprocessPath('src/file2'), null);
                assert.equal(linkHandler.preprocessPath('/absolute/path/file3'), '/absolute/path/file3');
            });
        });
        test('gitDiffLinkRegex', () => {
            // The platform is irrelevant because the links generated by Git are the same format regardless of platform
            const linkHandler = new TestTerminalLinkHandler(new TestXterm(), 2 /* Linux */, null, null, null, null, null);
            function assertAreGoodMatches(matches) {
                if (matches) {
                    assert.equal(matches.length, 2);
                    assert.equal(matches[1], 'src/file1');
                }
                else {
                    assert.fail();
                }
            }
            // Happy cases
            assertAreGoodMatches('--- a/src/file1'.match(linkHandler.gitDiffLinkPreImageRegex));
            assertAreGoodMatches('--- a/src/file1             '.match(linkHandler.gitDiffLinkPreImageRegex));
            assertAreGoodMatches('+++ b/src/file1'.match(linkHandler.gitDiffLinkPostImageRegex));
            assertAreGoodMatches('+++ b/src/file1             '.match(linkHandler.gitDiffLinkPostImageRegex));
            // Make sure /dev/null isn't a match
            assert.equal(linkHandler.gitDiffLinkPreImageRegex.test('--- /dev/null'), false);
            assert.equal(linkHandler.gitDiffLinkPreImageRegex.test('--- /dev/null           '), false);
            assert.equal(linkHandler.gitDiffLinkPostImageRegex.test('+++ /dev/null'), false);
            assert.equal(linkHandler.gitDiffLinkPostImageRegex.test('+++ /dev/null          '), false);
        });
    });
});
//# sourceMappingURL=terminalLinkHandler.test.js.map