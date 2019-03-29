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
define(["require", "exports", "vs/base/parts/ipc/node/ipc.net", "http", "fs", "vs/base/common/uri", "vs/platform/workspaces/common/workspaces"], function (require, exports, ipc_net_1, http, fs, uri_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CLIServer {
        constructor(_commands) {
            this._commands = _commands;
            this._server = http.createServer((req, res) => this.onRequest(req, res));
            this.setup().catch(err => {
                console.error(err);
                return '';
            });
        }
        get ipcHandlePath() {
            return this._ipcHandlePath;
        }
        setup() {
            return __awaiter(this, void 0, void 0, function* () {
                this._ipcHandlePath = ipc_net_1.generateRandomPipeName();
                try {
                    this._server.listen(this.ipcHandlePath);
                    this._server.on('error', err => console.error(err));
                }
                catch (err) {
                    console.error('Could not start open from terminal server.');
                }
                return this._ipcHandlePath;
            });
        }
        collectURIToOpen(strs, typeHint, result) {
            if (Array.isArray(strs)) {
                for (const s of strs) {
                    try {
                        result.push({ uri: uri_1.URI.parse(s), typeHint });
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
        }
        onRequest(req, res) {
            const chunks = [];
            req.setEncoding('utf8');
            req.on('data', (d) => chunks.push(d));
            req.on('end', () => {
                const data = JSON.parse(chunks.join(''));
                switch (data.type) {
                    case 'open':
                        this.open(data, res);
                        break;
                    default:
                        res.writeHead(404);
                        res.write(`Unkown message type: ${data.type}`, err => {
                            if (err) {
                                console.error(err);
                            }
                        });
                        res.end();
                        break;
                }
            });
        }
        open(data, res) {
            let { fileURIs, folderURIs, forceNewWindow, diffMode, addMode, forceReuseWindow } = data;
            if (folderURIs && folderURIs.length || fileURIs && fileURIs.length) {
                const urisToOpen = [];
                this.collectURIToOpen(folderURIs, 'folder', urisToOpen);
                this.collectURIToOpen(fileURIs, 'file', urisToOpen);
                if (!forceReuseWindow && urisToOpen.some(o => o.typeHint === 'folder' || (o.typeHint === 'file' && workspaces_1.hasWorkspaceFileExtension(o.uri.path)))) {
                    forceNewWindow = true;
                }
                this._commands.executeCommand('_files.windowOpen', urisToOpen, { forceNewWindow, diffMode, addMode, forceReuseWindow });
            }
            res.writeHead(200);
            res.end();
        }
        dispose() {
            this._server.close();
            if (this._ipcHandlePath && process.platform !== 'win32' && fs.existsSync(this._ipcHandlePath)) {
                fs.unlinkSync(this._ipcHandlePath);
            }
        }
    }
    exports.CLIServer = CLIServer;
});
//# sourceMappingURL=extHostCLIServer.js.map