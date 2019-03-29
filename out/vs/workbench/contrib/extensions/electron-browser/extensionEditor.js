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
define(["require", "exports", "vs/nls", "vs/base/common/marked/marked", "vs/base/common/async", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/common/event", "vs/base/common/cache", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/browser/event", "vs/base/browser/dom", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/electron-browser/extensionsWidgets", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/extensions/electron-browser/extensionsActions", "vs/workbench/contrib/webview/electron-browser/webviewElement", "vs/platform/keybinding/common/keybinding", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/opener/common/opener", "vs/workbench/services/layout/browser/layoutService", "vs/platform/theme/common/themeService", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/platform/contextkey/common/contextkey", "vs/editor/browser/editorExtensions", "vs/workbench/services/editor/common/editorService", "vs/base/common/color", "vs/base/common/objects", "vs/platform/notification/common/notification", "vs/workbench/contrib/extensions/browser/extensionsViewer", "vs/workbench/contrib/update/electron-browser/update", "vs/base/common/keybindingParser", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/workbench/services/themes/common/workbenchThemeService", "vs/css!./media/extensionEditor"], function (require, exports, nls_1, marked, async_1, arrays, platform_1, event_1, cache_1, actions_1, errors_1, lifecycle_1, event_2, dom_1, baseEditor_1, viewlet_1, telemetry_1, instantiation_1, extensionManagement_1, extensions_1, extensionsWidgets_1, actionbar_1, extensionsActions_1, webviewElement_1, keybinding_1, scrollableElement_1, opener_1, layoutService_1, themeService_1, keybindingLabel_1, contextkey_1, editorExtensions_1, editorService_1, color_1, objects_1, notification_1, extensionsViewer_1, update_1, keybindingParser_1, storage_1, extensions_2, configurationRegistry_1, types_1, workbenchThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function renderBody(body) {
        const styleSheetPath = require.toUrl('./media/markdown.css').replace('file://', 'vscode-core-resource://');
        return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; script-src 'none'; style-src vscode-core-resource:; child-src 'none'; frame-src 'none';">
				<link rel="stylesheet" type="text/css" href="${styleSheetPath}">
			</head>
			<body>
				<a id="scroll-to-top" role="button" aria-label="scroll to top" href="#"><span class="icon"></span></a>
				${body}
			</body>
		</html>`;
    }
    function removeEmbeddedSVGs(documentContent) {
        const newDocument = new DOMParser().parseFromString(documentContent, 'text/html');
        // remove all inline svgs
        const allSVGs = newDocument.documentElement.querySelectorAll('svg');
        if (allSVGs) {
            for (let i = 0; i < allSVGs.length; i++) {
                const svg = allSVGs[i];
                if (svg.parentNode) {
                    svg.parentNode.removeChild(allSVGs[i]);
                }
            }
        }
        return newDocument.documentElement.outerHTML;
    }
    class NavBar {
        constructor(container) {
            this._onChange = new event_1.Emitter();
            this.currentId = null;
            const element = dom_1.append(container, dom_1.$('.navbar'));
            this.actions = [];
            this.actionbar = new actionbar_1.ActionBar(element, { animated: false });
        }
        get onChange() { return this._onChange.event; }
        push(id, label, tooltip) {
            const action = new actions_1.Action(id, label, undefined, true, () => this._update(id, true));
            action.tooltip = tooltip;
            this.actions.push(action);
            this.actionbar.push(action);
            if (this.actions.length === 1) {
                this._update(id);
            }
        }
        clear() {
            this.actions = lifecycle_1.dispose(this.actions);
            this.actionbar.clear();
        }
        update() {
            this._update(this.currentId);
        }
        _update(id = this.currentId, focus) {
            this.currentId = id;
            this._onChange.fire({ id, focus: !!focus });
            this.actions.forEach(a => a.enabled = a.id !== id);
            return Promise.resolve(undefined);
        }
        dispose() {
            this.actionbar = lifecycle_1.dispose(this.actionbar);
        }
    }
    const NavbarSection = {
        Readme: 'readme',
        Contributions: 'contributions',
        Changelog: 'changelog',
        Dependencies: 'dependencies',
        ExtensionPack: 'extensionPack'
    };
    let ExtensionEditor = class ExtensionEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, instantiationService, viewletService, extensionsWorkbenchService, themeService, keybindingService, notificationService, openerService, layoutService, extensionTipsService, storageService, extensionService, workbenchThemeService) {
            super(ExtensionEditor.ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.viewletService = viewletService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.layoutService = layoutService;
            this.extensionTipsService = extensionTipsService;
            this.extensionService = extensionService;
            this.workbenchThemeService = workbenchThemeService;
            this.layoutParticipants = [];
            this.contentDisposables = [];
            this.transientDisposables = [];
            this.editorLoadComplete = false;
            this.disposables = [];
            this.extensionReadme = null;
            this.extensionChangelog = null;
            this.extensionManifest = null;
            this.extensionDependencies = null;
        }
        createEditor(parent) {
            const root = dom_1.append(parent, dom_1.$('.extension-editor'));
            this.header = dom_1.append(root, dom_1.$('.header'));
            this.iconContainer = dom_1.append(this.header, dom_1.$('.icon-container'));
            this.icon = dom_1.append(this.iconContainer, dom_1.$('img.icon', { draggable: false }));
            const details = dom_1.append(this.header, dom_1.$('.details'));
            const title = dom_1.append(details, dom_1.$('.title'));
            this.name = dom_1.append(title, dom_1.$('span.name.clickable', { title: nls_1.localize('name', "Extension name") }));
            this.identifier = dom_1.append(title, dom_1.$('span.identifier', { title: nls_1.localize('extension id', "Extension identifier") }));
            this.preview = dom_1.append(title, dom_1.$('span.preview', { title: nls_1.localize('preview', "Preview") }));
            this.preview.textContent = nls_1.localize('preview', "Preview");
            this.builtin = dom_1.append(title, dom_1.$('span.builtin'));
            this.builtin.textContent = nls_1.localize('builtin', "Built-in");
            const subtitle = dom_1.append(details, dom_1.$('.subtitle'));
            this.publisher = dom_1.append(subtitle, dom_1.$('span.publisher.clickable', { title: nls_1.localize('publisher', "Publisher name") }));
            this.installCount = dom_1.append(subtitle, dom_1.$('span.install', { title: nls_1.localize('install count', "Install count") }));
            this.rating = dom_1.append(subtitle, dom_1.$('span.rating.clickable', { title: nls_1.localize('rating', "Rating") }));
            this.repository = dom_1.append(subtitle, dom_1.$('span.repository.clickable'));
            this.repository.textContent = nls_1.localize('repository', 'Repository');
            this.repository.style.display = 'none';
            this.license = dom_1.append(subtitle, dom_1.$('span.license.clickable'));
            this.license.textContent = nls_1.localize('license', 'License');
            this.license.style.display = 'none';
            this.description = dom_1.append(details, dom_1.$('.description'));
            const extensionActions = dom_1.append(details, dom_1.$('.actions'));
            this.extensionActionBar = new actionbar_1.ActionBar(extensionActions, {
                animated: false,
                actionItemProvider: (action) => {
                    if (action instanceof extensionsActions_1.ExtensionEditorDropDownAction) {
                        return action.createActionItem();
                    }
                    return null;
                }
            });
            this.subtextContainer = dom_1.append(details, dom_1.$('.subtext-container'));
            this.subtext = dom_1.append(this.subtextContainer, dom_1.$('.subtext'));
            this.ignoreActionbar = new actionbar_1.ActionBar(this.subtextContainer, { animated: false });
            this.disposables.push(this.extensionActionBar);
            this.disposables.push(this.ignoreActionbar);
            event_1.Event.chain(this.extensionActionBar.onDidRun)
                .map(({ error }) => error)
                .filter(error => !!error)
                .on(this.onError, this, this.disposables);
            event_1.Event.chain(this.ignoreActionbar.onDidRun)
                .map(({ error }) => error)
                .filter(error => !!error)
                .on(this.onError, this, this.disposables);
            const body = dom_1.append(root, dom_1.$('.body'));
            this.navbar = new NavBar(body);
            this.content = dom_1.append(body, dom_1.$('.content'));
        }
        setInput(input, options, token) {
            const _super = Object.create(null, {
                setInput: { get: () => super.setInput }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const runningExtensions = yield this.extensionService.getExtensions();
                const colorThemes = yield this.workbenchThemeService.getColorThemes();
                const fileIconThemes = yield this.workbenchThemeService.getFileIconThemes();
                this.activeElement = null;
                this.editorLoadComplete = false;
                const extension = input.extension;
                this.transientDisposables = lifecycle_1.dispose(this.transientDisposables);
                this.extensionReadme = new cache_1.Cache(() => async_1.createCancelablePromise(token => extension.getReadme(token)));
                this.extensionChangelog = new cache_1.Cache(() => async_1.createCancelablePromise(token => extension.getChangelog(token)));
                this.extensionManifest = new cache_1.Cache(() => async_1.createCancelablePromise(token => extension.getManifest(token)));
                this.extensionDependencies = new cache_1.Cache(() => async_1.createCancelablePromise(token => this.extensionsWorkbenchService.loadDependencies(extension, token)));
                const remoteBadge = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, this.iconContainer);
                const onError = event_1.Event.once(event_2.domEvent(this.icon, 'error'));
                onError(() => this.icon.src = extension.iconUrlFallback, null, this.transientDisposables);
                this.icon.src = extension.iconUrl;
                this.name.textContent = extension.displayName;
                this.identifier.textContent = extension.identifier.id;
                this.preview.style.display = extension.preview ? 'inherit' : 'none';
                this.builtin.style.display = extension.type === 0 /* System */ ? 'inherit' : 'none';
                this.publisher.textContent = extension.publisherDisplayName;
                this.description.textContent = extension.description;
                const extRecommendations = this.extensionTipsService.getAllRecommendationsWithReason();
                let recommendationsData = {};
                if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                    recommendationsData = { recommendationReason: extRecommendations[extension.identifier.id.toLowerCase()].reasonId };
                }
                /* __GDPR__
                "extensionGallery:openExtension" : {
                    "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
                */
                this.telemetryService.publicLog('extensionGallery:openExtension', objects_1.assign(extension.telemetryData, recommendationsData));
                dom_1.toggleClass(this.name, 'clickable', !!extension.url);
                dom_1.toggleClass(this.publisher, 'clickable', !!extension.url);
                dom_1.toggleClass(this.rating, 'clickable', !!extension.url);
                if (extension.url) {
                    this.name.onclick = dom_1.finalHandler(() => window.open(extension.url));
                    this.rating.onclick = dom_1.finalHandler(() => window.open(`${extension.url}#review-details`));
                    this.publisher.onclick = dom_1.finalHandler(() => {
                        this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                            .then(viewlet => viewlet)
                            .then(viewlet => viewlet.search(`publisher:"${extension.publisherDisplayName}"`));
                    });
                    if (extension.licenseUrl) {
                        this.license.onclick = dom_1.finalHandler(() => window.open(extension.licenseUrl));
                        this.license.style.display = 'initial';
                    }
                    else {
                        this.license.onclick = null;
                        this.license.style.display = 'none';
                    }
                }
                else {
                    this.name.onclick = null;
                    this.rating.onclick = null;
                    this.publisher.onclick = null;
                    this.license.onclick = null;
                    this.license.style.display = 'none';
                }
                if (extension.repository) {
                    this.repository.onclick = dom_1.finalHandler(() => window.open(extension.repository));
                    this.repository.style.display = 'initial';
                }
                else {
                    this.repository.onclick = null;
                    this.repository.style.display = 'none';
                }
                const widgets = [
                    remoteBadge,
                    this.instantiationService.createInstance(extensionsWidgets_1.InstallCountWidget, this.installCount, false),
                    this.instantiationService.createInstance(extensionsWidgets_1.RatingsWidget, this.rating, false)
                ];
                const reloadAction = this.instantiationService.createInstance(extensionsActions_1.ReloadAction);
                const actions = [
                    reloadAction,
                    this.instantiationService.createInstance(extensionsActions_1.StatusLabelAction),
                    this.instantiationService.createInstance(extensionsActions_1.UpdateAction),
                    this.instantiationService.createInstance(extensionsActions_1.SetColorThemeAction, colorThemes),
                    this.instantiationService.createInstance(extensionsActions_1.SetFileIconThemeAction, fileIconThemes),
                    this.instantiationService.createInstance(extensionsActions_1.EnableDropDownAction),
                    this.instantiationService.createInstance(extensionsActions_1.DisableDropDownAction, runningExtensions),
                    this.instantiationService.createInstance(extensionsActions_1.CombinedInstallAction),
                    this.instantiationService.createInstance(extensionsActions_1.MaliciousStatusLabelAction, true),
                ];
                const extensionContainers = this.instantiationService.createInstance(extensions_1.ExtensionContainers, [...actions, ...widgets]);
                extensionContainers.extension = extension;
                this.extensionActionBar.clear();
                this.extensionActionBar.push(actions, { icon: true, label: true });
                this.transientDisposables.push(...[...actions, ...widgets, extensionContainers]);
                this.setSubText(extension, reloadAction);
                this.content.innerHTML = ''; // Clear content before setting navbar actions.
                this.navbar.clear();
                this.navbar.onChange(this.onNavbarChange.bind(this, extension), this, this.transientDisposables);
                if (extension.hasReadme()) {
                    this.navbar.push(NavbarSection.Readme, nls_1.localize('details', "Details"), nls_1.localize('detailstooltip', "Extension details, rendered from the extension's 'README.md' file"));
                }
                this.extensionManifest.get()
                    .promise
                    .then(manifest => {
                    if (extension.extensionPack.length) {
                        this.navbar.push(NavbarSection.ExtensionPack, nls_1.localize('extensionPack', "Extension Pack"), nls_1.localize('extensionsPack', "Set of extensions that can be installed together"));
                    }
                    if (manifest && manifest.contributes) {
                        this.navbar.push(NavbarSection.Contributions, nls_1.localize('contributions', "Contributions"), nls_1.localize('contributionstooltip', "Lists contributions to VS Code by this extension"));
                    }
                    if (extension.hasChangelog()) {
                        this.navbar.push(NavbarSection.Changelog, nls_1.localize('changelog', "Changelog"), nls_1.localize('changelogtooltip', "Extension update history, rendered from the extension's 'CHANGELOG.md' file"));
                    }
                    if (extension.dependencies.length) {
                        this.navbar.push(NavbarSection.Dependencies, nls_1.localize('dependencies', "Dependencies"), nls_1.localize('dependenciestooltip', "Lists extensions this extension depends on"));
                    }
                    this.editorLoadComplete = true;
                });
                return _super.setInput.call(this, input, options, token);
            });
        }
        setSubText(extension, reloadAction) {
            dom_1.hide(this.subtextContainer);
            const ignoreAction = this.instantiationService.createInstance(extensionsActions_1.IgnoreExtensionRecommendationAction);
            const undoIgnoreAction = this.instantiationService.createInstance(extensionsActions_1.UndoIgnoreExtensionRecommendationAction);
            ignoreAction.extension = extension;
            undoIgnoreAction.extension = extension;
            ignoreAction.enabled = false;
            undoIgnoreAction.enabled = false;
            this.ignoreActionbar.clear();
            this.ignoreActionbar.push([ignoreAction, undoIgnoreAction], { icon: true, label: true });
            this.transientDisposables.push(ignoreAction, undoIgnoreAction);
            const extRecommendations = this.extensionTipsService.getAllRecommendationsWithReason();
            if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                ignoreAction.enabled = true;
                this.subtext.textContent = extRecommendations[extension.identifier.id.toLowerCase()].reasonText;
                dom_1.show(this.subtextContainer);
            }
            else if (this.extensionTipsService.getAllIgnoredRecommendations().global.indexOf(extension.identifier.id.toLowerCase()) !== -1) {
                undoIgnoreAction.enabled = true;
                this.subtext.textContent = nls_1.localize('recommendationHasBeenIgnored', "You have chosen not to receive recommendations for this extension.");
                dom_1.show(this.subtextContainer);
            }
            else {
                this.subtext.textContent = '';
            }
            this.extensionTipsService.onRecommendationChange(change => {
                if (change.extensionId.toLowerCase() === extension.identifier.id.toLowerCase()) {
                    if (change.isRecommended) {
                        undoIgnoreAction.enabled = false;
                        const extRecommendations = this.extensionTipsService.getAllRecommendationsWithReason();
                        if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                            ignoreAction.enabled = true;
                            this.subtext.textContent = extRecommendations[extension.identifier.id.toLowerCase()].reasonText;
                        }
                    }
                    else {
                        undoIgnoreAction.enabled = true;
                        ignoreAction.enabled = false;
                        this.subtext.textContent = nls_1.localize('recommendationHasBeenIgnored', "You have chosen not to receive recommendations for this extension.");
                    }
                }
            });
            this.transientDisposables.push(reloadAction.onDidChange(e => {
                if (e.tooltip) {
                    this.subtext.textContent = reloadAction.tooltip;
                    dom_1.show(this.subtextContainer);
                    ignoreAction.enabled = false;
                    undoIgnoreAction.enabled = false;
                }
                if (e.enabled === true) {
                    dom_1.show(this.subtextContainer);
                }
                if (e.enabled === false) {
                    dom_1.hide(this.subtextContainer);
                }
            }));
        }
        focus() {
            if (this.activeElement) {
                this.activeElement.focus();
            }
        }
        showFind() {
            if (this.activeElement instanceof webviewElement_1.WebviewElement) {
                this.activeElement.showFind();
            }
        }
        onNavbarChange(extension, { id, focus }) {
            if (this.editorLoadComplete) {
                /* __GDPR__
                    "extensionEditor:navbarChange" : {
                        "navItem": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "${include}": [
                            "${GalleryExtensionTelemetryData}"
                        ]
                    }
                */
                this.telemetryService.publicLog('extensionEditor:navbarChange', objects_1.assign(extension.telemetryData, { navItem: id }));
            }
            this.contentDisposables = lifecycle_1.dispose(this.contentDisposables);
            this.content.innerHTML = '';
            this.activeElement = null;
            this.open(id, extension)
                .then(activeElement => {
                this.activeElement = activeElement;
                if (focus) {
                    this.focus();
                }
            });
        }
        open(id, extension) {
            switch (id) {
                case NavbarSection.Readme: return this.openReadme();
                case NavbarSection.Contributions: return this.openContributions();
                case NavbarSection.Changelog: return this.openChangelog();
                case NavbarSection.Dependencies: return this.openDependencies(extension);
                case NavbarSection.ExtensionPack: return this.openExtensionPack(extension);
            }
            return Promise.resolve(null);
        }
        openMarkdown(cacheResult, noContentCopy) {
            return this.loadContents(() => cacheResult)
                .then(marked.parse)
                .then(renderBody)
                .then(removeEmbeddedSVGs)
                .then(body => {
                const wbeviewElement = this.instantiationService.createInstance(webviewElement_1.WebviewElement, this.layoutService.getContainer("workbench.parts.editor" /* EDITOR_PART */), {
                    enableFindWidget: true,
                }, {
                    svgWhiteList: this.extensionsWorkbenchService.allowedBadgeProviders
                });
                wbeviewElement.mountTo(this.content);
                const removeLayoutParticipant = arrays.insert(this.layoutParticipants, wbeviewElement);
                this.contentDisposables.push(lifecycle_1.toDisposable(removeLayoutParticipant));
                wbeviewElement.contents = body;
                wbeviewElement.onDidClickLink(link => {
                    if (!link) {
                        return;
                    }
                    // Whitelist supported schemes for links
                    if (['http', 'https', 'mailto'].indexOf(link.scheme) >= 0 || (link.scheme === 'command' && link.path === update_1.ShowCurrentReleaseNotesAction.ID)) {
                        this.openerService.open(link);
                    }
                }, null, this.contentDisposables);
                this.contentDisposables.push(wbeviewElement);
                return wbeviewElement;
            })
                .then(undefined, () => {
                const p = dom_1.append(this.content, dom_1.$('p.nocontent'));
                p.textContent = noContentCopy;
                return p;
            });
        }
        openReadme() {
            return this.openMarkdown(this.extensionReadme.get(), nls_1.localize('noReadme', "No README available."));
        }
        openChangelog() {
            return this.openMarkdown(this.extensionChangelog.get(), nls_1.localize('noChangelog', "No Changelog available."));
        }
        openContributions() {
            const content = dom_1.$('div', { class: 'subcontent', tabindex: '0' });
            return this.loadContents(() => this.extensionManifest.get())
                .then(manifest => {
                if (!manifest) {
                    return content;
                }
                const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
                const layout = () => scrollableContent.scanDomNode();
                const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
                this.contentDisposables.push(lifecycle_1.toDisposable(removeLayoutParticipant));
                const renders = [
                    this.renderSettings(content, manifest, layout),
                    this.renderCommands(content, manifest, layout),
                    this.renderLanguages(content, manifest, layout),
                    this.renderColorThemes(content, manifest, layout),
                    this.renderIconThemes(content, manifest, layout),
                    this.renderColors(content, manifest, layout),
                    this.renderJSONValidation(content, manifest, layout),
                    this.renderDebuggers(content, manifest, layout),
                    this.renderViewContainers(content, manifest, layout),
                    this.renderViews(content, manifest, layout),
                    this.renderLocalizations(content, manifest, layout)
                ];
                const isEmpty = !renders.reduce((v, r) => r || v, false);
                scrollableContent.scanDomNode();
                if (isEmpty) {
                    dom_1.append(content, dom_1.$('p.nocontent')).textContent = nls_1.localize('noContributions', "No Contributions");
                    dom_1.append(this.content, content);
                }
                else {
                    dom_1.append(this.content, scrollableContent.getDomNode());
                    this.contentDisposables.push(scrollableContent);
                }
                return content;
            }, () => {
                dom_1.append(content, dom_1.$('p.nocontent')).textContent = nls_1.localize('noContributions', "No Contributions");
                dom_1.append(this.content, content);
                return content;
            });
        }
        openDependencies(extension) {
            if (extension.dependencies.length === 0) {
                dom_1.append(this.content, dom_1.$('p.nocontent')).textContent = nls_1.localize('noDependencies', "No Dependencies");
                return Promise.resolve(this.content);
            }
            return this.loadContents(() => this.extensionDependencies.get())
                .then(extensionDependencies => {
                if (extensionDependencies) {
                    const content = dom_1.$('div', { class: 'subcontent' });
                    const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
                    dom_1.append(this.content, scrollableContent.getDomNode());
                    this.contentDisposables.push(scrollableContent);
                    const dependenciesTree = this.renderDependencies(content, extensionDependencies);
                    const layout = () => {
                        scrollableContent.scanDomNode();
                        const scrollDimensions = scrollableContent.getScrollDimensions();
                        dependenciesTree.layout(scrollDimensions.height);
                    };
                    const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
                    this.contentDisposables.push(lifecycle_1.toDisposable(removeLayoutParticipant));
                    this.contentDisposables.push(dependenciesTree);
                    scrollableContent.scanDomNode();
                    return { focus() { dependenciesTree.domFocus(); } };
                }
                else {
                    dom_1.append(this.content, dom_1.$('p.nocontent')).textContent = nls_1.localize('noDependencies', "No Dependencies");
                    return Promise.resolve(this.content);
                }
            }, error => {
                dom_1.append(this.content, dom_1.$('p.nocontent')).textContent = error;
                this.notificationService.error(error);
                return this.content;
            });
        }
        renderDependencies(container, extensionDependencies) {
            class ExtensionData {
                constructor(extensionDependencies) {
                    this.extensionDependencies = extensionDependencies;
                }
                get extension() {
                    return this.extensionDependencies.extension;
                }
                get parent() {
                    return this.extensionDependencies.dependent ? new ExtensionData(this.extensionDependencies.dependent) : null;
                }
                get hasChildren() {
                    return this.extensionDependencies.hasDependencies;
                }
                getChildren() {
                    return this.extensionDependencies.dependencies ? Promise.resolve(this.extensionDependencies.dependencies.map(d => new ExtensionData(d))) : Promise.resolve(null);
                }
            }
            return this.instantiationService.createInstance(extensionsViewer_1.ExtensionsTree, new ExtensionData(extensionDependencies), container);
        }
        openExtensionPack(extension) {
            const content = dom_1.$('div', { class: 'subcontent' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
            dom_1.append(this.content, scrollableContent.getDomNode());
            this.contentDisposables.push(scrollableContent);
            const extensionsPackTree = this.renderExtensionPack(content, extension);
            const layout = () => {
                scrollableContent.scanDomNode();
                const scrollDimensions = scrollableContent.getScrollDimensions();
                extensionsPackTree.layout(scrollDimensions.height);
            };
            const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
            this.contentDisposables.push(lifecycle_1.toDisposable(removeLayoutParticipant));
            this.contentDisposables.push(extensionsPackTree);
            scrollableContent.scanDomNode();
            return Promise.resolve({ focus() { extensionsPackTree.domFocus(); } });
        }
        renderExtensionPack(container, extension) {
            const extensionsWorkbenchService = this.extensionsWorkbenchService;
            class ExtensionData {
                constructor(extension, parent) {
                    this.extension = extension;
                    this.parent = parent || null;
                }
                get hasChildren() {
                    return this.extension.extensionPack.length > 0;
                }
                getChildren() {
                    if (this.hasChildren) {
                        const names = arrays.distinct(this.extension.extensionPack, e => e.toLowerCase());
                        return extensionsWorkbenchService.queryGallery({ names, pageSize: names.length })
                            .then(result => result.firstPage.map(extension => new ExtensionData(extension, this)));
                    }
                    return Promise.resolve(null);
                }
            }
            return this.instantiationService.createInstance(extensionsViewer_1.ExtensionsTree, new ExtensionData(extension), container);
        }
        renderSettings(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const configuration = contributes && contributes.configuration;
            let properties = {};
            if (Array.isArray(configuration)) {
                configuration.forEach(config => {
                    properties = Object.assign({}, properties, config.properties);
                });
            }
            else if (configuration) {
                properties = configuration.properties;
            }
            const contrib = properties ? Object.keys(properties) : [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('settings', "Settings ({0})", contrib.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('setting name', "Name")), dom_1.$('th', undefined, nls_1.localize('description', "Description")), dom_1.$('th', undefined, nls_1.localize('default', "Default"))), ...contrib.map(key => dom_1.$('tr', undefined, dom_1.$('td', undefined, dom_1.$('code', undefined, key)), dom_1.$('td', undefined, properties[key].description), dom_1.$('td', undefined, dom_1.$('code', undefined, `${types_1.isUndefined(properties[key].default) ? configurationRegistry_1.getDefaultValue(properties[key].type) : properties[key].default}`))))));
            dom_1.append(container, details);
            return true;
        }
        renderDebuggers(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const contrib = contributes && contributes.debuggers || [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('debuggers', "Debuggers ({0})", contrib.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('debugger name', "Name")), dom_1.$('th', undefined, nls_1.localize('debugger type', "Type"))), ...contrib.map(d => dom_1.$('tr', undefined, dom_1.$('td', undefined, d.label), dom_1.$('td', undefined, d.type)))));
            dom_1.append(container, details);
            return true;
        }
        renderViewContainers(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const contrib = contributes && contributes.viewsContainers || {};
            let viewContainers = Object.keys(contrib).reduce((result, location) => {
                let viewContainersForLocation = contrib[location];
                result.push(...viewContainersForLocation.map(viewContainer => (Object.assign({}, viewContainer, { location }))));
                return result;
            }, []);
            if (!viewContainers.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('viewContainers', "View Containers ({0})", viewContainers.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('view container id', "ID")), dom_1.$('th', undefined, nls_1.localize('view container title', "Title")), dom_1.$('th', undefined, nls_1.localize('view container location', "Where"))), ...viewContainers.map(viewContainer => dom_1.$('tr', undefined, dom_1.$('td', undefined, viewContainer.id), dom_1.$('td', undefined, viewContainer.title), dom_1.$('td', undefined, viewContainer.location)))));
            dom_1.append(container, details);
            return true;
        }
        renderViews(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const contrib = contributes && contributes.views || {};
            let views = Object.keys(contrib).reduce((result, location) => {
                let viewsForLocation = contrib[location];
                result.push(...viewsForLocation.map(view => (Object.assign({}, view, { location }))));
                return result;
            }, []);
            if (!views.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('views', "Views ({0})", views.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('view id', "ID")), dom_1.$('th', undefined, nls_1.localize('view name', "Name")), dom_1.$('th', undefined, nls_1.localize('view location', "Where"))), ...views.map(view => dom_1.$('tr', undefined, dom_1.$('td', undefined, view.id), dom_1.$('td', undefined, view.name), dom_1.$('td', undefined, view.location)))));
            dom_1.append(container, details);
            return true;
        }
        renderLocalizations(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const localizations = contributes && contributes.localizations || [];
            if (!localizations.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('localizations', "Localizations ({0})", localizations.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('localizations language id', "Language Id")), dom_1.$('th', undefined, nls_1.localize('localizations language name', "Language Name")), dom_1.$('th', undefined, nls_1.localize('localizations localized language name', "Language Name (Localized)"))), ...localizations.map(localization => dom_1.$('tr', undefined, dom_1.$('td', undefined, localization.languageId), dom_1.$('td', undefined, localization.languageName || ''), dom_1.$('td', undefined, localization.localizedLanguageName || '')))));
            dom_1.append(container, details);
            return true;
        }
        renderColorThemes(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const contrib = contributes && contributes.themes || [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('colorThemes', "Color Themes ({0})", contrib.length)), dom_1.$('ul', undefined, ...contrib.map(theme => dom_1.$('li', undefined, theme.label))));
            dom_1.append(container, details);
            return true;
        }
        renderIconThemes(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const contrib = contributes && contributes.iconThemes || [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('iconThemes', "Icon Themes ({0})", contrib.length)), dom_1.$('ul', undefined, ...contrib.map(theme => dom_1.$('li', undefined, theme.label))));
            dom_1.append(container, details);
            return true;
        }
        renderColors(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const colors = contributes && contributes.colors;
            if (!colors || !colors.length) {
                return false;
            }
            function colorPreview(colorReference) {
                let result = [];
                if (colorReference && colorReference[0] === '#') {
                    let color = color_1.Color.fromHex(colorReference);
                    if (color) {
                        result.push(dom_1.$('span', { class: 'colorBox', style: 'background-color: ' + color_1.Color.Format.CSS.format(color) }, ''));
                    }
                }
                result.push(dom_1.$('code', undefined, colorReference));
                return result;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('colors', "Colors ({0})", colors.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('colorId', "Id")), dom_1.$('th', undefined, nls_1.localize('description', "Description")), dom_1.$('th', undefined, nls_1.localize('defaultDark', "Dark Default")), dom_1.$('th', undefined, nls_1.localize('defaultLight', "Light Default")), dom_1.$('th', undefined, nls_1.localize('defaultHC', "High Contrast Default"))), ...colors.map(color => dom_1.$('tr', undefined, dom_1.$('td', undefined, dom_1.$('code', undefined, color.id)), dom_1.$('td', undefined, color.description), dom_1.$('td', undefined, ...colorPreview(color.defaults.dark)), dom_1.$('td', undefined, ...colorPreview(color.defaults.light)), dom_1.$('td', undefined, ...colorPreview(color.defaults.highContrast))))));
            dom_1.append(container, details);
            return true;
        }
        renderJSONValidation(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const contrib = contributes && contributes.jsonValidation || [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('JSON Validation', "JSON Validation ({0})", contrib.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('fileMatch', "File Match")), dom_1.$('th', undefined, nls_1.localize('schema', "Schema"))), ...contrib.map(v => dom_1.$('tr', undefined, dom_1.$('td', undefined, dom_1.$('code', undefined, v.fileMatch)), dom_1.$('td', undefined, v.url)))));
            dom_1.append(container, details);
            return true;
        }
        renderCommands(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const rawCommands = contributes && contributes.commands || [];
            const commands = rawCommands.map(c => ({
                id: c.command,
                title: c.title,
                keybindings: [],
                menus: []
            }));
            const byId = arrays.index(commands, c => c.id);
            const menus = contributes && contributes.menus || {};
            Object.keys(menus).forEach(context => {
                menus[context].forEach(menu => {
                    let command = byId[menu.command];
                    if (!command) {
                        command = { id: menu.command, title: '', keybindings: [], menus: [context] };
                        byId[command.id] = command;
                        commands.push(command);
                    }
                    else {
                        command.menus.push(context);
                    }
                });
            });
            const rawKeybindings = contributes && contributes.keybindings ? (Array.isArray(contributes.keybindings) ? contributes.keybindings : [contributes.keybindings]) : [];
            rawKeybindings.forEach(rawKeybinding => {
                const keybinding = this.resolveKeybinding(rawKeybinding);
                if (!keybinding) {
                    return;
                }
                let command = byId[rawKeybinding.command];
                if (!command) {
                    command = { id: rawKeybinding.command, title: '', keybindings: [keybinding], menus: [] };
                    byId[command.id] = command;
                    commands.push(command);
                }
                else {
                    command.keybindings.push(keybinding);
                }
            });
            if (!commands.length) {
                return false;
            }
            const renderKeybinding = (keybinding) => {
                const element = dom_1.$('');
                new keybindingLabel_1.KeybindingLabel(element, platform_1.OS).set(keybinding);
                return element;
            };
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('commands', "Commands ({0})", commands.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('command name', "Name")), dom_1.$('th', undefined, nls_1.localize('description', "Description")), dom_1.$('th', undefined, nls_1.localize('keyboard shortcuts', "Keyboard Shortcuts")), dom_1.$('th', undefined, nls_1.localize('menuContexts', "Menu Contexts"))), ...commands.map(c => dom_1.$('tr', undefined, dom_1.$('td', undefined, dom_1.$('code', undefined, c.id)), dom_1.$('td', undefined, c.title), dom_1.$('td', undefined, ...c.keybindings.map(keybinding => renderKeybinding(keybinding))), dom_1.$('td', undefined, ...c.menus.map(context => dom_1.$('code', undefined, context)))))));
            dom_1.append(container, details);
            return true;
        }
        renderLanguages(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const rawLanguages = contributes && contributes.languages || [];
            const languages = rawLanguages.map(l => ({
                id: l.id,
                name: (l.aliases || [])[0] || l.id,
                extensions: l.extensions || [],
                hasGrammar: false,
                hasSnippets: false
            }));
            const byId = arrays.index(languages, l => l.id);
            const grammars = contributes && contributes.grammars || [];
            grammars.forEach(grammar => {
                let language = byId[grammar.language];
                if (!language) {
                    language = { id: grammar.language, name: grammar.language, extensions: [], hasGrammar: true, hasSnippets: false };
                    byId[language.id] = language;
                    languages.push(language);
                }
                else {
                    language.hasGrammar = true;
                }
            });
            const snippets = contributes && contributes.snippets || [];
            snippets.forEach(snippet => {
                let language = byId[snippet.language];
                if (!language) {
                    language = { id: snippet.language, name: snippet.language, extensions: [], hasGrammar: false, hasSnippets: true };
                    byId[language.id] = language;
                    languages.push(language);
                }
                else {
                    language.hasSnippets = true;
                }
            });
            if (!languages.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', undefined, nls_1.localize('languages', "Languages ({0})", languages.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('language id', "ID")), dom_1.$('th', undefined, nls_1.localize('language name', "Name")), dom_1.$('th', undefined, nls_1.localize('file extensions', "File Extensions")), dom_1.$('th', undefined, nls_1.localize('grammar', "Grammar")), dom_1.$('th', undefined, nls_1.localize('snippets', "Snippets"))), ...languages.map(l => dom_1.$('tr', undefined, dom_1.$('td', undefined, l.id), dom_1.$('td', undefined, l.name), dom_1.$('td', undefined, ...dom_1.join(l.extensions.map(ext => dom_1.$('code', undefined, ext)), ' ')), dom_1.$('td', undefined, document.createTextNode(l.hasGrammar ? '✔︎' : '—')), dom_1.$('td', undefined, document.createTextNode(l.hasSnippets ? '✔︎' : '—'))))));
            dom_1.append(container, details);
            return true;
        }
        resolveKeybinding(rawKeyBinding) {
            let key;
            switch (process.platform) {
                case 'win32':
                    key = rawKeyBinding.win;
                    break;
                case 'linux':
                    key = rawKeyBinding.linux;
                    break;
                case 'darwin':
                    key = rawKeyBinding.mac;
                    break;
            }
            const keyBinding = keybindingParser_1.KeybindingParser.parseKeybinding(key || rawKeyBinding.key, platform_1.OS);
            if (!keyBinding) {
                return null;
            }
            return this.keybindingService.resolveKeybinding(keyBinding)[0];
        }
        loadContents(loadingTask) {
            dom_1.addClass(this.content, 'loading');
            const result = loadingTask();
            const onDone = () => dom_1.removeClass(this.content, 'loading');
            result.promise.then(onDone, onDone);
            this.contentDisposables.push(lifecycle_1.toDisposable(() => result.dispose()));
            return result.promise;
        }
        layout() {
            this.layoutParticipants.forEach(p => p.layout());
        }
        onError(err) {
            if (errors_1.isPromiseCanceledError(err)) {
                return;
            }
            this.notificationService.error(err);
        }
        dispose() {
            this.transientDisposables = lifecycle_1.dispose(this.transientDisposables);
            this.disposables = lifecycle_1.dispose(this.disposables);
            super.dispose();
        }
    };
    ExtensionEditor.ID = 'workbench.editor.extension';
    ExtensionEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, viewlet_1.IViewletService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, themeService_1.IThemeService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, notification_1.INotificationService),
        __param(7, opener_1.IOpenerService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, extensionManagement_1.IExtensionTipsService),
        __param(10, storage_1.IStorageService),
        __param(11, extensions_2.IExtensionService),
        __param(12, workbenchThemeService_1.IWorkbenchThemeService)
    ], ExtensionEditor);
    exports.ExtensionEditor = ExtensionEditor;
    class ShowExtensionEditorFindCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            const extensionEditor = this.getExtensionEditor(accessor);
            if (extensionEditor) {
                extensionEditor.showFind();
            }
        }
        getExtensionEditor(accessor) {
            const activeControl = accessor.get(editorService_1.IEditorService).activeControl;
            if (activeControl instanceof ExtensionEditor) {
                return activeControl;
            }
            return null;
        }
    }
    const showCommand = new ShowExtensionEditorFindCommand({
        id: 'editor.action.extensioneditor.showfind',
        precondition: contextkey_1.ContextKeyExpr.equals('activeEditor', ExtensionEditor.ID),
        kbOpts: {
            primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
            weight: 100 /* EditorContrib */
        }
    });
    showCommand.register();
});
//# sourceMappingURL=extensionEditor.js.map