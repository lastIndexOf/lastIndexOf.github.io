/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "fs", "vs/base/common/path", "vs/base/common/json"], function (require, exports, fs_1, path_1, json_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function asSortedItems(map) {
        const a = [];
        map.forEach((value, index) => a.push({ name: index, count: value }));
        return a.sort((a, b) => b.count - a.count);
    }
    function collectLaunchConfigs(folder) {
        const launchConfigs = new Map();
        const launchConfig = path_1.join(folder, '.vscode', 'launch.json');
        return new Promise((resolve, reject) => {
            fs_1.exists(launchConfig, (doesExist) => {
                if (doesExist) {
                    fs_1.readFile(launchConfig, (err, contents) => {
                        if (err) {
                            return resolve([]);
                        }
                        const errors = [];
                        const json = json_1.parse(contents.toString(), errors);
                        if (errors.length) {
                            console.log(`Unable to parse ${launchConfig}`);
                            return resolve([]);
                        }
                        if (json['configurations']) {
                            for (const each of json['configurations']) {
                                const type = each['type'];
                                if (type) {
                                    if (launchConfigs.has(type)) {
                                        launchConfigs.set(type, launchConfigs.get(type) + 1);
                                    }
                                    else {
                                        launchConfigs.set(type, 1);
                                    }
                                }
                            }
                        }
                        return resolve(asSortedItems(launchConfigs));
                    });
                }
                else {
                    return resolve([]);
                }
            });
        });
    }
    exports.collectLaunchConfigs = collectLaunchConfigs;
    function collectWorkspaceStats(folder, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const configFilePatterns = [
                { 'tag': 'grunt.js', 'pattern': /^gruntfile\.js$/i },
                { 'tag': 'gulp.js', 'pattern': /^gulpfile\.js$/i },
                { 'tag': 'tsconfig.json', 'pattern': /^tsconfig\.json$/i },
                { 'tag': 'package.json', 'pattern': /^package\.json$/i },
                { 'tag': 'jsconfig.json', 'pattern': /^jsconfig\.json$/i },
                { 'tag': 'tslint.json', 'pattern': /^tslint\.json$/i },
                { 'tag': 'eslint.json', 'pattern': /^eslint\.json$/i },
                { 'tag': 'tasks.json', 'pattern': /^tasks\.json$/i },
                { 'tag': 'launch.json', 'pattern': /^launch\.json$/i },
                { 'tag': 'settings.json', 'pattern': /^settings\.json$/i },
                { 'tag': 'webpack.config.js', 'pattern': /^webpack\.config\.js$/i },
                { 'tag': 'project.json', 'pattern': /^project\.json$/i },
                { 'tag': 'makefile', 'pattern': /^makefile$/i },
                { 'tag': 'sln', 'pattern': /^.+\.sln$/i },
                { 'tag': 'csproj', 'pattern': /^.+\.csproj$/i },
                { 'tag': 'cmake', 'pattern': /^.+\.cmake$/i }
            ];
            const fileTypes = new Map();
            const configFiles = new Map();
            const MAX_FILES = 20000;
            function walk(dir, filter, token, done) {
                let results = [];
                fs_1.readdir(dir, (err, files) => __awaiter(this, void 0, void 0, function* () {
                    // Ignore folders that can't be read
                    if (err) {
                        return done(results);
                    }
                    let pending = files.length;
                    if (pending === 0) {
                        return done(results);
                    }
                    for (const file of files) {
                        if (token.maxReached) {
                            return done(results);
                        }
                        fs_1.stat(path_1.join(dir, file), (err, stats) => {
                            // Ignore files that can't be read
                            if (err) {
                                if (--pending === 0) {
                                    return done(results);
                                }
                            }
                            else {
                                if (stats.isDirectory()) {
                                    if (filter.indexOf(file) === -1) {
                                        walk(path_1.join(dir, file), filter, token, (res) => {
                                            results = results.concat(res);
                                            if (--pending === 0) {
                                                return done(results);
                                            }
                                        });
                                    }
                                    else {
                                        if (--pending === 0) {
                                            done(results);
                                        }
                                    }
                                }
                                else {
                                    if (token.count >= MAX_FILES) {
                                        token.maxReached = true;
                                    }
                                    token.count++;
                                    results.push(file);
                                    if (--pending === 0) {
                                        done(results);
                                    }
                                }
                            }
                        });
                    }
                }));
            }
            const addFileType = (fileType) => {
                if (fileTypes.has(fileType)) {
                    fileTypes.set(fileType, fileTypes.get(fileType) + 1);
                }
                else {
                    fileTypes.set(fileType, 1);
                }
            };
            const addConfigFiles = (fileName) => {
                for (const each of configFilePatterns) {
                    if (each.pattern.test(fileName)) {
                        if (configFiles.has(each.tag)) {
                            configFiles.set(each.tag, configFiles.get(each.tag) + 1);
                        }
                        else {
                            configFiles.set(each.tag, 1);
                        }
                    }
                }
            };
            const acceptFile = (name) => {
                if (name.lastIndexOf('.') >= 0) {
                    const suffix = name.split('.').pop();
                    if (suffix) {
                        addFileType(suffix);
                    }
                }
                addConfigFiles(name);
            };
            const token = { count: 0, maxReached: false };
            return new Promise((resolve, reject) => {
                walk(folder, filter, token, (files) => __awaiter(this, void 0, void 0, function* () {
                    files.forEach(acceptFile);
                    const launchConfigs = yield collectLaunchConfigs(folder);
                    resolve({
                        configFiles: asSortedItems(configFiles),
                        fileTypes: asSortedItems(fileTypes),
                        fileCount: token.count,
                        maxFilesReached: token.maxReached,
                        launchConfigFiles: launchConfigs
                    });
                }));
            });
        });
    }
    exports.collectWorkspaceStats = collectWorkspaceStats;
});
//# sourceMappingURL=stats.js.map