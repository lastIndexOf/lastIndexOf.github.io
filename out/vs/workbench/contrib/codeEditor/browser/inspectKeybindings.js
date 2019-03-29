/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, editorExtensions_1, keybinding_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class InspectKeyMap extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'workbench.action.inspectKeyMappings',
                label: nls.localize('workbench.action.inspectKeyMap', "Developer: Inspect Key Mappings"),
                alias: 'Developer: Inspect Key Mappings',
                precondition: null
            });
        }
        run(accessor, editor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor({ contents: keybindingService._dumpDebugInfo(), options: { pinned: true } });
        }
    }
    editorExtensions_1.registerEditorAction(InspectKeyMap);
});
//# sourceMappingURL=inspectKeybindings.js.map