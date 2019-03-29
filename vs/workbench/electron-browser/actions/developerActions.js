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
define(["require", "exports", "vs/base/common/actions", "vs/platform/windows/common/windows", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/base/browser/event", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/base/browser/keyboardEvent", "vs/base/common/async", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, actions_1, windows_1, nls, keybinding_1, event_1, event_2, lifecycle_1, dom_1, contextkey_1, keyboardEvent_1, async_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ToggleDevToolsAction = class ToggleDevToolsAction extends actions_1.Action {
        constructor(id, label, windowsService) {
            super(id, label);
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.toggleDevTools();
        }
    };
    ToggleDevToolsAction.ID = 'workbench.action.toggleDevTools';
    ToggleDevToolsAction.LABEL = nls.localize('toggleDevTools', "Toggle Developer Tools");
    ToggleDevToolsAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], ToggleDevToolsAction);
    exports.ToggleDevToolsAction = ToggleDevToolsAction;
    let ToggleSharedProcessAction = class ToggleSharedProcessAction extends actions_1.Action {
        constructor(id, label, windowsService) {
            super(id, label);
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.toggleSharedProcess();
        }
    };
    ToggleSharedProcessAction.ID = 'workbench.action.toggleSharedProcess';
    ToggleSharedProcessAction.LABEL = nls.localize('toggleSharedProcess', "Toggle Shared Process");
    ToggleSharedProcessAction = __decorate([
        __param(2, windows_1.IWindowsService)
    ], ToggleSharedProcessAction);
    exports.ToggleSharedProcessAction = ToggleSharedProcessAction;
    let InspectContextKeysAction = class InspectContextKeysAction extends actions_1.Action {
        constructor(id, label, contextKeyService, windowService) {
            super(id, label);
            this.contextKeyService = contextKeyService;
            this.windowService = windowService;
        }
        run() {
            const disposables = [];
            const stylesheet = dom_1.createStyleSheet();
            disposables.push(lifecycle_1.toDisposable(() => {
                if (stylesheet.parentNode) {
                    stylesheet.parentNode.removeChild(stylesheet);
                }
            }));
            dom_1.createCSSRule('*', 'cursor: crosshair !important;', stylesheet);
            const hoverFeedback = document.createElement('div');
            document.body.appendChild(hoverFeedback);
            disposables.push(lifecycle_1.toDisposable(() => document.body.removeChild(hoverFeedback)));
            hoverFeedback.style.position = 'absolute';
            hoverFeedback.style.pointerEvents = 'none';
            hoverFeedback.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            hoverFeedback.style.zIndex = '1000';
            const onMouseMove = event_1.domEvent(document.body, 'mousemove', true);
            disposables.push(onMouseMove(e => {
                const target = e.target;
                const position = dom_1.getDomNodePagePosition(target);
                hoverFeedback.style.top = `${position.top}px`;
                hoverFeedback.style.left = `${position.left}px`;
                hoverFeedback.style.width = `${position.width}px`;
                hoverFeedback.style.height = `${position.height}px`;
            }));
            const onMouseDown = event_2.Event.once(event_1.domEvent(document.body, 'mousedown', true));
            onMouseDown(e => { e.preventDefault(); e.stopPropagation(); }, null, disposables);
            const onMouseUp = event_2.Event.once(event_1.domEvent(document.body, 'mouseup', true));
            onMouseUp(e => {
                e.preventDefault();
                e.stopPropagation();
                const context = this.contextKeyService.getContext(e.target);
                console.log(context.collectAllValues());
                this.windowService.openDevTools();
                lifecycle_1.dispose(disposables);
            }, null, disposables);
            return Promise.resolve();
        }
    };
    InspectContextKeysAction.ID = 'workbench.action.inspectContextKeys';
    InspectContextKeysAction.LABEL = nls.localize('inspect context keys', "Inspect Context Keys");
    InspectContextKeysAction = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, windows_1.IWindowService)
    ], InspectContextKeysAction);
    exports.InspectContextKeysAction = InspectContextKeysAction;
    let ToggleScreencastModeAction = class ToggleScreencastModeAction extends actions_1.Action {
        constructor(id, label, keybindingService, layoutService) {
            super(id, label);
            this.keybindingService = keybindingService;
            this.layoutService = layoutService;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                if (ToggleScreencastModeAction.disposable) {
                    ToggleScreencastModeAction.disposable.dispose();
                    ToggleScreencastModeAction.disposable = undefined;
                    return;
                }
                const container = this.layoutService.getWorkbenchElement();
                const mouseMarker = dom_1.append(container, dom_1.$('div'));
                mouseMarker.style.position = 'absolute';
                mouseMarker.style.border = '2px solid red';
                mouseMarker.style.borderRadius = '20px';
                mouseMarker.style.width = '20px';
                mouseMarker.style.height = '20px';
                mouseMarker.style.top = '0';
                mouseMarker.style.left = '0';
                mouseMarker.style.zIndex = '100000';
                mouseMarker.style.content = ' ';
                mouseMarker.style.pointerEvents = 'none';
                mouseMarker.style.display = 'none';
                const onMouseDown = event_1.domEvent(container, 'mousedown', true);
                const onMouseUp = event_1.domEvent(container, 'mouseup', true);
                const onMouseMove = event_1.domEvent(container, 'mousemove', true);
                const mouseListener = onMouseDown(e => {
                    mouseMarker.style.top = `${e.clientY - 10}px`;
                    mouseMarker.style.left = `${e.clientX - 10}px`;
                    mouseMarker.style.display = 'block';
                    const mouseMoveListener = onMouseMove(e => {
                        mouseMarker.style.top = `${e.clientY - 10}px`;
                        mouseMarker.style.left = `${e.clientX - 10}px`;
                    });
                    event_2.Event.once(onMouseUp)(() => {
                        mouseMarker.style.display = 'none';
                        mouseMoveListener.dispose();
                    });
                });
                const keyboardMarker = dom_1.append(container, dom_1.$('div'));
                keyboardMarker.style.position = 'absolute';
                keyboardMarker.style.backgroundColor = 'rgba(0, 0, 0 ,0.5)';
                keyboardMarker.style.width = '100%';
                keyboardMarker.style.height = '100px';
                keyboardMarker.style.bottom = '20%';
                keyboardMarker.style.left = '0';
                keyboardMarker.style.zIndex = '100000';
                keyboardMarker.style.pointerEvents = 'none';
                keyboardMarker.style.color = 'white';
                keyboardMarker.style.lineHeight = '100px';
                keyboardMarker.style.textAlign = 'center';
                keyboardMarker.style.fontSize = '56px';
                keyboardMarker.style.display = 'none';
                const onKeyDown = event_1.domEvent(container, 'keydown', true);
                let keyboardTimeout = lifecycle_1.Disposable.None;
                const keyboardListener = onKeyDown(e => {
                    keyboardTimeout.dispose();
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    const keybinding = this.keybindingService.resolveKeyboardEvent(event);
                    const label = keybinding.getLabel();
                    if (!event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && this.keybindingService.mightProducePrintableCharacter(event) && label) {
                        keyboardMarker.textContent += ' ' + label;
                    }
                    else {
                        keyboardMarker.textContent = label;
                    }
                    keyboardMarker.style.display = 'block';
                    const promise = async_1.timeout(800);
                    keyboardTimeout = lifecycle_1.toDisposable(() => promise.cancel());
                    promise.then(() => {
                        keyboardMarker.textContent = '';
                        keyboardMarker.style.display = 'none';
                    });
                });
                ToggleScreencastModeAction.disposable = lifecycle_1.toDisposable(() => {
                    mouseListener.dispose();
                    keyboardListener.dispose();
                    mouseMarker.remove();
                    keyboardMarker.remove();
                });
            });
        }
    };
    ToggleScreencastModeAction.ID = 'workbench.action.toggleScreencastMode';
    ToggleScreencastModeAction.LABEL = nls.localize('toggle mouse clicks', "Toggle Screencast Mode");
    ToggleScreencastModeAction = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], ToggleScreencastModeAction);
    exports.ToggleScreencastModeAction = ToggleScreencastModeAction;
});
//# sourceMappingURL=developerActions.js.map