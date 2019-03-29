/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/path", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/json", "vs/base/node/extfs", "vs/base/common/platform"], function (require, exports, fs, path_1, objects, lifecycle_1, event_1, json, extfs, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A simple helper to watch a configured file for changes and process its contents as JSON object.
     * Supports:
     * - comments in JSON files and errors
     * - symlinks for the config file itself
     * - delayed processing of changes to accomodate for lots of changes
     * - configurable defaults
     */
    class ConfigWatcher {
        constructor(_path, options = { defaultConfig: Object.create(null), onError: error => console.error(error) }) {
            this._path = _path;
            this.options = options;
            this.disposables = [];
            this.configName = path_1.basename(this._path);
            this._onDidUpdateConfiguration = new event_1.Emitter();
            this.disposables.push(this._onDidUpdateConfiguration);
            this.registerWatcher();
            this.initAsync();
        }
        get path() {
            return this._path;
        }
        get hasParseErrors() {
            return this.parseErrors && this.parseErrors.length > 0;
        }
        get onDidUpdateConfiguration() {
            return this._onDidUpdateConfiguration.event;
        }
        initAsync() {
            this.loadAsync(config => {
                if (!this.loaded) {
                    this.updateCache(config); // prevent race condition if config was loaded sync already
                }
                if (this.options.initCallback) {
                    this.options.initCallback(this.getConfig());
                }
            });
        }
        updateCache(value) {
            this.cache = value;
            this.loaded = true;
        }
        loadSync() {
            try {
                return this.parse(fs.readFileSync(this._path).toString());
            }
            catch (error) {
                return this.options.defaultConfig;
            }
        }
        loadAsync(callback) {
            fs.readFile(this._path, (error, raw) => {
                if (error) {
                    return callback(this.options.defaultConfig);
                }
                return callback(this.parse(raw.toString()));
            });
        }
        parse(raw) {
            let res;
            try {
                this.parseErrors = [];
                res = this.options.parse ? this.options.parse(raw, this.parseErrors) : json.parse(raw, this.parseErrors);
                return res || this.options.defaultConfig;
            }
            catch (error) {
                // Ignore parsing errors
                return this.options.defaultConfig;
            }
        }
        registerWatcher() {
            // Watch the parent of the path so that we detect ADD and DELETES
            const parentFolder = path_1.dirname(this._path);
            this.watch(parentFolder, true);
            // Check if the path is a symlink and watch its target if so
            fs.lstat(this._path, (err, stat) => {
                if (err || stat.isDirectory()) {
                    return; // path is not a valid file
                }
                // We found a symlink
                if (stat.isSymbolicLink()) {
                    fs.readlink(this._path, (err, realPath) => {
                        if (err) {
                            return; // path is not a valid symlink
                        }
                        this.watch(realPath, false);
                    });
                }
            });
        }
        watch(path, isParentFolder) {
            if (this.disposed) {
                return; // avoid watchers that will never get disposed by checking for being disposed
            }
            this.disposables.push(extfs.watch(path, (type, file) => this.onConfigFileChange(type, file, isParentFolder), (error) => this.options.onError(error)));
        }
        onConfigFileChange(eventType, filename, isParentFolder) {
            if (isParentFolder) {
                // Windows: in some cases the filename contains artifacts from the absolute path
                // see https://github.com/nodejs/node/issues/19170
                // As such, we have to ensure that the filename basename is used for comparison.
                if (platform_1.isWindows && filename && filename !== this.configName) {
                    filename = path_1.basename(filename);
                }
                if (filename !== this.configName) {
                    return; // a change to a sibling file that is not our config file
                }
            }
            if (this.timeoutHandle) {
                global.clearTimeout(this.timeoutHandle);
                this.timeoutHandle = null;
            }
            // we can get multiple change events for one change, so we buffer through a timeout
            this.timeoutHandle = global.setTimeout(() => this.reload(), this.options.changeBufferDelay || 0);
        }
        reload(callback) {
            this.loadAsync(currentConfig => {
                if (!objects.equals(currentConfig, this.cache)) {
                    this.updateCache(currentConfig);
                    this._onDidUpdateConfiguration.fire({ config: this.cache });
                }
                if (callback) {
                    return callback(currentConfig);
                }
            });
        }
        getConfig() {
            this.ensureLoaded();
            return this.cache;
        }
        ensureLoaded() {
            if (!this.loaded) {
                this.updateCache(this.loadSync());
            }
        }
        dispose() {
            this.disposed = true;
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    }
    exports.ConfigWatcher = ConfigWatcher;
});
//# sourceMappingURL=config.js.map