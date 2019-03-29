/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "crypto", "vs/base/common/objects", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry"], function (require, exports, nls, crypto, Objects, taskDefinitionRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KeyedTaskIdentifier;
    (function (KeyedTaskIdentifier) {
        function create(value) {
            const hash = crypto.createHash('md5');
            hash.update(JSON.stringify(value));
            let result = { _key: hash.digest('hex'), type: value.taskType };
            Objects.assign(result, value);
            return result;
        }
        KeyedTaskIdentifier.create = create;
    })(KeyedTaskIdentifier || (KeyedTaskIdentifier = {}));
    exports.KeyedTaskIdentifier = KeyedTaskIdentifier;
    var TaskDefinition;
    (function (TaskDefinition) {
        function createTaskIdentifier(external, reporter) {
            let definition = taskDefinitionRegistry_1.TaskDefinitionRegistry.get(external.type);
            if (definition === undefined) {
                // We have no task definition so we can't sanitize the literal. Take it as is
                let copy = Objects.deepClone(external);
                delete copy._key;
                return KeyedTaskIdentifier.create(copy);
            }
            let literal = Object.create(null);
            literal.type = definition.taskType;
            let required = new Set();
            definition.required.forEach(element => required.add(element));
            let properties = definition.properties;
            for (let property of Object.keys(properties)) {
                let value = external[property];
                if (value !== undefined && value !== null) {
                    literal[property] = value;
                }
                else if (required.has(property)) {
                    let schema = properties[property];
                    if (schema.default !== undefined) {
                        literal[property] = Objects.deepClone(schema.default);
                    }
                    else {
                        switch (schema.type) {
                            case 'boolean':
                                literal[property] = false;
                                break;
                            case 'number':
                            case 'integer':
                                literal[property] = 0;
                                break;
                            case 'string':
                                literal[property] = '';
                                break;
                            default:
                                reporter.error(nls.localize('TaskDefinition.missingRequiredProperty', 'Error: the task identifier \'{0}\' is missing the required property \'{1}\'. The task identifier will be ignored.', JSON.stringify(external, undefined, 0), property));
                                return undefined;
                        }
                    }
                }
            }
            return KeyedTaskIdentifier.create(literal);
        }
        TaskDefinition.createTaskIdentifier = createTaskIdentifier;
    })(TaskDefinition || (TaskDefinition = {}));
    exports.TaskDefinition = TaskDefinition;
});
//# sourceMappingURL=tasks.js.map