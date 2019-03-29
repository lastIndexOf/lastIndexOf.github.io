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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/browser/event", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/electron-browser/extensionsActions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/electron-browser/extensionsWidgets", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification"], function (require, exports, dom_1, lifecycle_1, actionbar_1, instantiation_1, event_1, event_2, extensions_1, extensionsActions_1, extensionManagementUtil_1, extensionsWidgets_1, extensions_2, extensionManagement_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Delegate {
        getHeight() { return 62; }
        getTemplateId() { return 'extension'; }
    }
    exports.Delegate = Delegate;
    const actionOptions = { icon: true, label: true, tabOnlyOnFocus: true };
    let Renderer = class Renderer {
        constructor(extensionViewState, instantiationService, notificationService, extensionsWorkbenchService, extensionService, extensionManagementServerService) {
            this.extensionViewState = extensionViewState;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
        }
        get templateId() { return 'extension'; }
        renderTemplate(root) {
            const recommendationWidget = this.instantiationService.createInstance(extensionsWidgets_1.RecommendationWidget, root);
            const element = dom_1.append(root, dom_1.$('.extension'));
            const iconContainer = dom_1.append(element, dom_1.$('.icon-container'));
            const icon = dom_1.append(iconContainer, dom_1.$('img.icon'));
            const badgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, iconContainer);
            const details = dom_1.append(element, dom_1.$('.details'));
            const headerContainer = dom_1.append(details, dom_1.$('.header-container'));
            const header = dom_1.append(headerContainer, dom_1.$('.header'));
            const name = dom_1.append(header, dom_1.$('span.name'));
            const version = dom_1.append(header, dom_1.$('span.version'));
            const installCount = dom_1.append(header, dom_1.$('span.install-count'));
            const ratings = dom_1.append(header, dom_1.$('span.ratings'));
            const description = dom_1.append(details, dom_1.$('.description.ellipsis'));
            const footer = dom_1.append(details, dom_1.$('.footer'));
            const author = dom_1.append(footer, dom_1.$('.author.ellipsis'));
            const actionbar = new actionbar_1.ActionBar(footer, {
                animated: false,
                actionItemProvider: (action) => {
                    if (action.id === extensionsActions_1.ManageExtensionAction.ID) {
                        return action.createActionItem();
                    }
                    return new extensionsActions_1.ExtensionActionItem(null, action, actionOptions);
                }
            });
            actionbar.onDidRun(({ error }) => error && this.notificationService.error(error));
            const widgets = [
                recommendationWidget,
                badgeWidget,
                this.instantiationService.createInstance(extensionsWidgets_1.Label, version, (e) => e.version),
                this.instantiationService.createInstance(extensionsWidgets_1.InstallCountWidget, installCount, true),
                this.instantiationService.createInstance(extensionsWidgets_1.RatingsWidget, ratings, true)
            ];
            const actions = [
                this.instantiationService.createInstance(extensionsActions_1.StatusLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.UpdateAction),
                this.instantiationService.createInstance(extensionsActions_1.ReloadAction),
                this.instantiationService.createInstance(extensionsActions_1.InstallAction),
                this.instantiationService.createInstance(extensionsActions_1.MaliciousStatusLabelAction, false),
                this.instantiationService.createInstance(extensionsActions_1.ManageExtensionAction)
            ];
            const extensionContainers = this.instantiationService.createInstance(extensions_1.ExtensionContainers, [...actions, ...widgets]);
            actionbar.push(actions, actionOptions);
            const disposables = [...actions, ...widgets, actionbar, extensionContainers];
            return {
                root, element, icon, name, installCount, ratings, author, description, disposables, actionbar,
                extensionDisposables: [],
                set extension(extension) {
                    extensionContainers.extension = extension;
                }
            };
        }
        renderPlaceholder(index, data) {
            dom_1.addClass(data.element, 'loading');
            data.root.removeAttribute('aria-label');
            data.extensionDisposables = lifecycle_1.dispose(data.extensionDisposables);
            data.icon.src = '';
            data.name.textContent = '';
            data.author.textContent = '';
            data.description.textContent = '';
            data.installCount.style.display = 'none';
            data.ratings.style.display = 'none';
            data.extension = null;
        }
        renderElement(extension, index, data) {
            dom_1.removeClass(data.element, 'loading');
            data.extensionDisposables = lifecycle_1.dispose(data.extensionDisposables);
            const updateEnablement = () => __awaiter(this, void 0, void 0, function* () {
                const runningExtensions = yield this.extensionService.getExtensions();
                const installed = this.extensionsWorkbenchService.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0];
                if (installed && installed.local) {
                    const installedExtensionServer = this.extensionManagementServerService.getExtensionManagementServer(installed.local.location);
                    const isSameExtensionRunning = runningExtensions.some(e => {
                        if (!extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value }, extension.identifier)) {
                            return false;
                        }
                        const runningExtensionServer = this.extensionManagementServerService.getExtensionManagementServer(e.extensionLocation);
                        if (!installedExtensionServer || !runningExtensionServer) {
                            return false;
                        }
                        return installedExtensionServer.authority === runningExtensionServer.authority;
                    });
                    dom_1.toggleClass(data.root, 'disabled', !isSameExtensionRunning);
                }
                else {
                    dom_1.removeClass(data.root, 'disabled');
                }
            });
            updateEnablement();
            this.extensionService.onDidChangeExtensions(() => updateEnablement(), this, data.extensionDisposables);
            const onError = event_1.Event.once(event_2.domEvent(data.icon, 'error'));
            onError(() => data.icon.src = extension.iconUrlFallback, null, data.extensionDisposables);
            data.icon.src = extension.iconUrl;
            if (!data.icon.complete) {
                data.icon.style.visibility = 'hidden';
                data.icon.onload = () => data.icon.style.visibility = 'inherit';
            }
            else {
                data.icon.style.visibility = 'inherit';
            }
            data.name.textContent = extension.displayName;
            data.author.textContent = extension.publisherDisplayName;
            data.description.textContent = extension.description;
            data.installCount.style.display = '';
            data.ratings.style.display = '';
            data.extension = extension;
            if (extension.gallery && extension.gallery.properties && extension.gallery.properties.localizedLanguages && extension.gallery.properties.localizedLanguages.length) {
                data.description.textContent = extension.gallery.properties.localizedLanguages.map(name => name[0].toLocaleUpperCase() + name.slice(1)).join(', ');
            }
            this.extensionViewState.onFocus(e => {
                if (extensionManagementUtil_1.areSameExtensions(extension.identifier, e.identifier)) {
                    data.actionbar.items.forEach(item => item.setFocus(true));
                }
            }, this, data.extensionDisposables);
            this.extensionViewState.onBlur(e => {
                if (extensionManagementUtil_1.areSameExtensions(extension.identifier, e.identifier)) {
                    data.actionbar.items.forEach(item => item.setFocus(false));
                }
            }, this, data.extensionDisposables);
        }
        disposeTemplate(data) {
            data.disposables = lifecycle_1.dispose(data.disposables);
        }
    };
    Renderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensions_2.IExtensionService),
        __param(5, extensionManagement_1.IExtensionManagementServerService)
    ], Renderer);
    exports.Renderer = Renderer;
});
//# sourceMappingURL=extensionsList.js.map