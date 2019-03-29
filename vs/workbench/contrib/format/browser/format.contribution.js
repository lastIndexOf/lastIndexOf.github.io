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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/notification/common/notification", "vs/editor/contrib/format/format", "vs/nls", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/contrib/extensions/common/extensions"], function (require, exports, platform_1, contributions_1, notification_1, format_1, nls_1, viewlet_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let FormattingConflictHandler = class FormattingConflictHandler {
        constructor(notificationService, _viewletService) {
            this._viewletService = _viewletService;
            this._registration = format_1.setFormatterConflictCallback((ids, model, mode) => {
                if (mode & 1 /* Auto */) {
                    return;
                }
                if (ids.length === 0) {
                    const langName = model.getLanguageIdentifier().language;
                    const message = mode & 8 /* Document */
                        ? nls_1.localize('no.documentprovider', "There is no document formatter for '{0}'-files installed.", langName)
                        : nls_1.localize('no.selectionprovider', "There is no selection formatter for '{0}'-files installed.", langName);
                    const choice = {
                        label: nls_1.localize('install.formatter', "Install Formatter..."),
                        run: () => {
                            return this._viewletService.openViewlet(extensions_1.VIEWLET_ID, true).then(viewlet => {
                                if (viewlet) {
                                    viewlet.search(`category:formatters ${langName}`);
                                }
                            });
                        }
                    };
                    notificationService.prompt(notification_1.Severity.Info, message, [choice]);
                }
            });
        }
        dispose() {
            this._registration.dispose();
        }
    };
    FormattingConflictHandler = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, viewlet_1.IViewletService)
    ], FormattingConflictHandler);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(FormattingConflictHandler, 3 /* Restored */);
});
//# sourceMappingURL=format.contribution.js.map