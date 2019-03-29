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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files"], function (require, exports, nls, path, platform, uri_1, lifecycle_1, opener_1, configuration_1, terminal_1, editorService_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const pathPrefix = '(\\.\\.?|\\~)';
    const pathSeparatorClause = '\\/';
    // '":; are allowed in paths but they are often separators so ignore them
    // Also disallow \\ to prevent a catastropic backtracking case #24798
    const excludedPathCharactersClause = '[^\\0\\s!$`&*()\\[\\]+\'":;\\\\]';
    /** A regex that matches paths in the form /foo, ~/foo, ./foo, ../foo, foo/bar */
    const unixLocalLinkClause = '((' + pathPrefix + '|(' + excludedPathCharactersClause + ')+)?(' + pathSeparatorClause + '(' + excludedPathCharactersClause + ')+)+)';
    const winDrivePrefix = '[a-zA-Z]:';
    const winPathPrefix = '(' + winDrivePrefix + '|\\.\\.?|\\~)';
    const winPathSeparatorClause = '(\\\\|\\/)';
    const winExcludedPathCharactersClause = '[^\\0<>\\?\\|\\/\\s!$`&*()\\[\\]+\'":;]';
    /** A regex that matches paths in the form c:\foo, ~\foo, .\foo, ..\foo, foo\bar */
    const winLocalLinkClause = '((' + winPathPrefix + '|(' + winExcludedPathCharactersClause + ')+)?(' + winPathSeparatorClause + '(' + winExcludedPathCharactersClause + ')+)+)';
    /** As xterm reads from DOM, space in that case is nonbreaking char ASCII code - 160,
    replacing space with nonBreakningSpace or space ASCII code - 32. */
    const lineAndColumnClause = [
        '((\\S*)", line ((\\d+)( column (\\d+))?))',
        '((\\S*) on line ((\\d+)(, column (\\d+))?))',
        '((\\S*):line ((\\d+)(, column (\\d+))?))',
        '(([^\\s\\(\\)]*)(\\s?[\\(\\[](\\d+)(,\\s?(\\d+))?)[\\)\\]])',
        '(([^:\\s\\(\\)<>\'\"\\[\\]]*)(:(\\d+))?(:(\\d+))?)' // (file path):336, (file path):336:9
    ].join('|').replace(/ /g, `[${'\u00A0'} ]`);
    // Changing any regex may effect this value, hence changes this as well if required.
    const winLineAndColumnMatchIndex = 12;
    const unixLineAndColumnMatchIndex = 11;
    // Each line and column clause have 6 groups (ie no. of expressions in round brackets)
    const lineAndColumnClauseGroupCount = 6;
    /** Higher than local link, lower than hypertext */
    const CUSTOM_LINK_PRIORITY = -1;
    /** Lowest */
    const LOCAL_LINK_PRIORITY = -2;
    let TerminalLinkHandler = class TerminalLinkHandler {
        constructor(_xterm, _platform, _openerService, _editorService, _configurationService, _terminalService, _fileService) {
            this._xterm = _xterm;
            this._platform = _platform;
            this._openerService = _openerService;
            this._editorService = _editorService;
            this._configurationService = _configurationService;
            this._terminalService = _terminalService;
            this._fileService = _fileService;
            this._hoverDisposables = [];
            const baseLocalLinkClause = _platform === 3 /* Windows */ ? winLocalLinkClause : unixLocalLinkClause;
            // Append line and column number regex
            this._localLinkPattern = new RegExp(`${baseLocalLinkClause}(${lineAndColumnClause})`);
            // Matches '--- a/src/file1', capturing 'src/file1' in group 1
            this._gitDiffPreImagePattern = /^--- a\/(\S*)/;
            // Matches '+++ b/src/file1', capturing 'src/file1' in group 1
            this._gitDiffPostImagePattern = /^\+\+\+ b\/(\S*)/;
            this._tooltipCallback = (e) => {
                if (this._terminalService && this._terminalService.configHelper.config.rendererType === 'dom') {
                    const target = e.target;
                    this._widgetManager.showMessage(target.offsetLeft, target.offsetTop, this._getLinkHoverString());
                }
                else {
                    this._widgetManager.showMessage(e.offsetX, e.offsetY, this._getLinkHoverString());
                }
            };
            this.registerWebLinkHandler();
            this.registerLocalLinkHandler();
            this.registerGitDiffLinkHandlers();
        }
        setWidgetManager(widgetManager) {
            this._widgetManager = widgetManager;
        }
        set processCwd(processCwd) {
            this._processCwd = processCwd;
        }
        registerCustomLinkHandler(regex, handler, matchIndex, validationCallback) {
            const options = {
                matchIndex,
                tooltipCallback: this._tooltipCallback,
                leaveCallback: () => this._widgetManager.closeMessage(),
                willLinkActivate: (e) => this._isLinkActivationModifierDown(e),
                priority: CUSTOM_LINK_PRIORITY
            };
            if (validationCallback) {
                options.validationCallback = (uri, callback) => validationCallback(uri, callback);
            }
            return this._xterm.registerLinkMatcher(regex, this._wrapLinkHandler(handler), options);
        }
        registerWebLinkHandler() {
            const wrappedHandler = this._wrapLinkHandler(uri => {
                this._handleHypertextLink(uri);
            });
            this._xterm.webLinksInit(wrappedHandler, {
                validationCallback: (uri, callback) => this._validateWebLink(uri, callback),
                tooltipCallback: this._tooltipCallback,
                leaveCallback: () => this._widgetManager.closeMessage(),
                willLinkActivate: (e) => this._isLinkActivationModifierDown(e)
            });
        }
        registerLocalLinkHandler() {
            const wrappedHandler = this._wrapLinkHandler(url => {
                this._handleLocalLink(url);
            });
            this._xterm.registerLinkMatcher(this._localLinkRegex, wrappedHandler, {
                validationCallback: (uri, callback) => this._validateLocalLink(uri, callback),
                tooltipCallback: this._tooltipCallback,
                leaveCallback: () => this._widgetManager.closeMessage(),
                willLinkActivate: (e) => this._isLinkActivationModifierDown(e),
                priority: LOCAL_LINK_PRIORITY
            });
        }
        registerGitDiffLinkHandlers() {
            const wrappedHandler = this._wrapLinkHandler(url => {
                this._handleLocalLink(url);
            });
            const options = {
                matchIndex: 1,
                validationCallback: (uri, callback) => this._validateLocalLink(uri, callback),
                tooltipCallback: this._tooltipCallback,
                leaveCallback: () => this._widgetManager.closeMessage(),
                willLinkActivate: (e) => this._isLinkActivationModifierDown(e),
                priority: LOCAL_LINK_PRIORITY
            };
            this._xterm.registerLinkMatcher(this._gitDiffPreImagePattern, wrappedHandler, options);
            this._xterm.registerLinkMatcher(this._gitDiffPostImagePattern, wrappedHandler, options);
        }
        dispose() {
            this._xterm = null;
            this._hoverDisposables = lifecycle_1.dispose(this._hoverDisposables);
            this._mouseMoveDisposable = lifecycle_1.dispose(this._mouseMoveDisposable);
        }
        _wrapLinkHandler(handler) {
            return (event, uri) => {
                // Prevent default electron link handling so Alt+Click mode works normally
                event.preventDefault();
                // Require correct modifier on click
                if (!this._isLinkActivationModifierDown(event)) {
                    // If the modifier is not pressed, the terminal should be
                    // focused if it's not already
                    this._terminalService.getActiveInstance().focus(true);
                    return false;
                }
                return handler(uri);
            };
        }
        get _localLinkRegex() {
            return this._localLinkPattern;
        }
        get _gitDiffPreImageRegex() {
            return this._gitDiffPreImagePattern;
        }
        get _gitDiffPostImageRegex() {
            return this._gitDiffPostImagePattern;
        }
        _handleLocalLink(link) {
            return this._resolvePath(link).then(resolvedLink => {
                if (!resolvedLink) {
                    return Promise.resolve(null);
                }
                const normalizedPath = path.normalize(path.resolve(resolvedLink));
                const normalizedUrl = this.extractLinkUrl(normalizedPath);
                if (!normalizedUrl) {
                    return Promise.resolve(null);
                }
                const resource = uri_1.URI.file(normalizedUrl);
                const lineColumnInfo = this.extractLineColumnInfo(link);
                const selection = {
                    startLineNumber: lineColumnInfo.lineNumber,
                    startColumn: lineColumnInfo.columnNumber
                };
                return this._editorService.openEditor({ resource, options: { pinned: true, selection } });
            });
        }
        _validateLocalLink(link, callback) {
            this._resolvePath(link).then(resolvedLink => callback(!!resolvedLink));
        }
        _validateWebLink(link, callback) {
            callback(true);
        }
        _handleHypertextLink(url) {
            const uri = uri_1.URI.parse(url);
            this._openerService.open(uri);
        }
        _isLinkActivationModifierDown(event) {
            const editorConf = this._configurationService.getValue('editor');
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                return !!event.altKey;
            }
            return platform.isMacintosh ? event.metaKey : event.ctrlKey;
        }
        _getLinkHoverString() {
            const editorConf = this._configurationService.getValue('editor');
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                return nls.localize('terminalLinkHandler.followLinkAlt', 'Alt + click to follow link');
            }
            if (platform.isMacintosh) {
                return nls.localize('terminalLinkHandler.followLinkCmd', 'Cmd + click to follow link');
            }
            return nls.localize('terminalLinkHandler.followLinkCtrl', 'Ctrl + click to follow link');
        }
        _preprocessPath(link) {
            if (this._platform === 3 /* Windows */) {
                // Resolve ~ -> %HOMEDRIVE%\%HOMEPATH%
                if (link.charAt(0) === '~') {
                    if (!process.env.HOMEDRIVE || !process.env.HOMEPATH) {
                        return null;
                    }
                    link = `${process.env.HOMEDRIVE}\\${process.env.HOMEPATH + link.substring(1)}`;
                }
                // Resolve relative paths (.\a, ..\a, ~\a, a\b)
                if (!link.match('^' + winDrivePrefix)) {
                    if (!this._processCwd) {
                        // Abort if no workspace is open
                        return null;
                    }
                    link = path.join(this._processCwd, link);
                }
            }
            // Resolve workspace path . | .. | <relative_path> -> <path>/. | <path>/.. | <path>/<relative_path>
            else if (link.charAt(0) !== '/' && link.charAt(0) !== '~') {
                if (!this._processCwd) {
                    // Abort if no workspace is open
                    return null;
                }
                link = path.join(this._processCwd, link);
            }
            return link;
        }
        _resolvePath(link) {
            const preprocessedLink = this._preprocessPath(link);
            if (!preprocessedLink) {
                return Promise.resolve(null);
            }
            const linkUrl = this.extractLinkUrl(preprocessedLink);
            if (!linkUrl) {
                return Promise.resolve(null);
            }
            // Ensure the file exists on disk, so an editor can be opened after clicking it
            return this._fileService.resolveFile(uri_1.URI.file(linkUrl)).then(stat => {
                if (stat.isDirectory) {
                    return null;
                }
                return preprocessedLink;
            });
        }
        /**
         * Returns line and column number of URl if that is present.
         *
         * @param link Url link which may contain line and column number.
         */
        extractLineColumnInfo(link) {
            const matches = this._localLinkRegex.exec(link);
            const lineColumnInfo = {
                lineNumber: 1,
                columnNumber: 1
            };
            if (!matches) {
                return lineColumnInfo;
            }
            const lineAndColumnMatchIndex = this._platform === 3 /* Windows */ ? winLineAndColumnMatchIndex : unixLineAndColumnMatchIndex;
            for (let i = 0; i < lineAndColumnClause.length; i++) {
                const lineMatchIndex = lineAndColumnMatchIndex + (lineAndColumnClauseGroupCount * i);
                const rowNumber = matches[lineMatchIndex];
                if (rowNumber) {
                    lineColumnInfo['lineNumber'] = parseInt(rowNumber, 10);
                    // Check if column number exists
                    const columnNumber = matches[lineMatchIndex + 2];
                    if (columnNumber) {
                        lineColumnInfo['columnNumber'] = parseInt(columnNumber, 10);
                    }
                    break;
                }
            }
            return lineColumnInfo;
        }
        /**
         * Returns url from link as link may contain line and column information.
         *
         * @param link url link which may contain line and column number.
         */
        extractLinkUrl(link) {
            const matches = this._localLinkRegex.exec(link);
            if (!matches) {
                return null;
            }
            return matches[1];
        }
    };
    TerminalLinkHandler = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, terminal_1.ITerminalService),
        __param(6, files_1.IFileService)
    ], TerminalLinkHandler);
    exports.TerminalLinkHandler = TerminalLinkHandler;
});
//# sourceMappingURL=terminalLinkHandler.js.map