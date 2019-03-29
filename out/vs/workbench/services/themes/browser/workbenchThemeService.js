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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/registry/common/platform", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "./colorThemeData", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/services/themes/common/fileIconThemeSchema", "vs/workbench/services/themes/browser/colorThemeStore", "vs/workbench/services/themes/common/fileIconThemeStore", "vs/workbench/services/themes/common/fileIconThemeData", "vs/platform/windows/common/windows", "vs/base/browser/dom", "vs/platform/environment/common/environment", "vs/base/common/resources", "vs/workbench/services/themes/common/colorThemeSchema", "vs/platform/theme/common/colorRegistry", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, types, extensions_1, workbenchThemeService_1, storage_1, telemetry_1, platform_1, errors, configuration_1, configurationRegistry_1, instantiation_1, colorThemeData_1, themeService_1, event_1, fileIconThemeSchema_1, colorThemeStore_1, fileIconThemeStore_1, fileIconThemeData_1, windows_1, dom_1, environment_1, resources, colorThemeSchema_1, colorRegistry_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // implementation
    const DEFAULT_THEME_ID = 'vs-dark vscode-theme-defaults-themes-dark_plus-json';
    const DEFAULT_THEME_SETTING_VALUE = 'Default Dark+';
    const PERSISTED_THEME_STORAGE_KEY = 'colorThemeData';
    const PERSISTED_ICON_THEME_STORAGE_KEY = 'iconThemeData';
    const defaultThemeExtensionId = 'vscode-theme-defaults';
    const oldDefaultThemeExtensionId = 'vscode-theme-colorful-defaults';
    const DEFAULT_ICON_THEME_SETTING_VALUE = 'vs-seti';
    const fileIconsEnabledClass = 'file-icons-enabled';
    const colorThemeRulesClassName = 'contributedColorTheme';
    const iconThemeRulesClassName = 'contributedIconTheme';
    const themingRegistry = platform_1.Registry.as(themeService_1.Extensions.ThemingContribution);
    function validateThemeId(theme) {
        // migrations
        switch (theme) {
            case workbenchThemeService_1.VS_LIGHT_THEME: return `vs ${defaultThemeExtensionId}-themes-light_vs-json`;
            case workbenchThemeService_1.VS_DARK_THEME: return `vs-dark ${defaultThemeExtensionId}-themes-dark_vs-json`;
            case workbenchThemeService_1.VS_HC_THEME: return `hc-black ${defaultThemeExtensionId}-themes-hc_black-json`;
            case `vs ${oldDefaultThemeExtensionId}-themes-light_plus-tmTheme`: return `vs ${defaultThemeExtensionId}-themes-light_plus-json`;
            case `vs-dark ${oldDefaultThemeExtensionId}-themes-dark_plus-tmTheme`: return `vs-dark ${defaultThemeExtensionId}-themes-dark_plus-json`;
        }
        return theme;
    }
    let WorkbenchThemeService = class WorkbenchThemeService {
        constructor(extensionService, storageService, configurationService, telemetryService, windowService, instantiationService, environmentService) {
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.windowService = windowService;
            this.instantiationService = instantiationService;
            this.environmentService = environmentService;
            this.themeExtensionsActivated = new Map();
            this.container = document.body;
            this.colorThemeStore = new colorThemeStore_1.ColorThemeStore(extensionService, colorThemeData_1.ColorThemeData.createLoadedEmptyTheme(DEFAULT_THEME_ID, DEFAULT_THEME_SETTING_VALUE));
            this.onFileIconThemeChange = new event_1.Emitter();
            this.iconThemeStore = new fileIconThemeStore_1.FileIconThemeStore(extensionService);
            this.onColorThemeChange = new event_1.Emitter({ leakWarningThreshold: 400 });
            this.currentIconTheme = fileIconThemeData_1.FileIconThemeData.createUnloadedTheme('');
            // In order to avoid paint flashing for tokens, because
            // themes are loaded asynchronously, we need to initialize
            // a color theme document with good defaults until the theme is loaded
            let themeData = undefined;
            let persistedThemeData = this.storageService.get(PERSISTED_THEME_STORAGE_KEY, 0 /* GLOBAL */);
            if (persistedThemeData) {
                themeData = colorThemeData_1.ColorThemeData.fromStorageData(persistedThemeData);
            }
            let containerBaseTheme = this.getBaseThemeFromContainer();
            if (!themeData || themeData.baseTheme !== containerBaseTheme) {
                themeData = colorThemeData_1.ColorThemeData.createUnloadedTheme(containerBaseTheme);
            }
            themeData.setCustomColors(this.colorCustomizations);
            themeData.setCustomTokenColors(this.tokenColorCustomizations);
            this.updateDynamicCSSRules(themeData);
            this.applyTheme(themeData, undefined, true);
            let persistedIconThemeData = this.storageService.get(PERSISTED_ICON_THEME_STORAGE_KEY, 0 /* GLOBAL */);
            if (persistedIconThemeData) {
                const iconData = fileIconThemeData_1.FileIconThemeData.fromStorageData(persistedIconThemeData);
                if (iconData) {
                    _applyIconTheme(iconData, () => {
                        this.doSetFileIconTheme(iconData);
                        return Promise.resolve(iconData);
                    });
                }
            }
            this.initialize().then(undefined, errors.onUnexpectedError).then(_ => {
                this.installConfigurationListener();
            });
            let prevColorId = undefined;
            // update settings schema setting for theme specific settings
            this.colorThemeStore.onDidChange((event) => __awaiter(this, void 0, void 0, function* () {
                // updates enum for the 'workbench.colorTheme` setting
                colorThemeSettingSchema.enum = event.themes.map(t => t.settingsId);
                colorThemeSettingSchema.enumDescriptions = event.themes.map(t => t.description || '');
                const themeSpecificWorkbenchColors = { properties: {} };
                const themeSpecificTokenColors = { properties: {} };
                const workbenchColors = { $ref: colorRegistry_1.workbenchColorsSchemaId, additionalProperties: false };
                const tokenColors = { properties: tokenColorSchema.properties, additionalProperties: false };
                for (let t of event.themes) {
                    // add theme specific color customization ("[Abyss]":{ ... })
                    const themeId = `[${t.settingsId}]`;
                    themeSpecificWorkbenchColors.properties[themeId] = workbenchColors;
                    themeSpecificTokenColors.properties[themeId] = tokenColors;
                }
                colorCustomizationsSchema.allOf[1] = themeSpecificWorkbenchColors;
                tokenColorCustomizationSchema.allOf[1] = themeSpecificTokenColors;
                configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration, tokenColorCustomizationConfiguration);
                if (this.currentColorTheme.isLoaded) {
                    const themeData = yield this.colorThemeStore.findThemeData(this.currentColorTheme.id);
                    if (!themeData) {
                        // current theme is no longer available
                        prevColorId = this.currentColorTheme.id;
                        this.setColorTheme(DEFAULT_THEME_ID, 'auto');
                    }
                    else {
                        if (this.currentColorTheme.id === DEFAULT_THEME_ID && !types.isUndefined(prevColorId) && (yield this.colorThemeStore.findThemeData(prevColorId))) {
                            // restore color
                            this.setColorTheme(prevColorId, 'auto');
                            prevColorId = undefined;
                        }
                    }
                }
            }));
            let prevFileIconId = undefined;
            this.iconThemeStore.onDidChange((event) => __awaiter(this, void 0, void 0, function* () {
                iconThemeSettingSchema.enum = [null, ...event.themes.map(t => t.settingsId)];
                iconThemeSettingSchema.enumDescriptions = [iconThemeSettingSchema.enumDescriptions[0], ...event.themes.map(t => t.description || '')];
                configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration);
                if (this.currentIconTheme.isLoaded) {
                    const theme = yield this.iconThemeStore.findThemeData(this.currentIconTheme.id);
                    if (!theme) {
                        // current theme is no longer available
                        prevFileIconId = this.currentIconTheme.id;
                        this.setFileIconTheme(DEFAULT_ICON_THEME_SETTING_VALUE, 'auto');
                    }
                    else {
                        // restore color
                        if (this.currentIconTheme.id === DEFAULT_ICON_THEME_SETTING_VALUE && !types.isUndefined(prevFileIconId) && (yield this.iconThemeStore.findThemeData(prevFileIconId))) {
                            this.setFileIconTheme(prevFileIconId, 'auto');
                            prevFileIconId = undefined;
                        }
                    }
                }
            }));
        }
        get colorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.CUSTOM_WORKBENCH_COLORS_SETTING) || {};
        }
        get tokenColorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.CUSTOM_EDITOR_COLORS_SETTING) || {};
        }
        acquireFileService(fileService) {
            this.fileService = fileService;
            this.fileService.onFileChanges((e) => __awaiter(this, void 0, void 0, function* () {
                if (this.watchedColorThemeLocation && this.currentColorTheme && e.contains(this.watchedColorThemeLocation, 0 /* UPDATED */)) {
                    yield this.currentColorTheme.reload(this.fileService);
                    this.currentColorTheme.setCustomColors(this.colorCustomizations);
                    this.currentColorTheme.setCustomTokenColors(this.tokenColorCustomizations);
                    this.updateDynamicCSSRules(this.currentColorTheme);
                    this.applyTheme(this.currentColorTheme, undefined, false);
                }
                if (this.watchedIconThemeLocation && this.currentIconTheme && e.contains(this.watchedIconThemeLocation, 0 /* UPDATED */)) {
                    yield this.currentIconTheme.reload(this.fileService);
                    _applyIconTheme(this.currentIconTheme, () => Promise.resolve(this.currentIconTheme));
                }
            }));
        }
        get onDidColorThemeChange() {
            return this.onColorThemeChange.event;
        }
        get onDidFileIconThemeChange() {
            return this.onFileIconThemeChange.event;
        }
        get onIconThemeChange() {
            return this.onFileIconThemeChange.event;
        }
        get onThemeChange() {
            return this.onColorThemeChange.event;
        }
        initialize() {
            let detectHCThemeSetting = this.configurationService.getValue(workbenchThemeService_1.DETECT_HC_SETTING);
            let colorThemeSetting;
            if (this.windowService.getConfiguration().highContrast && detectHCThemeSetting) {
                colorThemeSetting = workbenchThemeService_1.HC_THEME_ID;
            }
            else {
                colorThemeSetting = this.configurationService.getValue(workbenchThemeService_1.COLOR_THEME_SETTING);
            }
            let iconThemeSetting = this.configurationService.getValue(workbenchThemeService_1.ICON_THEME_SETTING);
            return Promise.all([
                this.colorThemeStore.findThemeDataBySettingsId(colorThemeSetting, DEFAULT_THEME_ID).then(theme => {
                    return this.colorThemeStore.findThemeDataByParentLocation(this.environmentService.extensionDevelopmentLocationURI).then(devThemes => {
                        if (devThemes.length) {
                            return this.setColorTheme(devThemes[0].id, 5 /* MEMORY */);
                        }
                        else {
                            return this.setColorTheme(theme && theme.id, undefined);
                        }
                    });
                }),
                this.iconThemeStore.findThemeBySettingsId(iconThemeSetting).then(theme => {
                    return this.iconThemeStore.findThemeDataByParentLocation(this.environmentService.extensionDevelopmentLocationURI).then(devThemes => {
                        if (devThemes.length) {
                            return this.setFileIconTheme(devThemes[0].id, 5 /* MEMORY */);
                        }
                        else {
                            return this.setFileIconTheme(theme && theme.id, undefined);
                        }
                    });
                }),
            ]);
        }
        installConfigurationListener() {
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(workbenchThemeService_1.COLOR_THEME_SETTING)) {
                    let colorThemeSetting = this.configurationService.getValue(workbenchThemeService_1.COLOR_THEME_SETTING);
                    if (colorThemeSetting !== this.currentColorTheme.settingsId) {
                        this.colorThemeStore.findThemeDataBySettingsId(colorThemeSetting, undefined).then(theme => {
                            if (theme) {
                                this.setColorTheme(theme.id, undefined);
                            }
                        });
                    }
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ICON_THEME_SETTING)) {
                    let iconThemeSetting = this.configurationService.getValue(workbenchThemeService_1.ICON_THEME_SETTING);
                    if (iconThemeSetting !== this.currentIconTheme.settingsId) {
                        this.iconThemeStore.findThemeBySettingsId(iconThemeSetting).then(theme => {
                            this.setFileIconTheme(theme && theme.id, undefined);
                        });
                    }
                }
                if (this.currentColorTheme) {
                    let hasColorChanges = false;
                    if (e.affectsConfiguration(workbenchThemeService_1.CUSTOM_WORKBENCH_COLORS_SETTING)) {
                        this.currentColorTheme.setCustomColors(this.colorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.CUSTOM_EDITOR_COLORS_SETTING)) {
                        this.currentColorTheme.setCustomTokenColors(this.tokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (hasColorChanges) {
                        this.updateDynamicCSSRules(this.currentColorTheme);
                        this.onColorThemeChange.fire(this.currentColorTheme);
                    }
                }
            });
        }
        getColorTheme() {
            return this.currentColorTheme;
        }
        getColorThemes() {
            return this.colorThemeStore.getColorThemes();
        }
        getTheme() {
            return this.getColorTheme();
        }
        setColorTheme(themeId, settingsTarget) {
            if (!themeId) {
                return Promise.resolve(null);
            }
            if (themeId === this.currentColorTheme.id && this.currentColorTheme.isLoaded) {
                return this.writeColorThemeConfiguration(settingsTarget);
            }
            themeId = validateThemeId(themeId); // migrate theme ids
            return this.colorThemeStore.findThemeData(themeId, DEFAULT_THEME_ID).then(data => {
                if (!data) {
                    return null;
                }
                const themeData = data;
                return themeData.ensureLoaded(this.fileService).then(_ => {
                    if (themeId === this.currentColorTheme.id && !this.currentColorTheme.isLoaded && this.currentColorTheme.hasEqualData(themeData)) {
                        // the loaded theme is identical to the perisisted theme. Don't need to send an event.
                        this.currentColorTheme = themeData;
                        themeData.setCustomColors(this.colorCustomizations);
                        themeData.setCustomTokenColors(this.tokenColorCustomizations);
                        return Promise.resolve(themeData);
                    }
                    themeData.setCustomColors(this.colorCustomizations);
                    themeData.setCustomTokenColors(this.tokenColorCustomizations);
                    this.updateDynamicCSSRules(themeData);
                    return this.applyTheme(themeData, settingsTarget);
                }, error => {
                    return Promise.reject(new Error(nls.localize('error.cannotloadtheme', "Unable to load {0}: {1}", themeData.location.toString(), error.message)));
                });
            });
        }
        restoreColorTheme() {
            let colorThemeSetting = this.configurationService.getValue(workbenchThemeService_1.COLOR_THEME_SETTING);
            if (colorThemeSetting !== this.currentColorTheme.settingsId) {
                this.colorThemeStore.findThemeDataBySettingsId(colorThemeSetting, undefined).then(theme => {
                    if (theme) {
                        this.setColorTheme(theme.id, undefined);
                    }
                });
            }
        }
        updateDynamicCSSRules(themeData) {
            let cssRules = [];
            let hasRule = {};
            let ruleCollector = {
                addRule: (rule) => {
                    if (!hasRule[rule]) {
                        cssRules.push(rule);
                        hasRule[rule] = true;
                    }
                }
            };
            themingRegistry.getThemingParticipants().forEach(p => p(themeData, ruleCollector, this.environmentService));
            _applyRules(cssRules.join('\n'), colorThemeRulesClassName);
        }
        applyTheme(newTheme, settingsTarget, silent = false) {
            if (this.container) {
                if (this.currentColorTheme) {
                    dom_1.removeClasses(this.container, this.currentColorTheme.id);
                }
                else {
                    dom_1.removeClasses(this.container, workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_HC_THEME);
                }
                dom_1.addClasses(this.container, newTheme.id);
            }
            this.currentColorTheme = newTheme;
            if (!this.themingParticipantChangeListener) {
                this.themingParticipantChangeListener = themingRegistry.onThemingParticipantAdded(_ => this.updateDynamicCSSRules(this.currentColorTheme));
            }
            if (this.fileService && !resources.isEqual(newTheme.location, this.watchedColorThemeLocation)) {
                if (this.watchedColorThemeLocation) {
                    this.fileService.unwatchFileChanges(this.watchedColorThemeLocation);
                    this.watchedColorThemeLocation = undefined;
                }
                if (newTheme.location && (newTheme.watch || !!this.environmentService.extensionDevelopmentLocationURI)) {
                    this.watchedColorThemeLocation = newTheme.location;
                    this.fileService.watchFileChanges(this.watchedColorThemeLocation);
                }
            }
            this.sendTelemetry(newTheme.id, newTheme.extensionData, 'color');
            if (silent) {
                return Promise.resolve(null);
            }
            this.onColorThemeChange.fire(this.currentColorTheme);
            // remember theme data for a quick restore
            if (newTheme.isLoaded) {
                this.storageService.store(PERSISTED_THEME_STORAGE_KEY, newTheme.toStorageData(), 0 /* GLOBAL */);
            }
            return this.writeColorThemeConfiguration(settingsTarget);
        }
        writeColorThemeConfiguration(settingsTarget) {
            if (!types.isUndefinedOrNull(settingsTarget)) {
                return this.configurationWriter.writeConfiguration(workbenchThemeService_1.COLOR_THEME_SETTING, this.currentColorTheme.settingsId, settingsTarget).then(_ => this.currentColorTheme);
            }
            return Promise.resolve(this.currentColorTheme);
        }
        sendTelemetry(themeId, themeData, themeType) {
            if (themeData) {
                let key = themeType + themeData.extensionId;
                if (!this.themeExtensionsActivated.get(key)) {
                    /* __GDPR__
                        "activatePlugin" : {
                            "id" : { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                            "name": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                            "isBuiltin": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                            "publisherDisplayName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                            "themeId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('activatePlugin', {
                        id: themeData.extensionId,
                        name: themeData.extensionName,
                        isBuiltin: themeData.extensionIsBuiltin,
                        publisherDisplayName: themeData.extensionPublisher,
                        themeId: themeId
                    });
                    this.themeExtensionsActivated.set(key, true);
                }
            }
        }
        getFileIconThemes() {
            return this.iconThemeStore.getFileIconThemes();
        }
        getFileIconTheme() {
            return this.currentIconTheme;
        }
        getIconTheme() {
            return this.currentIconTheme;
        }
        setFileIconTheme(iconTheme, settingsTarget) {
            iconTheme = iconTheme || '';
            if (iconTheme === this.currentIconTheme.id && this.currentIconTheme.isLoaded) {
                return this.writeFileIconConfiguration(settingsTarget);
            }
            let onApply = (newIconTheme) => {
                this.doSetFileIconTheme(newIconTheme);
                // remember theme data for a quick restore
                if (newIconTheme.isLoaded) {
                    this.storageService.store(PERSISTED_ICON_THEME_STORAGE_KEY, newIconTheme.toStorageData(), 0 /* GLOBAL */);
                }
                return this.writeFileIconConfiguration(settingsTarget);
            };
            return this.iconThemeStore.findThemeData(iconTheme).then(data => {
                const iconThemeData = data || fileIconThemeData_1.FileIconThemeData.noIconTheme();
                return iconThemeData.ensureLoaded(this.fileService).then(_ => {
                    return _applyIconTheme(iconThemeData, onApply);
                });
            });
        }
        restoreFileIconTheme() {
            let fileIconThemeSetting = this.configurationService.getValue(workbenchThemeService_1.ICON_THEME_SETTING);
            if (fileIconThemeSetting !== this.currentIconTheme.settingsId) {
                this.iconThemeStore.findThemeBySettingsId(fileIconThemeSetting).then(theme => {
                    if (theme) {
                        this.setFileIconTheme(theme.id, undefined);
                    }
                });
            }
        }
        doSetFileIconTheme(iconThemeData) {
            this.currentIconTheme = iconThemeData;
            if (this.container) {
                if (iconThemeData.id) {
                    dom_1.addClasses(this.container, fileIconsEnabledClass);
                }
                else {
                    dom_1.removeClasses(this.container, fileIconsEnabledClass);
                }
            }
            if (this.fileService && !resources.isEqual(iconThemeData.location, this.watchedIconThemeLocation)) {
                if (this.watchedIconThemeLocation) {
                    this.fileService.unwatchFileChanges(this.watchedIconThemeLocation);
                    this.watchedIconThemeLocation = undefined;
                }
                if (iconThemeData.location && (iconThemeData.watch || !!this.environmentService.extensionDevelopmentLocationURI)) {
                    this.watchedIconThemeLocation = iconThemeData.location;
                    this.fileService.watchFileChanges(this.watchedIconThemeLocation);
                }
            }
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'fileIcon');
            }
            this.onFileIconThemeChange.fire(this.currentIconTheme);
        }
        writeFileIconConfiguration(settingsTarget) {
            if (!types.isUndefinedOrNull(settingsTarget)) {
                return this.configurationWriter.writeConfiguration(workbenchThemeService_1.ICON_THEME_SETTING, this.currentIconTheme.settingsId, settingsTarget).then(_ => this.currentIconTheme);
            }
            return Promise.resolve(this.currentIconTheme);
        }
        get configurationWriter() {
            // separate out the ConfigurationWriter to avoid a dependency of the IConfigurationEditingService
            if (!this._configurationWriter) {
                this._configurationWriter = this.instantiationService.createInstance(ConfigurationWriter);
            }
            return this._configurationWriter;
        }
        getBaseThemeFromContainer() {
            if (this.container) {
                for (let i = this.container.classList.length - 1; i >= 0; i--) {
                    const item = document.body.classList.item(i);
                    if (item === workbenchThemeService_1.VS_LIGHT_THEME || item === workbenchThemeService_1.VS_DARK_THEME || item === workbenchThemeService_1.VS_HC_THEME) {
                        return item;
                    }
                }
            }
            return workbenchThemeService_1.VS_DARK_THEME;
        }
    };
    WorkbenchThemeService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, windows_1.IWindowService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, environment_1.IEnvironmentService)
    ], WorkbenchThemeService);
    exports.WorkbenchThemeService = WorkbenchThemeService;
    function _applyIconTheme(data, onApply) {
        _applyRules(data.styleSheetContent, iconThemeRulesClassName);
        return onApply(data);
    }
    function _applyRules(styleSheetContent, rulesClassName) {
        let themeStyles = document.head.getElementsByClassName(rulesClassName);
        if (themeStyles.length === 0) {
            let elStyle = document.createElement('style');
            elStyle.type = 'text/css';
            elStyle.className = rulesClassName;
            elStyle.innerHTML = styleSheetContent;
            document.head.appendChild(elStyle);
        }
        else {
            themeStyles[0].innerHTML = styleSheetContent;
        }
    }
    colorThemeSchema_1.registerColorThemeSchemas();
    fileIconThemeSchema_1.registerFileIconThemeSchemas();
    let ConfigurationWriter = class ConfigurationWriter {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        writeConfiguration(key, value, settingsTarget) {
            let settings = this.configurationService.inspect(key);
            if (settingsTarget === 'auto') {
                if (!types.isUndefined(settings.workspaceFolder)) {
                    settingsTarget = 3 /* WORKSPACE_FOLDER */;
                }
                else if (!types.isUndefined(settings.workspace)) {
                    settingsTarget = 2 /* WORKSPACE */;
                }
                else {
                    settingsTarget = 1 /* USER */;
                }
            }
            if (settingsTarget === 1 /* USER */) {
                if (value === settings.user) {
                    return Promise.resolve(undefined); // nothing to do
                }
                else if (value === settings.default) {
                    if (types.isUndefined(settings.user)) {
                        return Promise.resolve(undefined); // nothing to do
                    }
                    value = undefined; // remove configuration from user settings
                }
            }
            else if (settingsTarget === 2 /* WORKSPACE */ || settingsTarget === 3 /* WORKSPACE_FOLDER */) {
                if (value === settings.value) {
                    return Promise.resolve(undefined); // nothing to do
                }
            }
            return this.configurationService.updateValue(key, value, settingsTarget);
        }
    };
    ConfigurationWriter = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], ConfigurationWriter);
    // Configuration: Themes
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const colorThemeSettingSchema = {
        type: 'string',
        description: nls.localize('colorTheme', "Specifies the color theme used in the workbench."),
        default: DEFAULT_THEME_SETTING_VALUE,
        enum: [],
        enumDescriptions: [],
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const iconThemeSettingSchema = {
        type: ['string', 'null'],
        default: DEFAULT_ICON_THEME_SETTING_VALUE,
        description: nls.localize('iconTheme', "Specifies the icon theme used in the workbench or 'null' to not show any file icons."),
        enum: [null],
        enumDescriptions: [nls.localize('noIconThemeDesc', 'No file icons')],
        errorMessage: nls.localize('iconThemeError', "File icon theme is unknown or not installed.")
    };
    const colorCustomizationsSchema = {
        type: 'object',
        description: nls.localize('workbenchColors', "Overrides colors from the currently selected color theme."),
        allOf: [{ $ref: colorRegistry_1.workbenchColorsSchemaId }],
        default: {},
        defaultSnippets: [{
                body: {}
            }]
    };
    const themeSettingsConfiguration = {
        id: 'workbench',
        order: 7.1,
        type: 'object',
        properties: {
            [workbenchThemeService_1.COLOR_THEME_SETTING]: colorThemeSettingSchema,
            [workbenchThemeService_1.ICON_THEME_SETTING]: iconThemeSettingSchema,
            [workbenchThemeService_1.CUSTOM_WORKBENCH_COLORS_SETTING]: colorCustomizationsSchema
        }
    };
    configurationRegistry.registerConfiguration(themeSettingsConfiguration);
    function tokenGroupSettings(description) {
        return {
            description,
            default: '#FF0000',
            anyOf: [
                {
                    type: 'string',
                    format: 'color-hex'
                },
                {
                    $ref: colorThemeSchema_1.textmateColorSettingsSchemaId
                }
            ]
        };
    }
    const tokenColorSchema = {
        properties: {
            comments: tokenGroupSettings(nls.localize('editorColors.comments', "Sets the colors and styles for comments")),
            strings: tokenGroupSettings(nls.localize('editorColors.strings', "Sets the colors and styles for strings literals.")),
            keywords: tokenGroupSettings(nls.localize('editorColors.keywords', "Sets the colors and styles for keywords.")),
            numbers: tokenGroupSettings(nls.localize('editorColors.numbers', "Sets the colors and styles for number literals.")),
            types: tokenGroupSettings(nls.localize('editorColors.types', "Sets the colors and styles for type declarations and references.")),
            functions: tokenGroupSettings(nls.localize('editorColors.functions', "Sets the colors and styles for functions declarations and references.")),
            variables: tokenGroupSettings(nls.localize('editorColors.variables', "Sets the colors and styles for variables declarations and references.")),
            textMateRules: {
                description: nls.localize('editorColors.textMateRules', 'Sets colors and styles using textmate theming rules (advanced).'),
                $ref: colorThemeSchema_1.textmateColorsSchemaId
            }
        }
    };
    const tokenColorCustomizationSchema = {
        description: nls.localize('editorColors', "Overrides editor colors and font style from the currently selected color theme."),
        default: {},
        allOf: [tokenColorSchema]
    };
    const tokenColorCustomizationConfiguration = {
        id: 'editor',
        order: 7.2,
        type: 'object',
        properties: {
            [workbenchThemeService_1.CUSTOM_EDITOR_COLORS_SETTING]: tokenColorCustomizationSchema
        }
    };
    configurationRegistry.registerConfiguration(tokenColorCustomizationConfiguration);
    extensions_2.registerSingleton(workbenchThemeService_1.IWorkbenchThemeService, WorkbenchThemeService);
});
//# sourceMappingURL=workbenchThemeService.js.map