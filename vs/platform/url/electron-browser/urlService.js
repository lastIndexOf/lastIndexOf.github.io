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
define(["require", "exports", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/url/node/urlIpc", "vs/platform/url/common/urlService"], function (require, exports, mainProcessService_1, urlIpc_1, urlService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RelayURLService = class RelayURLService extends urlService_1.URLService {
        constructor(mainProcessService) {
            super();
            this.urlService = new urlIpc_1.URLServiceChannelClient(mainProcessService.getChannel('url'));
            mainProcessService.registerChannel('urlHandler', new urlIpc_1.URLHandlerChannel(this));
        }
        open(uri) {
            return this.urlService.open(uri);
        }
        handleURL(uri) {
            return super.open(uri);
        }
    };
    RelayURLService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService)
    ], RelayURLService);
    exports.RelayURLService = RelayURLService;
});
//# sourceMappingURL=urlService.js.map