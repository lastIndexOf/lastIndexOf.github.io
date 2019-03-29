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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingResolver"], function (require, exports, event_1, lifecycle_1, map_1, commands_1, configuration_1, contextkey_1, keybindingResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const KEYBINDING_CONTEXT_ATTR = 'data-keybinding-context';
    class Context {
        constructor(id, parent) {
            this._id = id;
            this._parent = parent;
            this._value = Object.create(null);
            this._value['_contextId'] = id;
        }
        setValue(key, value) {
            // console.log('SET ' + key + ' = ' + value + ' ON ' + this._id);
            if (this._value[key] !== value) {
                this._value[key] = value;
                return true;
            }
            return false;
        }
        removeValue(key) {
            // console.log('REMOVE ' + key + ' FROM ' + this._id);
            if (key in this._value) {
                delete this._value[key];
                return true;
            }
            return false;
        }
        getValue(key) {
            const ret = this._value[key];
            if (typeof ret === 'undefined' && this._parent) {
                return this._parent.getValue(key);
            }
            return ret;
        }
        collectAllValues() {
            let result = this._parent ? this._parent.collectAllValues() : Object.create(null);
            result = Object.assign({}, result, this._value);
            delete result['_contextId'];
            return result;
        }
    }
    exports.Context = Context;
    class NullContext extends Context {
        constructor() {
            super(-1, null);
        }
        setValue(key, value) {
            return false;
        }
        removeValue(key) {
            return false;
        }
        getValue(key) {
            return undefined;
        }
        collectAllValues() {
            return Object.create(null);
        }
    }
    NullContext.INSTANCE = new NullContext();
    class ConfigAwareContextValuesContainer extends Context {
        constructor(id, _configurationService, emitter) {
            super(id, null);
            this._configurationService = _configurationService;
            this._values = new Map();
            this._listener = this._configurationService.onDidChangeConfiguration(event => {
                if (event.source === 4 /* DEFAULT */) {
                    // new setting, reset everything
                    const allKeys = map_1.keys(this._values);
                    this._values.clear();
                    emitter.fire(allKeys);
                }
                else {
                    const changedKeys = [];
                    for (const configKey of event.affectedKeys) {
                        const contextKey = `config.${configKey}`;
                        if (this._values.has(contextKey)) {
                            this._values.delete(contextKey);
                            changedKeys.push(contextKey);
                        }
                    }
                    emitter.fire(changedKeys);
                }
            });
        }
        dispose() {
            this._listener.dispose();
        }
        getValue(key) {
            if (key.indexOf(ConfigAwareContextValuesContainer._keyPrefix) !== 0) {
                return super.getValue(key);
            }
            if (this._values.has(key)) {
                return this._values.get(key);
            }
            const configKey = key.substr(ConfigAwareContextValuesContainer._keyPrefix.length);
            const configValue = this._configurationService.getValue(configKey);
            let value = undefined;
            switch (typeof configValue) {
                case 'number':
                case 'boolean':
                case 'string':
                    value = configValue;
                    break;
            }
            this._values.set(key, value);
            return value;
        }
        setValue(key, value) {
            return super.setValue(key, value);
        }
        removeValue(key) {
            return super.removeValue(key);
        }
        collectAllValues() {
            const result = Object.create(null);
            this._values.forEach((value, index) => result[index] = value);
            return Object.assign({}, result, super.collectAllValues());
        }
    }
    ConfigAwareContextValuesContainer._keyPrefix = 'config.';
    class ContextKey {
        constructor(parent, key, defaultValue) {
            this._parent = parent;
            this._key = key;
            this._defaultValue = defaultValue;
            this.reset();
        }
        set(value) {
            this._parent.setContext(this._key, value);
        }
        reset() {
            if (typeof this._defaultValue === 'undefined') {
                this._parent.removeContext(this._key);
            }
            else {
                this._parent.setContext(this._key, this._defaultValue);
            }
        }
        get() {
            return this._parent.getContextKeyValue(this._key);
        }
    }
    class SimpleContextKeyChangeEvent {
        constructor(_key) {
            this._key = _key;
        }
        affectsSome(keys) {
            return keys.has(this._key);
        }
    }
    class ArrayContextKeyChangeEvent {
        constructor(_keys) {
            this._keys = _keys;
        }
        affectsSome(keys) {
            for (const key of this._keys) {
                if (keys.has(key)) {
                    return true;
                }
            }
            return false;
        }
    }
    class AbstractContextKeyService {
        constructor(myContextId) {
            this._isDisposed = false;
            this._myContextId = myContextId;
            this._onDidChangeContextKey = new event_1.Emitter();
        }
        createKey(key, defaultValue) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            return new ContextKey(this, key, defaultValue);
        }
        get onDidChangeContext() {
            if (!this._onDidChangeContext) {
                this._onDidChangeContext = event_1.Event.map(this._onDidChangeContextKey.event, ((changedKeyOrKeys) => {
                    return typeof changedKeyOrKeys === 'string'
                        ? new SimpleContextKeyChangeEvent(changedKeyOrKeys)
                        : new ArrayContextKeyChangeEvent(changedKeyOrKeys);
                }));
            }
            return this._onDidChangeContext;
        }
        createScoped(domNode) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            return new ScopedContextKeyService(this, this._onDidChangeContextKey, domNode);
        }
        contextMatchesRules(rules) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            const context = this.getContextValuesContainer(this._myContextId);
            const result = keybindingResolver_1.KeybindingResolver.contextMatchesRules(context, rules);
            // console.group(rules.serialize() + ' -> ' + result);
            // rules.keys().forEach(key => { console.log(key, ctx[key]); });
            // console.groupEnd();
            return result;
        }
        getContextKeyValue(key) {
            if (this._isDisposed) {
                return undefined;
            }
            return this.getContextValuesContainer(this._myContextId).getValue(key);
        }
        setContext(key, value) {
            if (this._isDisposed) {
                return;
            }
            const myContext = this.getContextValuesContainer(this._myContextId);
            if (!myContext) {
                return;
            }
            if (myContext.setValue(key, value)) {
                this._onDidChangeContextKey.fire(key);
            }
        }
        removeContext(key) {
            if (this._isDisposed) {
                return;
            }
            if (this.getContextValuesContainer(this._myContextId).removeValue(key)) {
                this._onDidChangeContextKey.fire(key);
            }
        }
        getContext(target) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this.getContextValuesContainer(findContextAttr(target));
        }
    }
    exports.AbstractContextKeyService = AbstractContextKeyService;
    let ContextKeyService = class ContextKeyService extends AbstractContextKeyService {
        constructor(configurationService) {
            super(0);
            this._toDispose = [];
            this._lastContextId = 0;
            this._contexts = Object.create(null);
            const myContext = new ConfigAwareContextValuesContainer(this._myContextId, configurationService, this._onDidChangeContextKey);
            this._contexts[String(this._myContextId)] = myContext;
            this._toDispose.push(myContext);
            // Uncomment this to see the contexts continuously logged
            // let lastLoggedValue: string | null = null;
            // setInterval(() => {
            // 	let values = Object.keys(this._contexts).map((key) => this._contexts[key]);
            // 	let logValue = values.map(v => JSON.stringify(v._value, null, '\t')).join('\n');
            // 	if (lastLoggedValue !== logValue) {
            // 		lastLoggedValue = logValue;
            // 		console.log(lastLoggedValue);
            // 	}
            // }, 2000);
        }
        dispose() {
            this._isDisposed = true;
            this._toDispose = lifecycle_1.dispose(this._toDispose);
        }
        getContextValuesContainer(contextId) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this._contexts[String(contextId)];
        }
        createChildContext(parentContextId = this._myContextId) {
            if (this._isDisposed) {
                throw new Error(`ContextKeyService has been disposed`);
            }
            let id = (++this._lastContextId);
            this._contexts[String(id)] = new Context(id, this.getContextValuesContainer(parentContextId));
            return id;
        }
        disposeContext(contextId) {
            if (this._isDisposed) {
                return;
            }
            delete this._contexts[String(contextId)];
        }
    };
    ContextKeyService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], ContextKeyService);
    exports.ContextKeyService = ContextKeyService;
    class ScopedContextKeyService extends AbstractContextKeyService {
        constructor(parent, emitter, domNode) {
            super(parent.createChildContext());
            this._parent = parent;
            this._onDidChangeContextKey = emitter;
            if (domNode) {
                this._domNode = domNode;
                this._domNode.setAttribute(KEYBINDING_CONTEXT_ATTR, String(this._myContextId));
            }
        }
        dispose() {
            this._isDisposed = true;
            this._parent.disposeContext(this._myContextId);
            if (this._domNode) {
                this._domNode.removeAttribute(KEYBINDING_CONTEXT_ATTR);
                this._domNode = undefined;
            }
        }
        get onDidChangeContext() {
            return this._parent.onDidChangeContext;
        }
        getContextValuesContainer(contextId) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this._parent.getContextValuesContainer(contextId);
        }
        createChildContext(parentContextId = this._myContextId) {
            if (this._isDisposed) {
                throw new Error(`ScopedContextKeyService has been disposed`);
            }
            return this._parent.createChildContext(parentContextId);
        }
        disposeContext(contextId) {
            if (this._isDisposed) {
                return;
            }
            this._parent.disposeContext(contextId);
        }
    }
    function findContextAttr(domNode) {
        while (domNode) {
            if (domNode.hasAttribute(KEYBINDING_CONTEXT_ATTR)) {
                const attr = domNode.getAttribute(KEYBINDING_CONTEXT_ATTR);
                if (attr) {
                    return parseInt(attr, 10);
                }
                return NaN;
            }
            domNode = domNode.parentElement;
        }
        return 0;
    }
    commands_1.CommandsRegistry.registerCommand(contextkey_1.SET_CONTEXT_COMMAND_ID, function (accessor, contextKey, contextValue) {
        accessor.get(contextkey_1.IContextKeyService).createKey(String(contextKey), contextValue);
    });
});
//# sourceMappingURL=contextKeyService.js.map