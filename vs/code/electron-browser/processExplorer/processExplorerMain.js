/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/ps", "electron", "vs/base/common/strings", "os", "vs/platform/product/node/product", "vs/nls", "vs/base/browser/browser", "vs/base/common/platform", "vs/base/parts/contextmenu/electron-browser/contextmenu", "vs/css!./media/processExplorer"], function (require, exports, ps_1, electron_1, strings_1, os_1, product_1, nls_1, browser, platform, contextmenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let processList;
    let mapPidToWindowTitle = new Map();
    const DEBUG_FLAGS_PATTERN = /\s--(inspect|debug)(-brk|port)?=(\d+)?/;
    const DEBUG_PORT_PATTERN = /\s--(inspect|debug)-port=(\d+)/;
    function getProcessList(rootProcess) {
        const processes = [];
        if (rootProcess) {
            getProcessItem(processes, rootProcess, 0);
        }
        return processes;
    }
    function getProcessItem(processes, item, indent) {
        const isRoot = (indent === 0);
        const MB = 1024 * 1024;
        let name = item.name;
        if (isRoot) {
            name = `${product_1.default.applicationName} main`;
        }
        if (name === 'window') {
            const windowTitle = mapPidToWindowTitle.get(item.pid);
            name = windowTitle !== undefined ? `${name} (${mapPidToWindowTitle.get(item.pid)})` : name;
        }
        // Format name with indent
        const formattedName = isRoot ? name : `${strings_1.repeat('    ', indent)} ${name}`;
        const memory = process.platform === 'win32' ? item.mem : (os_1.totalmem() * (item.mem / 100));
        processes.push({
            cpu: Number(item.load.toFixed(0)),
            memory: Number((memory / MB).toFixed(0)),
            pid: Number((item.pid).toFixed(0)),
            name,
            formattedName,
            cmd: item.cmd
        });
        // Recurse into children if any
        if (Array.isArray(item.children)) {
            item.children.forEach(child => getProcessItem(processes, child, indent + 1));
        }
    }
    function isDebuggable(cmd) {
        const matches = DEBUG_FLAGS_PATTERN.exec(cmd);
        return (matches && matches.length >= 2) || cmd.indexOf('node ') >= 0 || cmd.indexOf('node.exe') >= 0;
    }
    function attachTo(item) {
        const config = {
            type: 'node',
            request: 'attach',
            name: `process ${item.pid}`
        };
        let matches = DEBUG_FLAGS_PATTERN.exec(item.cmd);
        if (matches && matches.length >= 2) {
            // attach via port
            if (matches.length === 4 && matches[3]) {
                config.port = parseInt(matches[3]);
            }
            config.protocol = matches[1] === 'debug' ? 'legacy' : 'inspector';
        }
        else {
            // no port -> try to attach via pid (send SIGUSR1)
            config.processId = String(item.pid);
        }
        // a debug-port=n or inspect-port=n overrides the port
        matches = DEBUG_PORT_PATTERN.exec(item.cmd);
        if (matches && matches.length === 3) {
            // override port
            config.port = parseInt(matches[2]);
        }
        electron_1.ipcRenderer.send('vscode:workbenchCommand', { id: 'debug.startFromConfig', from: 'processExplorer', args: [config] });
    }
    function getProcessIdWithHighestProperty(processList, propertyName) {
        let max = 0;
        let maxProcessId;
        processList.forEach(process => {
            if (process[propertyName] > max) {
                max = process[propertyName];
                maxProcessId = process.pid;
            }
        });
        return maxProcessId;
    }
    function updateProcessInfo(processList) {
        const container = document.getElementById('process-list');
        if (!container) {
            return;
        }
        container.innerHTML = '';
        const highestCPUProcess = getProcessIdWithHighestProperty(processList, 'cpu');
        const highestMemoryProcess = getProcessIdWithHighestProperty(processList, 'memory');
        const tableHead = document.createElement('thead');
        tableHead.innerHTML = `<tr>
		<th scope="col" class="cpu">${nls_1.localize('cpu', "CPU %")}</th>
		<th scope="col" class="memory">${nls_1.localize('memory', "Memory (MB)")}</th>
		<th scope="col" class="pid">${nls_1.localize('pid', "pid")}</th>
		<th scope="col" class="nameLabel">${nls_1.localize('name', "Name")}</th>
	</tr>`;
        const tableBody = document.createElement('tbody');
        processList.forEach(p => {
            const row = document.createElement('tr');
            row.id = p.pid;
            const cpu = document.createElement('td');
            p.pid === highestCPUProcess
                ? cpu.classList.add('centered', 'highest')
                : cpu.classList.add('centered');
            cpu.textContent = p.cpu;
            const memory = document.createElement('td');
            p.pid === highestMemoryProcess
                ? memory.classList.add('centered', 'highest')
                : memory.classList.add('centered');
            memory.textContent = p.memory;
            const pid = document.createElement('td');
            pid.classList.add('centered');
            pid.textContent = p.pid;
            const name = document.createElement('th');
            name.scope = 'row';
            name.classList.add('data');
            name.title = p.cmd;
            name.textContent = p.formattedName;
            row.append(cpu, memory, pid, name);
            tableBody.appendChild(row);
        });
        container.append(tableHead, tableBody);
    }
    function applyStyles(styles) {
        const styleTag = document.createElement('style');
        const content = [];
        if (styles.hoverBackground) {
            content.push(`tbody > tr:hover  { background-color: ${styles.hoverBackground}; }`);
        }
        if (styles.hoverForeground) {
            content.push(`tbody > tr:hover{ color: ${styles.hoverForeground}; }`);
        }
        if (styles.highlightForeground) {
            content.push(`.highest { color: ${styles.highlightForeground}; }`);
        }
        styleTag.innerHTML = content.join('\n');
        if (document.head) {
            document.head.appendChild(styleTag);
        }
        if (styles.color) {
            document.body.style.color = styles.color;
        }
    }
    function applyZoom(zoomLevel) {
        electron_1.webFrame.setZoomLevel(zoomLevel);
        browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
        // See https://github.com/Microsoft/vscode/issues/26151
        // Cannot be trusted because the webFrame might take some time
        // until it really applies the new zoom level
        browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
    }
    function showContextMenu(e) {
        e.preventDefault();
        const items = [];
        const pid = parseInt(e.currentTarget.id);
        if (pid && typeof pid === 'number') {
            items.push({
                label: nls_1.localize('killProcess', "Kill Process"),
                click() {
                    process.kill(pid, 'SIGTERM');
                }
            });
            items.push({
                label: nls_1.localize('forceKillProcess', "Force Kill Process"),
                click() {
                    process.kill(pid, 'SIGKILL');
                }
            });
            items.push({
                type: 'separator'
            });
            items.push({
                label: nls_1.localize('copy', "Copy"),
                click() {
                    const row = document.getElementById(pid.toString());
                    if (row) {
                        electron_1.clipboard.writeText(row.innerText);
                    }
                }
            });
            items.push({
                label: nls_1.localize('copyAll', "Copy All"),
                click() {
                    const processList = document.getElementById('process-list');
                    if (processList) {
                        electron_1.clipboard.writeText(processList.innerText);
                    }
                }
            });
            const item = processList.filter(process => process.pid === pid)[0];
            if (item && isDebuggable(item.cmd)) {
                items.push({
                    type: 'separator'
                });
                items.push({
                    label: nls_1.localize('debug', "Debug"),
                    click() {
                        attachTo(item);
                    }
                });
            }
        }
        else {
            items.push({
                label: nls_1.localize('copyAll', "Copy All"),
                click() {
                    const processList = document.getElementById('process-list');
                    if (processList) {
                        electron_1.clipboard.writeText(processList.innerText);
                    }
                }
            });
        }
        contextmenu_1.popup(items);
    }
    function startup(data) {
        applyStyles(data.styles);
        applyZoom(data.zoomLevel);
        // Map window process pids to titles, annotate process names with this when rendering to distinguish between them
        electron_1.ipcRenderer.on('vscode:windowsInfoResponse', (event, windows) => {
            mapPidToWindowTitle = new Map();
            windows.forEach(window => mapPidToWindowTitle.set(window.pid, window.title));
        });
        setInterval(() => {
            electron_1.ipcRenderer.send('windowsInfoRequest');
            ps_1.listProcesses(data.pid).then(processes => {
                processList = getProcessList(processes);
                updateProcessInfo(processList);
                const tableRows = document.getElementsByTagName('tr');
                for (let i = 0; i < tableRows.length; i++) {
                    const tableRow = tableRows[i];
                    tableRow.addEventListener('contextmenu', (e) => {
                        showContextMenu(e);
                    });
                }
            });
        }, 1200);
        document.onkeydown = (e) => {
            const cmdOrCtrlKey = platform.isMacintosh ? e.metaKey : e.ctrlKey;
            // Cmd/Ctrl + zooms in
            if (cmdOrCtrlKey && e.keyCode === 187) {
                applyZoom(electron_1.webFrame.getZoomLevel() + 1);
            }
            // Cmd/Ctrl - zooms out
            if (cmdOrCtrlKey && e.keyCode === 189) {
                applyZoom(electron_1.webFrame.getZoomLevel() - 1);
            }
        };
    }
    exports.startup = startup;
});
//# sourceMappingURL=processExplorerMain.js.map