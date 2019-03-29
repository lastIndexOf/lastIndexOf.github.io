/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/nls"], function (require, exports, platform_1, configurationRegistry_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'update',
        order: 15,
        title: nls_1.localize('updateConfigurationTitle', "Update"),
        type: 'object',
        properties: {
            'update.mode': {
                type: 'string',
                enum: ['none', 'manual', 'default'],
                default: 'default',
                scope: 1 /* APPLICATION */,
                description: nls_1.localize('updateMode', "Configure whether you receive automatic updates. Requires a restart after change. The updates are fetched from a Microsoft online service."),
                tags: ['usesOnlineServices'],
                enumDescriptions: [
                    nls_1.localize('none', "Disable updates."),
                    nls_1.localize('manual', "Disable automatic background update checks. Updates will be available if you manually check for updates."),
                    nls_1.localize('default', "Enable automatic update checks. Code will check for updates automatically and periodically.")
                ]
            },
            'update.channel': {
                type: 'string',
                default: 'default',
                scope: 1 /* APPLICATION */,
                description: nls_1.localize('updateMode', "Configure whether you receive automatic updates. Requires a restart after change. The updates are fetched from a Microsoft online service."),
                deprecationMessage: nls_1.localize('deprecated', "This setting is deprecated, please use '{0}' instead.", 'update.mode')
            },
            'update.enableWindowsBackgroundUpdates': {
                type: 'boolean',
                default: true,
                scope: 1 /* APPLICATION */,
                description: nls_1.localize('enableWindowsBackgroundUpdates', "Enables Windows background updates. The updates are fetched from a Microsoft online service."),
                tags: ['usesOnlineServices']
            },
            'update.showReleaseNotes': {
                type: 'boolean',
                default: true,
                description: nls_1.localize('showReleaseNotes', "Show Release Notes after an update. The Release Notes are fetched from a Microsoft online service."),
                tags: ['usesOnlineServices']
            }
        }
    });
});
//# sourceMappingURL=update.config.contribution.js.map