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
define(["require", "exports", "crypto", "vs/base/node/paths", "os", "vs/base/common/path", "vs/base/common/decorators", "vs/platform/product/node/package", "vs/platform/product/node/product", "vs/base/common/date", "vs/base/common/platform", "vs/base/common/amd", "vs/base/common/uri"], function (require, exports, crypto, paths, os, path, decorators_1, package_1, product_1, date_1, platform_1, amd_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Read this before there's any chance it is overwritten
    // Related to https://github.com/Microsoft/vscode/issues/30624
    const xdgRuntimeDir = process.env['XDG_RUNTIME_DIR'];
    function getNixIPCHandle(userDataPath, type) {
        if (xdgRuntimeDir) {
            const scope = crypto.createHash('md5').update(userDataPath).digest('hex').substr(0, 8);
            return path.join(xdgRuntimeDir, `vscode-${scope}-${package_1.default.version}-${type}.sock`);
        }
        return path.join(userDataPath, `${package_1.default.version}-${type}.sock`);
    }
    function getWin32IPCHandle(userDataPath, type) {
        const scope = crypto.createHash('md5').update(userDataPath).digest('hex');
        return `\\\\.\\pipe\\${scope}-${package_1.default.version}-${type}-sock`;
    }
    function getIPCHandle(userDataPath, type) {
        if (platform_1.isWindows) {
            return getWin32IPCHandle(userDataPath, type);
        }
        return getNixIPCHandle(userDataPath, type);
    }
    function getCLIPath(execPath, appRoot, isBuilt) {
        // Windows
        if (platform_1.isWindows) {
            if (isBuilt) {
                return path.join(path.dirname(execPath), 'bin', `${product_1.default.applicationName}.cmd`);
            }
            return path.join(appRoot, 'scripts', 'code-cli.bat');
        }
        // Linux
        if (platform_1.isLinux) {
            if (isBuilt) {
                return path.join(path.dirname(execPath), 'bin', `${product_1.default.applicationName}`);
            }
            return path.join(appRoot, 'scripts', 'code-cli.sh');
        }
        // macOS
        if (isBuilt) {
            return path.join(appRoot, 'bin', 'code');
        }
        return path.join(appRoot, 'scripts', 'code-cli.sh');
    }
    class EnvironmentService {
        constructor(_args, _execPath) {
            this._args = _args;
            this._execPath = _execPath;
            if (!process.env['VSCODE_LOGS']) {
                const key = date_1.toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '');
                process.env['VSCODE_LOGS'] = path.join(this.userDataPath, 'logs', key);
            }
            this.logsPath = process.env['VSCODE_LOGS'];
        }
        get args() { return this._args; }
        get appRoot() { return path.dirname(amd_1.getPathFromAmdModule(require, '')); }
        get execPath() { return this._execPath; }
        get cliPath() { return getCLIPath(this.execPath, this.appRoot, this.isBuilt); }
        get userHome() { return os.homedir(); }
        get userDataPath() {
            const vscodePortable = process.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return path.join(vscodePortable, 'user-data');
            }
            return parseUserDataDir(this._args, process);
        }
        get appNameLong() { return product_1.default.nameLong; }
        get appQuality() { return product_1.default.quality; }
        get appSettingsHome() { return path.join(this.userDataPath, 'User'); }
        get appSettingsPath() { return path.join(this.appSettingsHome, 'settings.json'); }
        get globalStorageHome() { return path.join(this.appSettingsHome, 'globalStorage'); }
        get workspaceStorageHome() { return path.join(this.appSettingsHome, 'workspaceStorage'); }
        get settingsSearchBuildId() { return product_1.default.settingsSearchBuildId; }
        get settingsSearchUrl() { return product_1.default.settingsSearchUrl; }
        get appKeybindingsPath() { return path.join(this.appSettingsHome, 'keybindings.json'); }
        get isExtensionDevelopment() { return !!this._args.extensionDevelopmentPath; }
        get backupHome() { return path.join(this.userDataPath, 'Backups'); }
        get backupWorkspacesPath() { return path.join(this.backupHome, 'workspaces.json'); }
        get untitledWorkspacesHome() { return uri_1.URI.file(path.join(this.userDataPath, 'Workspaces')); }
        get installSourcePath() { return path.join(this.userDataPath, 'installSource'); }
        get builtinExtensionsPath() {
            const fromArgs = parsePathArg(this._args['builtin-extensions-dir'], process);
            if (fromArgs) {
                return fromArgs;
            }
            else {
                return path.normalize(path.join(amd_1.getPathFromAmdModule(require, ''), '..', 'extensions'));
            }
        }
        get extensionsPath() {
            const fromArgs = parsePathArg(this._args['extensions-dir'], process);
            if (fromArgs) {
                return fromArgs;
            }
            const vscodeExtensions = process.env['VSCODE_EXTENSIONS'];
            if (vscodeExtensions) {
                return vscodeExtensions;
            }
            const vscodePortable = process.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return path.join(vscodePortable, 'extensions');
            }
            return path.join(this.userHome, product_1.default.dataFolderName, 'extensions');
        }
        get extensionDevelopmentLocationURI() {
            const s = this._args.extensionDevelopmentPath;
            if (s) {
                if (/^[^:/?#]+?:\/\//.test(s)) {
                    return uri_1.URI.parse(s);
                }
                return uri_1.URI.file(path.normalize(s));
            }
            return undefined;
        }
        get extensionTestsLocationURI() {
            const s = this._args.extensionTestsPath;
            if (s) {
                if (/^[^:/?#]+?:\/\//.test(s)) {
                    return uri_1.URI.parse(s);
                }
                return uri_1.URI.file(path.normalize(s));
            }
            return undefined;
        }
        get disableExtensions() {
            if (this._args['disable-extensions']) {
                return true;
            }
            const disableExtensions = this._args['disable-extension'];
            if (disableExtensions) {
                if (typeof disableExtensions === 'string') {
                    return [disableExtensions];
                }
                if (Array.isArray(disableExtensions) && disableExtensions.length > 0) {
                    return disableExtensions;
                }
            }
            return false;
        }
        get skipGettingStarted() { return !!this._args['skip-getting-started']; }
        get skipReleaseNotes() { return !!this._args['skip-release-notes']; }
        get skipAddToRecentlyOpened() { return !!this._args['skip-add-to-recently-opened']; }
        get debugExtensionHost() { return parseExtensionHostPort(this._args, this.isBuilt); }
        get debugSearch() { return parseSearchPort(this._args, this.isBuilt); }
        get isBuilt() { return !process.env['VSCODE_DEV']; }
        get verbose() { return !!this._args.verbose; }
        get log() { return this._args.log; }
        get wait() { return !!this._args.wait; }
        get logExtensionHostCommunication() { return !!this._args.logExtensionHostCommunication; }
        get status() { return !!this._args.status; }
        get mainIPCHandle() { return getIPCHandle(this.userDataPath, 'main'); }
        get sharedIPCHandle() { return getIPCHandle(this.userDataPath, 'shared'); }
        get nodeCachedDataDir() { return process.env['VSCODE_NODE_CACHED_DATA_DIR'] || undefined; }
        get disableUpdates() { return !!this._args['disable-updates']; }
        get disableCrashReporter() { return !!this._args['disable-crash-reporter']; }
        get driverHandle() { return this._args['driver']; }
        get driverVerbose() { return !!this._args['driver-verbose']; }
    }
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "appRoot", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "cliPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "userHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "userDataPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "appSettingsHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "appSettingsPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "globalStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "workspaceStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "settingsSearchBuildId", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "settingsSearchUrl", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "appKeybindingsPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "isExtensionDevelopment", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "backupHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "backupWorkspacesPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "installSourcePath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "builtinExtensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "extensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "extensionDevelopmentLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "extensionTestsLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "debugExtensionHost", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "debugSearch", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "mainIPCHandle", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "sharedIPCHandle", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentService.prototype, "nodeCachedDataDir", null);
    exports.EnvironmentService = EnvironmentService;
    function parseExtensionHostPort(args, isBuild) {
        return parseDebugPort(args['inspect-extensions'], args['inspect-brk-extensions'], 5870, isBuild, args.debugId);
    }
    exports.parseExtensionHostPort = parseExtensionHostPort;
    function parseSearchPort(args, isBuild) {
        return parseDebugPort(args['inspect-search'], args['inspect-brk-search'], 5876, isBuild);
    }
    exports.parseSearchPort = parseSearchPort;
    function parseDebugPort(debugArg, debugBrkArg, defaultBuildPort, isBuild, debugId) {
        const portStr = debugBrkArg || debugArg;
        const port = Number(portStr) || (!isBuild ? defaultBuildPort : null);
        const brk = port ? Boolean(!!debugBrkArg) : false;
        return { port, break: brk, debugId };
    }
    exports.parseDebugPort = parseDebugPort;
    function parsePathArg(arg, process) {
        if (!arg) {
            return undefined;
        }
        // Determine if the arg is relative or absolute, if relative use the original CWD
        // (VSCODE_CWD), not the potentially overridden one (process.cwd()).
        const resolved = path.resolve(arg);
        if (path.normalize(arg) === resolved) {
            return resolved;
        }
        else {
            return path.resolve(process.env['VSCODE_CWD'] || process.cwd(), arg);
        }
    }
    function parseUserDataDir(args, process) {
        return parsePathArg(args['user-data-dir'], process) || path.resolve(paths.getDefaultUserDataPath(process.platform));
    }
    exports.parseUserDataDir = parseUserDataDir;
});
//# sourceMappingURL=environmentService.js.map