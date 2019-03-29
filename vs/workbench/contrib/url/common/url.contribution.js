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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/url/common/url", "vs/platform/quickinput/common/quickInput", "vs/base/common/uri", "vs/base/common/actions"], function (require, exports, nls_1, actions_1, platform_1, actions_2, url_1, quickInput_1, uri_1, actions_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenUrlAction = class OpenUrlAction extends actions_3.Action {
        constructor(id, label, urlService, quickInputService) {
            super(id, label);
            this.urlService = urlService;
            this.quickInputService = quickInputService;
        }
        run() {
            return this.quickInputService.input({ prompt: 'URL to open' }).then(input => {
                const uri = uri_1.URI.parse(input);
                this.urlService.open(uri);
            });
        }
    };
    OpenUrlAction.ID = 'workbench.action.url.openUrl';
    OpenUrlAction.LABEL = nls_1.localize('openUrl', "Open URL");
    OpenUrlAction = __decorate([
        __param(2, url_1.IURLService),
        __param(3, quickInput_1.IQuickInputService)
    ], OpenUrlAction);
    exports.OpenUrlAction = OpenUrlAction;
    platform_1.Registry.as(actions_2.Extensions.WorkbenchActions)
        .registerWorkbenchAction(new actions_1.SyncActionDescriptor(OpenUrlAction, OpenUrlAction.ID, OpenUrlAction.LABEL), 'OpenUrl', nls_1.localize('developer', "Developer"));
});
//# sourceMappingURL=url.contribution.js.map