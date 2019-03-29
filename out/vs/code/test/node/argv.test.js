define(["require", "exports", "assert", "vs/platform/environment/node/argv"], function (require, exports, assert, argv_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('formatOptions', () => {
        function o(id, description) {
            return {
                id, description, type: 'string'
            };
        }
        test('Text should display small columns correctly', () => {
            assert.deepEqual(argv_1.formatOptions([
                o('foo', 'bar')
            ], 80), ['  --foo bar']);
            assert.deepEqual(argv_1.formatOptions([
                o('f', 'bar'),
                o('fo', 'ba'),
                o('foo', 'b')
            ], 80), [
                '  --f   bar',
                '  --fo  ba',
                '  --foo b'
            ]);
        });
        test('Text should wrap', () => {
            assert.deepEqual(argv_1.formatOptions([
                o('foo', 'bar '.repeat(9))
            ], 40), [
                '  --foo bar bar bar bar bar bar bar bar',
                '        bar'
            ]);
        });
        test('Text should revert to the condensed view when the terminal is too narrow', () => {
            assert.deepEqual(argv_1.formatOptions([
                o('foo', 'bar '.repeat(9))
            ], 30), [
                '  --foo',
                '      bar bar bar bar bar bar bar bar bar '
            ]);
        });
        test('addArg', () => {
            assert.deepEqual(argv_1.addArg([], 'foo'), ['foo']);
            assert.deepEqual(argv_1.addArg([], 'foo', 'bar'), ['foo', 'bar']);
            assert.deepEqual(argv_1.addArg(['foo'], 'bar'), ['foo', 'bar']);
            assert.deepEqual(argv_1.addArg(['--wait'], 'bar'), ['--wait', 'bar']);
            assert.deepEqual(argv_1.addArg(['--wait', '--', '--foo'], 'bar'), ['--wait', 'bar', '--', '--foo']);
            assert.deepEqual(argv_1.addArg(['--', '--foo'], 'bar'), ['bar', '--', '--foo']);
        });
    });
});
//# sourceMappingURL=argv.test.js.map