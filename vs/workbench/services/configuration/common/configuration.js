/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FOLDER_CONFIG_FOLDER_NAME = '.vscode';
    exports.FOLDER_SETTINGS_NAME = 'settings';
    exports.FOLDER_SETTINGS_PATH = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.FOLDER_SETTINGS_NAME}.json`;
    exports.defaultSettingsSchemaId = 'vscode://schemas/settings/default';
    exports.userSettingsSchemaId = 'vscode://schemas/settings/user';
    exports.workspaceSettingsSchemaId = 'vscode://schemas/settings/workspace';
    exports.folderSettingsSchemaId = 'vscode://schemas/settings/folder';
    exports.launchSchemaId = 'vscode://schemas/launch';
    exports.TASKS_CONFIGURATION_KEY = 'tasks';
    exports.LAUNCH_CONFIGURATION_KEY = 'launch';
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS = Object.create(null);
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS[exports.TASKS_CONFIGURATION_KEY] = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.TASKS_CONFIGURATION_KEY}.json`;
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS[exports.LAUNCH_CONFIGURATION_KEY] = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.LAUNCH_CONFIGURATION_KEY}.json`;
});
//# sourceMappingURL=configuration.js.map