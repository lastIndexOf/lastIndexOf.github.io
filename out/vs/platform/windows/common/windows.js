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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/platform", "vs/base/common/lifecycle"], function (require, exports, instantiation_1, event_1, platform_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWindowsService = instantiation_1.createDecorator('windowsService');
    exports.IWindowService = instantiation_1.createDecorator('windowService');
    function getTitleBarStyle(configurationService, environment, isExtensionDevelopment = environment.isExtensionDevelopment) {
        const configuration = configurationService.getValue('window');
        const isDev = !environment.isBuilt || isExtensionDevelopment;
        if (platform_1.isMacintosh && isDev) {
            return 'native'; // not enabled when developing due to https://github.com/electron/electron/issues/3647
        }
        if (configuration) {
            const useNativeTabs = platform_1.isMacintosh && configuration.nativeTabs === true;
            if (useNativeTabs) {
                return 'native'; // native tabs on sierra do not work with custom title style
            }
            const useSimpleFullScreen = platform_1.isMacintosh && configuration.nativeFullScreen === false;
            if (useSimpleFullScreen) {
                return 'native'; // simple fullscreen does not work well with custom title style (https://github.com/Microsoft/vscode/issues/63291)
            }
            const style = configuration.titleBarStyle;
            if (style === 'native' || style === 'custom') {
                return style;
            }
        }
        return platform_1.isLinux ? 'native' : 'custom'; // default to custom on all macOS and Windows
    }
    exports.getTitleBarStyle = getTitleBarStyle;
    var OpenContext;
    (function (OpenContext) {
        // opening when running from the command line
        OpenContext[OpenContext["CLI"] = 0] = "CLI";
        // macOS only: opening from the dock (also when opening files to a running instance from desktop)
        OpenContext[OpenContext["DOCK"] = 1] = "DOCK";
        // opening from the main application window
        OpenContext[OpenContext["MENU"] = 2] = "MENU";
        // opening from a file or folder dialog
        OpenContext[OpenContext["DIALOG"] = 3] = "DIALOG";
        // opening from the OS's UI
        OpenContext[OpenContext["DESKTOP"] = 4] = "DESKTOP";
        // opening through the API
        OpenContext[OpenContext["API"] = 5] = "API";
    })(OpenContext = exports.OpenContext || (exports.OpenContext = {}));
    var ReadyState;
    (function (ReadyState) {
        /**
         * This window has not loaded any HTML yet
         */
        ReadyState[ReadyState["NONE"] = 0] = "NONE";
        /**
         * This window is loading HTML
         */
        ReadyState[ReadyState["LOADING"] = 1] = "LOADING";
        /**
         * This window is navigating to another HTML
         */
        ReadyState[ReadyState["NAVIGATING"] = 2] = "NAVIGATING";
        /**
         * This window is done loading HTML
         */
        ReadyState[ReadyState["READY"] = 3] = "READY";
    })(ReadyState = exports.ReadyState || (exports.ReadyState = {}));
    let ActiveWindowManager = class ActiveWindowManager {
        constructor(windowsService) {
            this.disposables = [];
            const onActiveWindowChange = event_1.Event.latch(event_1.Event.any(windowsService.onWindowOpen, windowsService.onWindowFocus));
            onActiveWindowChange(this.setActiveWindow, this, this.disposables);
            this.firstActiveWindowIdPromise = windowsService.getActiveWindowId()
                .then(id => (typeof this._activeWindowId === 'undefined') && this.setActiveWindow(id));
        }
        setActiveWindow(windowId) {
            if (this.firstActiveWindowIdPromise) {
                this.firstActiveWindowIdPromise = null;
            }
            this._activeWindowId = windowId;
        }
        getActiveClientId() {
            if (this.firstActiveWindowIdPromise) {
                return this.firstActiveWindowIdPromise;
            }
            return Promise.resolve(`window:${this._activeWindowId}`);
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    ActiveWindowManager = __decorate([
        __param(0, exports.IWindowsService)
    ], ActiveWindowManager);
    exports.ActiveWindowManager = ActiveWindowManager;
});
//# sourceMappingURL=windows.js.map