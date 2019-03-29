/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/process", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/labels", "vs/nls"], function (require, exports, paths, process, types, objects, platform_1, labels_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AbstractVariableResolverService {
        constructor(_context, _envVariables) {
            this._context = _context;
            this._envVariables = _envVariables;
            if (platform_1.isWindows) {
                this._envVariables = Object.create(null);
                Object.keys(_envVariables).forEach(key => {
                    this._envVariables[key.toLowerCase()] = _envVariables[key];
                });
            }
        }
        resolve(root, value) {
            return this.recursiveResolve(root ? root.uri : undefined, value);
        }
        resolveAnyBase(workspaceFolder, config, commandValueMapping, resolvedVariables) {
            const result = objects.deepClone(config);
            // hoist platform specific attributes to top level
            if (platform_1.isWindows && result.windows) {
                Object.keys(result.windows).forEach(key => result[key] = result.windows[key]);
            }
            else if (platform_1.isMacintosh && result.osx) {
                Object.keys(result.osx).forEach(key => result[key] = result.osx[key]);
            }
            else if (platform_1.isLinux && result.linux) {
                Object.keys(result.linux).forEach(key => result[key] = result.linux[key]);
            }
            // delete all platform specific sections
            delete result.windows;
            delete result.osx;
            delete result.linux;
            // substitute all variables recursively in string values
            return this.recursiveResolve(workspaceFolder ? workspaceFolder.uri : undefined, result, commandValueMapping, resolvedVariables);
        }
        resolveAny(workspaceFolder, config, commandValueMapping) {
            return this.resolveAnyBase(workspaceFolder, config, commandValueMapping);
        }
        resolveAnyMap(workspaceFolder, config, commandValueMapping) {
            const resolvedVariables = new Map();
            const newConfig = this.resolveAnyBase(workspaceFolder, config, commandValueMapping, resolvedVariables);
            return { newConfig, resolvedVariables };
        }
        resolveWithInteractionReplace(folder, config) {
            throw new Error('resolveWithInteractionReplace not implemented.');
        }
        resolveWithInteraction(folder, config) {
            throw new Error('resolveWithInteraction not implemented.');
        }
        recursiveResolve(folderUri, value, commandValueMapping, resolvedVariables) {
            if (types.isString(value)) {
                const resolved = this.resolveString(folderUri, value, commandValueMapping);
                if (resolvedVariables) {
                    resolvedVariables.set(resolved.variableName, resolved.resolvedValue);
                }
                return resolved.replaced;
            }
            else if (types.isArray(value)) {
                return value.map(s => this.recursiveResolve(folderUri, s, commandValueMapping, resolvedVariables));
            }
            else if (types.isObject(value)) {
                let result = Object.create(null);
                Object.keys(value).forEach(key => {
                    const resolvedKey = this.resolveString(folderUri, key, commandValueMapping);
                    if (resolvedVariables) {
                        resolvedVariables.set(resolvedKey.variableName, resolvedKey.resolvedValue);
                    }
                    result[resolvedKey.replaced] = this.recursiveResolve(folderUri, value[key], commandValueMapping, resolvedVariables);
                });
                return result;
            }
            return value;
        }
        resolveString(folderUri, value, commandValueMapping) {
            const filePath = this._context.getFilePath();
            let variableName;
            let resolvedValue;
            const replaced = value.replace(AbstractVariableResolverService.VARIABLE_REGEXP, (match, variable) => {
                variableName = variable;
                let argument;
                const parts = variable.split(':');
                if (parts && parts.length > 1) {
                    variable = parts[0];
                    argument = parts[1];
                }
                switch (variable) {
                    case 'env':
                        if (argument) {
                            if (platform_1.isWindows) {
                                argument = argument.toLowerCase();
                            }
                            const env = this._envVariables[argument];
                            if (types.isString(env)) {
                                return resolvedValue = env;
                            }
                            // For `env` we should do the same as a normal shell does - evaluates missing envs to an empty string #46436
                            return resolvedValue = '';
                        }
                        throw new Error(nls_1.localize('missingEnvVarName', "'{0}' can not be resolved because no environment variable name is given.", match));
                    case 'config':
                        if (argument) {
                            const config = this._context.getConfigurationValue(folderUri, argument);
                            if (types.isUndefinedOrNull(config)) {
                                throw new Error(nls_1.localize('configNotFound', "'{0}' can not be resolved because setting '{1}' not found.", match, argument));
                            }
                            if (types.isObject(config)) {
                                throw new Error(nls_1.localize('configNoString', "'{0}' can not be resolved because '{1}' is a structured value.", match, argument));
                            }
                            return resolvedValue = config;
                        }
                        throw new Error(nls_1.localize('missingConfigName', "'{0}' can not be resolved because no settings name is given.", match));
                    case 'command':
                        return resolvedValue = this.resolveFromMap(match, argument, commandValueMapping, 'command');
                    case 'input':
                        return resolvedValue = this.resolveFromMap(match, argument, commandValueMapping, 'input');
                    default: {
                        // common error handling for all variables that require an open folder and accept a folder name argument
                        switch (variable) {
                            case 'workspaceRoot':
                            case 'workspaceFolder':
                            case 'workspaceRootFolderName':
                            case 'workspaceFolderBasename':
                            case 'relativeFile':
                                if (argument) {
                                    const folder = this._context.getFolderUri(argument);
                                    if (folder) {
                                        folderUri = folder;
                                    }
                                    else {
                                        throw new Error(nls_1.localize('canNotFindFolder', "'{0}' can not be resolved. No such folder '{1}'.", match, argument));
                                    }
                                }
                                if (!folderUri) {
                                    if (this._context.getWorkspaceFolderCount() > 1) {
                                        throw new Error(nls_1.localize('canNotResolveWorkspaceFolderMultiRoot', "'{0}' can not be resolved in a multi folder workspace. Scope this variable using ':' and a workspace folder name.", match));
                                    }
                                    throw new Error(nls_1.localize('canNotResolveWorkspaceFolder', "'{0}' can not be resolved. Please open a folder.", match));
                                }
                                break;
                            default:
                                break;
                        }
                        // common error handling for all variables that require an open file
                        switch (variable) {
                            case 'file':
                            case 'relativeFile':
                            case 'fileDirname':
                            case 'fileExtname':
                            case 'fileBasename':
                            case 'fileBasenameNoExtension':
                                if (!filePath) {
                                    throw new Error(nls_1.localize('canNotResolveFile', "'{0}' can not be resolved. Please open an editor.", match));
                                }
                                break;
                            default:
                                break;
                        }
                        switch (variable) {
                            case 'workspaceRoot':
                            case 'workspaceFolder':
                                return resolvedValue = labels_1.normalizeDriveLetter(folderUri.fsPath);
                            case 'cwd':
                                return resolvedValue = (folderUri ? labels_1.normalizeDriveLetter(folderUri.fsPath) : process.cwd());
                            case 'workspaceRootFolderName':
                            case 'workspaceFolderBasename':
                                return resolvedValue = paths.basename(folderUri.fsPath);
                            case 'lineNumber':
                                const lineNumber = this._context.getLineNumber();
                                if (lineNumber) {
                                    return resolvedValue = lineNumber;
                                }
                                throw new Error(nls_1.localize('canNotResolveLineNumber', "'{0}' can not be resolved. Make sure to have a line selected in the active editor.", match));
                            case 'selectedText':
                                const selectedText = this._context.getSelectedText();
                                if (selectedText) {
                                    return resolvedValue = selectedText;
                                }
                                throw new Error(nls_1.localize('canNotResolveSelectedText', "'{0}' can not be resolved. Make sure to have some text selected in the active editor.", match));
                            case 'file':
                                return resolvedValue = filePath;
                            case 'relativeFile':
                                if (folderUri) {
                                    return resolvedValue = paths.normalize(paths.relative(folderUri.fsPath, filePath));
                                }
                                return resolvedValue = filePath;
                            case 'fileDirname':
                                return resolvedValue = paths.dirname(filePath);
                            case 'fileExtname':
                                return resolvedValue = paths.extname(filePath);
                            case 'fileBasename':
                                return resolvedValue = paths.basename(filePath);
                            case 'fileBasenameNoExtension':
                                const basename = paths.basename(filePath);
                                return resolvedValue = (basename.slice(0, basename.length - paths.extname(basename).length));
                            case 'execPath':
                                const ep = this._context.getExecPath();
                                if (ep) {
                                    return resolvedValue = ep;
                                }
                                return resolvedValue = match;
                            default:
                                return resolvedValue = match;
                        }
                    }
                }
            });
            return { replaced, variableName, resolvedValue };
        }
        resolveFromMap(match, argument, commandValueMapping, prefix) {
            if (argument && commandValueMapping) {
                const v = commandValueMapping[prefix + ':' + argument];
                if (typeof v === 'string') {
                    return v;
                }
                throw new Error(nls_1.localize('noValueForCommand', "'{0}' can not be resolved because the command has no value.", match));
            }
            return match;
        }
    }
    AbstractVariableResolverService.VARIABLE_REGEXP = /\$\{(.*?)\}/g;
    exports.AbstractVariableResolverService = AbstractVariableResolverService;
});
//# sourceMappingURL=variableResolver.js.map