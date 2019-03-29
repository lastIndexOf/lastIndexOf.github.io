/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/files/node/watcher/common", "vs/workbench/services/files/node/watcher/win32/csharpWatcherService", "vs/base/common/path", "vs/base/common/strings", "vs/base/common/network"], function (require, exports, common_1, csharpWatcherService_1, path_1, strings_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileWatcher {
        constructor(contextService, ignored, onFileChanges, errorLogger, verboseLogging) {
            this.contextService = contextService;
            this.ignored = ignored;
            this.onFileChanges = onFileChanges;
            this.errorLogger = errorLogger;
            this.verboseLogging = verboseLogging;
        }
        startWatching() {
            if (this.contextService.getWorkspace().folders[0].uri.scheme !== network_1.Schemas.file) {
                return () => { };
            }
            let basePath = path_1.normalize(this.contextService.getWorkspace().folders[0].uri.fsPath);
            if (basePath && basePath.indexOf('\\\\') === 0 && strings_1.endsWith(basePath, path_1.posix.sep)) {
                // for some weird reason, node adds a trailing slash to UNC paths
                // we never ever want trailing slashes as our base path unless
                // someone opens root ("/").
                // See also https://github.com/nodejs/io.js/issues/1765
                basePath = strings_1.rtrim(basePath, path_1.posix.sep);
            }
            const watcher = new csharpWatcherService_1.OutOfProcessWin32FolderWatcher(basePath, this.ignored, events => this.onRawFileEvents(events), error => this.onError(error), this.verboseLogging);
            return () => {
                this.isDisposed = true;
                watcher.dispose();
            };
        }
        onRawFileEvents(events) {
            if (this.isDisposed) {
                return;
            }
            // Emit through event emitter
            if (events.length > 0) {
                this.onFileChanges(common_1.toFileChangesEvent(events));
            }
        }
        onError(error) {
            if (!this.isDisposed) {
                this.errorLogger(error);
            }
        }
    }
    exports.FileWatcher = FileWatcher;
});
//# sourceMappingURL=watcherService.js.map