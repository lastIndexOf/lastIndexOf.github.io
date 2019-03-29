/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/notification/common/notification", "vs/workbench/common/notifications", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/instantiation/common/extensions"], function (require, exports, notification_1, notifications_1, lifecycle_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NotificationService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._model = this._register(new notifications_1.NotificationsModel());
        }
        get model() {
            return this._model;
        }
        info(message) {
            if (Array.isArray(message)) {
                message.forEach(m => this.info(m));
                return;
            }
            this.model.notify({ severity: notification_1.Severity.Info, message });
        }
        warn(message) {
            if (Array.isArray(message)) {
                message.forEach(m => this.warn(m));
                return;
            }
            this.model.notify({ severity: notification_1.Severity.Warning, message });
        }
        error(message) {
            if (Array.isArray(message)) {
                message.forEach(m => this.error(m));
                return;
            }
            this.model.notify({ severity: notification_1.Severity.Error, message });
        }
        notify(notification) {
            return this.model.notify(notification);
        }
        prompt(severity, message, choices, options) {
            const toDispose = [];
            let choiceClicked = false;
            let handle;
            // Convert choices into primary/secondary actions
            const actions = { primary: [], secondary: [] };
            choices.forEach((choice, index) => {
                const action = new notifications_1.ChoiceAction(`workbench.dialog.choice.${index}`, choice);
                if (!choice.isSecondary) {
                    if (!actions.primary) {
                        actions.primary = [];
                    }
                    actions.primary.push(action);
                }
                else {
                    if (!actions.secondary) {
                        actions.secondary = [];
                    }
                    actions.secondary.push(action);
                }
                // React to action being clicked
                toDispose.push(action.onDidRun(() => {
                    choiceClicked = true;
                    // Close notification unless we are told to keep open
                    if (!choice.keepOpen) {
                        handle.close();
                    }
                }));
                toDispose.push(action);
            });
            // Show notification with actions
            handle = this.notify({ severity, message, actions, sticky: options && options.sticky, silent: options && options.silent });
            event_1.Event.once(handle.onDidClose)(() => {
                // Cleanup when notification gets disposed
                lifecycle_1.dispose(toDispose);
                // Indicate cancellation to the outside if no action was executed
                if (options && typeof options.onCancel === 'function' && !choiceClicked) {
                    options.onCancel();
                }
            });
            return handle;
        }
    }
    exports.NotificationService = NotificationService;
    extensions_1.registerSingleton(notification_1.INotificationService, NotificationService, true);
});
//# sourceMappingURL=notificationService.js.map