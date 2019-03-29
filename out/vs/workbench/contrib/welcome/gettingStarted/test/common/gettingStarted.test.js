/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage"], function (require, exports, instantiationServiceMock_1, workspace_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - GettingStarted', () => {
        let instantiation = null;
        let welcomePageEnvConfig = null;
        let hideWelcomeSettingsValue = null;
        // let machineId: string | null = null;
        let appName = null;
        suiteSetup(() => {
            instantiation = new instantiationServiceMock_1.TestInstantiationService();
            instantiation.stub(workspace_1.IWorkspaceContextService, {
                getConfiguration: () => {
                    return {
                        env: {
                            welcomePage: welcomePageEnvConfig,
                            appName: appName
                        }
                    };
                }
            });
            instantiation.stub(storage_1.IStorageService, {
                get: () => hideWelcomeSettingsValue,
                store: (value) => hideWelcomeSettingsValue = value
            });
        });
        suiteTeardown(() => {
            instantiation = null;
        });
        setup(() => {
            welcomePageEnvConfig = null;
            hideWelcomeSettingsValue = null;
            appName = null;
        });
    });
});
//# sourceMappingURL=gettingStarted.test.js.map