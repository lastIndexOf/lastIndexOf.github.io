/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types"], function (require, exports, nls, arrays, async_1, event_1, lifecycle_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AbstractKeybindingService extends lifecycle_1.Disposable {
        constructor(contextKeyService, commandService, telemetryService, notificationService, statusService) {
            super();
            this._contextKeyService = contextKeyService;
            this._commandService = commandService;
            this._telemetryService = telemetryService;
            this._statusService = statusService;
            this._notificationService = notificationService;
            this._currentChord = null;
            this._currentChordChecker = new async_1.IntervalTimer();
            this._currentChordStatusMessage = null;
            this._onDidUpdateKeybindings = this._register(new event_1.Emitter());
        }
        dispose() {
            super.dispose();
        }
        get onDidUpdateKeybindings() {
            return this._onDidUpdateKeybindings ? this._onDidUpdateKeybindings.event : event_1.Event.None; // Sinon stubbing walks properties on prototype
        }
        getDefaultKeybindingsContent() {
            return '';
        }
        getDefaultKeybindings() {
            return this._getResolver().getDefaultKeybindings();
        }
        getKeybindings() {
            return this._getResolver().getKeybindings();
        }
        customKeybindingsCount() {
            return 0;
        }
        lookupKeybindings(commandId) {
            return arrays.coalesce(this._getResolver().lookupKeybindings(commandId).map(item => item.resolvedKeybinding));
        }
        lookupKeybinding(commandId) {
            let result = this._getResolver().lookupPrimaryKeybinding(commandId);
            if (!result) {
                return undefined;
            }
            return types_1.withNullAsUndefined(result.resolvedKeybinding);
        }
        dispatchEvent(e, target) {
            return this._dispatch(e, target);
        }
        softDispatch(e, target) {
            const keybinding = this.resolveKeyboardEvent(e);
            if (keybinding.isChord()) {
                console.warn('Unexpected keyboard event mapped to a chord');
                return null;
            }
            const [firstPart,] = keybinding.getDispatchParts();
            if (firstPart === null) {
                // cannot be dispatched, probably only modifier keys
                return null;
            }
            const contextValue = this._contextKeyService.getContext(target);
            const currentChord = this._currentChord ? this._currentChord.keypress : null;
            return this._getResolver().resolve(contextValue, currentChord, firstPart);
        }
        _enterChordMode(firstPart, keypressLabel) {
            this._currentChord = {
                keypress: firstPart,
                label: keypressLabel
            };
            if (this._statusService) {
                this._currentChordStatusMessage = this._statusService.setStatusMessage(nls.localize('first.chord', "({0}) was pressed. Waiting for second key of chord...", keypressLabel));
            }
            const chordEnterTime = Date.now();
            this._currentChordChecker.cancelAndSet(() => {
                if (!this._documentHasFocus()) {
                    // Focus has been lost => leave chord mode
                    this._leaveChordMode();
                    return;
                }
                if (Date.now() - chordEnterTime > 5000) {
                    // 5 seconds elapsed => leave chord mode
                    this._leaveChordMode();
                }
            }, 500);
        }
        _leaveChordMode() {
            if (this._currentChordStatusMessage) {
                this._currentChordStatusMessage.dispose();
                this._currentChordStatusMessage = null;
            }
            this._currentChordChecker.cancel();
            this._currentChord = null;
        }
        dispatchByUserSettingsLabel(userSettingsLabel, target) {
            const keybindings = this.resolveUserBinding(userSettingsLabel);
            if (keybindings.length >= 1) {
                this._doDispatch(keybindings[0], target);
            }
        }
        _dispatch(e, target) {
            return this._doDispatch(this.resolveKeyboardEvent(e), target);
        }
        _doDispatch(keybinding, target) {
            let shouldPreventDefault = false;
            if (keybinding.isChord()) {
                console.warn('Unexpected keyboard event mapped to a chord');
                return false;
            }
            const [firstPart,] = keybinding.getDispatchParts();
            if (firstPart === null) {
                // cannot be dispatched, probably only modifier keys
                return shouldPreventDefault;
            }
            const contextValue = this._contextKeyService.getContext(target);
            const currentChord = this._currentChord ? this._currentChord.keypress : null;
            const keypressLabel = keybinding.getLabel();
            const resolveResult = this._getResolver().resolve(contextValue, currentChord, firstPart);
            if (resolveResult && resolveResult.enterChord) {
                shouldPreventDefault = true;
                this._enterChordMode(firstPart, keypressLabel);
                return shouldPreventDefault;
            }
            if (this._statusService && this._currentChord) {
                if (!resolveResult || !resolveResult.commandId) {
                    this._statusService.setStatusMessage(nls.localize('missing.chord', "The key combination ({0}, {1}) is not a command.", this._currentChord.label, keypressLabel), 10 * 1000 /* 10s */);
                    shouldPreventDefault = true;
                }
            }
            this._leaveChordMode();
            if (resolveResult && resolveResult.commandId) {
                if (!resolveResult.bubble) {
                    shouldPreventDefault = true;
                }
                if (typeof resolveResult.commandArgs === 'undefined') {
                    this._commandService.executeCommand(resolveResult.commandId).then(undefined, err => this._notificationService.warn(err));
                }
                else {
                    this._commandService.executeCommand(resolveResult.commandId, resolveResult.commandArgs).then(undefined, err => this._notificationService.warn(err));
                }
                /* __GDPR__
                    "workbenchActionExecuted" : {
                        "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "from": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this._telemetryService.publicLog('workbenchActionExecuted', { id: resolveResult.commandId, from: 'keybinding' });
            }
            return shouldPreventDefault;
        }
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey) {
                // ignore ctrl/cmd-combination but not shift/alt-combinatios
                return false;
            }
            // weak check for certain ranges. this is properly implemented in a subclass
            // with access to the KeyboardMapperFactory.
            if ((event.keyCode >= 31 /* KEY_A */ && event.keyCode <= 56 /* KEY_Z */)
                || (event.keyCode >= 21 /* KEY_0 */ && event.keyCode <= 30 /* KEY_9 */)) {
                return true;
            }
            return false;
        }
    }
    exports.AbstractKeybindingService = AbstractKeybindingService;
});
//# sourceMappingURL=abstractKeybindingService.js.map