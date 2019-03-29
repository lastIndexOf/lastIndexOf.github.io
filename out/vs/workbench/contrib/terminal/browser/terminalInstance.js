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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/common/path", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/common/config/commonEditorConfig", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/workbench/contrib/terminal/browser/terminalWidgetManager", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/contrib/terminal/browser/terminalLinkHandler", "vs/workbench/contrib/terminal/browser/terminalCommandTracker", "vs/workbench/services/panel/common/panelService", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, path, dom, keyboardEvent_1, decorators_1, event_1, lifecycle, platform, commonEditorConfig_1, nls, clipboardService_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, log_1, notification_1, storage_1, colorRegistry_1, themeService_1, theme_1, terminalWidgetManager_1, terminal_1, terminalColorRegistry_1, terminalLinkHandler_1, terminalCommandTracker_1, panelService_1, accessibility_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // How long in milliseconds should an average frame take to render for a notification to appear
    // which suggests the fallback DOM-based renderer
    const SLOW_CANVAS_RENDER_THRESHOLD = 50;
    const NUMBER_OF_FRAMES_TO_MEASURE = 20;
    exports.DEFAULT_COMMANDS_TO_SKIP_SHELL = [
        "workbench.action.terminal.clearSelection" /* CLEAR_SELECTION */,
        "workbench.action.terminal.clear" /* CLEAR */,
        "workbench.action.terminal.copySelection" /* COPY_SELECTION */,
        "workbench.action.terminal.deleteToLineStart" /* DELETE_TO_LINE_START */,
        "workbench.action.terminal.deleteWordLeft" /* DELETE_WORD_LEFT */,
        "workbench.action.terminal.deleteWordRight" /* DELETE_WORD_RIGHT */,
        "workbench.action.terminal.focusFindWidget" /* FIND_WIDGET_FOCUS */,
        "workbench.action.terminal.hideFindWidget" /* FIND_WIDGET_HIDE */,
        "workbench.action.terminal.findNextTerminalFocus" /* FIND_NEXT_TERMINAL_FOCUS */,
        "workbench.action.terminal.findPreviousTerminalFocus" /* FIND_PREVIOUS_TERMINAL_FOCUS */,
        "workbench.action.terminal.toggleFindRegexTerminalFocus" /* TOGGLE_FIND_REGEX_TERMINAL_FOCUS */,
        "workbench.action.terminal.toggleFindWholeWordTerminalFocus" /* TOGGLE_FIND_WHOLE_WORD_TERMINAL_FOCUS */,
        "workbench.action.terminal.toggleFindCaseSensitiveTerminalFocus" /* TOGGLE_FIND_CASE_SENSITIVE_TERMINAL_FOCUS */,
        "workbench.action.terminal.focusNextPane" /* FOCUS_NEXT_PANE */,
        "workbench.action.terminal.focusNext" /* FOCUS_NEXT */,
        "workbench.action.terminal.focusPreviousPane" /* FOCUS_PREVIOUS_PANE */,
        "workbench.action.terminal.focusPrevious" /* FOCUS_PREVIOUS */,
        "workbench.action.terminal.focus" /* FOCUS */,
        "workbench.action.terminal.kill" /* KILL */,
        "workbench.action.terminal.moveToLineEnd" /* MOVE_TO_LINE_END */,
        "workbench.action.terminal.moveToLineStart" /* MOVE_TO_LINE_START */,
        "workbench.action.terminal.newInActiveWorkspace" /* NEW_IN_ACTIVE_WORKSPACE */,
        "workbench.action.terminal.new" /* NEW */,
        "workbench.action.terminal.paste" /* PASTE */,
        "workbench.action.terminal.resizePaneDown" /* RESIZE_PANE_DOWN */,
        "workbench.action.terminal.resizePaneLeft" /* RESIZE_PANE_LEFT */,
        "workbench.action.terminal.resizePaneRight" /* RESIZE_PANE_RIGHT */,
        "workbench.action.terminal.resizePaneUp" /* RESIZE_PANE_UP */,
        "workbench.action.terminal.runActiveFile" /* RUN_ACTIVE_FILE */,
        "workbench.action.terminal.runSelectedText" /* RUN_SELECTED_TEXT */,
        "workbench.action.terminal.scrollDown" /* SCROLL_DOWN_LINE */,
        "workbench.action.terminal.scrollDownPage" /* SCROLL_DOWN_PAGE */,
        "workbench.action.terminal.scrollToBottom" /* SCROLL_TO_BOTTOM */,
        "workbench.action.terminal.scrollToNextCommand" /* SCROLL_TO_NEXT_COMMAND */,
        "workbench.action.terminal.scrollToPreviousCommand" /* SCROLL_TO_PREVIOUS_COMMAND */,
        "workbench.action.terminal.scrollToTop" /* SCROLL_TO_TOP */,
        "workbench.action.terminal.scrollUp" /* SCROLL_UP_LINE */,
        "workbench.action.terminal.scrollUpPage" /* SCROLL_UP_PAGE */,
        "workbench.action.terminal.sendSequence" /* SEND_SEQUENCE */,
        "workbench.action.terminal.selectAll" /* SELECT_ALL */,
        "workbench.action.terminal.selectToNextCommand" /* SELECT_TO_NEXT_COMMAND */,
        "workbench.action.terminal.selectToNextLine" /* SELECT_TO_NEXT_LINE */,
        "workbench.action.terminal.selectToPreviousCommand" /* SELECT_TO_PREVIOUS_COMMAND */,
        "workbench.action.terminal.selectToPreviousLine" /* SELECT_TO_PREVIOUS_LINE */,
        "workbench.action.terminal.splitInActiveWorkspace" /* SPLIT_IN_ACTIVE_WORKSPACE */,
        "workbench.action.terminal.split" /* SPLIT */,
        "workbench.action.terminal.toggleTerminal" /* TOGGLE */,
        'editor.action.toggleTabFocusMode',
        'workbench.action.quickOpen',
        'workbench.action.quickOpenPreviousEditor',
        'workbench.action.showCommands',
        'workbench.action.tasks.build',
        'workbench.action.tasks.restartTask',
        'workbench.action.tasks.runTask',
        'workbench.action.tasks.reRunTask',
        'workbench.action.tasks.showLog',
        'workbench.action.tasks.showTasks',
        'workbench.action.tasks.terminate',
        'workbench.action.tasks.test',
        'workbench.action.toggleFullScreen',
        'workbench.action.terminal.focusAtIndex1',
        'workbench.action.terminal.focusAtIndex2',
        'workbench.action.terminal.focusAtIndex3',
        'workbench.action.terminal.focusAtIndex4',
        'workbench.action.terminal.focusAtIndex5',
        'workbench.action.terminal.focusAtIndex6',
        'workbench.action.terminal.focusAtIndex7',
        'workbench.action.terminal.focusAtIndex8',
        'workbench.action.terminal.focusAtIndex9',
        'workbench.action.focusSecondEditorGroup',
        'workbench.action.focusThirdEditorGroup',
        'workbench.action.focusFourthEditorGroup',
        'workbench.action.focusFifthEditorGroup',
        'workbench.action.focusSixthEditorGroup',
        'workbench.action.focusSeventhEditorGroup',
        'workbench.action.focusEighthEditorGroup',
        'workbench.action.nextPanelView',
        'workbench.action.previousPanelView',
        'workbench.action.nextSideBarView',
        'workbench.action.previousSideBarView',
        'workbench.action.debug.start',
        'workbench.action.debug.stop',
        'workbench.action.debug.run',
        'workbench.action.debug.restart',
        'workbench.action.debug.continue',
        'workbench.action.debug.pause',
        'workbench.action.debug.stepInto',
        'workbench.action.debug.stepOut',
        'workbench.action.debug.stepOver',
        'workbench.action.openNextRecentlyUsedEditorInGroup',
        'workbench.action.openPreviousRecentlyUsedEditorInGroup',
        'workbench.action.focusActiveEditorGroup',
        'workbench.action.focusFirstEditorGroup',
        'workbench.action.focusLastEditorGroup',
        'workbench.action.firstEditorInGroup',
        'workbench.action.lastEditorInGroup',
        'workbench.action.navigateUp',
        'workbench.action.navigateDown',
        'workbench.action.navigateRight',
        'workbench.action.navigateLeft',
        'workbench.action.togglePanel',
        'workbench.action.quickOpenView',
        'workbench.action.toggleMaximizedPanel'
    ];
    let TerminalInstance = class TerminalInstance {
        constructor(_terminalFocusContextKey, _configHelper, _container, _shellLaunchConfig, _terminalInstanceService, _contextKeyService, _keybindingService, _notificationService, _panelService, _instantiationService, _clipboardService, _themeService, _configurationService, _logService, _storageService, _accessibilityService) {
            this._terminalFocusContextKey = _terminalFocusContextKey;
            this._configHelper = _configHelper;
            this._container = _container;
            this._shellLaunchConfig = _shellLaunchConfig;
            this._terminalInstanceService = _terminalInstanceService;
            this._contextKeyService = _contextKeyService;
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._panelService = _panelService;
            this._instantiationService = _instantiationService;
            this._clipboardService = _clipboardService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._storageService = _storageService;
            this._accessibilityService = _accessibilityService;
            this._onExit = new event_1.Emitter();
            this._onDisposed = new event_1.Emitter();
            this._onFocused = new event_1.Emitter();
            this._onProcessIdReady = new event_1.Emitter();
            this._onTitleChanged = new event_1.Emitter();
            this._onData = new event_1.Emitter();
            this._onLineData = new event_1.Emitter();
            this._onRendererInput = new event_1.Emitter();
            this._onRequestExtHostProcess = new event_1.Emitter();
            this._onDimensionsChanged = new event_1.Emitter();
            this._onFocus = new event_1.Emitter();
            this._disposables = [];
            this._skipTerminalCommands = [];
            this._isExiting = false;
            this._hadFocusOnExit = false;
            this._isVisible = false;
            this._isDisposed = false;
            this._id = TerminalInstance._idCounter++;
            this._titleReadyPromise = new Promise(c => {
                this._titleReadyComplete = c;
            });
            this._terminalHasTextContextKey = terminal_1.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED.bindTo(this._contextKeyService);
            this.disableLayout = false;
            this._logService.trace(`terminalInstance#ctor (id: ${this.id})`, this._shellLaunchConfig);
            this._initDimensions();
            if (!this.shellLaunchConfig.isRendererOnly) {
                this._createProcess();
            }
            else {
                this.setTitle(this._shellLaunchConfig.name, false);
            }
            this._xtermReadyPromise = this._createXterm();
            this._xtermReadyPromise.then(() => {
                // Only attach xterm.js to the DOM if the terminal panel has been opened before.
                if (_container) {
                    this._attachToElement(_container);
                }
            });
            this.addDisposable(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('terminal.integrated')) {
                    this.updateConfig();
                    // HACK: Trigger another async layout to ensure xterm's CharMeasure is ready to use,
                    // this hack can be removed when https://github.com/xtermjs/xterm.js/issues/702 is
                    // supported.
                    this.setVisible(this._isVisible);
                }
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    this.updateAccessibilitySupport();
                }
            }));
        }
        get id() { return this._id; }
        get cols() {
            if (this._dimensionsOverride && this._dimensionsOverride.cols) {
                return Math.min(Math.max(this._dimensionsOverride.cols, 2), this._cols);
            }
            return this._cols;
        }
        get rows() {
            if (this._dimensionsOverride && this._dimensionsOverride.rows) {
                return Math.min(Math.max(this._dimensionsOverride.rows, 2), this._rows);
            }
            return this._rows;
        }
        // TODO: Ideally processId would be merged into processReady
        get processId() { return this._processManager ? this._processManager.shellProcessId : undefined; }
        // TODO: How does this work with detached processes?
        // TODO: Should this be an event as it can fire twice?
        get processReady() { return this._processManager ? this._processManager.ptyProcessReady : Promise.resolve(undefined); }
        get title() { return this._title; }
        get hadFocusOnExit() { return this._hadFocusOnExit; }
        get isTitleSetByProcess() { return !!this._messageTitleDisposable; }
        get shellLaunchConfig() { return this._shellLaunchConfig; }
        get commandTracker() { return this._commandTracker; }
        get onExit() { return this._onExit.event; }
        get onDisposed() { return this._onDisposed.event; }
        get onFocused() { return this._onFocused.event; }
        get onProcessIdReady() { return this._onProcessIdReady.event; }
        get onTitleChanged() { return this._onTitleChanged.event; }
        get onData() { return this._onData.event; }
        get onLineData() { return this._onLineData.event; }
        get onRendererInput() { return this._onRendererInput.event; }
        get onRequestExtHostProcess() { return this._onRequestExtHostProcess.event; }
        get onDimensionsChanged() { return this._onDimensionsChanged.event; }
        get onFocus() { return this._onFocus.event; }
        addDisposable(disposable) {
            this._disposables.push(disposable);
        }
        _initDimensions() {
            // The terminal panel needs to have been created
            if (!this._container) {
                return;
            }
            const computedStyle = window.getComputedStyle(this._container.parentElement);
            const width = parseInt(computedStyle.getPropertyValue('width').replace('px', ''), 10);
            const height = parseInt(computedStyle.getPropertyValue('height').replace('px', ''), 10);
            this._evaluateColsAndRows(width, height);
        }
        /**
         * Evaluates and sets the cols and rows of the terminal if possible.
         * @param width The width of the container.
         * @param height The height of the container.
         * @return The terminal's width if it requires a layout.
         */
        _evaluateColsAndRows(width, height) {
            // Ignore if dimensions are undefined or 0
            if (!width || !height) {
                return null;
            }
            const dimension = this._getDimension(width, height);
            if (!dimension) {
                return null;
            }
            const font = this._configHelper.getFont(this._xterm);
            if (!font.charWidth || !font.charHeight) {
                return null;
            }
            // Because xterm.js converts from CSS pixels to actual pixels through
            // the use of canvas, window.devicePixelRatio needs to be used here in
            // order to be precise. font.charWidth/charHeight alone as insufficient
            // when window.devicePixelRatio changes.
            const scaledWidthAvailable = dimension.width * window.devicePixelRatio;
            let scaledCharWidth;
            if (this._configHelper.config.rendererType === 'dom') {
                scaledCharWidth = font.charWidth * window.devicePixelRatio;
            }
            else {
                scaledCharWidth = Math.floor(font.charWidth * window.devicePixelRatio) + font.letterSpacing;
            }
            this._cols = Math.max(Math.floor(scaledWidthAvailable / scaledCharWidth), 1);
            const scaledHeightAvailable = dimension.height * window.devicePixelRatio;
            const scaledCharHeight = Math.ceil(font.charHeight * window.devicePixelRatio);
            const scaledLineHeight = Math.floor(scaledCharHeight * font.lineHeight);
            this._rows = Math.max(Math.floor(scaledHeightAvailable / scaledLineHeight), 1);
            return dimension.width;
        }
        _getDimension(width, height) {
            // The font needs to have been initialized
            const font = this._configHelper.getFont(this._xterm);
            if (!font || !font.charWidth || !font.charHeight) {
                return null;
            }
            // The panel is minimized
            if (!this._isVisible) {
                return TerminalInstance._lastKnownDimensions;
            }
            else {
                // Trigger scroll event manually so that the viewport's scroll area is synced. This
                // needs to happen otherwise its scrollTop value is invalid when the panel is toggled as
                // it gets removed and then added back to the DOM (resetting scrollTop to 0).
                // Upstream issue: https://github.com/sourcelair/xterm.js/issues/291
                if (this._xterm) {
                    this._xterm.emit('scroll', this._xterm._core.buffer.ydisp);
                }
            }
            if (!this._wrapperElement) {
                return null;
            }
            const wrapperElementStyle = getComputedStyle(this._wrapperElement);
            const marginLeft = parseInt(wrapperElementStyle.marginLeft.split('px')[0], 10);
            const marginRight = parseInt(wrapperElementStyle.marginRight.split('px')[0], 10);
            const bottom = parseInt(wrapperElementStyle.bottom.split('px')[0], 10);
            const innerWidth = width - marginLeft - marginRight;
            const innerHeight = height - bottom;
            TerminalInstance._lastKnownDimensions = new dom.Dimension(innerWidth, innerHeight);
            return TerminalInstance._lastKnownDimensions;
        }
        /**
         * Create xterm.js instance and attach data listeners.
         */
        _createXterm() {
            return __awaiter(this, void 0, void 0, function* () {
                const Terminal = yield this._terminalInstanceService.getXtermConstructor();
                const font = this._configHelper.getFont(undefined, true);
                const config = this._configHelper.config;
                this._xterm = new Terminal({
                    scrollback: config.scrollback,
                    theme: this._getXtermTheme(),
                    drawBoldTextInBrightColors: config.drawBoldTextInBrightColors,
                    fontFamily: font.fontFamily,
                    fontWeight: config.fontWeight,
                    fontWeightBold: config.fontWeightBold,
                    fontSize: font.fontSize,
                    letterSpacing: font.letterSpacing,
                    lineHeight: font.lineHeight,
                    bellStyle: config.enableBell ? 'sound' : 'none',
                    screenReaderMode: this._isScreenReaderOptimized(),
                    macOptionIsMeta: config.macOptionIsMeta,
                    macOptionClickForcesSelection: config.macOptionClickForcesSelection,
                    rightClickSelectsWord: config.rightClickBehavior === 'selectWord',
                    // TODO: Guess whether to use canvas or dom better
                    rendererType: config.rendererType === 'auto' ? 'canvas' : config.rendererType,
                    // TODO: Remove this once the setting is removed upstream
                    experimentalCharAtlas: 'dynamic',
                    experimentalBufferLineImpl: 'TypedArray'
                });
                if (this._shellLaunchConfig.initialText) {
                    this._xterm.writeln(this._shellLaunchConfig.initialText);
                }
                this._xterm.winptyCompatInit();
                this._xterm.on('linefeed', () => this._onLineFeed());
                this._xterm.on('key', (key, ev) => this._onKey(key, ev));
                if (this._processManager) {
                    this._processManager.onProcessData(data => this._onProcessData(data));
                    this._xterm.on('data', data => this._processManager.write(data));
                    // TODO: How does the cwd work on detached processes?
                    this._linkHandler = this._instantiationService.createInstance(terminalLinkHandler_1.TerminalLinkHandler, this._xterm, platform.platform);
                    this.processReady.then(() => __awaiter(this, void 0, void 0, function* () {
                        this._linkHandler.processCwd = yield this._processManager.getInitialCwd();
                    }));
                }
                this._xterm.on('focus', () => this._onFocus.fire(this));
                // Register listener to trigger the onInput ext API if the terminal is a renderer only
                if (this._shellLaunchConfig.isRendererOnly) {
                    this._xterm.on('data', (data) => this._sendRendererInput(data));
                }
                this._commandTracker = new terminalCommandTracker_1.TerminalCommandTracker(this._xterm);
                this._disposables.push(this._themeService.onThemeChange(theme => this._updateTheme(theme)));
            });
        }
        _isScreenReaderOptimized() {
            const detected = this._accessibilityService.getAccessibilitySupport() === 2 /* Enabled */;
            const config = this._configurationService.getValue('editor.accessibilitySupport');
            return config === 'on' || (config === 'auto' && detected);
        }
        reattachToElement(container) {
            if (!this._wrapperElement) {
                throw new Error('The terminal instance has not been attached to a container yet');
            }
            if (this._wrapperElement.parentNode) {
                this._wrapperElement.parentNode.removeChild(this._wrapperElement);
            }
            this._container = container;
            this._container.appendChild(this._wrapperElement);
        }
        attachToElement(container) {
            // The container did not change, do nothing
            if (this._container === container) {
                return;
            }
            // Attach has not occured yet
            if (!this._wrapperElement) {
                this._attachToElement(container);
                return;
            }
            // The container changed, reattach
            this._container.removeChild(this._wrapperElement);
            this._container = container;
            this._container.appendChild(this._wrapperElement);
        }
        _attachToElement(container) {
            this._xtermReadyPromise.then(() => {
                if (this._wrapperElement) {
                    throw new Error('The terminal instance has already been attached to a container');
                }
                this._container = container;
                this._wrapperElement = document.createElement('div');
                dom.addClass(this._wrapperElement, 'terminal-wrapper');
                this._xtermElement = document.createElement('div');
                // Attach the xterm object to the DOM, exposing it to the smoke tests
                this._wrapperElement.xterm = this._xterm;
                this._xterm.open(this._xtermElement);
                this._xterm.attachCustomKeyEventHandler((event) => {
                    // Disable all input if the terminal is exiting
                    if (this._isExiting) {
                        return false;
                    }
                    // Skip processing by xterm.js of keyboard events that resolve to commands described
                    // within commandsToSkipShell
                    const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(event);
                    const resolveResult = this._keybindingService.softDispatch(standardKeyboardEvent, standardKeyboardEvent.target);
                    if (resolveResult && this._skipTerminalCommands.some(k => k === resolveResult.commandId)) {
                        event.preventDefault();
                        return false;
                    }
                    // If tab focus mode is on, tab is not passed to the terminal
                    if (commonEditorConfig_1.TabFocus.getTabFocusMode() && event.keyCode === 9) {
                        return false;
                    }
                    // Always have alt+F4 skip the terminal on Windows and allow it to be handled by the
                    // system
                    if (platform.isWindows && event.altKey && event.key === 'F4' && !event.ctrlKey) {
                        return false;
                    }
                    return true;
                });
                this._disposables.push(dom.addDisposableListener(this._xterm.element, 'mousedown', () => {
                    // We need to listen to the mouseup event on the document since the user may release
                    // the mouse button anywhere outside of _xterm.element.
                    const listener = dom.addDisposableListener(document, 'mouseup', () => {
                        // Delay with a setTimeout to allow the mouseup to propagate through the DOM
                        // before evaluating the new selection state.
                        setTimeout(() => this._refreshSelectionContextKey(), 0);
                        listener.dispose();
                    });
                }));
                // xterm.js currently drops selection on keyup as we need to handle this case.
                this._disposables.push(dom.addDisposableListener(this._xterm.element, 'keyup', () => {
                    // Wait until keyup has propagated through the DOM before evaluating
                    // the new selection state.
                    setTimeout(() => this._refreshSelectionContextKey(), 0);
                }));
                const xtermHelper = this._xterm.element.querySelector('.xterm-helpers');
                const focusTrap = document.createElement('div');
                focusTrap.setAttribute('tabindex', '0');
                dom.addClass(focusTrap, 'focus-trap');
                this._disposables.push(dom.addDisposableListener(focusTrap, 'focus', () => {
                    let currentElement = focusTrap;
                    while (!dom.hasClass(currentElement, 'part')) {
                        currentElement = currentElement.parentElement;
                    }
                    const hidePanelElement = currentElement.querySelector('.hide-panel-action');
                    hidePanelElement.focus();
                }));
                xtermHelper.insertBefore(focusTrap, this._xterm.textarea);
                this._disposables.push(dom.addDisposableListener(this._xterm.textarea, 'focus', () => {
                    this._terminalFocusContextKey.set(true);
                    this._onFocused.fire(this);
                }));
                this._disposables.push(dom.addDisposableListener(this._xterm.textarea, 'blur', () => {
                    this._terminalFocusContextKey.reset();
                    this._refreshSelectionContextKey();
                }));
                this._disposables.push(dom.addDisposableListener(this._xterm.element, 'focus', () => {
                    this._terminalFocusContextKey.set(true);
                }));
                this._disposables.push(dom.addDisposableListener(this._xterm.element, 'blur', () => {
                    this._terminalFocusContextKey.reset();
                    this._refreshSelectionContextKey();
                }));
                this._wrapperElement.appendChild(this._xtermElement);
                this._container.appendChild(this._wrapperElement);
                if (this._processManager) {
                    this._widgetManager = new terminalWidgetManager_1.TerminalWidgetManager(this._wrapperElement);
                    this._linkHandler.setWidgetManager(this._widgetManager);
                }
                const computedStyle = window.getComputedStyle(this._container);
                const width = parseInt(computedStyle.getPropertyValue('width').replace('px', ''), 10);
                const height = parseInt(computedStyle.getPropertyValue('height').replace('px', ''), 10);
                this.layout(new dom.Dimension(width, height));
                this.setVisible(this._isVisible);
                this.updateConfig();
                // If IShellLaunchConfig.waitOnExit was true and the process finished before the terminal
                // panel was initialized.
                if (this._xterm.getOption('disableStdin')) {
                    this._attachPressAnyKeyToCloseListener();
                }
                const neverMeasureRenderTime = this._storageService.getBoolean(terminal_1.NEVER_MEASURE_RENDER_TIME_STORAGE_KEY, 0 /* GLOBAL */, false);
                if (!neverMeasureRenderTime && this._configHelper.config.rendererType === 'auto') {
                    this._measureRenderTime();
                }
            });
        }
        _measureRenderTime() {
            const frameTimes = [];
            const textRenderLayer = this._xterm._core.renderer._renderLayers[0];
            const originalOnGridChanged = textRenderLayer.onGridChanged;
            const evaluateCanvasRenderer = () => {
                // Discard first frame time as it's normal to take longer
                frameTimes.shift();
                const medianTime = frameTimes.sort()[Math.floor(frameTimes.length / 2)];
                if (medianTime > SLOW_CANVAS_RENDER_THRESHOLD) {
                    const promptChoices = [
                        {
                            label: nls.localize('yes', "Yes"),
                            run: () => {
                                this._configurationService.updateValue('terminal.integrated.rendererType', 'dom', 1 /* USER */).then(() => {
                                    this._notificationService.info(nls.localize('terminal.rendererInAllNewTerminals', "The terminal is now using the fallback renderer."));
                                });
                            }
                        },
                        {
                            label: nls.localize('no', "No"),
                            run: () => { }
                        },
                        {
                            label: nls.localize('dontShowAgain', "Don't Show Again"),
                            isSecondary: true,
                            run: () => this._storageService.store(terminal_1.NEVER_MEASURE_RENDER_TIME_STORAGE_KEY, true, 0 /* GLOBAL */)
                        }
                    ];
                    this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('terminal.slowRendering', 'The standard renderer for the integrated terminal appears to be slow on your computer. Would you like to switch to the alternative DOM-based renderer which may improve performance? [Read more about terminal settings](https://code.visualstudio.com/docs/editor/integrated-terminal#_changing-how-the-terminal-is-rendered).'), promptChoices);
                }
            };
            textRenderLayer.onGridChanged = (terminal, firstRow, lastRow) => {
                const startTime = performance.now();
                originalOnGridChanged.call(textRenderLayer, terminal, firstRow, lastRow);
                frameTimes.push(performance.now() - startTime);
                if (frameTimes.length === NUMBER_OF_FRAMES_TO_MEASURE) {
                    evaluateCanvasRenderer();
                    // Restore original function
                    textRenderLayer.onGridChanged = originalOnGridChanged;
                }
            };
        }
        registerLinkMatcher(regex, handler, matchIndex, validationCallback) {
            return this._linkHandler.registerCustomLinkHandler(regex, handler, matchIndex, validationCallback);
        }
        deregisterLinkMatcher(linkMatcherId) {
            this._xterm.deregisterLinkMatcher(linkMatcherId);
        }
        hasSelection() {
            return this._xterm && this._xterm.hasSelection();
        }
        copySelection() {
            if (this.hasSelection()) {
                this._clipboardService.writeText(this._xterm.getSelection());
            }
            else {
                this._notificationService.warn(nls.localize('terminal.integrated.copySelection.noSelection', 'The terminal has no selection to copy'));
            }
        }
        get selection() {
            return this.hasSelection() ? this._xterm.getSelection() : undefined;
        }
        clearSelection() {
            this._xterm.clearSelection();
        }
        selectAll() {
            // Focus here to ensure the terminal context key is set
            this._xterm.focus();
            this._xterm.selectAll();
        }
        findNext(term, searchOptions) {
            return this._xterm.findNext(term, searchOptions);
        }
        findPrevious(term, searchOptions) {
            return this._xterm.findPrevious(term, searchOptions);
        }
        notifyFindWidgetFocusChanged(isFocused) {
            const terminalFocused = !isFocused && (document.activeElement === this._xterm.textarea || document.activeElement === this._xterm.element);
            this._terminalFocusContextKey.set(terminalFocused);
        }
        dispose(immediate) {
            this._logService.trace(`terminalInstance#dispose (id: ${this.id})`);
            lifecycle.dispose(this._windowsShellHelper);
            this._windowsShellHelper = undefined;
            this._linkHandler = lifecycle.dispose(this._linkHandler);
            this._commandTracker = lifecycle.dispose(this._commandTracker);
            this._widgetManager = lifecycle.dispose(this._widgetManager);
            if (this._xterm && this._xterm.element) {
                this._hadFocusOnExit = dom.hasClass(this._xterm.element, 'focus');
            }
            if (this._wrapperElement) {
                if (this._wrapperElement.xterm) {
                    this._wrapperElement.xterm = null;
                }
                if (this._wrapperElement.parentElement) {
                    this._container.removeChild(this._wrapperElement);
                }
            }
            if (this._xterm) {
                const buffer = this._xterm._core.buffer;
                this._sendLineData(buffer, buffer.ybase + buffer.y);
                this._xterm.dispose();
            }
            if (this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener.dispose();
                this._pressAnyKeyToCloseListener = undefined;
            }
            if (this._processManager) {
                this._processManager.dispose(immediate);
            }
            else {
                // In cases where there is no associated process (for example executing an extension callback task)
                // consumers still expect on onExit event to be fired. An example of this is terminating the extension callback
                // task.
                this._onExit.fire(0);
            }
            if (!this._isDisposed) {
                this._isDisposed = true;
                this._onDisposed.fire(this);
            }
            this._disposables = lifecycle.dispose(this._disposables);
        }
        rendererExit(exitCode) {
            // The use of this API is for cases where there is no backing process behind a terminal
            // instance (eg. a custom execution task).
            if (!this.shellLaunchConfig.isRendererOnly) {
                throw new Error('rendererExit is only expected to be called on a renderer only terminal');
            }
            return this._onProcessExit(exitCode);
        }
        forceRedraw() {
            this._xterm.refresh(0, this._xterm.rows - 1);
        }
        focus(force) {
            if (!this._xterm) {
                return;
            }
            const text = window.getSelection().toString();
            if (!text || force) {
                this._xterm.focus();
            }
        }
        focusWhenReady(force) {
            return this._xtermReadyPromise.then(() => this.focus(force));
        }
        paste() {
            this.focus();
            document.execCommand('paste');
        }
        write(text) {
            this._xtermReadyPromise.then(() => {
                if (!this._xterm) {
                    return;
                }
                this._xterm.write(text);
                if (this._shellLaunchConfig.isRendererOnly) {
                    // Fire onData API in the extension host
                    this._onData.fire(text);
                }
            });
        }
        sendText(text, addNewLine) {
            // Normalize line endings to 'enter' press.
            text = text.replace(TerminalInstance.EOL_REGEX, '\r');
            if (addNewLine && text.substr(text.length - 1) !== '\r') {
                text += '\r';
            }
            if (this._shellLaunchConfig.isRendererOnly) {
                // If the terminal is a renderer only, fire the onInput ext API
                this._sendRendererInput(text);
            }
            else {
                // If the terminal has a process, send it to the process
                if (this._processManager) {
                    this._processManager.ptyProcessReady.then(() => {
                        this._processManager.write(text);
                    });
                }
            }
        }
        setVisible(visible) {
            this._isVisible = visible;
            if (this._wrapperElement) {
                dom.toggleClass(this._wrapperElement, 'active', visible);
            }
            if (visible && this._xterm) {
                // Trigger a manual scroll event which will sync the viewport and scroll bar. This is
                // necessary if the number of rows in the terminal has decreased while it was in the
                // background since scrollTop changes take no effect but the terminal's position does
                // change since the number of visible rows decreases.
                this._xterm.emit('scroll', this._xterm._core.buffer.ydisp);
                if (this._container && this._container.parentElement) {
                    // Force a layout when the instance becomes invisible. This is particularly important
                    // for ensuring that terminals that are created in the background by an extension will
                    // correctly get correct character measurements in order to render to the screen (see
                    // #34554).
                    const computedStyle = window.getComputedStyle(this._container.parentElement);
                    const width = parseInt(computedStyle.getPropertyValue('width').replace('px', ''), 10);
                    const height = parseInt(computedStyle.getPropertyValue('height').replace('px', ''), 10);
                    this.layout(new dom.Dimension(width, height));
                    // HACK: Trigger another async layout to ensure xterm's CharMeasure is ready to use,
                    // this hack can be removed when https://github.com/xtermjs/xterm.js/issues/702 is
                    // supported.
                    setTimeout(() => this.layout(new dom.Dimension(width, height)), 0);
                }
            }
        }
        scrollDownLine() {
            this._xterm.scrollLines(1);
        }
        scrollDownPage() {
            this._xterm.scrollPages(1);
        }
        scrollToBottom() {
            this._xterm.scrollToBottom();
        }
        scrollUpLine() {
            this._xterm.scrollLines(-1);
        }
        scrollUpPage() {
            this._xterm.scrollPages(-1);
        }
        scrollToTop() {
            this._xterm.scrollToTop();
        }
        clear() {
            this._xterm.clear();
        }
        _refreshSelectionContextKey() {
            const activePanel = this._panelService.getActivePanel();
            const isActive = !!activePanel && activePanel.getId() === terminal_1.TERMINAL_PANEL_ID;
            this._terminalHasTextContextKey.set(isActive && this.hasSelection());
        }
        _createProcess() {
            this._processManager = this._terminalInstanceService.createTerminalProcessManager(this._id, this._configHelper);
            this._processManager.onProcessReady(() => this._onProcessIdReady.fire(this));
            this._processManager.onProcessExit(exitCode => this._onProcessExit(exitCode));
            this._processManager.onProcessData(data => this._onData.fire(data));
            if (this._shellLaunchConfig.name) {
                this.setTitle(this._shellLaunchConfig.name, false);
            }
            else {
                // Only listen for process title changes when a name is not provided
                this.setTitle(this._shellLaunchConfig.executable, true);
                this._messageTitleDisposable = this._processManager.onProcessTitle(title => this.setTitle(title ? title : '', true));
            }
            if (platform.isWindows) {
                this._processManager.ptyProcessReady.then(() => {
                    this._xtermReadyPromise.then(() => {
                        if (!this._isDisposed) {
                            this._terminalInstanceService.createWindowsShellHelper(this._processManager.shellProcessId, this, this._xterm);
                        }
                    });
                });
            }
            // Create the process asynchronously to allow the terminal's container
            // to be created so dimensions are accurate
            setTimeout(() => {
                this._processManager.createProcess(this._shellLaunchConfig, this._cols, this._rows);
            }, 0);
        }
        _onProcessData(data) {
            if (this._widgetManager) {
                this._widgetManager.closeMessage();
            }
            if (this._xterm) {
                this._xterm.write(data);
            }
        }
        /**
         * Called when either a process tied to a terminal has exited or when a terminal renderer
         * simulates a process exiting (eg. custom execution task).
         * @param exitCode The exit code of the process, this is undefined when the terminal was exited
         * through user action.
         */
        _onProcessExit(exitCode) {
            this._logService.debug(`Terminal process exit (id: ${this.id}) with code ${exitCode}`);
            // Prevent dispose functions being triggered multiple times
            if (this._isExiting) {
                return;
            }
            this._isExiting = true;
            let exitCodeMessage;
            if (exitCode) {
                exitCodeMessage = nls.localize('terminal.integrated.exitedWithCode', 'The terminal process terminated with exit code: {0}', exitCode);
            }
            this._logService.debug(`Terminal process exit (id: ${this.id})${this._processManager ? ' state ' + this._processManager.processState : ''}`);
            // Only trigger wait on exit when the exit was *not* triggered by the
            // user (via the `workbench.action.terminal.kill` command).
            if (this._shellLaunchConfig.waitOnExit && (!this._processManager || this._processManager.processState !== 4 /* KILLED_BY_USER */)) {
                if (exitCode) {
                    this._xterm.writeln(exitCodeMessage);
                }
                if (typeof this._shellLaunchConfig.waitOnExit === 'string') {
                    let message = this._shellLaunchConfig.waitOnExit;
                    // Bold the message and add an extra new line to make it stand out from the rest of the output
                    message = `\n\x1b[1m${message}\x1b[0m`;
                    this._xterm.writeln(message);
                }
                // Disable all input if the terminal is exiting and listen for next keypress
                this._xterm.setOption('disableStdin', true);
                if (this._xterm.textarea) {
                    this._attachPressAnyKeyToCloseListener();
                }
            }
            else {
                this.dispose();
                if (exitCode) {
                    if (this._processManager && this._processManager.processState === 3 /* KILLED_DURING_LAUNCH */) {
                        let args = '';
                        if (typeof this._shellLaunchConfig.args === 'string') {
                            args = this._shellLaunchConfig.args;
                        }
                        else if (this._shellLaunchConfig.args && this._shellLaunchConfig.args.length) {
                            args = ' ' + this._shellLaunchConfig.args.map(a => {
                                if (typeof a === 'string' && a.indexOf(' ') !== -1) {
                                    return `'${a}'`;
                                }
                                return a;
                            }).join(' ');
                        }
                        if (this._shellLaunchConfig.executable) {
                            this._notificationService.error(nls.localize('terminal.integrated.launchFailed', 'The terminal process command \'{0}{1}\' failed to launch (exit code: {2})', this._shellLaunchConfig.executable, args, exitCode));
                        }
                        else {
                            this._notificationService.error(nls.localize('terminal.integrated.launchFailedExtHost', 'The terminal process failed to launch (exit code: {0})', exitCode));
                        }
                    }
                    else {
                        if (this._configHelper.config.showExitAlert) {
                            this._notificationService.error(exitCodeMessage);
                        }
                        else {
                            console.warn(exitCodeMessage);
                        }
                    }
                }
            }
            this._onExit.fire(exitCode || 0);
        }
        _attachPressAnyKeyToCloseListener() {
            if (!this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener = dom.addDisposableListener(this._xterm.textarea, 'keypress', (event) => {
                    if (this._pressAnyKeyToCloseListener) {
                        this._pressAnyKeyToCloseListener.dispose();
                        this._pressAnyKeyToCloseListener = undefined;
                        this.dispose();
                        event.preventDefault();
                    }
                });
            }
        }
        reuseTerminal(shell) {
            // Unsubscribe any key listener we may have.
            if (this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener.dispose();
                this._pressAnyKeyToCloseListener = undefined;
            }
            // Kill and clear up the process, making the process manager ready for a new process
            if (this._processManager) {
                this._processManager.dispose();
                this._processManager = undefined;
            }
            // Ensure new processes' output starts at start of new line
            this._xterm.write('\n\x1b[G');
            // Print initialText if specified
            if (shell.initialText) {
                this._xterm.writeln(shell.initialText);
            }
            const oldTitle = this._title;
            // Clean up waitOnExit state
            if (this._isExiting && this._shellLaunchConfig.waitOnExit) {
                this._xterm.setOption('disableStdin', false);
                this._isExiting = false;
            }
            // Set the new shell launch config
            this._shellLaunchConfig = shell; // Must be done before calling _createProcess()
            // Launch the process unless this is only a renderer.
            // In the renderer only cases, we still need to set the title correctly.
            if (!this._shellLaunchConfig.isRendererOnly) {
                this._createProcess();
            }
            else if (this._shellLaunchConfig.name) {
                this.setTitle(this._shellLaunchConfig.name, false);
            }
            if (oldTitle !== this._title) {
                this.setTitle(this._title, true);
            }
            if (this._processManager) {
                // The "!" operator is required here because _processManager is set to undefiend earlier
                // and TS does not know that createProcess sets it.
                this._processManager.onProcessData(data => this._onProcessData(data));
            }
        }
        _sendRendererInput(input) {
            if (this._processManager) {
                throw new Error('onRendererInput attempted to be used on a regular terminal');
            }
            // For terminal renderers onData fires on keystrokes and when sendText is called.
            this._onRendererInput.fire(input);
        }
        _onLineFeed() {
            const buffer = this._xterm._core.buffer;
            const newLine = buffer.lines.get(buffer.ybase + buffer.y);
            if (!newLine.isWrapped) {
                this._sendLineData(buffer, buffer.ybase + buffer.y - 1);
            }
        }
        _sendLineData(buffer, lineIndex) {
            let lineData = buffer.translateBufferLineToString(lineIndex, true);
            while (lineIndex >= 0 && buffer.lines.get(lineIndex--).isWrapped) {
                lineData = buffer.translateBufferLineToString(lineIndex, false) + lineData;
            }
            this._onLineData.fire(lineData);
        }
        _onKey(key, ev) {
            const event = new keyboardEvent_1.StandardKeyboardEvent(ev);
            if (event.equals(3 /* Enter */)) {
                this._updateProcessCwd();
            }
        }
        _updateProcessCwd() {
            return __awaiter(this, void 0, void 0, function* () {
                // reset cwd if it has changed, so file based url paths can be resolved
                const cwd = yield this.getCwd();
                if (cwd) {
                    this._linkHandler.processCwd = cwd;
                }
                return cwd;
            });
        }
        updateConfig() {
            const config = this._configHelper.config;
            this._setCursorBlink(config.cursorBlinking);
            this._setCursorStyle(config.cursorStyle);
            this._setCommandsToSkipShell(config.commandsToSkipShell);
            this._setEnableBell(config.enableBell);
            this._safeSetOption('scrollback', config.scrollback);
            this._safeSetOption('macOptionIsMeta', config.macOptionIsMeta);
            this._safeSetOption('macOptionClickForcesSelection', config.macOptionClickForcesSelection);
            this._safeSetOption('rightClickSelectsWord', config.rightClickBehavior === 'selectWord');
            this._safeSetOption('rendererType', config.rendererType === 'auto' ? 'canvas' : config.rendererType);
        }
        updateAccessibilitySupport() {
            this._xterm.setOption('screenReaderMode', this._isScreenReaderOptimized());
        }
        _setCursorBlink(blink) {
            if (this._xterm && this._xterm.getOption('cursorBlink') !== blink) {
                this._xterm.setOption('cursorBlink', blink);
                this._xterm.refresh(0, this._xterm.rows - 1);
            }
        }
        _setCursorStyle(style) {
            if (this._xterm && this._xterm.getOption('cursorStyle') !== style) {
                // 'line' is used instead of bar in VS Code to be consistent with editor.cursorStyle
                const xtermOption = style === 'line' ? 'bar' : style;
                this._xterm.setOption('cursorStyle', xtermOption);
            }
        }
        _setCommandsToSkipShell(commands) {
            const excludeCommands = commands.filter(command => command[0] === '-').map(command => command.slice(1));
            this._skipTerminalCommands = exports.DEFAULT_COMMANDS_TO_SKIP_SHELL.filter(defaultCommand => {
                return excludeCommands.indexOf(defaultCommand) === -1;
            }).concat(commands);
        }
        _setEnableBell(isEnabled) {
            if (this._xterm) {
                if (this._xterm.getOption('bellStyle') === 'sound') {
                    if (!this._configHelper.config.enableBell) {
                        this._xterm.setOption('bellStyle', 'none');
                    }
                }
                else {
                    if (this._configHelper.config.enableBell) {
                        this._xterm.setOption('bellStyle', 'sound');
                    }
                }
            }
        }
        _safeSetOption(key, value) {
            if (!this._xterm) {
                return;
            }
            if (this._xterm.getOption(key) !== value) {
                this._xterm.setOption(key, value);
            }
        }
        layout(dimension) {
            if (this.disableLayout) {
                return;
            }
            const terminalWidth = this._evaluateColsAndRows(dimension.width, dimension.height);
            if (!terminalWidth) {
                return;
            }
            if (this._xterm) {
                this._xterm.element.style.width = terminalWidth + 'px';
            }
            this._resize();
        }
        _resize() {
            let cols = this.cols;
            let rows = this.rows;
            if (this._xterm) {
                // Only apply these settings when the terminal is visible so that
                // the characters are measured correctly.
                if (this._isVisible) {
                    const font = this._configHelper.getFont(this._xterm);
                    const config = this._configHelper.config;
                    this._safeSetOption('letterSpacing', font.letterSpacing);
                    this._safeSetOption('lineHeight', font.lineHeight);
                    this._safeSetOption('fontSize', font.fontSize);
                    this._safeSetOption('fontFamily', font.fontFamily);
                    this._safeSetOption('fontWeight', config.fontWeight);
                    this._safeSetOption('fontWeightBold', config.fontWeightBold);
                    this._safeSetOption('drawBoldTextInBrightColors', config.drawBoldTextInBrightColors);
                }
                if (cols !== this._xterm.cols || rows !== this._xterm.rows) {
                    this._onDimensionsChanged.fire();
                }
                this._xterm.resize(cols, rows);
                if (this._isVisible) {
                    // HACK: Force the renderer to unpause by simulating an IntersectionObserver event.
                    // This is to fix an issue where dragging the window to the top of the screen to
                    // maximize on Windows/Linux would fire an event saying that the terminal was not
                    // visible.
                    if (this._xterm.getOption('rendererType') === 'canvas') {
                        this._xterm._core.renderer.onIntersectionChange({ intersectionRatio: 1 });
                        // HACK: Force a refresh of the screen to ensure links are refresh corrected.
                        // This can probably be removed when the above hack is fixed in Chromium.
                        this._xterm.refresh(0, this._xterm.rows - 1);
                    }
                }
            }
            if (this._processManager) {
                this._processManager.ptyProcessReady.then(() => this._processManager.setDimensions(cols, rows));
            }
        }
        setTitle(title, eventFromProcess) {
            if (!title) {
                return;
            }
            if (eventFromProcess) {
                title = path.basename(title);
                if (platform.isWindows) {
                    // Remove the .exe extension
                    title = title.split('.exe')[0];
                }
            }
            else {
                // If the title has not been set by the API or the rename command, unregister the handler that
                // automatically updates the terminal name
                if (this._messageTitleDisposable) {
                    lifecycle.dispose(this._messageTitleDisposable);
                    lifecycle.dispose(this._windowsShellHelper);
                    this._messageTitleDisposable = undefined;
                    this._windowsShellHelper = undefined;
                }
            }
            const didTitleChange = title !== this._title;
            const oldTitle = this._title;
            this._title = title;
            if (didTitleChange) {
                if (!oldTitle) {
                    this._titleReadyComplete(title);
                }
                this._onTitleChanged.fire(this);
            }
        }
        waitForTitle() {
            return this._titleReadyPromise;
        }
        setDimensions(dimensions) {
            this._dimensionsOverride = dimensions;
            this._resize();
        }
        _getXtermTheme(theme) {
            if (!theme) {
                theme = this._themeService.getTheme();
            }
            const foregroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_FOREGROUND_COLOR);
            const backgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || theme.getColor(theme_1.PANEL_BACKGROUND);
            const cursorColor = theme.getColor(terminalColorRegistry_1.TERMINAL_CURSOR_FOREGROUND_COLOR) || foregroundColor;
            const cursorAccentColor = theme.getColor(terminalColorRegistry_1.TERMINAL_CURSOR_BACKGROUND_COLOR) || backgroundColor;
            const selectionColor = theme.getColor(terminalColorRegistry_1.TERMINAL_SELECTION_BACKGROUND_COLOR);
            return {
                background: backgroundColor ? backgroundColor.toString() : null,
                foreground: foregroundColor ? foregroundColor.toString() : null,
                cursor: cursorColor ? cursorColor.toString() : null,
                cursorAccent: cursorAccentColor ? cursorAccentColor.toString() : null,
                selection: selectionColor ? selectionColor.toString() : null,
                black: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[0]).toString(),
                red: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[1]).toString(),
                green: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[2]).toString(),
                yellow: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[3]).toString(),
                blue: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[4]).toString(),
                magenta: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[5]).toString(),
                cyan: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[6]).toString(),
                white: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[7]).toString(),
                brightBlack: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[8]).toString(),
                brightRed: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[9]).toString(),
                brightGreen: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[10]).toString(),
                brightYellow: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[11]).toString(),
                brightBlue: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[12]).toString(),
                brightMagenta: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[13]).toString(),
                brightCyan: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[14]).toString(),
                brightWhite: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[15]).toString()
            };
        }
        _updateTheme(theme) {
            this._xterm.setOption('theme', this._getXtermTheme(theme));
        }
        toggleEscapeSequenceLogging() {
            this._xterm._core.debug = !this._xterm._core.debug;
            this._xterm.setOption('debug', this._xterm._core.debug);
        }
        getInitialCwd() {
            if (!this._processManager) {
                return Promise.resolve('');
            }
            return this._processManager.getInitialCwd();
        }
        getCwd() {
            if (!this._processManager) {
                return Promise.resolve('');
            }
            return this._processManager.getCwd();
        }
    };
    TerminalInstance.EOL_REGEX = /\r?\n/g;
    TerminalInstance._lastKnownDimensions = null;
    TerminalInstance._idCounter = 1;
    __decorate([
        decorators_1.debounce(2000)
    ], TerminalInstance.prototype, "_updateProcessCwd", null);
    __decorate([
        decorators_1.debounce(50)
    ], TerminalInstance.prototype, "_resize", null);
    TerminalInstance = __decorate([
        __param(4, terminal_2.ITerminalInstanceService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, notification_1.INotificationService),
        __param(8, panelService_1.IPanelService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, clipboardService_1.IClipboardService),
        __param(11, themeService_1.IThemeService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, log_1.ILogService),
        __param(14, storage_1.IStorageService),
        __param(15, accessibility_1.IAccessibilityService)
    ], TerminalInstance);
    exports.TerminalInstance = TerminalInstance;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Border
        const border = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (border) {
            collector.addRule(`
			.hc-black .monaco-workbench .panel.integrated-terminal .xterm.focus::before,
			.hc-black .monaco-workbench .panel.integrated-terminal .xterm:focus::before { border-color: ${border}; }`);
        }
        // Scrollbar
        const scrollbarSliderBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderBackground);
        if (scrollbarSliderBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .panel.integrated-terminal .find-focused .xterm .xterm-viewport,
			.monaco-workbench .panel.integrated-terminal .xterm.focus .xterm-viewport,
			.monaco-workbench .panel.integrated-terminal .xterm:focus .xterm-viewport,
			.monaco-workbench .panel.integrated-terminal .xterm:hover .xterm-viewport { background-color: ${scrollbarSliderBackgroundColor} !important; }`);
        }
        const scrollbarSliderHoverBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderHoverBackground);
        if (scrollbarSliderHoverBackgroundColor) {
            collector.addRule(`.monaco-workbench .panel.integrated-terminal .xterm .xterm-viewport::-webkit-scrollbar-thumb:hover { background-color: ${scrollbarSliderHoverBackgroundColor}; }`);
        }
        const scrollbarSliderActiveBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderActiveBackground);
        if (scrollbarSliderActiveBackgroundColor) {
            collector.addRule(`.monaco-workbench .panel.integrated-terminal .xterm .xterm-viewport::-webkit-scrollbar-thumb:active { background-color: ${scrollbarSliderActiveBackgroundColor}; }`);
        }
    });
});
//# sourceMappingURL=terminalInstance.js.map