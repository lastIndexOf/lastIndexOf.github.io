/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/workbench/api/node/extHostTypes", "vs/workbench/api/node/extHostTypeConverters", "vs/base/common/objects", "./extHost.protocol", "vs/base/common/arrays", "vs/base/common/marshalling", "vs/editor/common/core/range", "vs/editor/common/core/position", "vs/base/common/uri"], function (require, exports, types_1, extHostTypes, extHostTypeConverter, objects_1, extHost_protocol_1, arrays_1, marshalling_1, range_1, position_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostCommands {
        constructor(mainContext, heapService, logService) {
            this._commands = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadCommands);
            this._logService = logService;
            this._converter = new CommandsConverter(this, heapService);
            this._argumentProcessors = [
                {
                    processArgument(a) {
                        // URI, Regex
                        return marshalling_1.revive(a, 0);
                    }
                },
                {
                    processArgument(arg) {
                        return objects_1.cloneAndChange(arg, function (obj) {
                            // Reverse of https://github.com/Microsoft/vscode/blob/1f28c5fc681f4c01226460b6d1c7e91b8acb4a5b/src/vs/workbench/api/node/extHostCommands.ts#L112-L127
                            if (range_1.Range.isIRange(obj)) {
                                return extHostTypeConverter.Range.to(obj);
                            }
                            if (position_1.Position.isIPosition(obj)) {
                                return extHostTypeConverter.Position.to(obj);
                            }
                            if (range_1.Range.isIRange(obj.range) && uri_1.URI.isUri(obj.uri)) {
                                return extHostTypeConverter.location.to(obj);
                            }
                            if (!Array.isArray(obj)) {
                                return obj;
                            }
                        });
                    }
                }
            ];
        }
        get converter() {
            return this._converter;
        }
        registerArgumentProcessor(processor) {
            this._argumentProcessors.push(processor);
        }
        registerCommand(global, id, callback, thisArg, description) {
            this._logService.trace('ExtHostCommands#registerCommand', id);
            if (!id.trim().length) {
                throw new Error('invalid id');
            }
            if (this._commands.has(id)) {
                throw new Error(`command '${id}' already exists`);
            }
            this._commands.set(id, { callback, thisArg, description });
            if (global) {
                this._proxy.$registerCommand(id);
            }
            return new extHostTypes.Disposable(() => {
                if (this._commands.delete(id)) {
                    if (global) {
                        this._proxy.$unregisterCommand(id);
                    }
                }
            });
        }
        executeCommand(id, ...args) {
            this._logService.trace('ExtHostCommands#executeCommand', id);
            if (this._commands.has(id)) {
                // we stay inside the extension host and support
                // to pass any kind of parameters around
                return this._executeContributedCommand(id, args);
            }
            else {
                // automagically convert some argument types
                args = objects_1.cloneAndChange(args, function (value) {
                    if (value instanceof extHostTypes.Position) {
                        return extHostTypeConverter.Position.from(value);
                    }
                    if (value instanceof extHostTypes.Range) {
                        return extHostTypeConverter.Range.from(value);
                    }
                    if (value instanceof extHostTypes.Location) {
                        return extHostTypeConverter.location.from(value);
                    }
                    if (!Array.isArray(value)) {
                        return value;
                    }
                });
                return this._proxy.$executeCommand(id, args).then(result => marshalling_1.revive(result, 0));
            }
        }
        _executeContributedCommand(id, args) {
            const command = this._commands.get(id);
            if (!command) {
                throw new Error('Unknown command');
            }
            let { callback, thisArg, description } = command;
            if (description) {
                for (let i = 0; i < description.args.length; i++) {
                    try {
                        types_1.validateConstraint(args[i], description.args[i].constraint);
                    }
                    catch (err) {
                        return Promise.reject(new Error(`Running the contributed command:'${id}' failed. Illegal argument '${description.args[i].name}' - ${description.args[i].description}`));
                    }
                }
            }
            try {
                const result = callback.apply(thisArg, args);
                return Promise.resolve(result);
            }
            catch (err) {
                this._logService.error(err, id);
                return Promise.reject(new Error(`Running the contributed command:'${id}' failed.`));
            }
        }
        $executeContributedCommand(id, ...args) {
            this._logService.trace('ExtHostCommands#$executeContributedCommand', id);
            if (!this._commands.has(id)) {
                return Promise.reject(new Error(`Contributed command '${id}' does not exist.`));
            }
            else {
                args = args.map(arg => this._argumentProcessors.reduce((r, p) => p.processArgument(r), arg));
                return this._executeContributedCommand(id, args);
            }
        }
        getCommands(filterUnderscoreCommands = false) {
            this._logService.trace('ExtHostCommands#getCommands', filterUnderscoreCommands);
            return this._proxy.$getCommands().then(result => {
                if (filterUnderscoreCommands) {
                    result = result.filter(command => command[0] !== '_');
                }
                return result;
            });
        }
        $getContributedCommandHandlerDescriptions() {
            const result = Object.create(null);
            this._commands.forEach((command, id) => {
                let { description } = command;
                if (description) {
                    result[id] = description;
                }
            });
            return Promise.resolve(result);
        }
    }
    exports.ExtHostCommands = ExtHostCommands;
    class CommandsConverter {
        // --- conversion between internal and api commands
        constructor(commands, heap) {
            this._delegatingCommandId = `_internal_command_delegation_${Date.now()}`;
            this._commands = commands;
            this._heap = heap;
            this._commands.registerCommand(true, this._delegatingCommandId, this._executeConvertedCommand, this);
        }
        toInternal(command) {
            if (!command) {
                return undefined;
            }
            const result = {
                $ident: undefined,
                id: command.command,
                title: command.title,
            };
            if (command.command && arrays_1.isNonEmptyArray(command.arguments)) {
                // we have a contributed command with arguments. that
                // means we don't want to send the arguments around
                const id = this._heap.keep(command);
                result.$ident = id;
                result.id = this._delegatingCommandId;
                result.arguments = [id];
            }
            if (command.tooltip) {
                result.tooltip = command.tooltip;
            }
            return result;
        }
        fromInternal(command) {
            const id = extHost_protocol_1.ObjectIdentifier.of(command);
            if (typeof id === 'number') {
                return this._heap.get(id);
            }
            else {
                return {
                    command: command.id,
                    title: command.title,
                    arguments: command.arguments
                };
            }
        }
        _executeConvertedCommand(...args) {
            const actualCmd = this._heap.get(args[0]);
            return this._commands.executeCommand(actualCmd.command, ...(actualCmd.arguments || []));
        }
    }
    exports.CommandsConverter = CommandsConverter;
});
//# sourceMappingURL=extHostCommands.js.map