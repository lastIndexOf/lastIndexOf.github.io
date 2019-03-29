/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/node/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/workbench/services/files/node/watcher/common", "vs/workbench/services/files/node/watcher/unix/watcherIpc", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/event", "vs/base/common/amd"], function (require, exports, ipc_1, ipc_cp_1, common_1, watcherIpc_1, lifecycle_1, network_1, event_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileWatcher {
        constructor(contextService, configurationService, onFileChanges, errorLogger, verboseLogging) {
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.onFileChanges = onFileChanges;
            this.errorLogger = errorLogger;
            this.verboseLogging = verboseLogging;
            this.isDisposed = false;
            this.restartCounter = 0;
            this.toDispose = [];
        }
        startWatching() {
            const args = ['--type=watcherService'];
            const client = new ipc_cp_1.Client(amd_1.getPathFromAmdModule(require, 'bootstrap-fork'), {
                serverName: 'File Watcher (chokidar)',
                args,
                env: {
                    AMD_ENTRYPOINT: 'vs/workbench/services/files/node/watcher/unix/watcherApp',
                    PIPE_LOGGING: 'true',
                    VERBOSE_LOGGING: this.verboseLogging
                }
            });
            this.toDispose.push(client);
            client.onDidProcessExit(() => {
                // our watcher app should never be completed because it keeps on watching. being in here indicates
                // that the watcher process died and we want to restart it here. we only do it a max number of times
                if (!this.isDisposed) {
                    if (this.restartCounter <= FileWatcher.MAX_RESTARTS) {
                        this.errorLogger('[FileWatcher] terminated unexpectedly and is restarted again...');
                        this.restartCounter++;
                        this.startWatching();
                    }
                    else {
                        this.errorLogger('[FileWatcher] failed to start after retrying for some time, giving up. Please report this as a bug report!');
                    }
                }
            }, null, this.toDispose);
            const channel = ipc_1.getNextTickChannel(client.getChannel('watcher'));
            this.service = new watcherIpc_1.WatcherChannelClient(channel);
            const options = { verboseLogging: this.verboseLogging };
            const onWatchEvent = event_1.Event.filter(this.service.watch(options), () => !this.isDisposed);
            const onError = event_1.Event.filter(onWatchEvent, (e) => typeof e.message === 'string');
            onError(err => this.errorLogger(err.message), null, this.toDispose);
            const onFileChanges = event_1.Event.filter(onWatchEvent, (e) => Array.isArray(e) && e.length > 0);
            onFileChanges(e => this.onFileChanges(common_1.toFileChangesEvent(e)), null, this.toDispose);
            // Start watching
            this.updateFolders();
            this.toDispose.push(this.contextService.onDidChangeWorkspaceFolders(() => this.updateFolders()));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('files.watcherExclude')) {
                    this.updateFolders();
                }
            }));
            return () => this.dispose();
        }
        updateFolders() {
            if (this.isDisposed) {
                return;
            }
            this.service.setRoots(this.contextService.getWorkspace().folders.filter(folder => {
                // Only workspace folders on disk
                return folder.uri.scheme === network_1.Schemas.file;
            }).map(folder => {
                // Fetch the root's watcherExclude setting and return it
                const configuration = this.configurationService.getValue({
                    resource: folder.uri
                });
                let ignored = [];
                if (configuration.files && configuration.files.watcherExclude) {
                    ignored = Object.keys(configuration.files.watcherExclude).filter(k => !!configuration.files.watcherExclude[k]);
                }
                return {
                    basePath: folder.uri.fsPath,
                    ignored,
                    recursive: false
                };
            }));
        }
        dispose() {
            this.isDisposed = true;
            this.toDispose = lifecycle_1.dispose(this.toDispose);
        }
    }
    FileWatcher.MAX_RESTARTS = 5;
    exports.FileWatcher = FileWatcher;
});
//# sourceMappingURL=watcherService.js.map