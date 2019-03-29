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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/platform", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/severity", "vs/platform/notification/common/notification"], function (require, exports, nls, path, platform, editorOptions_1, configuration_1, storage_1, terminal_1, severity_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const MINIMUM_FONT_SIZE = 6;
    const MAXIMUM_FONT_SIZE = 25;
    /**
     * Encapsulates terminal configuration logic, the primary purpose of this file is so that platform
     * specific test cases can be written.
     */
    let TerminalConfigHelper = class TerminalConfigHelper {
        constructor(_linuxDistro, _configurationService, _workspaceConfigurationService, _notificationService, _storageService) {
            this._linuxDistro = _linuxDistro;
            this._configurationService = _configurationService;
            this._workspaceConfigurationService = _workspaceConfigurationService;
            this._notificationService = _notificationService;
            this._storageService = _storageService;
            this._updateConfig();
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                    this._updateConfig();
                }
            });
        }
        _updateConfig() {
            this.config = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION);
        }
        configFontIsMonospace() {
            this._createCharMeasureElementIfNecessary();
            const fontSize = 15;
            const fontFamily = this.config.fontFamily || this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            const i_rect = this._getBoundingRectFor('i', fontFamily, fontSize);
            const w_rect = this._getBoundingRectFor('w', fontFamily, fontSize);
            const invalidBounds = !i_rect.width || !w_rect.width;
            if (invalidBounds) {
                // There is no reason to believe the font is not Monospace.
                return true;
            }
            return i_rect.width === w_rect.width;
        }
        _createCharMeasureElementIfNecessary() {
            // Create charMeasureElement if it hasn't been created or if it was orphaned by its parent
            if (!this._charMeasureElement || !this._charMeasureElement.parentElement) {
                this._charMeasureElement = document.createElement('div');
                this.panelContainer.appendChild(this._charMeasureElement);
            }
        }
        _getBoundingRectFor(char, fontFamily, fontSize) {
            const style = this._charMeasureElement.style;
            style.display = 'inline-block';
            style.fontFamily = fontFamily;
            style.fontSize = fontSize + 'px';
            style.lineHeight = 'normal';
            this._charMeasureElement.innerText = char;
            const rect = this._charMeasureElement.getBoundingClientRect();
            style.display = 'none';
            return rect;
        }
        _measureFont(fontFamily, fontSize, letterSpacing, lineHeight) {
            this._createCharMeasureElementIfNecessary();
            const rect = this._getBoundingRectFor('X', fontFamily, fontSize);
            // Bounding client rect was invalid, use last font measurement if available.
            if (this._lastFontMeasurement && !rect.width && !rect.height) {
                return this._lastFontMeasurement;
            }
            this._lastFontMeasurement = {
                fontFamily,
                fontSize,
                letterSpacing,
                lineHeight,
                charWidth: rect.width,
                charHeight: Math.ceil(rect.height)
            };
            return this._lastFontMeasurement;
        }
        /**
         * Gets the font information based on the terminal.integrated.fontFamily
         * terminal.integrated.fontSize, terminal.integrated.lineHeight configuration properties
         */
        getFont(xterm, excludeDimensions) {
            const editorConfig = this._configurationService.getValue('editor');
            let fontFamily = this.config.fontFamily || editorConfig.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            let fontSize = this._toInteger(this.config.fontSize, MINIMUM_FONT_SIZE, MAXIMUM_FONT_SIZE, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
            // Work around bad font on Fedora/Ubuntu
            if (!this.config.fontFamily) {
                if (this._linuxDistro === terminal_1.LinuxDistro.Fedora) {
                    fontFamily = '\'DejaVu Sans Mono\', monospace';
                }
                if (this._linuxDistro === terminal_1.LinuxDistro.Ubuntu) {
                    fontFamily = '\'Ubuntu Mono\', monospace';
                    // Ubuntu mono is somehow smaller, so set fontSize a bit larger to get the same perceived size.
                    fontSize = this._toInteger(fontSize + 2, MINIMUM_FONT_SIZE, MAXIMUM_FONT_SIZE, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
                }
            }
            const letterSpacing = this.config.letterSpacing ? Math.max(Math.floor(this.config.letterSpacing), terminal_1.MINIMUM_LETTER_SPACING) : terminal_1.DEFAULT_LETTER_SPACING;
            const lineHeight = this.config.lineHeight ? Math.max(this.config.lineHeight, 1) : terminal_1.DEFAULT_LINE_HEIGHT;
            if (excludeDimensions) {
                return {
                    fontFamily,
                    fontSize,
                    letterSpacing,
                    lineHeight
                };
            }
            // Get the character dimensions from xterm if it's available
            if (xterm) {
                if (xterm._core.charMeasure && xterm._core.charMeasure.width && xterm._core.charMeasure.height) {
                    return {
                        fontFamily,
                        fontSize,
                        letterSpacing,
                        lineHeight,
                        charHeight: xterm._core.charMeasure.height,
                        charWidth: xterm._core.charMeasure.width
                    };
                }
            }
            // Fall back to measuring the font ourselves
            return this._measureFont(fontFamily, fontSize, letterSpacing, lineHeight);
        }
        setWorkspaceShellAllowed(isAllowed) {
            this._storageService.store(terminal_1.IS_WORKSPACE_SHELL_ALLOWED_STORAGE_KEY, isAllowed, 1 /* WORKSPACE */);
        }
        isWorkspaceShellAllowed(defaultValue = undefined) {
            return this._storageService.getBoolean(terminal_1.IS_WORKSPACE_SHELL_ALLOWED_STORAGE_KEY, 1 /* WORKSPACE */, defaultValue);
        }
        checkWorkspaceShellPermissions(platformOverride = platform.platform) {
            // Check whether there is a workspace setting
            const platformKey = platformOverride === 3 /* Windows */ ? 'windows' : platformOverride === 1 /* Mac */ ? 'osx' : 'linux';
            const shellConfigValue = this._workspaceConfigurationService.inspect(`terminal.integrated.shell.${platformKey}`);
            const shellArgsConfigValue = this._workspaceConfigurationService.inspect(`terminal.integrated.shellArgs.${platformKey}`);
            const envConfigValue = this._workspaceConfigurationService.inspect(`terminal.integrated.env.${platformKey}`);
            // Check if workspace setting exists and whether it's whitelisted
            let isWorkspaceShellAllowed = false;
            if (shellConfigValue.workspace !== undefined || shellArgsConfigValue.workspace !== undefined || envConfigValue.workspace !== undefined) {
                isWorkspaceShellAllowed = this.isWorkspaceShellAllowed(undefined);
            }
            // Always allow [] args as it would lead to an odd error message and should not be dangerous
            if (shellConfigValue.workspace === undefined && envConfigValue.workspace === undefined &&
                shellArgsConfigValue.workspace && shellArgsConfigValue.workspace.length === 0) {
                isWorkspaceShellAllowed = true;
            }
            // Check if the value is neither blacklisted (false) or whitelisted (true) and ask for
            // permission
            if (isWorkspaceShellAllowed === undefined) {
                let shellString;
                if (shellConfigValue.workspace) {
                    shellString = `shell: "${shellConfigValue.workspace}"`;
                }
                let argsString;
                if (shellArgsConfigValue.workspace) {
                    argsString = `shellArgs: [${shellArgsConfigValue.workspace.map(v => '"' + v + '"').join(', ')}]`;
                }
                let envString;
                if (envConfigValue.workspace) {
                    envString = `env: {${Object.keys(envConfigValue.workspace).map(k => `${k}:${envConfigValue.workspace[k]}`).join(', ')}}`;
                }
                // Should not be localized as it's json-like syntax referencing settings keys
                const workspaceConfigStrings = [];
                if (shellString) {
                    workspaceConfigStrings.push(shellString);
                }
                if (argsString) {
                    workspaceConfigStrings.push(argsString);
                }
                if (envString) {
                    workspaceConfigStrings.push(envString);
                }
                const workspaceConfigString = workspaceConfigStrings.join(', ');
                this._notificationService.prompt(severity_1.default.Info, nls.localize('terminal.integrated.allowWorkspaceShell', "Do you allow this workspace to modify your terminal shell? {0}", workspaceConfigString), [{
                        label: nls.localize('allow', "Allow"),
                        run: () => this.setWorkspaceShellAllowed(true)
                    },
                    {
                        label: nls.localize('disallow', "Disallow"),
                        run: () => this.setWorkspaceShellAllowed(false)
                    }]);
            }
            return !!isWorkspaceShellAllowed;
        }
        mergeDefaultShellPathAndArgs(shell, platformOverride = platform.platform) {
            const isWorkspaceShellAllowed = this.checkWorkspaceShellPermissions(platformOverride);
            const platformKey = platformOverride === 3 /* Windows */ ? 'windows' : platformOverride === 1 /* Mac */ ? 'osx' : 'linux';
            const shellConfigValue = this._workspaceConfigurationService.inspect(`terminal.integrated.shell.${platformKey}`);
            const shellArgsConfigValue = this._workspaceConfigurationService.inspect(`terminal.integrated.shellArgs.${platformKey}`);
            shell.executable = (isWorkspaceShellAllowed ? shellConfigValue.value : shellConfigValue.user) || shellConfigValue.default;
            shell.args = (isWorkspaceShellAllowed ? shellArgsConfigValue.value : shellArgsConfigValue.user) || shellArgsConfigValue.default;
            // Change Sysnative to System32 if the OS is Windows but NOT WoW64. It's
            // safe to assume that this was used by accident as Sysnative does not
            // exist and will break the terminal in non-WoW64 environments.
            if ((platformOverride === 3 /* Windows */) && !process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432') && process.env.windir) {
                const sysnativePath = path.join(process.env.windir, 'Sysnative').toLowerCase();
                if (shell.executable.toLowerCase().indexOf(sysnativePath) === 0) {
                    shell.executable = path.join(process.env.windir, 'System32', shell.executable.substr(sysnativePath.length));
                }
            }
            // Convert / to \ on Windows for convenience
            if (platformOverride === 3 /* Windows */) {
                shell.executable = shell.executable.replace(/\//g, '\\');
            }
        }
        _toInteger(source, minimum, maximum, fallback) {
            let r = parseInt(source, 10);
            if (isNaN(r)) {
                return fallback;
            }
            if (typeof minimum === 'number') {
                r = Math.max(minimum, r);
            }
            if (typeof maximum === 'number') {
                r = Math.min(maximum, r);
            }
            return r;
        }
    };
    TerminalConfigHelper = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, storage_1.IStorageService)
    ], TerminalConfigHelper);
    exports.TerminalConfigHelper = TerminalConfigHelper;
});
//# sourceMappingURL=terminalConfigHelper.js.map