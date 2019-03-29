/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/product/node/product", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/contrib/issue/electron-browser/issueActions", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/issue/electron-browser/issue", "vs/workbench/contrib/issue/electron-browser/issueService"], function (require, exports, platform_1, nls, product_1, actions_1, actions_2, issueActions_1, extensions_1, issue_1, issueService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const helpCategory = nls.localize('help', "Help");
    const workbenchActionsRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    if (!!product_1.default.reportIssueUrl) {
        workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(issueActions_1.OpenIssueReporterAction, issueActions_1.OpenIssueReporterAction.ID, issueActions_1.OpenIssueReporterAction.LABEL), 'Help: Open Issue Reporter', helpCategory);
        workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(issueActions_1.ReportPerformanceIssueUsingReporterAction, issueActions_1.ReportPerformanceIssueUsingReporterAction.ID, issueActions_1.ReportPerformanceIssueUsingReporterAction.LABEL), 'Help: Report Performance Issue', helpCategory);
    }
    const developerCategory = nls.localize('developer', "Developer");
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(issueActions_1.OpenProcessExplorer, issueActions_1.OpenProcessExplorer.ID, issueActions_1.OpenProcessExplorer.LABEL), 'Developer: Open Process Explorer', developerCategory);
    extensions_1.registerSingleton(issue_1.IWorkbenchIssueService, issueService_1.WorkbenchIssueService, true);
});
//# sourceMappingURL=issue.contribution.js.map