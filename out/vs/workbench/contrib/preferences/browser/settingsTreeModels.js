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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/preferences/browser/settingsLayout", "vs/workbench/services/preferences/common/preferences", "vs/workbench/contrib/preferences/common/preferences"], function (require, exports, arrays, types_1, uri_1, nls_1, configuration_1, settingsLayout_1, preferences_1, preferences_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ONLINE_SERVICES_SETTING_TAG = 'usesOnlineServices';
    class SettingsTreeElement {
    }
    exports.SettingsTreeElement = SettingsTreeElement;
    class SettingsTreeGroupElement extends SettingsTreeElement {
        get children() {
            return this._children;
        }
        set children(newChildren) {
            this._children = newChildren;
            this._childSettingKeys = new Set();
            this._children.forEach(child => {
                if (child instanceof SettingsTreeSettingElement) {
                    this._childSettingKeys.add(child.setting.key);
                }
            });
        }
        /**
         * Returns whether this group contains the given child key (to a depth of 1 only)
         */
        containsSetting(key) {
            return this._childSettingKeys.has(key);
        }
    }
    exports.SettingsTreeGroupElement = SettingsTreeGroupElement;
    class SettingsTreeNewExtensionsElement extends SettingsTreeElement {
    }
    exports.SettingsTreeNewExtensionsElement = SettingsTreeNewExtensionsElement;
    class SettingsTreeSettingElement extends SettingsTreeElement {
        constructor(setting, parent, index, inspectResult) {
            super();
            this.index = index;
            this.setting = setting;
            this.parent = parent;
            this.id = sanitizeId(parent.id + '_' + setting.key);
            this.update(inspectResult);
        }
        get displayCategory() {
            if (!this._displayCategory) {
                this.initLabel();
            }
            return this._displayCategory;
        }
        get displayLabel() {
            if (!this._displayLabel) {
                this.initLabel();
            }
            return this._displayLabel;
        }
        initLabel() {
            const displayKeyFormat = settingKeyToDisplayFormat(this.setting.key, this.parent.id);
            this._displayLabel = displayKeyFormat.label;
            this._displayCategory = displayKeyFormat.category;
        }
        update(inspectResult) {
            const { isConfigured, inspected, targetSelector } = inspectResult;
            const displayValue = isConfigured ? inspected[targetSelector] : inspected.default;
            const overriddenScopeList = [];
            if (targetSelector === 'user' && typeof inspected.workspace !== 'undefined') {
                overriddenScopeList.push(nls_1.localize('workspace', "Workspace"));
            }
            if (targetSelector === 'workspace' && typeof inspected.user !== 'undefined') {
                overriddenScopeList.push(nls_1.localize('user', "User"));
            }
            this.value = displayValue;
            this.scopeValue = isConfigured && inspected[targetSelector];
            this.defaultValue = inspected.default;
            this.isConfigured = isConfigured;
            if (isConfigured || this.setting.tags || this.tags) {
                // Don't create an empty Set for all 1000 settings, only if needed
                this.tags = new Set();
                if (isConfigured) {
                    this.tags.add(preferences_2.MODIFIED_SETTING_TAG);
                }
                if (this.setting.tags) {
                    this.setting.tags.forEach(tag => this.tags.add(tag));
                }
            }
            this.overriddenScopeList = overriddenScopeList;
            if (this.setting.description.length > SettingsTreeSettingElement.MAX_DESC_LINES) {
                const truncatedDescLines = this.setting.description.slice(0, SettingsTreeSettingElement.MAX_DESC_LINES);
                truncatedDescLines.push('[...]');
                this.description = truncatedDescLines.join('\n');
            }
            else {
                this.description = this.setting.description.join('\n');
            }
            if (this.setting.enum && (!this.setting.type || settingTypeEnumRenderable(this.setting.type))) {
                this.valueType = preferences_1.SettingValueType.Enum;
            }
            else if (this.setting.type === 'string') {
                this.valueType = preferences_1.SettingValueType.String;
            }
            else if (isExcludeSetting(this.setting)) {
                this.valueType = preferences_1.SettingValueType.Exclude;
            }
            else if (this.setting.type === 'integer') {
                this.valueType = preferences_1.SettingValueType.Integer;
            }
            else if (this.setting.type === 'number') {
                this.valueType = preferences_1.SettingValueType.Number;
            }
            else if (this.setting.type === 'boolean') {
                this.valueType = preferences_1.SettingValueType.Boolean;
            }
            else if (types_1.isArray(this.setting.type) && this.setting.type.indexOf(preferences_1.SettingValueType.Null) > -1 && this.setting.type.length === 2) {
                if (this.setting.type.indexOf(preferences_1.SettingValueType.Integer) > -1) {
                    this.valueType = preferences_1.SettingValueType.NullableInteger;
                }
                else if (this.setting.type.indexOf(preferences_1.SettingValueType.Number) > -1) {
                    this.valueType = preferences_1.SettingValueType.NullableNumber;
                }
                else {
                    this.valueType = preferences_1.SettingValueType.Complex;
                }
            }
            else {
                this.valueType = preferences_1.SettingValueType.Complex;
            }
        }
        matchesAllTags(tagFilters) {
            if (!tagFilters || !tagFilters.size) {
                return true;
            }
            if (this.tags) {
                let hasFilteredTag = true;
                tagFilters.forEach(tag => {
                    hasFilteredTag = hasFilteredTag && this.tags.has(tag);
                });
                return hasFilteredTag;
            }
            else {
                return false;
            }
        }
        matchesScope(scope) {
            const configTarget = uri_1.URI.isUri(scope) ? 3 /* WORKSPACE_FOLDER */ : scope;
            if (configTarget === 3 /* WORKSPACE_FOLDER */) {
                return this.setting.scope === 3 /* RESOURCE */;
            }
            if (configTarget === 2 /* WORKSPACE */) {
                return this.setting.scope === 2 /* WINDOW */ || this.setting.scope === 3 /* RESOURCE */;
            }
            return true;
        }
    }
    SettingsTreeSettingElement.MAX_DESC_LINES = 20;
    exports.SettingsTreeSettingElement = SettingsTreeSettingElement;
    let SettingsTreeModel = class SettingsTreeModel {
        constructor(_viewState, _configurationService) {
            this._viewState = _viewState;
            this._configurationService = _configurationService;
            this._treeElementsById = new Map();
            this._treeElementsBySettingName = new Map();
        }
        get root() {
            return this._root;
        }
        update(newTocRoot = this._tocRoot) {
            this._treeElementsById.clear();
            this._treeElementsBySettingName.clear();
            const newRoot = this.createSettingsTreeGroupElement(newTocRoot);
            if (newRoot.children[0] instanceof SettingsTreeGroupElement) {
                newRoot.children[0].isFirstGroup = true; // TODO
            }
            if (this._root) {
                this._root.children = newRoot.children;
            }
            else {
                this._root = newRoot;
            }
        }
        getElementById(id) {
            return this._treeElementsById.get(id) || null;
        }
        getElementsByName(name) {
            return this._treeElementsBySettingName.get(name) || null;
        }
        updateElementsByName(name) {
            if (!this._treeElementsBySettingName.has(name)) {
                return;
            }
            this._treeElementsBySettingName.get(name).forEach(element => {
                const inspectResult = inspectSetting(element.setting.key, this._viewState.settingsTarget, this._configurationService);
                element.update(inspectResult);
            });
        }
        createSettingsTreeGroupElement(tocEntry, parent) {
            const element = new SettingsTreeGroupElement();
            const index = this._treeElementsById.size;
            element.index = index;
            element.id = tocEntry.id;
            element.label = tocEntry.label;
            element.parent = parent;
            element.level = this.getDepth(element);
            const children = [];
            if (tocEntry.settings) {
                const settingChildren = tocEntry.settings.map(s => this.createSettingsTreeSettingElement(s, element))
                    .filter(el => el.setting.deprecationMessage ? el.isConfigured : true);
                children.push(...settingChildren);
            }
            if (tocEntry.children) {
                const groupChildren = tocEntry.children.map(child => this.createSettingsTreeGroupElement(child, element));
                children.push(...groupChildren);
            }
            element.children = children;
            this._treeElementsById.set(element.id, element);
            return element;
        }
        getDepth(element) {
            if (element.parent) {
                return 1 + this.getDepth(element.parent);
            }
            else {
                return 0;
            }
        }
        createSettingsTreeSettingElement(setting, parent) {
            const index = this._treeElementsById.size;
            const inspectResult = inspectSetting(setting.key, this._viewState.settingsTarget, this._configurationService);
            const element = new SettingsTreeSettingElement(setting, parent, index, inspectResult);
            this._treeElementsById.set(element.id, element);
            const nameElements = this._treeElementsBySettingName.get(setting.key) || [];
            nameElements.push(element);
            this._treeElementsBySettingName.set(setting.key, nameElements);
            return element;
        }
    };
    SettingsTreeModel = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], SettingsTreeModel);
    exports.SettingsTreeModel = SettingsTreeModel;
    function inspectSetting(key, target, configurationService) {
        const inspectOverrides = uri_1.URI.isUri(target) ? { resource: target } : undefined;
        const inspected = configurationService.inspect(key, inspectOverrides);
        const targetSelector = target === 1 /* USER */ ? 'user' :
            target === 2 /* WORKSPACE */ ? 'workspace' :
                'workspaceFolder';
        const isConfigured = typeof inspected[targetSelector] !== 'undefined';
        return { isConfigured, inspected, targetSelector };
    }
    function sanitizeId(id) {
        return id.replace(/[\.\/]/, '_');
    }
    function settingKeyToDisplayFormat(key, groupId = '') {
        const lastDotIdx = key.lastIndexOf('.');
        let category = '';
        if (lastDotIdx >= 0) {
            category = key.substr(0, lastDotIdx);
            key = key.substr(lastDotIdx + 1);
        }
        groupId = groupId.replace(/\//g, '.');
        category = trimCategoryForGroup(category, groupId);
        category = wordifyKey(category);
        const label = wordifyKey(key);
        return { category, label };
    }
    exports.settingKeyToDisplayFormat = settingKeyToDisplayFormat;
    function wordifyKey(key) {
        return key
            .replace(/\.([a-z])/g, (match, p1) => ` › ${p1.toUpperCase()}`)
            .replace(/([a-z])([A-Z])/g, '$1 $2') // fooBar => foo Bar
            .replace(/^[a-z]/g, match => match.toUpperCase()) // foo => Foo
            .replace(/\b\w+\b/g, match => {
            return settingsLayout_1.knownAcronyms.has(match.toLowerCase()) ?
                match.toUpperCase() :
                match;
        });
    }
    function trimCategoryForGroup(category, groupId) {
        const doTrim = forward => {
            const parts = groupId.split('.');
            while (parts.length) {
                const reg = new RegExp(`^${parts.join('\\.')}(\\.|$)`, 'i');
                if (reg.test(category)) {
                    return category.replace(reg, '');
                }
                if (forward) {
                    parts.pop();
                }
                else {
                    parts.shift();
                }
            }
            return null;
        };
        let trimmed = doTrim(true);
        if (trimmed === null) {
            trimmed = doTrim(false);
        }
        if (trimmed === null) {
            trimmed = category;
        }
        return trimmed;
    }
    function isExcludeSetting(setting) {
        return setting.key === 'files.exclude' ||
            setting.key === 'search.exclude' ||
            setting.key === 'files.watcherExclude';
    }
    exports.isExcludeSetting = isExcludeSetting;
    function settingTypeEnumRenderable(_type) {
        const enumRenderableSettingTypes = ['string', 'boolean', 'null', 'integer', 'number'];
        const type = types_1.isArray(_type) ? _type : [_type];
        return type.every(type => enumRenderableSettingTypes.indexOf(type) > -1);
    }
    var SearchResultIdx;
    (function (SearchResultIdx) {
        SearchResultIdx[SearchResultIdx["Local"] = 0] = "Local";
        SearchResultIdx[SearchResultIdx["Remote"] = 1] = "Remote";
        SearchResultIdx[SearchResultIdx["NewExtensions"] = 2] = "NewExtensions";
    })(SearchResultIdx = exports.SearchResultIdx || (exports.SearchResultIdx = {}));
    let SearchResultModel = class SearchResultModel extends SettingsTreeModel {
        constructor(viewState, configurationService) {
            super(viewState, configurationService);
            this.id = 'searchResultModel';
            this.update({ id: 'searchResultModel', label: '' });
        }
        getUniqueResults() {
            if (this.cachedUniqueSearchResults) {
                return this.cachedUniqueSearchResults;
            }
            if (!this.rawSearchResults) {
                return [];
            }
            const localMatchKeys = new Set();
            const localResult = this.rawSearchResults[0 /* Local */];
            if (localResult) {
                localResult.filterMatches.forEach(m => localMatchKeys.add(m.setting.key));
            }
            const remoteResult = this.rawSearchResults[1 /* Remote */];
            if (remoteResult) {
                remoteResult.filterMatches = remoteResult.filterMatches.filter(m => !localMatchKeys.has(m.setting.key));
            }
            if (remoteResult) {
                this.newExtensionSearchResults = this.rawSearchResults[2 /* NewExtensions */];
            }
            this.cachedUniqueSearchResults = [localResult, remoteResult];
            return this.cachedUniqueSearchResults;
        }
        getRawResults() {
            return this.rawSearchResults;
        }
        setResult(order, result) {
            this.cachedUniqueSearchResults = undefined;
            this.rawSearchResults = this.rawSearchResults || [];
            if (!result) {
                delete this.rawSearchResults[order];
                return;
            }
            this.rawSearchResults[order] = result;
            this.updateChildren();
        }
        updateChildren() {
            this.update({
                id: 'searchResultModel',
                label: 'searchResultModel',
                settings: this.getFlatSettings()
            });
            // Save time, filter children in the search model instead of relying on the tree filter, which still requires heights to be calculated.
            this.root.children = this.root.children
                .filter(child => child instanceof SettingsTreeSettingElement && child.matchesAllTags(this._viewState.tagFilters) && child.matchesScope(this._viewState.settingsTarget));
            if (this.newExtensionSearchResults && this.newExtensionSearchResults.filterMatches.length) {
                const newExtElement = new SettingsTreeNewExtensionsElement();
                newExtElement.index = this._treeElementsById.size;
                newExtElement.parent = this._root;
                newExtElement.id = 'newExtensions';
                this._treeElementsById.set(newExtElement.id, newExtElement);
                const resultExtensionIds = this.newExtensionSearchResults.filterMatches
                    .map(result => result.setting)
                    .filter(setting => setting.extensionName && setting.extensionPublisher)
                    .map(setting => `${setting.extensionPublisher}.${setting.extensionName}`);
                newExtElement.extensionIds = arrays.distinct(resultExtensionIds);
                this._root.children.push(newExtElement);
            }
        }
        getFlatSettings() {
            const flatSettings = [];
            arrays.coalesce(this.getUniqueResults())
                .forEach(r => {
                flatSettings.push(...r.filterMatches.map(m => m.setting));
            });
            return flatSettings;
        }
    };
    SearchResultModel = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], SearchResultModel);
    exports.SearchResultModel = SearchResultModel;
    const tagRegex = /(^|\s)@tag:("([^"]*)"|[^"]\S*)/g;
    function parseQuery(query) {
        const tags = [];
        query = query.replace(tagRegex, (_, __, quotedTag, tag) => {
            tags.push(tag || quotedTag);
            return '';
        });
        query = query.replace(`@${preferences_2.MODIFIED_SETTING_TAG}`, () => {
            tags.push(preferences_2.MODIFIED_SETTING_TAG);
            return '';
        });
        query = query.trim();
        return {
            tags,
            query
        };
    }
    exports.parseQuery = parseQuery;
});
//# sourceMappingURL=settingsTreeModels.js.map