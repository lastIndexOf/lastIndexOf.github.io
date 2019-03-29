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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log"], function (require, exports, configuration_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullTelemetryService = new class {
        publicLog(eventName, data) {
            return Promise.resolve(undefined);
        }
        getTelemetryInfo() {
            return Promise.resolve({
                instanceId: 'someValue.instanceId',
                sessionId: 'someValue.sessionId',
                machineId: 'someValue.machineId'
            });
        }
    };
    function combinedAppender(...appenders) {
        return {
            log: (e, d) => appenders.forEach(a => a.log(e, d)),
            dispose: () => Promise.all(appenders.map(a => a.dispose()))
        };
    }
    exports.combinedAppender = combinedAppender;
    exports.NullAppender = { log: () => null, dispose: () => Promise.resolve(null) };
    let LogAppender = class LogAppender {
        constructor(_logService) {
            this._logService = _logService;
            this.commonPropertiesRegex = /^sessionID$|^version$|^timestamp$|^commitHash$|^common\./;
        }
        dispose() {
            return Promise.resolve(undefined);
        }
        log(eventName, data) {
            const strippedData = {};
            Object.keys(data).forEach(key => {
                if (!this.commonPropertiesRegex.test(key)) {
                    strippedData[key] = data[key];
                }
            });
            this._logService.trace(`telemetry/${eventName}`, strippedData);
        }
    };
    LogAppender = __decorate([
        __param(0, log_1.ILogService)
    ], LogAppender);
    exports.LogAppender = LogAppender;
    /**
     * Only add settings that cannot contain any personal/private information of users (PII).
     */
    const configurationValueWhitelist = [
        'editor.fontFamily',
        'editor.fontWeight',
        'editor.fontSize',
        'editor.lineHeight',
        'editor.letterSpacing',
        'editor.lineNumbers',
        'editor.rulers',
        'editor.wordSeparators',
        'editor.tabSize',
        'editor.indentSize',
        'editor.insertSpaces',
        'editor.detectIndentation',
        'editor.roundedSelection',
        'editor.scrollBeyondLastLine',
        'editor.minimap.enabled',
        'editor.minimap.side',
        'editor.minimap.renderCharacters',
        'editor.minimap.maxColumn',
        'editor.find.seedSearchStringFromSelection',
        'editor.find.autoFindInSelection',
        'editor.wordWrap',
        'editor.wordWrapColumn',
        'editor.wrappingIndent',
        'editor.mouseWheelScrollSensitivity',
        'editor.multiCursorModifier',
        'editor.quickSuggestions',
        'editor.quickSuggestionsDelay',
        'editor.parameterHints.enabled',
        'editor.parameterHints.cycle',
        'editor.autoClosingBrackets',
        'editor.autoClosingQuotes',
        'editor.autoSurround',
        'editor.autoIndent',
        'editor.formatOnType',
        'editor.formatOnPaste',
        'editor.suggestOnTriggerCharacters',
        'editor.acceptSuggestionOnEnter',
        'editor.acceptSuggestionOnCommitCharacter',
        'editor.snippetSuggestions',
        'editor.emptySelectionClipboard',
        'editor.wordBasedSuggestions',
        'editor.suggestSelection',
        'editor.suggestFontSize',
        'editor.suggestLineHeight',
        'editor.tabCompletion',
        'editor.selectionHighlight',
        'editor.occurrencesHighlight',
        'editor.overviewRulerLanes',
        'editor.overviewRulerBorder',
        'editor.cursorBlinking',
        'editor.cursorSmoothCaretAnimation',
        'editor.cursorStyle',
        'editor.mouseWheelZoom',
        'editor.fontLigatures',
        'editor.hideCursorInOverviewRuler',
        'editor.renderWhitespace',
        'editor.renderControlCharacters',
        'editor.renderIndentGuides',
        'editor.renderLineHighlight',
        'editor.codeLens',
        'editor.folding',
        'editor.showFoldingControls',
        'editor.matchBrackets',
        'editor.glyphMargin',
        'editor.useTabStops',
        'editor.trimAutoWhitespace',
        'editor.stablePeek',
        'editor.dragAndDrop',
        'editor.formatOnSave',
        'editor.colorDecorators',
        'breadcrumbs.enabled',
        'breadcrumbs.filePath',
        'breadcrumbs.symbolPath',
        'breadcrumbs.symbolSortOrder',
        'breadcrumbs.useQuickPick',
        'explorer.openEditors.visible',
        'extensions.autoUpdate',
        'files.associations',
        'files.autoGuessEncoding',
        'files.autoSave',
        'files.autoSaveDelay',
        'files.encoding',
        'files.eol',
        'files.hotExit',
        'files.trimTrailingWhitespace',
        'git.confirmSync',
        'git.enabled',
        'http.proxyStrictSSL',
        'javascript.validate.enable',
        'php.builtInCompletions.enable',
        'php.validate.enable',
        'php.validate.run',
        'terminal.integrated.fontFamily',
        'window.openFilesInNewWindow',
        'window.restoreWindows',
        'window.zoomLevel',
        'workbench.editor.enablePreview',
        'workbench.editor.enablePreviewFromQuickOpen',
        'workbench.editor.showTabs',
        'workbench.editor.highlightModifiedTabs',
        'workbench.editor.swipeToNavigate',
        'workbench.sideBar.location',
        'workbench.startupEditor',
        'workbench.statusBar.visible',
        'workbench.welcome.enabled',
    ];
    function configurationTelemetry(telemetryService, configurationService) {
        return configurationService.onDidChangeConfiguration(event => {
            if (event.source !== 4 /* DEFAULT */) {
                /* __GDPR__
                    "updateConfiguration" : {
                        "configurationSource" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "configurationKeys": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                telemetryService.publicLog('updateConfiguration', {
                    configurationSource: configuration_1.ConfigurationTargetToString(event.source),
                    configurationKeys: flattenKeys(event.sourceConfig)
                });
                /* __GDPR__
                    "updateConfigurationValues" : {
                        "configurationSource" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "configurationValues": { "classification": "CustomerContent", "purpose": "FeatureInsight" }
                    }
                */
                telemetryService.publicLog('updateConfigurationValues', {
                    configurationSource: configuration_1.ConfigurationTargetToString(event.source),
                    configurationValues: flattenValues(event.sourceConfig, configurationValueWhitelist)
                });
            }
        });
    }
    exports.configurationTelemetry = configurationTelemetry;
    function keybindingsTelemetry(telemetryService, keybindingService) {
        return keybindingService.onDidUpdateKeybindings(event => {
            if (event.source === 2 /* User */ && event.keybindings) {
                /* __GDPR__
                    "updateKeybindings" : {
                        "bindings": { "classification": "CustomerContent", "purpose": "FeatureInsight" }
                    }
                */
                telemetryService.publicLog('updateKeybindings', {
                    bindings: event.keybindings.map(binding => ({
                        key: binding.key,
                        command: binding.command,
                        when: binding.when,
                        args: binding.args ? true : undefined
                    }))
                });
            }
        });
    }
    exports.keybindingsTelemetry = keybindingsTelemetry;
    function flattenKeys(value) {
        if (!value) {
            return [];
        }
        const result = [];
        flatKeys(result, '', value);
        return result;
    }
    function flatKeys(result, prefix, value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value)
                .forEach(key => flatKeys(result, prefix ? `${prefix}.${key}` : key, value[key]));
        }
        else {
            result.push(prefix);
        }
    }
    function flattenValues(value, keys) {
        if (!value) {
            return [];
        }
        return keys.reduce((array, key) => {
            const v = key.split('.')
                .reduce((tmp, k) => tmp && typeof tmp === 'object' ? tmp[k] : undefined, value);
            if (typeof v !== 'undefined') {
                array.push({ [key]: v });
            }
            return array;
        }, []);
    }
});
//# sourceMappingURL=telemetryUtils.js.map