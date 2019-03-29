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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/actions", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/event", "vs/base/browser/event", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService"], function (require, exports, dom, nls_1, lifecycle_1, actions_1, extensions_1, event_1, event_2, instantiation_1, listService_1, configuration_1, contextkey_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DataSource {
        getId(tree, { extension, parent }) {
            return parent ? this.getId(tree, parent) + '/' + extension.identifier.id : extension.identifier.id;
        }
        hasChildren(tree, { hasChildren }) {
            return hasChildren;
        }
        getChildren(tree, extensionData) {
            return extensionData.getChildren();
        }
        getParent(tree, { parent }) {
            return Promise.resolve(parent);
        }
    }
    exports.DataSource = DataSource;
    let Renderer = class Renderer {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        getHeight(tree, element) {
            return 62;
        }
        getTemplateId(tree, { extension }) {
            return extension ? Renderer.EXTENSION_TEMPLATE_ID : Renderer.UNKNOWN_EXTENSION_TEMPLATE_ID;
        }
        renderTemplate(tree, templateId, container) {
            if (Renderer.EXTENSION_TEMPLATE_ID === templateId) {
                return this.renderExtensionTemplate(tree, container);
            }
            return this.renderUnknownExtensionTemplate(tree, container);
        }
        renderExtensionTemplate(tree, container) {
            dom.addClass(container, 'extension');
            const icon = dom.append(container, dom.$('img.icon'));
            const details = dom.append(container, dom.$('.details'));
            const header = dom.append(details, dom.$('.header'));
            const name = dom.append(header, dom.$('span.name'));
            const openExtensionAction = this.instantiationService.createInstance(OpenExtensionAction);
            const extensionDisposables = [dom.addDisposableListener(name, 'click', (e) => {
                    tree.setFocus(openExtensionAction.extensionData);
                    tree.setSelection([openExtensionAction.extensionData]);
                    openExtensionAction.run(e.ctrlKey || e.metaKey);
                    e.stopPropagation();
                    e.preventDefault();
                })];
            const identifier = dom.append(header, dom.$('span.identifier'));
            const footer = dom.append(details, dom.$('.footer'));
            const author = dom.append(footer, dom.$('.author'));
            return {
                icon,
                name,
                identifier,
                author,
                extensionDisposables,
                set extensionData(extensionData) {
                    openExtensionAction.extensionData = extensionData;
                }
            };
        }
        renderUnknownExtensionTemplate(tree, container) {
            const messageContainer = dom.append(container, dom.$('div.unknown-extension'));
            dom.append(messageContainer, dom.$('span.error-marker')).textContent = nls_1.localize('error', "Error");
            dom.append(messageContainer, dom.$('span.message')).textContent = nls_1.localize('Unknown Extension', "Unknown Extension:");
            const identifier = dom.append(messageContainer, dom.$('span.message'));
            return { identifier };
        }
        renderElement(tree, element, templateId, templateData) {
            if (templateId === Renderer.EXTENSION_TEMPLATE_ID) {
                this.renderExtension(tree, element, templateData);
                return;
            }
            this.renderUnknownExtension(tree, element, templateData);
        }
        renderExtension(tree, extensionData, data) {
            const extension = extensionData.extension;
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
            data.identifier.textContent = extension.identifier.id;
            data.author.textContent = extension.publisherDisplayName;
            data.extensionData = extensionData;
        }
        renderUnknownExtension(tree, { extension }, data) {
            data.identifier.textContent = extension.identifier.id;
        }
        disposeTemplate(tree, templateId, templateData) {
            if (templateId === Renderer.EXTENSION_TEMPLATE_ID) {
                templateData.extensionDisposables = lifecycle_1.dispose(templateData.extensionDisposables);
            }
        }
    };
    Renderer.EXTENSION_TEMPLATE_ID = 'extension-template';
    Renderer.UNKNOWN_EXTENSION_TEMPLATE_ID = 'unknown-extension-template';
    Renderer = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], Renderer);
    exports.Renderer = Renderer;
    let Controller = class Controller extends listService_1.WorkbenchTreeController {
        constructor(extensionsWorkdbenchService, configurationService) {
            super({}, configurationService);
            this.extensionsWorkdbenchService = extensionsWorkdbenchService;
            // TODO@Sandeep this should be a command
            this.downKeyBindingDispatcher.set(2048 /* CtrlCmd */ | 3 /* Enter */, (tree, event) => this.openExtension(tree, true));
        }
        onLeftClick(tree, element, event) {
            let currentFocused = tree.getFocus();
            if (super.onLeftClick(tree, element, event)) {
                if (element.parent === null) {
                    if (currentFocused) {
                        tree.setFocus(currentFocused);
                    }
                    else {
                        tree.focusFirst();
                    }
                    return true;
                }
            }
            return false;
        }
        openExtension(tree, sideByside) {
            const element = tree.getFocus();
            if (element.extension) {
                this.extensionsWorkdbenchService.open(element.extension, sideByside);
                return true;
            }
            return false;
        }
    };
    Controller = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, configuration_1.IConfigurationService)
    ], Controller);
    exports.Controller = Controller;
    let OpenExtensionAction = class OpenExtensionAction extends actions_1.Action {
        constructor(extensionsWorkdbenchService) {
            super('extensions.action.openExtension', '');
            this.extensionsWorkdbenchService = extensionsWorkdbenchService;
        }
        set extensionData(extension) {
            this._extensionData = extension;
        }
        get extensionData() {
            return this._extensionData;
        }
        run(sideByside) {
            return this.extensionsWorkdbenchService.open(this.extensionData.extension, sideByside);
        }
    };
    OpenExtensionAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], OpenExtensionAction);
    let ExtensionsTree = class ExtensionsTree extends listService_1.WorkbenchTree {
        constructor(input, container, contextKeyService, listService, themeService, instantiationService, configurationService) {
            const renderer = instantiationService.createInstance(Renderer);
            const controller = instantiationService.createInstance(Controller);
            super(container, {
                dataSource: new DataSource(),
                renderer,
                controller
            }, {
                indentPixels: 40,
                twistiePixels: 20
            }, contextKeyService, listService, themeService, instantiationService, configurationService);
            this.setInput(input);
            this.disposables.push(this.onDidChangeSelection(event => {
                if (event && event.payload && event.payload.origin === 'keyboard') {
                    controller.openExtension(this, false);
                }
            }));
        }
    };
    ExtensionsTree = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, listService_1.IListService),
        __param(4, themeService_1.IThemeService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, configuration_1.IConfigurationService)
    ], ExtensionsTree);
    exports.ExtensionsTree = ExtensionsTree;
});
//# sourceMappingURL=extensionsViewer.js.map