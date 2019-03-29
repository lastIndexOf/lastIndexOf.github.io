/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/product/node/product", "vs/base/common/platform"], function (require, exports, actions_1, nls, product_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeybindingsReferenceAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            window.open(KeybindingsReferenceAction.URL);
            return Promise.resolve();
        }
    }
    KeybindingsReferenceAction.ID = 'workbench.action.keybindingsReference';
    KeybindingsReferenceAction.LABEL = nls.localize('keybindingsReference', "Keyboard Shortcuts Reference");
    KeybindingsReferenceAction.URL = platform_1.isLinux ? product_1.default.keyboardShortcutsUrlLinux : platform_1.isMacintosh ? product_1.default.keyboardShortcutsUrlMac : product_1.default.keyboardShortcutsUrlWin;
    KeybindingsReferenceAction.AVAILABLE = !!KeybindingsReferenceAction.URL;
    exports.KeybindingsReferenceAction = KeybindingsReferenceAction;
    class OpenDocumentationUrlAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            window.open(OpenDocumentationUrlAction.URL);
            return Promise.resolve();
        }
    }
    OpenDocumentationUrlAction.ID = 'workbench.action.openDocumentationUrl';
    OpenDocumentationUrlAction.LABEL = nls.localize('openDocumentationUrl', "Documentation");
    OpenDocumentationUrlAction.URL = product_1.default.documentationUrl;
    OpenDocumentationUrlAction.AVAILABLE = !!OpenDocumentationUrlAction.URL;
    exports.OpenDocumentationUrlAction = OpenDocumentationUrlAction;
    class OpenIntroductoryVideosUrlAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            window.open(OpenIntroductoryVideosUrlAction.URL);
            return Promise.resolve();
        }
    }
    OpenIntroductoryVideosUrlAction.ID = 'workbench.action.openIntroductoryVideosUrl';
    OpenIntroductoryVideosUrlAction.LABEL = nls.localize('openIntroductoryVideosUrl', "Introductory Videos");
    OpenIntroductoryVideosUrlAction.URL = product_1.default.introductoryVideosUrl;
    OpenIntroductoryVideosUrlAction.AVAILABLE = !!OpenIntroductoryVideosUrlAction.URL;
    exports.OpenIntroductoryVideosUrlAction = OpenIntroductoryVideosUrlAction;
    class OpenTipsAndTricksUrlAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            window.open(OpenTipsAndTricksUrlAction.URL);
            return Promise.resolve();
        }
    }
    OpenTipsAndTricksUrlAction.ID = 'workbench.action.openTipsAndTricksUrl';
    OpenTipsAndTricksUrlAction.LABEL = nls.localize('openTipsAndTricksUrl', "Tips and Tricks");
    OpenTipsAndTricksUrlAction.URL = product_1.default.tipsAndTricksUrl;
    OpenTipsAndTricksUrlAction.AVAILABLE = !!OpenTipsAndTricksUrlAction.URL;
    exports.OpenTipsAndTricksUrlAction = OpenTipsAndTricksUrlAction;
    class OpenTwitterUrlAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            if (product_1.default.twitterUrl) {
                window.open(product_1.default.twitterUrl);
            }
            return Promise.resolve();
        }
    }
    OpenTwitterUrlAction.ID = 'workbench.action.openTwitterUrl';
    OpenTwitterUrlAction.LABEL = nls.localize('openTwitterUrl', "Join Us on Twitter", product_1.default.applicationName);
    exports.OpenTwitterUrlAction = OpenTwitterUrlAction;
    class OpenRequestFeatureUrlAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            if (product_1.default.requestFeatureUrl) {
                window.open(product_1.default.requestFeatureUrl);
            }
            return Promise.resolve();
        }
    }
    OpenRequestFeatureUrlAction.ID = 'workbench.action.openRequestFeatureUrl';
    OpenRequestFeatureUrlAction.LABEL = nls.localize('openUserVoiceUrl', "Search Feature Requests");
    exports.OpenRequestFeatureUrlAction = OpenRequestFeatureUrlAction;
    class OpenLicenseUrlAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            if (product_1.default.licenseUrl) {
                if (platform_1.language) {
                    const queryArgChar = product_1.default.licenseUrl.indexOf('?') > 0 ? '&' : '?';
                    window.open(`${product_1.default.licenseUrl}${queryArgChar}lang=${platform_1.language}`);
                }
                else {
                    window.open(product_1.default.licenseUrl);
                }
            }
            return Promise.resolve();
        }
    }
    OpenLicenseUrlAction.ID = 'workbench.action.openLicenseUrl';
    OpenLicenseUrlAction.LABEL = nls.localize('openLicenseUrl', "View License");
    exports.OpenLicenseUrlAction = OpenLicenseUrlAction;
    class OpenPrivacyStatementUrlAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            if (product_1.default.privacyStatementUrl) {
                if (platform_1.language) {
                    const queryArgChar = product_1.default.privacyStatementUrl.indexOf('?') > 0 ? '&' : '?';
                    window.open(`${product_1.default.privacyStatementUrl}${queryArgChar}lang=${platform_1.language}`);
                }
                else {
                    window.open(product_1.default.privacyStatementUrl);
                }
            }
            return Promise.resolve();
        }
    }
    OpenPrivacyStatementUrlAction.ID = 'workbench.action.openPrivacyStatementUrl';
    OpenPrivacyStatementUrlAction.LABEL = nls.localize('openPrivacyStatement', "Privacy Statement");
    exports.OpenPrivacyStatementUrlAction = OpenPrivacyStatementUrlAction;
});
//# sourceMappingURL=helpActions.js.map