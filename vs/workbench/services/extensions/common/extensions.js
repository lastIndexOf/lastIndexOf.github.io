/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, event_1, uri_1, instantiation_1, extensions_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nullExtensionDescription = Object.freeze({
        identifier: new extensions_1.ExtensionIdentifier('nullExtensionDescription'),
        name: 'Null Extension Description',
        version: '0.0.0',
        publisher: 'vscode',
        enableProposedApi: false,
        engines: { vscode: '' },
        extensionLocation: uri_1.URI.parse('void:location'),
        isBuiltin: false,
    });
    exports.IExtensionService = instantiation_1.createDecorator('extensionService');
    class ActivationTimes {
        constructor(startup, codeLoadingTime, activateCallTime, activateResolvedTime, activationEvent) {
            this.startup = startup;
            this.codeLoadingTime = codeLoadingTime;
            this.activateCallTime = activateCallTime;
            this.activateResolvedTime = activateResolvedTime;
            this.activationEvent = activationEvent;
        }
    }
    exports.ActivationTimes = ActivationTimes;
    class ExtensionPointContribution {
        constructor(description, value) {
            this.description = description;
            this.value = value;
        }
    }
    exports.ExtensionPointContribution = ExtensionPointContribution;
    exports.ExtensionHostLogFileName = 'exthost';
    function checkProposedApiEnabled(extension) {
        if (!extension.enableProposedApi) {
            throwProposedApiError(extension);
        }
    }
    exports.checkProposedApiEnabled = checkProposedApiEnabled;
    function throwProposedApiError(extension) {
        throw new Error(`[${extension.identifier.value}]: Proposed API is only available when running out of dev or with the following command line switch: --enable-proposed-api ${extension.identifier.value}`);
    }
    exports.throwProposedApiError = throwProposedApiError;
    function toExtension(extensionDescription) {
        return {
            type: extensionDescription.isBuiltin ? 0 /* System */ : 1 /* User */,
            identifier: { id: extensionManagementUtil_1.getGalleryExtensionId(extensionDescription.publisher, extensionDescription.name), uuid: extensionDescription.uuid },
            manifest: extensionDescription,
            location: extensionDescription.extensionLocation,
        };
    }
    exports.toExtension = toExtension;
    class NullExtensionService {
        constructor() {
            this.onDidRegisterExtensions = event_1.Event.None;
            this.onDidChangeExtensionsStatus = event_1.Event.None;
            this.onDidChangeExtensions = event_1.Event.None;
            this.onWillActivateByEvent = event_1.Event.None;
            this.onDidChangeResponsiveChange = event_1.Event.None;
        }
        activateByEvent(_activationEvent) { return Promise.resolve(undefined); }
        whenInstalledExtensionsRegistered() { return Promise.resolve(true); }
        getExtensions() { return Promise.resolve([]); }
        getExtension() { return Promise.resolve(undefined); }
        readExtensionPointContributions(_extPoint) { return Promise.resolve(Object.create(null)); }
        getExtensionsStatus() { return Object.create(null); }
        canProfileExtensionHost() { return false; }
        getInspectPort() { return 0; }
        startExtensionHostProfile() { return Promise.resolve(Object.create(null)); }
        restartExtensionHost() { }
        startExtensionHost() { }
        stopExtensionHost() { }
        canAddExtension() { return false; }
        canRemoveExtension() { return false; }
    }
    exports.NullExtensionService = NullExtensionService;
});
//# sourceMappingURL=extensions.js.map