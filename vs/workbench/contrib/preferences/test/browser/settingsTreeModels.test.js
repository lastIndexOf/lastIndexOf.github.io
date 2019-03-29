/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/preferences/browser/settingsTreeModels"], function (require, exports, assert, settingsTreeModels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SettingsTree', () => {
        test('settingKeyToDisplayFormat', () => {
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('foo.bar'), {
                category: 'Foo',
                label: 'Bar'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('foo.bar.etc'), {
                category: 'Foo › Bar',
                label: 'Etc'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('fooBar.etcSomething'), {
                category: 'Foo Bar',
                label: 'Etc Something'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('foo'), {
                category: '',
                label: 'Foo'
            });
        });
        test('settingKeyToDisplayFormat - with category', () => {
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('foo.bar', 'foo'), {
                category: '',
                label: 'Bar'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('disableligatures.ligatures', 'disableligatures'), {
                category: '',
                label: 'Ligatures'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('foo.bar.etc', 'foo'), {
                category: 'Bar',
                label: 'Etc'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('fooBar.etcSomething', 'foo'), {
                category: 'Foo Bar',
                label: 'Etc Something'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('foo.bar.etc', 'foo/bar'), {
                category: '',
                label: 'Etc'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('foo.bar.etc', 'something/foo'), {
                category: 'Bar',
                label: 'Etc'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('bar.etc', 'something.bar'), {
                category: '',
                label: 'Etc'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('fooBar.etc', 'fooBar'), {
                category: '',
                label: 'Etc'
            });
            assert.deepEqual(settingsTreeModels_1.settingKeyToDisplayFormat('fooBar.somethingElse.etc', 'fooBar'), {
                category: 'Something Else',
                label: 'Etc'
            });
        });
        test('parseQuery', () => {
            function testParseQuery(input, expected) {
                assert.deepEqual(settingsTreeModels_1.parseQuery(input), expected, input);
            }
            testParseQuery('', {
                tags: [],
                query: ''
            });
            testParseQuery('@modified', {
                tags: ['modified'],
                query: ''
            });
            testParseQuery('@tag:foo', {
                tags: ['foo'],
                query: ''
            });
            testParseQuery('@modified foo', {
                tags: ['modified'],
                query: 'foo'
            });
            testParseQuery('@tag:foo @modified', {
                tags: ['foo', 'modified'],
                query: ''
            });
            testParseQuery('@tag:foo @modified my query', {
                tags: ['foo', 'modified'],
                query: 'my query'
            });
            testParseQuery('test @modified query', {
                tags: ['modified'],
                query: 'test  query'
            });
            testParseQuery('test @modified', {
                tags: ['modified'],
                query: 'test'
            });
            testParseQuery('query has @ for some reason', {
                tags: [],
                query: 'query has @ for some reason'
            });
        });
    });
});
//# sourceMappingURL=settingsTreeModels.test.js.map