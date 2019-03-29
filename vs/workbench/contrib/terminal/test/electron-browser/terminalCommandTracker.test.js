/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vscode-xterm", "vs/workbench/contrib/terminal/browser/terminalCommandTracker", "vs/base/common/platform"], function (require, exports, assert, vscode_xterm_1, terminalCommandTracker_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function syncWrite(term, data) {
        // Terminal.write is asynchronous
        term._core.writeBuffer.push(data);
        term._core._innerWrite();
    }
    const ROWS = 10;
    const COLS = 10;
    suite('Workbench - TerminalCommandTracker', () => {
        let xterm;
        let commandTracker;
        setup(() => {
            xterm = new vscode_xterm_1.Terminal({
                cols: COLS,
                rows: ROWS
            });
            // Fill initial viewport
            for (let i = 0; i < ROWS - 1; i++) {
                syncWrite(xterm, `${i}\n`);
            }
            commandTracker = new terminalCommandTracker_1.TerminalCommandTracker(xterm);
        });
        suite('Command tracking', () => {
            test('should track commands when the prompt is of sufficient size', () => {
                assert.equal(xterm.markers.length, 0);
                syncWrite(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm.emit('key', '\x0d');
                assert.equal(xterm.markers.length, 1);
            });
            test('should not track commands when the prompt is too small', () => {
                assert.equal(xterm.markers.length, 0);
                syncWrite(xterm, '\x1b[2G'); // Move cursor to column 2
                xterm.emit('key', '\x0d');
                assert.equal(xterm.markers.length, 0);
            });
        });
        suite('Commands', () => {
            test('should scroll to the next and previous commands', () => {
                syncWrite(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm.emit('key', '\x0d'); // Mark line #10
                assert.equal(xterm.markers[0].line, 9);
                for (let i = 0; i < 20; i++) {
                    syncWrite(xterm, `\r\n`);
                }
                assert.equal(xterm._core.buffer.ybase, 20);
                assert.equal(xterm._core.buffer.ydisp, 20);
                // Scroll to marker
                commandTracker.scrollToPreviousCommand();
                assert.equal(xterm._core.buffer.ydisp, 9);
                // Scroll to top boundary
                commandTracker.scrollToPreviousCommand();
                assert.equal(xterm._core.buffer.ydisp, 0);
                // Scroll to marker
                commandTracker.scrollToNextCommand();
                assert.equal(xterm._core.buffer.ydisp, 9);
                // Scroll to bottom boundary
                commandTracker.scrollToNextCommand();
                assert.equal(xterm._core.buffer.ydisp, 20);
            });
            test('should select to the next and previous commands', () => {
                window.matchMedia = () => {
                    return { addListener: () => { } };
                };
                xterm.open(document.createElement('div'));
                syncWrite(xterm, '\r0');
                syncWrite(xterm, '\n\r1');
                syncWrite(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm.emit('key', '\x0d'); // Mark line
                assert.equal(xterm.markers[0].line, 10);
                syncWrite(xterm, '\n\r2');
                syncWrite(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm.emit('key', '\x0d'); // Mark line
                assert.equal(xterm.markers[1].line, 11);
                syncWrite(xterm, '\n\r3');
                assert.equal(xterm._core.buffer.ybase, 3);
                assert.equal(xterm._core.buffer.ydisp, 3);
                assert.equal(xterm.getSelection(), '');
                commandTracker.selectToPreviousCommand();
                assert.equal(xterm.getSelection(), '2');
                commandTracker.selectToPreviousCommand();
                assert.equal(xterm.getSelection(), platform_1.isWindows ? '1\r\n2' : '1\n2');
                commandTracker.selectToNextCommand();
                assert.equal(xterm.getSelection(), '2');
                commandTracker.selectToNextCommand();
                assert.equal(xterm.getSelection(), platform_1.isWindows ? '\r\n' : '\n');
            });
            test('should select to the next and previous lines & commands', () => {
                window.matchMedia = () => {
                    return { addListener: () => { } };
                };
                xterm.open(document.createElement('div'));
                syncWrite(xterm, '\r0');
                syncWrite(xterm, '\n\r1');
                syncWrite(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm.emit('key', '\x0d'); // Mark line
                assert.equal(xterm.markers[0].line, 10);
                syncWrite(xterm, '\n\r2');
                syncWrite(xterm, '\x1b[3G'); // Move cursor to column 3
                xterm.emit('key', '\x0d'); // Mark line
                assert.equal(xterm.markers[1].line, 11);
                syncWrite(xterm, '\n\r3');
                assert.equal(xterm._core.buffer.ybase, 3);
                assert.equal(xterm._core.buffer.ydisp, 3);
                assert.equal(xterm.getSelection(), '');
                commandTracker.selectToPreviousLine();
                assert.equal(xterm.getSelection(), '2');
                commandTracker.selectToNextLine();
                commandTracker.selectToNextLine();
                assert.equal(xterm.getSelection(), '3');
                commandTracker.selectToPreviousCommand();
                commandTracker.selectToPreviousCommand();
                commandTracker.selectToNextLine();
                assert.equal(xterm.getSelection(), '2');
                commandTracker.selectToPreviousCommand();
                assert.equal(xterm.getSelection(), platform_1.isWindows ? '1\r\n2' : '1\n2');
                commandTracker.selectToPreviousLine();
                assert.equal(xterm.getSelection(), platform_1.isWindows ? '0\r\n1\r\n2' : '0\n1\n2');
            });
        });
    });
});
//# sourceMappingURL=terminalCommandTracker.test.js.map