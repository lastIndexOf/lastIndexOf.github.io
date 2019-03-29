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
define(["require", "exports", "vs/workbench/services/backup/common/backup", "vs/workbench/services/editor/common/editorService", "vs/base/common/network", "vs/platform/lifecycle/common/lifecycle"], function (require, exports, backup_1, editorService_1, network_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BackupRestorer = class BackupRestorer {
        constructor(editorService, backupFileService, lifecycleService) {
            this.editorService = editorService;
            this.backupFileService = backupFileService;
            this.lifecycleService = lifecycleService;
            this.restoreBackups();
        }
        restoreBackups() {
            this.lifecycleService.when(3 /* Restored */).then(() => this.doRestoreBackups());
        }
        doRestoreBackups() {
            // Find all files and untitled with backups
            return this.backupFileService.getWorkspaceFileBackups().then(backups => {
                // Resolve backups that are opened
                return this.doResolveOpenedBackups(backups).then((unresolved) => {
                    // Some failed to restore or were not opened at all so we open and resolve them manually
                    if (unresolved.length > 0) {
                        return this.doOpenEditors(unresolved).then(() => this.doResolveOpenedBackups(unresolved));
                    }
                    return undefined;
                });
            });
        }
        doResolveOpenedBackups(backups) {
            const restorePromises = [];
            const unresolved = [];
            backups.forEach(backup => {
                const openedEditor = this.editorService.getOpened({ resource: backup });
                if (openedEditor) {
                    restorePromises.push(openedEditor.resolve().then(undefined, () => unresolved.push(backup)));
                }
                else {
                    unresolved.push(backup);
                }
            });
            return Promise.all(restorePromises).then(() => unresolved, () => unresolved);
        }
        doOpenEditors(resources) {
            const hasOpenedEditors = this.editorService.visibleEditors.length > 0;
            const inputs = resources.map((resource, index) => this.resolveInput(resource, index, hasOpenedEditors));
            // Open all remaining backups as editors and resolve them to load their backups
            return this.editorService.openEditors(inputs).then(() => undefined);
        }
        resolveInput(resource, index, hasOpenedEditors) {
            const options = { pinned: true, preserveFocus: true, inactive: index > 0 || hasOpenedEditors };
            if (resource.scheme === network_1.Schemas.untitled && !BackupRestorer.UNTITLED_REGEX.test(resource.fsPath)) {
                return { filePath: resource.fsPath, options };
            }
            return { resource, options };
        }
    };
    BackupRestorer.UNTITLED_REGEX = /Untitled-\d+/;
    BackupRestorer = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, backup_1.IBackupFileService),
        __param(2, lifecycle_1.ILifecycleService)
    ], BackupRestorer);
    exports.BackupRestorer = BackupRestorer;
});
//# sourceMappingURL=backupRestorer.js.map