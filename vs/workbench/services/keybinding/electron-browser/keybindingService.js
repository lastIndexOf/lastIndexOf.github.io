/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "native-keymap", "os", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/keybindingParser", "vs/base/common/platform", "vs/base/node/config", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/environment/common/environment", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/statusbar/common/statusbar", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/keybinding/common/keybindingIO", "vs/workbench/services/keybinding/common/keyboardMapper", "vs/workbench/services/keybinding/common/macLinuxFallbackKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxKeyboardMapper", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/platform/windows/common/windows", "vs/workbench/services/extensions/common/extensions", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, nativeKeymap, os_1, dom, keyboardEvent_1, errors_1, event_1, keybindingParser_1, platform_1, config_1, commands_1, configuration_1, configurationRegistry_1, contextkey_1, environment_1, jsonContributionRegistry_1, abstractKeybindingService_1, keybinding_1, keybindingResolver_1, keybindingsRegistry_1, resolvedKeybindingItem_1, notification_1, platform_2, statusbar_1, telemetry_1, telemetryUtils_1, extensionsRegistry_1, keybindingIO_1, keyboardMapper_1, macLinuxFallbackKeyboardMapper_1, macLinuxKeyboardMapper_1, windowsKeyboardMapper_1, windows_1, extensions_1, actions_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeyboardMapperFactory {
        constructor() {
            this._onDidChangeKeyboardMapper = new event_1.Emitter();
            this.onDidChangeKeyboardMapper = this._onDidChangeKeyboardMapper.event;
            this._layoutInfo = null;
            this._rawMapping = null;
            this._keyboardMapper = null;
            this._initialized = false;
        }
        _onKeyboardLayoutChanged() {
            if (this._initialized) {
                this._setKeyboardData(nativeKeymap.getCurrentKeyboardLayout(), nativeKeymap.getKeyMap());
            }
        }
        getKeyboardMapper(dispatchConfig) {
            if (!this._initialized) {
                this._setKeyboardData(nativeKeymap.getCurrentKeyboardLayout(), nativeKeymap.getKeyMap());
            }
            if (dispatchConfig === 1 /* KeyCode */) {
                // Forcefully set to use keyCode
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
            return this._keyboardMapper;
        }
        getCurrentKeyboardLayout() {
            if (!this._initialized) {
                this._setKeyboardData(nativeKeymap.getCurrentKeyboardLayout(), nativeKeymap.getKeyMap());
            }
            return this._layoutInfo;
        }
        static _isUSStandard(_kbInfo) {
            if (platform_1.OS === 3 /* Linux */) {
                const kbInfo = _kbInfo;
                return (kbInfo && kbInfo.layout === 'us');
            }
            if (platform_1.OS === 2 /* Macintosh */) {
                const kbInfo = _kbInfo;
                return (kbInfo && kbInfo.id === 'com.apple.keylayout.US');
            }
            if (platform_1.OS === 1 /* Windows */) {
                const kbInfo = _kbInfo;
                return (kbInfo && kbInfo.name === '00000409');
            }
            return false;
        }
        getRawKeyboardMapping() {
            if (!this._initialized) {
                this._setKeyboardData(nativeKeymap.getCurrentKeyboardLayout(), nativeKeymap.getKeyMap());
            }
            return this._rawMapping;
        }
        _setKeyboardData(layoutInfo, rawMapping) {
            this._layoutInfo = layoutInfo;
            if (this._initialized && KeyboardMapperFactory._equals(this._rawMapping, rawMapping)) {
                // nothing to do...
                return;
            }
            this._initialized = true;
            this._rawMapping = rawMapping;
            this._keyboardMapper = new keyboardMapper_1.CachedKeyboardMapper(KeyboardMapperFactory._createKeyboardMapper(this._layoutInfo, this._rawMapping));
            this._onDidChangeKeyboardMapper.fire();
        }
        static _createKeyboardMapper(layoutInfo, rawMapping) {
            const isUSStandard = KeyboardMapperFactory._isUSStandard(layoutInfo);
            if (platform_1.OS === 1 /* Windows */) {
                return new windowsKeyboardMapper_1.WindowsKeyboardMapper(isUSStandard, rawMapping);
            }
            if (Object.keys(rawMapping).length === 0) {
                // Looks like reading the mappings failed (most likely Mac + Japanese/Chinese keyboard layouts)
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
            if (platform_1.OS === 2 /* Macintosh */) {
                const kbInfo = layoutInfo;
                if (kbInfo.id === 'com.apple.keylayout.DVORAK-QWERTYCMD') {
                    // Use keyCode based dispatching for DVORAK - QWERTY ⌘
                    return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
                }
            }
            return new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(isUSStandard, rawMapping, platform_1.OS);
        }
        static _equals(a, b) {
            if (platform_1.OS === 1 /* Windows */) {
                return windowsKeyboardMapper_1.windowsKeyboardMappingEquals(a, b);
            }
            return macLinuxKeyboardMapper_1.macLinuxKeyboardMappingEquals(a, b);
        }
    }
    KeyboardMapperFactory.INSTANCE = new KeyboardMapperFactory();
    exports.KeyboardMapperFactory = KeyboardMapperFactory;
    function isContributedKeyBindingsArray(thing) {
        return Array.isArray(thing);
    }
    function isValidContributedKeyBinding(keyBinding, rejects) {
        if (!keyBinding) {
            rejects.push(nls.localize('nonempty', "expected non-empty value."));
            return false;
        }
        if (typeof keyBinding.command !== 'string') {
            rejects.push(nls.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
            return false;
        }
        if (keyBinding.key && typeof keyBinding.key !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'key'));
            return false;
        }
        if (keyBinding.when && typeof keyBinding.when !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
            return false;
        }
        if (keyBinding.mac && typeof keyBinding.mac !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'mac'));
            return false;
        }
        if (keyBinding.linux && typeof keyBinding.linux !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'linux'));
            return false;
        }
        if (keyBinding.win && typeof keyBinding.win !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'win'));
            return false;
        }
        return true;
    }
    let keybindingType = {
        type: 'object',
        default: { command: '', key: '' },
        properties: {
            command: {
                description: nls.localize('vscode.extension.contributes.keybindings.command', 'Identifier of the command to run when keybinding is triggered.'),
                type: 'string'
            },
            args: {
                description: nls.localize('vscode.extension.contributes.keybindings.args', "Arguments to pass to the command to execute.")
            },
            key: {
                description: nls.localize('vscode.extension.contributes.keybindings.key', 'Key or key sequence (separate keys with plus-sign and sequences with space, e.g Ctrl+O and Ctrl+L L for a chord).'),
                type: 'string'
            },
            mac: {
                description: nls.localize('vscode.extension.contributes.keybindings.mac', 'Mac specific key or key sequence.'),
                type: 'string'
            },
            linux: {
                description: nls.localize('vscode.extension.contributes.keybindings.linux', 'Linux specific key or key sequence.'),
                type: 'string'
            },
            win: {
                description: nls.localize('vscode.extension.contributes.keybindings.win', 'Windows specific key or key sequence.'),
                type: 'string'
            },
            when: {
                description: nls.localize('vscode.extension.contributes.keybindings.when', 'Condition when the key is active.'),
                type: 'string'
            },
        }
    };
    const keybindingsExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'keybindings',
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.keybindings', "Contributes keybindings."),
            oneOf: [
                keybindingType,
                {
                    type: 'array',
                    items: keybindingType
                }
            ]
        }
    });
    var DispatchConfig;
    (function (DispatchConfig) {
        DispatchConfig[DispatchConfig["Code"] = 0] = "Code";
        DispatchConfig[DispatchConfig["KeyCode"] = 1] = "KeyCode";
    })(DispatchConfig = exports.DispatchConfig || (exports.DispatchConfig = {}));
    function getDispatchConfig(configurationService) {
        const keyboard = configurationService.getValue('keyboard');
        const r = (keyboard ? keyboard.dispatch : null);
        return (r === 'keyCode' ? 1 /* KeyCode */ : 0 /* Code */);
    }
    let WorkbenchKeybindingService = class WorkbenchKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
        constructor(contextKeyService, commandService, telemetryService, notificationService, environmentService, statusBarService, configurationService, windowService, extensionService) {
            super(contextKeyService, commandService, telemetryService, notificationService, statusBarService);
            this.windowService = windowService;
            updateSchema();
            let dispatchConfig = getDispatchConfig(configurationService);
            configurationService.onDidChangeConfiguration((e) => {
                let newDispatchConfig = getDispatchConfig(configurationService);
                if (dispatchConfig === newDispatchConfig) {
                    return;
                }
                dispatchConfig = newDispatchConfig;
                this._keyboardMapper = KeyboardMapperFactory.INSTANCE.getKeyboardMapper(dispatchConfig);
                this.updateResolver({ source: 1 /* Default */ });
            });
            this._keyboardMapper = KeyboardMapperFactory.INSTANCE.getKeyboardMapper(dispatchConfig);
            KeyboardMapperFactory.INSTANCE.onDidChangeKeyboardMapper(() => {
                this._keyboardMapper = KeyboardMapperFactory.INSTANCE.getKeyboardMapper(dispatchConfig);
                this.updateResolver({ source: 1 /* Default */ });
            });
            this._cachedResolver = null;
            this._firstTimeComputingResolver = true;
            this.userKeybindings = this._register(new config_1.ConfigWatcher(environmentService.appKeybindingsPath, { defaultConfig: [], onError: error => errors_1.onUnexpectedError(error) }));
            keybindingsExtPoint.setHandler((extensions) => {
                let keybindings = [];
                for (let extension of extensions) {
                    this._handleKeybindingsExtensionPointUser(extension.description.isBuiltin, extension.value, extension.collector, keybindings);
                }
                keybindingsRegistry_1.KeybindingsRegistry.setExtensionKeybindings(keybindings);
                this.updateResolver({ source: 1 /* Default */ });
            });
            updateSchema();
            this._register(extensionService.onDidRegisterExtensions(() => updateSchema()));
            this._register(this.userKeybindings.onDidUpdateConfiguration(event => this.updateResolver({
                source: 2 /* User */,
                keybindings: event.config
            })));
            this._register(dom.addDisposableListener(window, dom.EventType.KEY_DOWN, (e) => {
                let keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                let shouldPreventDefault = this._dispatch(keyEvent, keyEvent.target);
                if (shouldPreventDefault) {
                    keyEvent.preventDefault();
                }
            }));
            telemetryUtils_1.keybindingsTelemetry(telemetryService, this);
            let data = KeyboardMapperFactory.INSTANCE.getCurrentKeyboardLayout();
            /* __GDPR__
                "keyboardLayout" : {
                    "currentKeyboardLayout": { "${inline}": [ "${IKeyboardLayoutInfo}" ] }
                }
            */
            telemetryService.publicLog('keyboardLayout', {
                currentKeyboardLayout: data
            });
        }
        _dumpDebugInfo() {
            const layoutInfo = JSON.stringify(KeyboardMapperFactory.INSTANCE.getCurrentKeyboardLayout(), null, '\t');
            const mapperInfo = this._keyboardMapper.dumpDebugInfo();
            const rawMapping = JSON.stringify(KeyboardMapperFactory.INSTANCE.getRawKeyboardMapping(), null, '\t');
            return `Layout info:\n${layoutInfo}\n${mapperInfo}\n\nRaw mapping:\n${rawMapping}`;
        }
        _safeGetConfig() {
            let rawConfig = this.userKeybindings.getConfig();
            if (Array.isArray(rawConfig)) {
                return rawConfig;
            }
            return [];
        }
        customKeybindingsCount() {
            let userKeybindings = this._safeGetConfig();
            return userKeybindings.length;
        }
        updateResolver(event) {
            this._cachedResolver = null;
            this._onDidUpdateKeybindings.fire(event);
        }
        _getResolver() {
            if (!this._cachedResolver) {
                const defaults = this._resolveKeybindingItems(keybindingsRegistry_1.KeybindingsRegistry.getDefaultKeybindings(), true);
                const overrides = this._resolveUserKeybindingItems(this._getExtraKeybindings(this._firstTimeComputingResolver), false);
                this._cachedResolver = new keybindingResolver_1.KeybindingResolver(defaults, overrides);
                this._firstTimeComputingResolver = false;
            }
            return this._cachedResolver;
        }
        _documentHasFocus() {
            // it is possible that the document has lost focus, but the
            // window is still focused, e.g. when a <webview> element
            // has focus
            return this.windowService.hasFocus;
        }
        _resolveKeybindingItems(items, isDefault) {
            let result = [], resultLen = 0;
            for (const item of items) {
                const when = (item.when ? item.when.normalize() : null);
                const keybinding = item.keybinding;
                if (!keybinding) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(null, item.command, item.commandArgs, when, isDefault);
                }
                else {
                    const resolvedKeybindings = this.resolveKeybinding(keybinding);
                    for (const resolvedKeybinding of resolvedKeybindings) {
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault);
                    }
                }
            }
            return result;
        }
        _resolveUserKeybindingItems(items, isDefault) {
            let result = [], resultLen = 0;
            for (const item of items) {
                const when = (item.when ? item.when.normalize() : null);
                const parts = item.parts;
                if (parts.length === 0) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(null, item.command, item.commandArgs, when, isDefault);
                }
                else {
                    const resolvedKeybindings = this._keyboardMapper.resolveUserBinding(parts);
                    for (const resolvedKeybinding of resolvedKeybindings) {
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault);
                    }
                }
            }
            return result;
        }
        _getExtraKeybindings(isFirstTime) {
            let extraUserKeybindings = this._safeGetConfig();
            if (!isFirstTime) {
                let cnt = extraUserKeybindings.length;
                /* __GDPR__
                    "customKeybindingsChanged" : {
                        "keyCount" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                    }
                */
                this._telemetryService.publicLog('customKeybindingsChanged', {
                    keyCount: cnt
                });
            }
            return extraUserKeybindings.map((k) => keybindingIO_1.KeybindingIO.readUserKeybindingItem(k));
        }
        resolveKeybinding(kb) {
            return this._keyboardMapper.resolveKeybinding(kb);
        }
        resolveKeyboardEvent(keyboardEvent) {
            return this._keyboardMapper.resolveKeyboardEvent(keyboardEvent);
        }
        resolveUserBinding(userBinding) {
            const parts = keybindingParser_1.KeybindingParser.parseUserBinding(userBinding);
            return this._keyboardMapper.resolveUserBinding(parts);
        }
        _handleKeybindingsExtensionPointUser(isBuiltin, keybindings, collector, result) {
            if (isContributedKeyBindingsArray(keybindings)) {
                for (let i = 0, len = keybindings.length; i < len; i++) {
                    this._handleKeybinding(isBuiltin, i + 1, keybindings[i], collector, result);
                }
            }
            else {
                this._handleKeybinding(isBuiltin, 1, keybindings, collector, result);
            }
        }
        _handleKeybinding(isBuiltin, idx, keybindings, collector, result) {
            let rejects = [];
            if (isValidContributedKeyBinding(keybindings, rejects)) {
                let rule = this._asCommandRule(isBuiltin, idx++, keybindings);
                if (rule) {
                    result.push(rule);
                }
            }
            if (rejects.length > 0) {
                collector.error(nls.localize('invalid.keybindings', "Invalid `contributes.{0}`: {1}", keybindingsExtPoint.name, rejects.join('\n')));
            }
        }
        _asCommandRule(isBuiltin, idx, binding) {
            let { command, args, when, key, mac, linux, win } = binding;
            let weight;
            if (isBuiltin) {
                weight = 300 /* BuiltinExtension */ + idx;
            }
            else {
                weight = 400 /* ExternalExtension */ + idx;
            }
            let desc = {
                id: command,
                args,
                when: contextkey_1.ContextKeyExpr.deserialize(when),
                weight: weight,
                primary: keybindingParser_1.KeybindingParser.parseKeybinding(key, platform_1.OS),
                mac: mac ? { primary: keybindingParser_1.KeybindingParser.parseKeybinding(mac, platform_1.OS) } : null,
                linux: linux ? { primary: keybindingParser_1.KeybindingParser.parseKeybinding(linux, platform_1.OS) } : null,
                win: win ? { primary: keybindingParser_1.KeybindingParser.parseKeybinding(win, platform_1.OS) } : null
            };
            if (!desc.primary && !desc.mac && !desc.linux && !desc.win) {
                return undefined;
            }
            return desc;
        }
        getDefaultKeybindingsContent() {
            const resolver = this._getResolver();
            const defaultKeybindings = resolver.getDefaultKeybindings();
            const boundCommands = resolver.getDefaultBoundCommands();
            return (WorkbenchKeybindingService._getDefaultKeybindings(defaultKeybindings)
                + '\n\n'
                + WorkbenchKeybindingService._getAllCommandsAsComment(boundCommands));
        }
        static _getDefaultKeybindings(defaultKeybindings) {
            let out = new keybindingIO_1.OutputBuilder();
            out.writeLine('[');
            let lastIndex = defaultKeybindings.length - 1;
            defaultKeybindings.forEach((k, index) => {
                keybindingIO_1.KeybindingIO.writeKeybindingItem(out, k);
                if (index !== lastIndex) {
                    out.writeLine(',');
                }
                else {
                    out.writeLine();
                }
            });
            out.writeLine(']');
            return out.toString();
        }
        static _getAllCommandsAsComment(boundCommands) {
            const unboundCommands = keybindingResolver_1.KeybindingResolver.getAllUnboundCommands(boundCommands);
            let pretty = unboundCommands.sort().join('\n// - ');
            return '// ' + nls.localize('unboundCommands', "Here are other available commands: ") + '\n// - ' + pretty;
        }
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey) {
                // ignore ctrl/cmd-combination but not shift/alt-combinatios
                return false;
            }
            // consult the KeyboardMapperFactory to check the given event for
            // a printable value.
            const mapping = KeyboardMapperFactory.INSTANCE.getRawKeyboardMapping();
            if (!mapping) {
                return false;
            }
            const keyInfo = mapping[event.code];
            if (!keyInfo) {
                return false;
            }
            if (!keyInfo.value || /\s/.test(keyInfo.value)) {
                return false;
            }
            return true;
        }
    };
    WorkbenchKeybindingService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, notification_1.INotificationService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, windows_1.IWindowService),
        __param(8, extensions_1.IExtensionService)
    ], WorkbenchKeybindingService);
    exports.WorkbenchKeybindingService = WorkbenchKeybindingService;
    let schemaId = 'vscode://schemas/keybindings';
    let commandsSchemas = [];
    let commandsEnum = [];
    let commandsEnumDescriptions = [];
    let schema = {
        'id': schemaId,
        'type': 'array',
        'title': nls.localize('keybindings.json.title', "Keybindings configuration"),
        'definitions': {
            'editorGroupsSchema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'groups': {
                            '$ref': '#/definitions/editorGroupsSchema',
                            'default': [{}, {}]
                        },
                        'size': {
                            'type': 'number',
                            'default': 0.5
                        }
                    }
                }
            }
        },
        'items': {
            'required': ['key'],
            'type': 'object',
            'defaultSnippets': [{ 'body': { 'key': '$1', 'command': '$2', 'when': '$3' } }],
            'properties': {
                'key': {
                    'type': 'string',
                    'description': nls.localize('keybindings.json.key', "Key or key sequence (separated by space)"),
                },
                'command': {
                    'type': 'string',
                    'enum': commandsEnum,
                    'enumDescriptions': commandsEnumDescriptions,
                    'description': nls.localize('keybindings.json.command', "Name of the command to execute"),
                },
                'when': {
                    'type': 'string',
                    'description': nls.localize('keybindings.json.when', "Condition when the key is active.")
                },
                'args': {
                    'description': nls.localize('keybindings.json.args', "Arguments to pass to the command to execute.")
                }
            },
            'allOf': commandsSchemas
        }
    };
    let schemaRegistry = platform_2.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(schemaId, schema);
    function updateSchema() {
        commandsSchemas.length = 0;
        commandsEnum.length = 0;
        commandsEnumDescriptions.length = 0;
        const knownCommands = new Set();
        const addKnownCommand = (commandId, description) => {
            if (!/^_/.test(commandId)) {
                if (!knownCommands.has(commandId)) {
                    knownCommands.add(commandId);
                    commandsEnum.push(commandId);
                    commandsEnumDescriptions.push(description);
                    // Also add the negative form for keybinding removal
                    commandsEnum.push(`-${commandId}`);
                    commandsEnumDescriptions.push(description);
                }
            }
        };
        const allCommands = commands_1.CommandsRegistry.getCommands();
        for (let commandId in allCommands) {
            const commandDescription = allCommands[commandId].description;
            addKnownCommand(commandId, commandDescription && commandDescription.description);
            if (!commandDescription || !commandDescription.args || commandDescription.args.length !== 1 || !commandDescription.args[0].schema) {
                continue;
            }
            const argsSchema = commandDescription.args[0].schema;
            const argsRequired = Array.isArray(argsSchema.required) && argsSchema.required.length > 0;
            const addition = {
                'if': {
                    'properties': {
                        'command': { 'const': commandId }
                    }
                },
                'then': {
                    'required': [].concat(argsRequired ? ['args'] : []),
                    'properties': {
                        'args': argsSchema
                    }
                }
            };
            commandsSchemas.push(addition);
        }
        const menuCommands = actions_1.MenuRegistry.getCommands();
        for (let commandId in menuCommands) {
            addKnownCommand(commandId);
        }
    }
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const keyboardConfiguration = {
        'id': 'keyboard',
        'order': 15,
        'type': 'object',
        'title': nls.localize('keyboardConfigurationTitle', "Keyboard"),
        'overridable': true,
        'properties': {
            'keyboard.dispatch': {
                'type': 'string',
                'enum': ['code', 'keyCode'],
                'default': 'code',
                'markdownDescription': nls.localize('dispatch', "Controls the dispatching logic for key presses to use either `code` (recommended) or `keyCode`."),
                'included': platform_1.OS === 2 /* Macintosh */ || platform_1.OS === 3 /* Linux */
            },
            'keyboard.touchbar.enabled': {
                'type': 'boolean',
                'default': true,
                'description': nls.localize('touchbar.enabled', "Enables the macOS touchbar buttons on the keyboard if available."),
                'included': platform_1.OS === 2 /* Macintosh */ && parseFloat(os_1.release()) >= 16 // Minimum: macOS Sierra (10.12.x = darwin 16.x)
            }
        }
    };
    configurationRegistry.registerConfiguration(keyboardConfiguration);
    extensions_2.registerSingleton(keybinding_1.IKeybindingService, WorkbenchKeybindingService);
});
//# sourceMappingURL=keybindingService.js.map