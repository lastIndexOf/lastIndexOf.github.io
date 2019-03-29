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
define(["require", "exports", "vs/platform/statusbar/common/statusbar", "vs/base/common/lifecycle", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/nls"], function (require, exports, statusbar_1, lifecycle_1, notificationsCommands_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotificationsStatus = class NotificationsStatus extends lifecycle_1.Disposable {
        constructor(model, statusbarService) {
            super();
            this.model = model;
            this.statusbarService = statusbarService;
            this._counter = new Set();
            this.updateNotificationsStatusItem();
            this.registerListeners();
        }
        get count() {
            return this._counter.size;
        }
        update(isCenterVisible) {
            if (this.isNotificationsCenterVisible !== isCenterVisible) {
                this.isNotificationsCenterVisible = isCenterVisible;
                // Showing the notification center resets the counter to 0
                this._counter.clear();
                this.updateNotificationsStatusItem();
            }
        }
        registerListeners() {
            this._register(this.model.onDidNotificationChange(e => this.onDidNotificationChange(e)));
        }
        onDidNotificationChange(e) {
            if (this.isNotificationsCenterVisible) {
                return; // no change if notification center is visible
            }
            // Notification got Added
            if (e.kind === 0 /* ADD */) {
                this._counter.add(e.item);
            }
            // Notification got Removed
            else if (e.kind === 2 /* REMOVE */) {
                this._counter.delete(e.item);
            }
            this.updateNotificationsStatusItem();
        }
        updateNotificationsStatusItem() {
            // Dispose old first
            if (this.statusItem) {
                this.statusItem.dispose();
            }
            // Create new
            this.statusItem = this.statusbarService.addEntry({
                text: this.count === 0 ? '$(bell)' : `$(bell) ${this.count}`,
                command: this.isNotificationsCenterVisible ? notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER : notificationsCommands_1.SHOW_NOTIFICATIONS_CENTER,
                tooltip: this.getTooltip(),
                showBeak: this.isNotificationsCenterVisible
            }, 1 /* RIGHT */, -1000 /* towards the far end of the right hand side */);
        }
        getTooltip() {
            if (this.isNotificationsCenterVisible) {
                return nls_1.localize('hideNotifications', "Hide Notifications");
            }
            if (this.model.notifications.length === 0) {
                return nls_1.localize('zeroNotifications', "No Notifications");
            }
            if (this.count === 0) {
                return nls_1.localize('noNotifications', "No New Notifications");
            }
            if (this.count === 1) {
                return nls_1.localize('oneNotification', "1 New Notification");
            }
            return nls_1.localize('notifications', "{0} New Notifications", this.count);
        }
        dispose() {
            super.dispose();
            if (this.statusItem) {
                this.statusItem.dispose();
            }
        }
    };
    NotificationsStatus = __decorate([
        __param(1, statusbar_1.IStatusbarService)
    ], NotificationsStatus);
    exports.NotificationsStatus = NotificationsStatus;
});
//# sourceMappingURL=notificationsStatus.js.map