/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/statusbar/statusbar", "vs/workbench/contrib/feedback/electron-browser/feedbackStatusbarItem", "vs/nls", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, platform_1, statusbar_1, feedbackStatusbarItem_1, nls_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Statusbar item
    platform_1.Registry.as(statusbar_1.Extensions.Statusbar).registerStatusbarItem(new statusbar_1.StatusbarItemDescriptor(feedbackStatusbarItem_1.FeedbackStatusbarItem, 1 /* RIGHT */, -100 /* towards the end of the right hand side */));
    // Configuration: Workbench
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        'id': 'workbench',
        'order': 7,
        'title': nls_1.localize('workbenchConfigurationTitle', "Workbench"),
        'type': 'object',
        'properties': {
            'workbench.statusBar.feedback.visible': {
                'type': 'boolean',
                'default': true,
                'description': nls_1.localize('feedbackVisibility', "Controls the visibility of the Twitter feedback (smiley) in the status bar at the bottom of the workbench.")
            }
        }
    });
});
//# sourceMappingURL=feedback.contribution.js.map