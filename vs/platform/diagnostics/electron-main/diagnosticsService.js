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
define(["require", "exports", "vs/base/node/stats", "vs/base/node/ps", "vs/platform/product/node/product", "vs/platform/product/node/package", "os", "vs/base/node/id", "vs/base/common/strings", "vs/base/common/platform", "electron", "vs/base/common/path", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation"], function (require, exports, stats_1, ps_1, product_1, package_1, os, id_1, strings_1, platform_1, electron_1, path_1, uri_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ID = 'diagnosticsService';
    exports.IDiagnosticsService = instantiation_1.createDecorator(exports.ID);
    class DiagnosticsService {
        formatEnvironment(info) {
            const MB = 1024 * 1024;
            const GB = 1024 * MB;
            const output = [];
            output.push(`Version:          ${package_1.default.name} ${package_1.default.version} (${product_1.default.commit || 'Commit unknown'}, ${product_1.default.date || 'Date unknown'})`);
            output.push(`OS Version:       ${os.type()} ${os.arch()} ${os.release()}`);
            const cpus = os.cpus();
            if (cpus && cpus.length > 0) {
                output.push(`CPUs:             ${cpus[0].model} (${cpus.length} x ${cpus[0].speed})`);
            }
            output.push(`Memory (System):  ${(os.totalmem() / GB).toFixed(2)}GB (${(os.freemem() / GB).toFixed(2)}GB free)`);
            if (!platform_1.isWindows) {
                output.push(`Load (avg):       ${os.loadavg().map(l => Math.round(l)).join(', ')}`); // only provided on Linux/macOS
            }
            output.push(`VM:               ${Math.round((id_1.virtualMachineHint.value() * 100))}%`);
            output.push(`Screen Reader:    ${electron_1.app.isAccessibilitySupportEnabled() ? 'yes' : 'no'}`);
            output.push(`Process Argv:     ${info.mainArguments.join(' ')}`);
            output.push(`GPU Status:       ${this.expandGPUFeatures()}`);
            return output.join('\n');
        }
        getPerformanceInfo(info) {
            return ps_1.listProcesses(info.mainPID).then(rootProcess => {
                const workspaceInfoMessages = [];
                // Workspace Stats
                const workspaceStatPromises = [];
                if (info.windows.some(window => window.folderURIs && window.folderURIs.length > 0)) {
                    info.windows.forEach(window => {
                        if (window.folderURIs.length === 0) {
                            return;
                        }
                        workspaceInfoMessages.push(`|  Window (${window.title})`);
                        window.folderURIs.forEach(uriComponents => {
                            const folderUri = uri_1.URI.revive(uriComponents);
                            if (folderUri.scheme === 'file') {
                                const folder = folderUri.fsPath;
                                workspaceStatPromises.push(stats_1.collectWorkspaceStats(folder, ['node_modules', '.git']).then((stats) => __awaiter(this, void 0, void 0, function* () {
                                    let countMessage = `${stats.fileCount} files`;
                                    if (stats.maxFilesReached) {
                                        countMessage = `more than ${countMessage}`;
                                    }
                                    workspaceInfoMessages.push(`|    Folder (${path_1.basename(folder)}): ${countMessage}`);
                                    workspaceInfoMessages.push(this.formatWorkspaceStats(stats));
                                })));
                            }
                            else {
                                workspaceInfoMessages.push(`|    Folder (${folderUri.toString()}): RPerformance stats not available.`);
                            }
                        });
                    });
                }
                return Promise.all(workspaceStatPromises).then(() => {
                    return {
                        processInfo: this.formatProcessList(info, rootProcess),
                        workspaceInfo: workspaceInfoMessages.join('\n')
                    };
                }).catch(error => {
                    return {
                        processInfo: this.formatProcessList(info, rootProcess),
                        workspaceInfo: `Unable to calculate workspace stats: ${error}`
                    };
                });
            });
        }
        getSystemInfo(info) {
            const MB = 1024 * 1024;
            const GB = 1024 * MB;
            const systemInfo = {
                'Memory (System)': `${(os.totalmem() / GB).toFixed(2)}GB (${(os.freemem() / GB).toFixed(2)}GB free)`,
                VM: `${Math.round((id_1.virtualMachineHint.value() * 100))}%`,
                'Screen Reader': `${electron_1.app.isAccessibilitySupportEnabled() ? 'yes' : 'no'}`,
                'Process Argv': `${info.mainArguments.join(' ')}`,
                'GPU Status': electron_1.app.getGPUFeatureStatus()
            };
            const cpus = os.cpus();
            if (cpus && cpus.length > 0) {
                systemInfo.CPUs = `${cpus[0].model} (${cpus.length} x ${cpus[0].speed})`;
            }
            if (!platform_1.isWindows) {
                systemInfo['Load (avg)'] = `${os.loadavg().map(l => Math.round(l)).join(', ')}`;
            }
            return systemInfo;
        }
        printDiagnostics(info) {
            return ps_1.listProcesses(info.mainPID).then(rootProcess => {
                // Environment Info
                console.log('');
                console.log(this.formatEnvironment(info));
                // Process List
                console.log('');
                console.log(this.formatProcessList(info, rootProcess));
                // Workspace Stats
                const workspaceStatPromises = [];
                if (info.windows.some(window => window.folderURIs && window.folderURIs.length > 0)) {
                    console.log('');
                    console.log('Workspace Stats: ');
                    info.windows.forEach(window => {
                        if (window.folderURIs.length === 0) {
                            return;
                        }
                        console.log(`|  Window (${window.title})`);
                        window.folderURIs.forEach(uriComponents => {
                            const folderUri = uri_1.URI.revive(uriComponents);
                            if (folderUri.scheme === 'file') {
                                const folder = folderUri.fsPath;
                                workspaceStatPromises.push(stats_1.collectWorkspaceStats(folder, ['node_modules', '.git']).then((stats) => __awaiter(this, void 0, void 0, function* () {
                                    let countMessage = `${stats.fileCount} files`;
                                    if (stats.maxFilesReached) {
                                        countMessage = `more than ${countMessage}`;
                                    }
                                    console.log(`|    Folder (${path_1.basename(folder)}): ${countMessage}`);
                                    console.log(this.formatWorkspaceStats(stats));
                                })).catch(error => {
                                    console.log(`|      Error: Unable to collect workspace stats for folder ${folder} (${error.toString()})`);
                                }));
                            }
                            else {
                                console.log(`|    Folder (${folderUri.toString()}): Workspace stats not available.`);
                            }
                        });
                    });
                }
                return Promise.all(workspaceStatPromises).then(() => {
                    console.log('');
                    console.log('');
                });
            });
        }
        formatWorkspaceStats(workspaceStats) {
            const output = [];
            const lineLength = 60;
            let col = 0;
            const appendAndWrap = (name, count) => {
                const item = ` ${name}(${count})`;
                if (col + item.length > lineLength) {
                    output.push(line);
                    line = '|                 ';
                    col = line.length;
                }
                else {
                    col += item.length;
                }
                line += item;
            };
            // File Types
            let line = '|      File types:';
            const maxShown = 10;
            let max = workspaceStats.fileTypes.length > maxShown ? maxShown : workspaceStats.fileTypes.length;
            for (let i = 0; i < max; i++) {
                const item = workspaceStats.fileTypes[i];
                appendAndWrap(item.name, item.count);
            }
            output.push(line);
            // Conf Files
            if (workspaceStats.configFiles.length >= 0) {
                line = '|      Conf files:';
                col = 0;
                workspaceStats.configFiles.forEach((item) => {
                    appendAndWrap(item.name, item.count);
                });
                output.push(line);
            }
            if (workspaceStats.launchConfigFiles.length > 0) {
                let line = '|      Launch Configs:';
                workspaceStats.launchConfigFiles.forEach(each => {
                    const item = each.count > 1 ? ` ${each.name}(${each.count})` : ` ${each.name}`;
                    line += item;
                });
                output.push(line);
            }
            return output.join('\n');
        }
        expandGPUFeatures() {
            const gpuFeatures = electron_1.app.getGPUFeatureStatus();
            const longestFeatureName = Math.max(...Object.keys(gpuFeatures).map(feature => feature.length));
            // Make columns aligned by adding spaces after feature name
            return Object.keys(gpuFeatures).map(feature => `${feature}:  ${strings_1.repeat(' ', longestFeatureName - feature.length)}  ${gpuFeatures[feature]}`).join('\n                  ');
        }
        formatProcessList(info, rootProcess) {
            const mapPidToWindowTitle = new Map();
            info.windows.forEach(window => mapPidToWindowTitle.set(window.pid, window.title));
            const output = [];
            output.push('CPU %\tMem MB\t   PID\tProcess');
            if (rootProcess) {
                this.formatProcessItem(mapPidToWindowTitle, output, rootProcess, 0);
            }
            return output.join('\n');
        }
        formatProcessItem(mapPidToWindowTitle, output, item, indent) {
            const isRoot = (indent === 0);
            const MB = 1024 * 1024;
            // Format name with indent
            let name;
            if (isRoot) {
                name = `${product_1.default.applicationName} main`;
            }
            else {
                name = `${strings_1.repeat('  ', indent)} ${item.name}`;
                if (item.name === 'window') {
                    name = `${name} (${mapPidToWindowTitle.get(item.pid)})`;
                }
            }
            const memory = process.platform === 'win32' ? item.mem : (os.totalmem() * (item.mem / 100));
            output.push(`${strings_1.pad(Number(item.load.toFixed(0)), 5, ' ')}\t${strings_1.pad(Number((memory / MB).toFixed(0)), 6, ' ')}\t${strings_1.pad(Number((item.pid).toFixed(0)), 6, ' ')}\t${name}`);
            // Recurse into children if any
            if (Array.isArray(item.children)) {
                item.children.forEach(child => this.formatProcessItem(mapPidToWindowTitle, output, child, indent + 1));
            }
        }
    }
    exports.DiagnosticsService = DiagnosticsService;
});
//# sourceMappingURL=diagnosticsService.js.map