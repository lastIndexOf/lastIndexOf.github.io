/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform"], function (require, exports, path, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This module contains utility functions related to the environment, cwd and paths.
     */
    function mergeEnvironments(parent, other) {
        if (!other) {
            return;
        }
        // On Windows apply the new values ignoring case, while still retaining
        // the case of the original key.
        if (platform.isWindows) {
            for (const configKey in other) {
                let actualKey = configKey;
                for (const envKey in parent) {
                    if (configKey.toLowerCase() === envKey.toLowerCase()) {
                        actualKey = envKey;
                        break;
                    }
                }
                const value = other[configKey];
                _mergeEnvironmentValue(parent, actualKey, value);
            }
        }
        else {
            Object.keys(other).forEach((key) => {
                const value = other[key];
                _mergeEnvironmentValue(parent, key, value);
            });
        }
    }
    exports.mergeEnvironments = mergeEnvironments;
    function _mergeEnvironmentValue(env, key, value) {
        if (typeof value === 'string') {
            env[key] = value;
        }
        else {
            delete env[key];
        }
    }
    function addTerminalEnvironmentKeys(env, version, locale, setLocaleVariables) {
        env['TERM_PROGRAM'] = 'vscode';
        env['TERM_PROGRAM_VERSION'] = version ? version : null;
        if (setLocaleVariables) {
            env['LANG'] = _getLangEnvVariable(locale);
        }
    }
    exports.addTerminalEnvironmentKeys = addTerminalEnvironmentKeys;
    function resolveConfigurationVariables(configurationResolverService, env, lastActiveWorkspaceRoot) {
        Object.keys(env).forEach((key) => {
            const value = env[key];
            if (typeof value === 'string' && lastActiveWorkspaceRoot !== null) {
                env[key] = configurationResolverService.resolve(lastActiveWorkspaceRoot, value);
            }
        });
        return env;
    }
    exports.resolveConfigurationVariables = resolveConfigurationVariables;
    function _getLangEnvVariable(locale) {
        const parts = locale ? locale.split('-') : [];
        const n = parts.length;
        if (n === 0) {
            // Fallback to en_US to prevent possible encoding issues.
            return 'en_US.UTF-8';
        }
        if (n === 1) {
            // app.getLocale can return just a language without a variant, fill in the variant for
            // supported languages as many shells expect a 2-part locale.
            const languageVariants = {
                de: 'DE',
                en: 'US',
                es: 'ES',
                fi: 'FI',
                fr: 'FR',
                it: 'IT',
                ja: 'JP',
                ko: 'KR',
                pl: 'PL',
                ru: 'RU',
                zh: 'CN'
            };
            if (parts[0] in languageVariants) {
                parts.push(languageVariants[parts[0]]);
            }
        }
        else {
            // Ensure the variant is uppercase
            parts[1] = parts[1].toUpperCase();
        }
        return parts.join('_') + '.UTF-8';
    }
    function getCwd(shell, userHome, root, customCwd) {
        if (shell.cwd) {
            return (typeof shell.cwd === 'object') ? shell.cwd.fsPath : shell.cwd;
        }
        let cwd;
        // TODO: Handle non-existent customCwd
        if (!shell.ignoreConfigurationCwd && customCwd) {
            if (path.isAbsolute(customCwd)) {
                cwd = customCwd;
            }
            else if (root) {
                cwd = path.join(root.fsPath, customCwd);
            }
        }
        // If there was no custom cwd or it was relative with no workspace
        if (!cwd) {
            cwd = root ? root.fsPath : userHome;
        }
        return _sanitizeCwd(cwd);
    }
    exports.getCwd = getCwd;
    function _sanitizeCwd(cwd) {
        // Make the drive letter uppercase on Windows (see #9448)
        if (platform.platform === 3 /* Windows */ && cwd && cwd[1] === ':') {
            return cwd[0].toUpperCase() + cwd.substr(1);
        }
        return cwd;
    }
    function escapeNonWindowsPath(path) {
        let newPath = path;
        if (newPath.indexOf('\\') !== 0) {
            newPath = newPath.replace(/\\/g, '\\\\');
        }
        if (!newPath && (newPath.indexOf('"') !== -1)) {
            newPath = '\'' + newPath + '\'';
        }
        else if (newPath.indexOf(' ') !== -1) {
            newPath = newPath.replace(/ /g, '\\ ');
        }
        return newPath;
    }
    exports.escapeNonWindowsPath = escapeNonWindowsPath;
});
//# sourceMappingURL=terminalEnvironment.js.map