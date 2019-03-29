/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/panel/common/panelService", "vs/workbench/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/nls", "vs/workbench/contrib/markers/browser/markersModel", "vs/workbench/contrib/markers/browser/markersPanel", "vs/platform/actions/common/actions", "vs/workbench/browser/panel", "vs/platform/registry/common/platform", "vs/workbench/contrib/markers/browser/markersPanelActions", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/contrib/markers/browser/messages", "vs/workbench/common/contributions", "vs/workbench/contrib/markers/browser/markers", "vs/platform/instantiation/common/extensions", "vs/platform/clipboard/common/clipboardService", "vs/workbench/common/panel", "vs/workbench/contrib/markers/browser/markersFileDecorations"], function (require, exports, contextkey_1, configurationRegistry_1, panelService_1, actions_1, keybindingsRegistry_1, nls_1, markersModel_1, markersPanel_1, actions_2, panel_1, platform_1, markersPanelActions_1, constants_1, messages_1, contributions_1, markers_1, extensions_1, clipboardService_1, panel_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(markers_1.IMarkersWorkbenchService, markers_1.MarkersWorkbenchService, false);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: constants_1.default.MARKER_OPEN_SIDE_ACTION_ID,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(constants_1.default.MarkerFocusContextKey),
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        mac: {
            primary: 256 /* WinCtrl */ | 3 /* Enter */
        },
        handler: (accessor, args) => {
            const markersPanel = accessor.get(panelService_1.IPanelService).getActivePanel();
            markersPanel.openFileAtElement(markersPanel.getFocusElement(), false, true, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: constants_1.default.MARKER_SHOW_PANEL_ID,
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: undefined,
        handler: (accessor, args) => {
            accessor.get(panelService_1.IPanelService).openPanel(constants_1.default.MARKERS_PANEL_ID);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: constants_1.default.MARKER_SHOW_QUICK_FIX,
        weight: 200 /* WorkbenchContrib */,
        when: constants_1.default.MarkerFocusContextKey,
        primary: 2048 /* CtrlCmd */ | 84 /* US_DOT */,
        handler: (accessor, args) => {
            const markersPanel = accessor.get(panelService_1.IPanelService).getActivePanel();
            const focusedElement = markersPanel.getFocusElement();
            if (focusedElement instanceof markersModel_1.Marker) {
                markersPanel.showQuickFixes(focusedElement);
            }
        }
    });
    // configuration
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': 'problems',
        'order': 101,
        'title': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_TITLE,
        'type': 'object',
        'properties': {
            'problems.autoReveal': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_AUTO_REVEAL,
                'type': 'boolean',
                'default': true
            }
        }
    });
    // markers panel
    platform_1.Registry.as(panel_1.Extensions.Panels).registerPanel(new panel_1.PanelDescriptor(markersPanel_1.MarkersPanel, constants_1.default.MARKERS_PANEL_ID, messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS, 'markersPanel', 10, markersPanelActions_1.ToggleMarkersPanelAction.ID));
    // workbench
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(markers_1.ActivityUpdater, 3 /* Restored */);
    // actions
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(markersPanelActions_1.ToggleMarkersPanelAction, markersPanelActions_1.ToggleMarkersPanelAction.ID, markersPanelActions_1.ToggleMarkersPanelAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 43 /* KEY_M */
    }), 'View: Toggle Problems (Errors, Warnings, Infos)', messages_1.default.MARKERS_PANEL_VIEW_CATEGORY);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(markersPanelActions_1.ShowProblemsPanelAction, markersPanelActions_1.ShowProblemsPanelAction.ID, markersPanelActions_1.ShowProblemsPanelAction.LABEL), 'View: Focus Problems (Errors, Warnings, Infos)', messages_1.default.MARKERS_PANEL_VIEW_CATEGORY);
    actions_2.registerAction({
        id: constants_1.default.MARKER_COPY_ACTION_ID,
        title: { value: nls_1.localize('copyMarker', "Copy"), original: 'Copy' },
        handler(accessor) {
            copyMarker(accessor.get(panelService_1.IPanelService), accessor.get(clipboardService_1.IClipboardService));
        },
        menu: {
            menuId: 28 /* ProblemsPanelContext */,
            when: constants_1.default.MarkerFocusContextKey,
            group: 'navigation'
        },
        keybinding: {
            keys: {
                primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */
            },
            when: constants_1.default.MarkerFocusContextKey
        }
    });
    actions_2.registerAction({
        id: constants_1.default.MARKER_COPY_MESSAGE_ACTION_ID,
        title: { value: nls_1.localize('copyMessage', "Copy Message"), original: 'Copy Message' },
        handler(accessor) {
            copyMessage(accessor.get(panelService_1.IPanelService), accessor.get(clipboardService_1.IClipboardService));
        },
        menu: {
            menuId: 28 /* ProblemsPanelContext */,
            when: constants_1.default.MarkerFocusContextKey,
            group: 'navigation'
        }
    });
    actions_2.registerAction({
        id: constants_1.default.RELATED_INFORMATION_COPY_MESSAGE_ACTION_ID,
        title: { value: nls_1.localize('copyMessage', "Copy Message"), original: 'Copy Message' },
        handler(accessor) {
            copyRelatedInformationMessage(accessor.get(panelService_1.IPanelService), accessor.get(clipboardService_1.IClipboardService));
        },
        menu: {
            menuId: 28 /* ProblemsPanelContext */,
            when: constants_1.default.RelatedInformationFocusContextKey,
            group: 'navigation'
        }
    });
    actions_2.registerAction({
        id: constants_1.default.FOCUS_PROBLEMS_FROM_FILTER,
        handler(accessor) {
            focusProblemsView(accessor.get(panelService_1.IPanelService));
        },
        keybinding: {
            when: constants_1.default.MarkerPanelFilterFocusContextKey,
            keys: {
                primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */
            },
        }
    });
    actions_2.registerAction({
        id: constants_1.default.MARKERS_PANEL_FOCUS_FILTER,
        handler(accessor) {
            focusProblemsFilter(accessor.get(panelService_1.IPanelService));
        },
        keybinding: {
            when: constants_1.default.MarkerPanelFocusContextKey,
            keys: {
                primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */
            },
        }
    });
    actions_2.registerAction({
        id: constants_1.default.MARKERS_PANEL_SHOW_MULTILINE_MESSAGE,
        handler(accessor) {
            const panelService = accessor.get(panelService_1.IPanelService);
            const panel = panelService.getActivePanel();
            if (panel instanceof markersPanel_1.MarkersPanel) {
                panel.markersViewModel.multiline = true;
            }
        },
        title: { value: nls_1.localize('show multiline', "Show message in multiple lines"), original: 'Problems: Show message in multiple lines' },
        category: nls_1.localize('problems', "Problems"),
        menu: {
            menuId: 0 /* CommandPalette */,
            when: panel_2.ActivePanelContext.isEqualTo(constants_1.default.MARKERS_PANEL_ID)
        }
    });
    actions_2.registerAction({
        id: constants_1.default.MARKERS_PANEL_SHOW_SINGLELINE_MESSAGE,
        handler(accessor) {
            const panelService = accessor.get(panelService_1.IPanelService);
            const panel = panelService.getActivePanel();
            if (panel instanceof markersPanel_1.MarkersPanel) {
                panel.markersViewModel.multiline = false;
            }
        },
        title: { value: nls_1.localize('show singleline', "Show message in single line"), original: 'Problems: Show message in single line' },
        category: nls_1.localize('problems', "Problems"),
        menu: {
            menuId: 0 /* CommandPalette */,
            when: panel_2.ActivePanelContext.isEqualTo(constants_1.default.MARKERS_PANEL_ID)
        }
    });
    function copyMarker(panelService, clipboardService) {
        const activePanel = panelService.getActivePanel();
        if (activePanel instanceof markersPanel_1.MarkersPanel) {
            const element = activePanel.getFocusElement();
            if (element instanceof markersModel_1.Marker) {
                clipboardService.writeText(`${element}`);
            }
        }
    }
    function copyMessage(panelService, clipboardService) {
        const activePanel = panelService.getActivePanel();
        if (activePanel instanceof markersPanel_1.MarkersPanel) {
            const element = activePanel.getFocusElement();
            if (element instanceof markersModel_1.Marker) {
                clipboardService.writeText(element.marker.message);
            }
        }
    }
    function copyRelatedInformationMessage(panelService, clipboardService) {
        const activePanel = panelService.getActivePanel();
        if (activePanel instanceof markersPanel_1.MarkersPanel) {
            const element = activePanel.getFocusElement();
            if (element instanceof markersModel_1.RelatedInformation) {
                clipboardService.writeText(element.raw.message);
            }
        }
    }
    function focusProblemsView(panelService) {
        const activePanel = panelService.getActivePanel();
        if (activePanel instanceof markersPanel_1.MarkersPanel) {
            activePanel.focus();
        }
    }
    function focusProblemsFilter(panelService) {
        const activePanel = panelService.getActivePanel();
        if (activePanel instanceof markersPanel_1.MarkersPanel) {
            activePanel.focusFilter();
        }
    }
    actions_2.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '4_panels',
        command: {
            id: markersPanelActions_1.ToggleMarkersPanelAction.ID,
            title: nls_1.localize({ key: 'miMarker', comment: ['&& denotes a mnemonic'] }, "&&Problems")
        },
        order: 4
    });
});
//# sourceMappingURL=markers.contribution.js.map