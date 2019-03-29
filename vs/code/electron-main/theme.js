/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "electron"], function (require, exports, platform_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEFAULT_BG_LIGHT = '#FFFFFF';
    const DEFAULT_BG_DARK = '#1E1E1E';
    const DEFAULT_BG_HC_BLACK = '#000000';
    const THEME_STORAGE_KEY = 'theme';
    const THEME_BG_STORAGE_KEY = 'themeBackground';
    function storeBackgroundColor(stateService, data) {
        stateService.setItem(THEME_STORAGE_KEY, data.baseTheme);
        stateService.setItem(THEME_BG_STORAGE_KEY, data.background);
    }
    exports.storeBackgroundColor = storeBackgroundColor;
    function getBackgroundColor(stateService) {
        if (platform_1.isWindows && electron_1.systemPreferences.isInvertedColorScheme()) {
            return DEFAULT_BG_HC_BLACK;
        }
        let background = stateService.getItem(THEME_BG_STORAGE_KEY, null);
        if (!background) {
            let baseTheme;
            if (platform_1.isWindows && electron_1.systemPreferences.isInvertedColorScheme()) {
                baseTheme = 'hc-black';
            }
            else {
                baseTheme = stateService.getItem(THEME_STORAGE_KEY, 'vs-dark').split(' ')[0];
            }
            background = (baseTheme === 'hc-black') ? DEFAULT_BG_HC_BLACK : (baseTheme === 'vs' ? DEFAULT_BG_LIGHT : DEFAULT_BG_DARK);
        }
        if (platform_1.isMacintosh && background.toUpperCase() === DEFAULT_BG_DARK) {
            background = '#171717'; // https://github.com/electron/electron/issues/5150
        }
        return background;
    }
    exports.getBackgroundColor = getBackgroundColor;
});
//# sourceMappingURL=theme.js.map