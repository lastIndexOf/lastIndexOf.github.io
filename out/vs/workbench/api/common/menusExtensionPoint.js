/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/collections", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/lifecycle"], function (require, exports, nls_1, strings_1, resources, collections_1, extensionsRegistry_1, contextkey_1, actions_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var schema;
    (function (schema) {
        // --- menus contribution point
        function parseMenuId(value) {
            switch (value) {
                case 'commandPalette': return 0 /* CommandPalette */;
                case 'touchBar': return 35 /* TouchBarContext */;
                case 'editor/title': return 8 /* EditorTitle */;
                case 'editor/context': return 7 /* EditorContext */;
                case 'explorer/context': return 11 /* ExplorerContext */;
                case 'editor/title/context': return 9 /* EditorTitleContext */;
                case 'debug/callstack/context': return 2 /* DebugCallStackContext */;
                case 'debug/toolbar': return 6 /* DebugToolbar */;
                case 'scm/title': return 33 /* SCMTitle */;
                case 'scm/sourceControl': return 32 /* SCMSourceControl */;
                case 'scm/resourceGroup/context': return 31 /* SCMResourceGroupContext */;
                case 'scm/resourceState/context': return 30 /* SCMResourceContext */;
                case 'scm/change/title': return 29 /* SCMChangeContext */;
                case 'view/title': return 37 /* ViewTitle */;
                case 'view/item/context': return 36 /* ViewItemContext */;
            }
            return undefined;
        }
        schema.parseMenuId = parseMenuId;
        function isValidMenuItems(menu, collector) {
            if (!Array.isArray(menu)) {
                collector.error(nls_1.localize('requirearray', "menu items must be an array"));
                return false;
            }
            for (let item of menu) {
                if (typeof item.command !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
                    return false;
                }
                if (item.alt && typeof item.alt !== 'string') {
                    collector.error(nls_1.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'alt'));
                    return false;
                }
                if (item.when && typeof item.when !== 'string') {
                    collector.error(nls_1.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                    return false;
                }
                if (item.group && typeof item.group !== 'string') {
                    collector.error(nls_1.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'group'));
                    return false;
                }
            }
            return true;
        }
        schema.isValidMenuItems = isValidMenuItems;
        const menuItem = {
            type: 'object',
            properties: {
                command: {
                    description: nls_1.localize('vscode.extension.contributes.menuItem.command', 'Identifier of the command to execute. The command must be declared in the \'commands\'-section'),
                    type: 'string'
                },
                alt: {
                    description: nls_1.localize('vscode.extension.contributes.menuItem.alt', 'Identifier of an alternative command to execute. The command must be declared in the \'commands\'-section'),
                    type: 'string'
                },
                when: {
                    description: nls_1.localize('vscode.extension.contributes.menuItem.when', 'Condition which must be true to show this item'),
                    type: 'string'
                },
                group: {
                    description: nls_1.localize('vscode.extension.contributes.menuItem.group', 'Group into which this command belongs'),
                    type: 'string'
                }
            }
        };
        schema.menusContribtion = {
            description: nls_1.localize('vscode.extension.contributes.menus', "Contributes menu items to the editor"),
            type: 'object',
            properties: {
                'commandPalette': {
                    description: nls_1.localize('menus.commandPalette', "The Command Palette"),
                    type: 'array',
                    items: menuItem
                },
                'touchBar': {
                    description: nls_1.localize('menus.touchBar', "The touch bar (macOS only)"),
                    type: 'array',
                    items: menuItem
                },
                'editor/title': {
                    description: nls_1.localize('menus.editorTitle', "The editor title menu"),
                    type: 'array',
                    items: menuItem
                },
                'editor/context': {
                    description: nls_1.localize('menus.editorContext', "The editor context menu"),
                    type: 'array',
                    items: menuItem
                },
                'explorer/context': {
                    description: nls_1.localize('menus.explorerContext', "The file explorer context menu"),
                    type: 'array',
                    items: menuItem
                },
                'editor/title/context': {
                    description: nls_1.localize('menus.editorTabContext', "The editor tabs context menu"),
                    type: 'array',
                    items: menuItem
                },
                'debug/callstack/context': {
                    description: nls_1.localize('menus.debugCallstackContext', "The debug callstack context menu"),
                    type: 'array',
                    items: menuItem
                },
                'debug/toolbar': {
                    description: nls_1.localize('menus.debugToolbar', "The debug toolbar menu"),
                    type: 'array',
                    items: menuItem
                },
                'scm/title': {
                    description: nls_1.localize('menus.scmTitle', "The Source Control title menu"),
                    type: 'array',
                    items: menuItem
                },
                'scm/sourceControl': {
                    description: nls_1.localize('menus.scmSourceControl', "The Source Control menu"),
                    type: 'array',
                    items: menuItem
                },
                'scm/resourceGroup/context': {
                    description: nls_1.localize('menus.resourceGroupContext', "The Source Control resource group context menu"),
                    type: 'array',
                    items: menuItem
                },
                'scm/resourceState/context': {
                    description: nls_1.localize('menus.resourceStateContext', "The Source Control resource state context menu"),
                    type: 'array',
                    items: menuItem
                },
                'view/title': {
                    description: nls_1.localize('view.viewTitle', "The contributed view title menu"),
                    type: 'array',
                    items: menuItem
                },
                'view/item/context': {
                    description: nls_1.localize('view.itemContext', "The contributed view item context menu"),
                    type: 'array',
                    items: menuItem
                }
            }
        };
        function isValidCommand(command, collector) {
            if (!command) {
                collector.error(nls_1.localize('nonempty', "expected non-empty value."));
                return false;
            }
            if (strings_1.isFalsyOrWhitespace(command.command)) {
                collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
                return false;
            }
            if (!isValidLocalizedString(command.title, collector, 'title')) {
                return false;
            }
            if (command.category && !isValidLocalizedString(command.category, collector, 'category')) {
                return false;
            }
            if (!isValidIcon(command.icon, collector)) {
                return false;
            }
            return true;
        }
        schema.isValidCommand = isValidCommand;
        function isValidIcon(icon, collector) {
            if (typeof icon === 'undefined') {
                return true;
            }
            if (typeof icon === 'string') {
                return true;
            }
            else if (typeof icon.dark === 'string' && typeof icon.light === 'string') {
                return true;
            }
            collector.error(nls_1.localize('opticon', "property `icon` can be omitted or must be either a string or a literal like `{dark, light}`"));
            return false;
        }
        function isValidLocalizedString(localized, collector, propertyName) {
            if (typeof localized === 'undefined') {
                collector.error(nls_1.localize('requireStringOrObject', "property `{0}` is mandatory and must be of type `string` or `object`", propertyName));
                return false;
            }
            else if (typeof localized === 'string' && strings_1.isFalsyOrWhitespace(localized)) {
                collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", propertyName));
                return false;
            }
            else if (typeof localized !== 'string' && (strings_1.isFalsyOrWhitespace(localized.original) || strings_1.isFalsyOrWhitespace(localized.value))) {
                collector.error(nls_1.localize('requirestrings', "properties `{0}` and `{1}` are mandatory and must be of type `string`", `${propertyName}.value`, `${propertyName}.original`));
                return false;
            }
            return true;
        }
        const commandType = {
            type: 'object',
            required: ['command', 'title'],
            properties: {
                command: {
                    description: nls_1.localize('vscode.extension.contributes.commandType.command', 'Identifier of the command to execute'),
                    type: 'string'
                },
                title: {
                    description: nls_1.localize('vscode.extension.contributes.commandType.title', 'Title by which the command is represented in the UI'),
                    type: 'string'
                },
                category: {
                    description: nls_1.localize('vscode.extension.contributes.commandType.category', '(Optional) Category string by the command is grouped in the UI'),
                    type: 'string'
                },
                icon: {
                    description: nls_1.localize('vscode.extension.contributes.commandType.icon', '(Optional) Icon which is used to represent the command in the UI. Either a file path or a themable configuration'),
                    anyOf: [{
                            type: 'string'
                        },
                        {
                            type: 'object',
                            properties: {
                                light: {
                                    description: nls_1.localize('vscode.extension.contributes.commandType.icon.light', 'Icon path when a light theme is used'),
                                    type: 'string'
                                },
                                dark: {
                                    description: nls_1.localize('vscode.extension.contributes.commandType.icon.dark', 'Icon path when a dark theme is used'),
                                    type: 'string'
                                }
                            }
                        }]
                }
            }
        };
        schema.commandsContribution = {
            description: nls_1.localize('vscode.extension.contributes.commands', "Contributes commands to the command palette."),
            oneOf: [
                commandType,
                {
                    type: 'array',
                    items: commandType
                }
            ]
        };
    })(schema || (schema = {}));
    let _commandRegistrations = [];
    extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'commands',
        jsonSchema: schema.commandsContribution
    }).setHandler(extensions => {
        function handleCommand(userFriendlyCommand, extension, disposables) {
            if (!schema.isValidCommand(userFriendlyCommand, extension.collector)) {
                return;
            }
            const { icon, category, title, command } = userFriendlyCommand;
            let absoluteIcon;
            if (icon) {
                if (typeof icon === 'string') {
                    absoluteIcon = { dark: resources.joinPath(extension.description.extensionLocation, icon) };
                }
                else {
                    absoluteIcon = {
                        dark: resources.joinPath(extension.description.extensionLocation, icon.dark),
                        light: resources.joinPath(extension.description.extensionLocation, icon.light)
                    };
                }
            }
            if (actions_1.MenuRegistry.getCommand(command)) {
                extension.collector.info(nls_1.localize('dup', "Command `{0}` appears multiple times in the `commands` section.", userFriendlyCommand.command));
            }
            const registration = actions_1.MenuRegistry.addCommand({ id: command, title, category, iconLocation: absoluteIcon });
            disposables.push(registration);
        }
        // remove all previous command registrations
        _commandRegistrations = lifecycle_1.dispose(_commandRegistrations);
        for (let extension of extensions) {
            const { value } = extension;
            if (Array.isArray(value)) {
                for (let command of value) {
                    handleCommand(command, extension, _commandRegistrations);
                }
            }
            else {
                handleCommand(value, extension, _commandRegistrations);
            }
        }
    });
    let _menuRegistrations = [];
    extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'menus',
        jsonSchema: schema.menusContribtion
    }).setHandler(extensions => {
        // remove all previous menu registrations
        _menuRegistrations = lifecycle_1.dispose(_menuRegistrations);
        for (let extension of extensions) {
            const { value, collector } = extension;
            collections_1.forEach(value, entry => {
                if (!schema.isValidMenuItems(entry.value, collector)) {
                    return;
                }
                const menu = schema.parseMenuId(entry.key);
                if (typeof menu !== 'number') {
                    collector.warn(nls_1.localize('menuId.invalid', "`{0}` is not a valid menu identifier", entry.key));
                    return;
                }
                for (let item of entry.value) {
                    let command = actions_1.MenuRegistry.getCommand(item.command);
                    let alt = item.alt && actions_1.MenuRegistry.getCommand(item.alt);
                    if (!command) {
                        collector.error(nls_1.localize('missing.command', "Menu item references a command `{0}` which is not defined in the 'commands' section.", item.command));
                        continue;
                    }
                    if (item.alt && !alt) {
                        collector.warn(nls_1.localize('missing.altCommand', "Menu item references an alt-command `{0}` which is not defined in the 'commands' section.", item.alt));
                    }
                    if (item.command === item.alt) {
                        collector.info(nls_1.localize('dupe.command', "Menu item references the same command as default and alt-command"));
                    }
                    let group;
                    let order;
                    if (item.group) {
                        const idx = item.group.lastIndexOf('@');
                        if (idx > 0) {
                            group = item.group.substr(0, idx);
                            order = Number(item.group.substr(idx + 1)) || undefined;
                        }
                        else {
                            group = item.group;
                        }
                    }
                    const registration = actions_1.MenuRegistry.appendMenuItem(menu, {
                        command,
                        alt,
                        group,
                        order,
                        when: contextkey_1.ContextKeyExpr.deserialize(item.when)
                    });
                    _menuRegistrations.push(registration);
                }
            });
        }
    });
});
//# sourceMappingURL=menusExtensionPoint.js.map