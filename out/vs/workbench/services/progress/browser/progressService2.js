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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/progress/common/progress", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/statusbar/common/statusbar", "vs/base/common/async", "vs/workbench/services/activity/common/activity", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/css!./media/progressService2"], function (require, exports, nls_1, lifecycle_1, progress_1, viewlet_1, statusbar_1, async_1, activity_1, notification_1, actions_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ProgressService2 = class ProgressService2 {
        constructor(_activityBar, _viewletService, _notificationService, _statusbarService) {
            this._activityBar = _activityBar;
            this._viewletService = _viewletService;
            this._notificationService = _notificationService;
            this._statusbarService = _statusbarService;
            this._stack = [];
        }
        withProgress(options, task, onDidCancel) {
            const { location } = options;
            if (typeof location === 'string') {
                const viewlet = this._viewletService.getViewlet(location);
                if (viewlet) {
                    return this._withViewletProgress(location, task);
                }
                return Promise.reject(new Error(`Bad progress location: ${location}`));
            }
            switch (location) {
                case 15 /* Notification */:
                    return this._withNotificationProgress(options, task, onDidCancel);
                case 10 /* Window */:
                    return this._withWindowProgress(options, task);
                case 1 /* Explorer */:
                    return this._withViewletProgress('workbench.view.explorer', task);
                case 3 /* Scm */:
                    return this._withViewletProgress('workbench.view.scm', task);
                case 5 /* Extensions */:
                    return this._withViewletProgress('workbench.view.extensions', task);
                default:
                    return Promise.reject(new Error(`Bad progress location: ${location}`));
            }
        }
        _withWindowProgress(options, callback) {
            const task = [options, new progress_1.Progress(() => this._updateWindowProgress())];
            const promise = callback(task[1]);
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                this._stack.unshift(task);
                this._updateWindowProgress();
                // show progress for at least 150ms
                Promise.all([
                    async_1.timeout(150),
                    promise
                ]).finally(() => {
                    const idx = this._stack.indexOf(task);
                    this._stack.splice(idx, 1);
                    this._updateWindowProgress();
                });
            }, 150);
            // cancel delay if promise finishes below 150ms
            return promise.finally(() => clearTimeout(delayHandle));
        }
        _updateWindowProgress(idx = 0) {
            lifecycle_1.dispose(this._globalStatusEntry);
            if (idx < this._stack.length) {
                const [options, progress] = this._stack[idx];
                let progressTitle = options.title;
                let progressMessage = progress.value && progress.value.message;
                let text;
                let title;
                if (progressTitle && progressMessage) {
                    // <title>: <message>
                    text = nls_1.localize('progress.text2', "{0}: {1}", progressTitle, progressMessage);
                    title = options.source ? nls_1.localize('progress.title3', "[{0}] {1}: {2}", options.source, progressTitle, progressMessage) : text;
                }
                else if (progressTitle) {
                    // <title>
                    text = progressTitle;
                    title = options.source ? nls_1.localize('progress.title2', "[{0}]: {1}", options.source, progressTitle) : text;
                }
                else if (progressMessage) {
                    // <message>
                    text = progressMessage;
                    title = options.source ? nls_1.localize('progress.title2', "[{0}]: {1}", options.source, progressMessage) : text;
                }
                else {
                    // no title, no message -> no progress. try with next on stack
                    this._updateWindowProgress(idx + 1);
                    return;
                }
                this._globalStatusEntry = this._statusbarService.addEntry({
                    text: `$(sync~spin) ${text}`,
                    tooltip: title
                }, 0 /* LEFT */);
            }
        }
        _withNotificationProgress(options, callback, onDidCancel) {
            const toDispose = [];
            const createNotification = (message, increment) => {
                if (!message) {
                    return undefined; // we need a message at least
                }
                const actions = { primary: [] };
                if (options.cancellable) {
                    const cancelAction = new class extends actions_1.Action {
                        constructor() {
                            super('progress.cancel', nls_1.localize('cancel', "Cancel"), undefined, true);
                        }
                        run() {
                            if (typeof onDidCancel === 'function') {
                                onDidCancel();
                            }
                            return Promise.resolve(undefined);
                        }
                    };
                    toDispose.push(cancelAction);
                    actions.primary.push(cancelAction);
                }
                const handle = this._notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message,
                    source: options.source,
                    actions
                });
                updateProgress(handle, increment);
                event_1.Event.once(handle.onDidClose)(() => {
                    lifecycle_1.dispose(toDispose);
                });
                return handle;
            };
            const updateProgress = (notification, increment) => {
                if (typeof increment === 'number' && increment >= 0) {
                    notification.progress.total(100); // always percentage based
                    notification.progress.worked(increment);
                }
                else {
                    notification.progress.infinite();
                }
            };
            let handle;
            const updateNotification = (message, increment) => {
                if (!handle) {
                    handle = createNotification(message, increment);
                }
                else {
                    if (typeof message === 'string') {
                        let newMessage;
                        if (typeof options.title === 'string') {
                            newMessage = `${options.title}: ${message}`; // always prefix with overall title if we have it (https://github.com/Microsoft/vscode/issues/50932)
                        }
                        else {
                            newMessage = message;
                        }
                        handle.updateMessage(newMessage);
                    }
                    if (typeof increment === 'number') {
                        updateProgress(handle, increment);
                    }
                }
            };
            // Show initially
            updateNotification(options.title);
            // Update based on progress
            const p = callback({
                report: progress => {
                    updateNotification(progress.message, progress.increment);
                }
            });
            // Show progress for at least 800ms and then hide once done or canceled
            Promise.all([async_1.timeout(800), p]).finally(() => {
                if (handle) {
                    handle.close();
                }
            });
            return p;
        }
        _withViewletProgress(viewletId, task) {
            const promise = task(progress_1.emptyProgress);
            // show in viewlet
            const viewletProgress = this._viewletService.getProgressIndicator(viewletId);
            if (viewletProgress) {
                viewletProgress.showWhile(promise);
            }
            // show activity bar
            let activityProgress;
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                const handle = this._activityBar.showActivity(viewletId, new activity_1.ProgressBadge(() => ''), 'progress-badge', 100);
                const startTimeVisible = Date.now();
                const minTimeVisible = 300;
                activityProgress = {
                    dispose() {
                        const d = Date.now() - startTimeVisible;
                        if (d < minTimeVisible) {
                            // should at least show for Nms
                            setTimeout(() => handle.dispose(), minTimeVisible - d);
                        }
                        else {
                            // shown long enough
                            handle.dispose();
                        }
                    }
                };
            }, 300);
            const onDone = () => {
                clearTimeout(delayHandle);
                lifecycle_1.dispose(activityProgress);
            };
            promise.then(onDone, onDone);
            return promise;
        }
    };
    ProgressService2 = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, viewlet_1.IViewletService),
        __param(2, notification_1.INotificationService),
        __param(3, statusbar_1.IStatusbarService)
    ], ProgressService2);
    exports.ProgressService2 = ProgressService2;
    extensions_1.registerSingleton(progress_1.IProgressService2, ProgressService2, true);
});
//# sourceMappingURL=progressService2.js.map