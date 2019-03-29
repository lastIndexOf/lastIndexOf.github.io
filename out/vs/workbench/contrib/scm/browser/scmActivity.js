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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/scm/common/scm", "vs/workbench/services/activity/common/activity", "vs/platform/contextkey/common/contextkey", "vs/platform/statusbar/common/statusbar", "vs/workbench/services/editor/common/editorService", "vs/base/common/strings", "vs/platform/log/common/log"], function (require, exports, nls_1, resources_1, lifecycle_1, event_1, scm_1, activity_1, contextkey_1, statusbar_1, editorService_1, strings_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let StatusUpdater = class StatusUpdater {
        constructor(scmService, activityService, logService) {
            this.scmService = scmService;
            this.activityService = activityService;
            this.logService = logService;
            this.badgeDisposable = lifecycle_1.Disposable.None;
            this.disposables = [];
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            this.render();
        }
        onDidAddRepository(repository) {
            const provider = repository.provider;
            const onDidChange = event_1.Event.any(provider.onDidChange, provider.onDidChangeResources);
            const changeDisposable = onDidChange(() => this.render());
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.disposables = this.disposables.filter(d => d !== removeDisposable);
                this.render();
            });
            const disposable = lifecycle_1.combinedDisposable([changeDisposable, removeDisposable]);
            this.disposables.push(disposable);
        }
        render() {
            this.badgeDisposable.dispose();
            const count = this.scmService.repositories.reduce((r, repository) => {
                if (typeof repository.provider.count === 'number') {
                    return r + repository.provider.count;
                }
                else {
                    return r + repository.provider.groups.elements.reduce((r, g) => r + g.elements.length, 0);
                }
            }, 0);
            // TODO@joao: remove
            this.logService.trace('SCM#StatusUpdater.render', count);
            if (count > 0) {
                const badge = new activity_1.NumberBadge(count, num => nls_1.localize('scmPendingChangesBadge', '{0} pending changes', num));
                this.badgeDisposable = this.activityService.showActivity(scm_1.VIEWLET_ID, badge, 'scm-viewlet-label');
            }
            else {
                this.badgeDisposable = lifecycle_1.Disposable.None;
            }
        }
        dispose() {
            this.badgeDisposable.dispose();
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    StatusUpdater = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, activity_1.IActivityService),
        __param(2, log_1.ILogService)
    ], StatusUpdater);
    exports.StatusUpdater = StatusUpdater;
    let StatusBarController = class StatusBarController {
        constructor(scmService, statusbarService, contextKeyService, editorService) {
            this.scmService = scmService;
            this.statusbarService = statusbarService;
            this.editorService = editorService;
            this.statusBarDisposable = lifecycle_1.Disposable.None;
            this.focusDisposable = lifecycle_1.Disposable.None;
            this.focusedRepository = undefined;
            this.disposables = [];
            this.focusedProviderContextKey = contextKeyService.createKey('scmProvider', undefined);
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            editorService.onDidActiveEditorChange(this.onDidActiveEditorChange, this, this.disposables);
        }
        onDidActiveEditorChange() {
            if (!this.editorService.activeEditor) {
                return;
            }
            const resource = this.editorService.activeEditor.getResource();
            if (!resource || resource.scheme !== 'file') {
                return;
            }
            let bestRepository = null;
            let bestMatchLength = Number.NEGATIVE_INFINITY;
            for (const repository of this.scmService.repositories) {
                const root = repository.provider.rootUri;
                if (!root) {
                    continue;
                }
                const rootFSPath = root.fsPath;
                const prefixLength = strings_1.commonPrefixLength(rootFSPath, resource.fsPath);
                if (prefixLength === rootFSPath.length && prefixLength > bestMatchLength) {
                    bestRepository = repository;
                    bestMatchLength = prefixLength;
                }
            }
            if (bestRepository) {
                this.onDidFocusRepository(bestRepository);
            }
        }
        onDidAddRepository(repository) {
            const changeDisposable = repository.onDidFocus(() => this.onDidFocusRepository(repository));
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.disposables = this.disposables.filter(d => d !== removeDisposable);
                if (this.scmService.repositories.length === 0) {
                    this.onDidFocusRepository(undefined);
                }
                else if (this.focusedRepository === repository) {
                    this.scmService.repositories[0].focus();
                }
            });
            const disposable = lifecycle_1.combinedDisposable([changeDisposable, removeDisposable]);
            this.disposables.push(disposable);
            if (!this.focusedRepository) {
                this.onDidFocusRepository(repository);
            }
        }
        onDidFocusRepository(repository) {
            if (this.focusedRepository === repository) {
                return;
            }
            this.focusedRepository = repository;
            this.focusedProviderContextKey.set(repository && repository.provider.id);
            this.focusDisposable.dispose();
            if (repository && repository.provider.onDidChangeStatusBarCommands) {
                this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(() => this.render(repository));
            }
            this.render(repository);
        }
        render(repository) {
            this.statusBarDisposable.dispose();
            if (!repository) {
                return;
            }
            const commands = repository.provider.statusBarCommands || [];
            const label = repository.provider.rootUri
                ? `${resources_1.basename(repository.provider.rootUri)} (${repository.provider.label})`
                : repository.provider.label;
            const disposables = commands.map(c => this.statusbarService.addEntry({
                text: c.title,
                tooltip: `${label} - ${c.tooltip}`,
                command: c.id,
                arguments: c.arguments
            }, 0 /* LEFT */, 10000));
            this.statusBarDisposable = lifecycle_1.combinedDisposable(disposables);
        }
        dispose() {
            this.focusDisposable.dispose();
            this.statusBarDisposable.dispose();
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    StatusBarController = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, editorService_1.IEditorService)
    ], StatusBarController);
    exports.StatusBarController = StatusBarController;
});
//# sourceMappingURL=scmActivity.js.map