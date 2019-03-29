/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/editor/standalone/common/standaloneThemeService"], function (require, exports, nls, editorExtensions_1, standaloneThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ToggleHighContrast extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.toggleHighContrast',
                label: nls.localize('toggleHighContrast', "Toggle High Contrast Theme"),
                alias: 'Toggle High Contrast Theme',
                precondition: null
            });
            this._originalThemeName = null;
        }
        run(accessor, editor) {
            const standaloneThemeService = accessor.get(standaloneThemeService_1.IStandaloneThemeService);
            if (this._originalThemeName) {
                // We must toggle back to the integrator's theme
                standaloneThemeService.setTheme(this._originalThemeName);
                this._originalThemeName = null;
            }
            else {
                this._originalThemeName = standaloneThemeService.getTheme().themeName;
                standaloneThemeService.setTheme('hc-black');
            }
        }
    }
    editorExtensions_1.registerEditorAction(ToggleHighContrast);
});
//# sourceMappingURL=toggleHighContrast.js.map