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
define(["require", "exports", "vs/base/common/network", "vs/base/node/pfs", "vs/platform/request/node/request", "vs/base/node/request", "vs/base/common/cancellation", "vs/base/common/path", "os", "vs/base/common/uuid"], function (require, exports, network_1, pfs_1, request_1, request_2, cancellation_1, path_1, os_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DownloadService = class DownloadService {
        constructor(requestService) {
            this.requestService = requestService;
        }
        download(uri, target = path_1.join(os_1.tmpdir(), uuid_1.generateUuid()), cancellationToken = cancellation_1.CancellationToken.None) {
            if (uri.scheme === network_1.Schemas.file) {
                return pfs_1.copy(uri.fsPath, target).then(() => target);
            }
            const options = { type: 'GET', url: uri.toString() };
            return this.requestService.request(options, cancellationToken)
                .then(context => {
                if (context.res.statusCode === 200) {
                    return request_2.download(target, context).then(() => target);
                }
                return request_2.asText(context)
                    .then(message => Promise.reject(new Error(`Expected 200, got back ${context.res.statusCode} instead.\n\n${message}`)));
            });
        }
    };
    DownloadService = __decorate([
        __param(0, request_1.IRequestService)
    ], DownloadService);
    exports.DownloadService = DownloadService;
});
//# sourceMappingURL=downloadService.js.map