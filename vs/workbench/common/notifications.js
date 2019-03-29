/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/notification/common/notification", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/base/common/actions", "vs/base/common/errorsWithActions"], function (require, exports, notification_1, errorMessage_1, event_1, lifecycle_1, errors_1, actions_1, errorsWithActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NotificationChangeType;
    (function (NotificationChangeType) {
        NotificationChangeType[NotificationChangeType["ADD"] = 0] = "ADD";
        NotificationChangeType[NotificationChangeType["CHANGE"] = 1] = "CHANGE";
        NotificationChangeType[NotificationChangeType["REMOVE"] = 2] = "REMOVE";
    })(NotificationChangeType = exports.NotificationChangeType || (exports.NotificationChangeType = {}));
    class NotificationHandle {
        constructor(item, closeItem) {
            this.item = item;
            this.closeItem = closeItem;
            this._onDidClose = new event_1.Emitter();
            this.registerListeners();
        }
        get onDidClose() { return this._onDidClose.event; }
        registerListeners() {
            event_1.Event.once(this.item.onDidClose)(() => {
                this._onDidClose.fire();
                this._onDidClose.dispose();
            });
        }
        get progress() {
            return this.item.progress;
        }
        updateSeverity(severity) {
            this.item.updateSeverity(severity);
        }
        updateMessage(message) {
            this.item.updateMessage(message);
        }
        updateActions(actions) {
            this.item.updateActions(actions);
        }
        close() {
            this.closeItem(this.item);
            this._onDidClose.dispose();
        }
    }
    exports.NotificationHandle = NotificationHandle;
    class NotificationsModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidNotificationChange = this._register(new event_1.Emitter());
            this._notifications = [];
        }
        get onDidNotificationChange() { return this._onDidNotificationChange.event; }
        get notifications() {
            return this._notifications;
        }
        notify(notification) {
            const item = this.createViewItem(notification);
            if (!item) {
                return NotificationsModel.NO_OP_NOTIFICATION; // return early if this is a no-op
            }
            // Deduplicate
            const duplicate = this.findNotification(item);
            if (duplicate) {
                duplicate.close();
            }
            // Add to list as first entry
            this._notifications.splice(0, 0, item);
            // Events
            this._onDidNotificationChange.fire({ item, index: 0, kind: 0 /* ADD */ });
            // Wrap into handle
            return new NotificationHandle(item, item => this.closeItem(item));
        }
        closeItem(item) {
            const liveItem = this.findNotification(item);
            if (liveItem && liveItem !== item) {
                liveItem.close(); // item could have been replaced with another one, make sure to close the live item
            }
            else {
                item.close(); // otherwise just close the item that was passed in
            }
        }
        findNotification(item) {
            for (const notification of this._notifications) {
                if (notification.equals(item)) {
                    return notification;
                }
            }
            return undefined;
        }
        createViewItem(notification) {
            const item = NotificationViewItem.create(notification);
            if (!item) {
                return null;
            }
            // Item Events
            const onItemChangeEvent = () => {
                const index = this._notifications.indexOf(item);
                if (index >= 0) {
                    this._onDidNotificationChange.fire({ item, index, kind: 1 /* CHANGE */ });
                }
            };
            const itemExpansionChangeListener = item.onDidExpansionChange(() => onItemChangeEvent());
            const itemLabelChangeListener = item.onDidLabelChange(e => {
                // a label change in the area of actions or the message is a change that potentially has an impact
                // on the size of the notification and as such we emit a change event so that viewers can redraw
                if (e.kind === 2 /* ACTIONS */ || e.kind === 1 /* MESSAGE */) {
                    onItemChangeEvent();
                }
            });
            event_1.Event.once(item.onDidClose)(() => {
                itemExpansionChangeListener.dispose();
                itemLabelChangeListener.dispose();
                const index = this._notifications.indexOf(item);
                if (index >= 0) {
                    this._notifications.splice(index, 1);
                    this._onDidNotificationChange.fire({ item, index, kind: 2 /* REMOVE */ });
                }
            });
            return item;
        }
    }
    NotificationsModel.NO_OP_NOTIFICATION = new notification_1.NoOpNotification();
    exports.NotificationsModel = NotificationsModel;
    function isNotificationViewItem(obj) {
        return obj instanceof NotificationViewItem;
    }
    exports.isNotificationViewItem = isNotificationViewItem;
    var NotificationViewItemLabelKind;
    (function (NotificationViewItemLabelKind) {
        NotificationViewItemLabelKind[NotificationViewItemLabelKind["SEVERITY"] = 0] = "SEVERITY";
        NotificationViewItemLabelKind[NotificationViewItemLabelKind["MESSAGE"] = 1] = "MESSAGE";
        NotificationViewItemLabelKind[NotificationViewItemLabelKind["ACTIONS"] = 2] = "ACTIONS";
        NotificationViewItemLabelKind[NotificationViewItemLabelKind["PROGRESS"] = 3] = "PROGRESS";
    })(NotificationViewItemLabelKind = exports.NotificationViewItemLabelKind || (exports.NotificationViewItemLabelKind = {}));
    class NotificationViewItemProgress extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this._state = Object.create(null);
        }
        get onDidChange() { return this._onDidChange.event; }
        get state() {
            return this._state;
        }
        infinite() {
            if (this._state.infinite) {
                return;
            }
            this._state.infinite = true;
            this._state.total = undefined;
            this._state.worked = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
        done() {
            if (this._state.done) {
                return;
            }
            this._state.done = true;
            this._state.infinite = undefined;
            this._state.total = undefined;
            this._state.worked = undefined;
            this._onDidChange.fire();
        }
        total(value) {
            if (this._state.total === value) {
                return;
            }
            this._state.total = value;
            this._state.infinite = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
        worked(value) {
            if (typeof this._state.worked === 'number') {
                this._state.worked += value;
            }
            else {
                this._state.worked = value;
            }
            this._state.infinite = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
    }
    exports.NotificationViewItemProgress = NotificationViewItemProgress;
    class NotificationViewItem extends lifecycle_1.Disposable {
        constructor(_severity, _sticky, _silent, _message, _source, actions) {
            super();
            this._severity = _severity;
            this._sticky = _sticky;
            this._silent = _silent;
            this._message = _message;
            this._source = _source;
            this._onDidExpansionChange = this._register(new event_1.Emitter());
            this._onDidClose = this._register(new event_1.Emitter());
            this._onDidLabelChange = this._register(new event_1.Emitter());
            this.setActions(actions);
        }
        get onDidExpansionChange() { return this._onDidExpansionChange.event; }
        get onDidClose() { return this._onDidClose.event; }
        get onDidLabelChange() { return this._onDidLabelChange.event; }
        static create(notification) {
            if (!notification || !notification.message || errors_1.isPromiseCanceledError(notification.message)) {
                return null; // we need a message to show
            }
            let severity;
            if (typeof notification.severity === 'number') {
                severity = notification.severity;
            }
            else {
                severity = notification_1.Severity.Info;
            }
            const message = NotificationViewItem.parseNotificationMessage(notification.message);
            if (!message) {
                return null; // we need a message to show
            }
            let actions;
            if (notification.actions) {
                actions = notification.actions;
            }
            else if (errorsWithActions_1.isErrorWithActions(notification.message)) {
                actions = { primary: notification.message.actions };
            }
            return new NotificationViewItem(severity, notification.sticky, notification.silent, message, notification.source, actions);
        }
        static parseNotificationMessage(input) {
            let message;
            if (input instanceof Error) {
                message = errorMessage_1.toErrorMessage(input, false);
            }
            else if (typeof input === 'string') {
                message = input;
            }
            if (!message) {
                return undefined; // we need a message to show
            }
            const raw = message;
            // Make sure message is in the limits
            if (message.length > NotificationViewItem.MAX_MESSAGE_LENGTH) {
                message = `${message.substr(0, NotificationViewItem.MAX_MESSAGE_LENGTH)}...`;
            }
            // Remove newlines from messages as we do not support that and it makes link parsing hard
            message = message.replace(/(\r\n|\n|\r)/gm, ' ').trim();
            // Parse Links
            const links = [];
            message.replace(NotificationViewItem.LINK_REGEX, (matchString, name, href, offset) => {
                links.push({ name, href, offset, length: matchString.length });
                return matchString;
            });
            return { raw, value: message, links, original: input };
        }
        setActions(actions = { primary: [], secondary: [] }) {
            if (!Array.isArray(actions.primary)) {
                actions.primary = [];
            }
            if (!Array.isArray(actions.secondary)) {
                actions.secondary = [];
            }
            this._actions = actions;
            this._expanded = actions.primary.length > 0;
        }
        get canCollapse() {
            return !this.hasPrompt();
        }
        get expanded() {
            return this._expanded;
        }
        get severity() {
            return this._severity;
        }
        get sticky() {
            if (this._sticky) {
                return true; // explicitly sticky
            }
            const hasPrompt = this.hasPrompt();
            if ((hasPrompt && this._severity === notification_1.Severity.Error) || // notification errors with actions are sticky
                (!hasPrompt && this._expanded) || // notifications that got expanded are sticky
                (this._progress && !this._progress.state.done) // notifications with running progress are sticky
            ) {
                return true;
            }
            return false; // not sticky
        }
        get silent() {
            return !!this._silent;
        }
        hasPrompt() {
            if (!this._actions.primary) {
                return false;
            }
            return this._actions.primary.length > 0;
        }
        hasProgress() {
            return !!this._progress;
        }
        get progress() {
            if (!this._progress) {
                this._progress = this._register(new NotificationViewItemProgress());
                this._register(this._progress.onDidChange(() => this._onDidLabelChange.fire({ kind: 3 /* PROGRESS */ })));
            }
            return this._progress;
        }
        get message() {
            return this._message;
        }
        get source() {
            return this._source;
        }
        get actions() {
            return this._actions;
        }
        updateSeverity(severity) {
            this._severity = severity;
            this._onDidLabelChange.fire({ kind: 0 /* SEVERITY */ });
        }
        updateMessage(input) {
            const message = NotificationViewItem.parseNotificationMessage(input);
            if (!message) {
                return;
            }
            this._message = message;
            this._onDidLabelChange.fire({ kind: 1 /* MESSAGE */ });
        }
        updateActions(actions) {
            this.setActions(actions);
            this._onDidLabelChange.fire({ kind: 2 /* ACTIONS */ });
        }
        expand() {
            if (this._expanded || !this.canCollapse) {
                return;
            }
            this._expanded = true;
            this._onDidExpansionChange.fire();
        }
        collapse(skipEvents) {
            if (!this._expanded || !this.canCollapse) {
                return;
            }
            this._expanded = false;
            if (!skipEvents) {
                this._onDidExpansionChange.fire();
            }
        }
        toggle() {
            if (this._expanded) {
                this.collapse();
            }
            else {
                this.expand();
            }
        }
        close() {
            this._onDidClose.fire();
            this.dispose();
        }
        equals(other) {
            if (this.hasProgress() || other.hasProgress()) {
                return false;
            }
            if (this._source !== other.source) {
                return false;
            }
            if (this._message.value !== other.message.value) {
                return false;
            }
            const primaryActions = this._actions.primary || [];
            const otherPrimaryActions = other.actions.primary || [];
            if (primaryActions.length !== otherPrimaryActions.length) {
                return false;
            }
            for (let i = 0; i < primaryActions.length; i++) {
                if ((primaryActions[i].id + primaryActions[i].label) !== (otherPrimaryActions[i].id + otherPrimaryActions[i].label)) {
                    return false;
                }
            }
            return true;
        }
    }
    NotificationViewItem.MAX_MESSAGE_LENGTH = 1000;
    // Example link: "Some message with [link text](http://link.href)."
    // RegEx: [, anything not ], ], (, http:|https:, //, no whitespace)
    NotificationViewItem.LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\)\s]+)\)/gi;
    exports.NotificationViewItem = NotificationViewItem;
    class ChoiceAction extends actions_1.Action {
        constructor(id, choice) {
            super(id, choice.label, undefined, true, () => {
                // Pass to runner
                choice.run();
                // Emit Event
                this._onDidRun.fire();
                return Promise.resolve();
            });
            this._onDidRun = new event_1.Emitter();
            this._keepOpen = !!choice.keepOpen;
        }
        get onDidRun() { return this._onDidRun.event; }
        get keepOpen() {
            return this._keepOpen;
        }
        dispose() {
            super.dispose();
            this._onDidRun.dispose();
        }
    }
    exports.ChoiceAction = ChoiceAction;
});
//# sourceMappingURL=notifications.js.map