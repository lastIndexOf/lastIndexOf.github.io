/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "vs/base/common/errors", "vs/base/common/event", "vs/base/parts/ipc/node/ipc.net", "vs/platform/product/node/product", "vs/workbench/services/extensions/node/extensionHostProtocol", "vs/workbench/services/extensions/node/extensionHostMain"], function (require, exports, net_1, errors_1, event_1, ipc_net_1, product_1, extensionHostProtocol_1, extensionHostMain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // With Electron 2.x and node.js 8.x the "natives" module
    // can cause a native crash (see https://github.com/nodejs/node/issues/19891 and
    // https://github.com/electron/electron/issues/10905). To prevent this from
    // happening we essentially blocklist this module from getting loaded in any
    // extension by patching the node require() function.
    (function () {
        if (process.env.isBrowser) {
            console.log('this is a browser child process', self);
            return;
        }
        const Module = require.__$__nodeRequire('module');
        const originalLoad = Module._load;
        Module._load = function (request) {
            if (request === 'natives') {
                throw new Error('Either the extension or a NPM dependency is using the "natives" node module which is unsupported as it can cause a crash of the extension host. Click [here](https://go.microsoft.com/fwlink/?linkid=871887) to find out more');
            }
            return originalLoad.apply(this, arguments);
        };
    })();
    // This calls exit directly in case the initialization is not finished and we need to exit
    // Otherwise, if initialization completed we go to extensionHostMain.terminate()
    let onTerminate = function () {
        extensionHostMain_1.exit();
    };
    function createExtHostProtocol() {
        const pipeName = process.env.isBrowser ? 'VSCODE_IPC_HOOK_EXTHOST' : process.env.VSCODE_IPC_HOOK_EXTHOST;
        return new Promise((resolve, reject) => {
            const socket = net_1.createConnection(pipeName, () => {
                socket.removeListener('error', reject);
                resolve(new ipc_net_1.Protocol(socket));
            });
            socket.once('error', reject);
        }).then(protocol => {
            return new class {
                constructor() {
                    this._terminating = false;
                    this.onMessage = event_1.Event.filter(protocol.onMessage, msg => {
                        if (!extensionHostProtocol_1.isMessageOfType(msg, 2 /* Terminate */)) {
                            return true;
                        }
                        this._terminating = true;
                        onTerminate();
                        return false;
                    });
                }
                send(msg) {
                    if (!this._terminating) {
                        protocol.send(msg);
                    }
                }
            };
        });
    }
    function connectToRenderer(protocol) {
        return new Promise((c, e) => {
            // Listen init data message
            const first = protocol.onMessage(raw => {
                console.log(raw.toString());
                first.dispose();
                const initData = JSON.parse(raw.toString());
                const rendererCommit = initData.commit;
                const myCommit = product_1.default.commit;
                if (rendererCommit && myCommit) {
                    // Running in the built version where commits are defined
                    if (rendererCommit !== myCommit) {
                        extensionHostMain_1.exit(55);
                    }
                }
                // Print a console message when rejection isn't handled within N seconds. For details:
                // see https://nodejs.org/api/process.html#process_event_unhandledrejection
                // and https://nodejs.org/api/process.html#process_event_rejectionhandled
                const unhandledPromises = [];
                process.on('unhandledRejection', (reason, promise) => {
                    unhandledPromises.push(promise);
                    setTimeout(() => {
                        const idx = unhandledPromises.indexOf(promise);
                        if (idx >= 0) {
                            promise.catch(e => {
                                unhandledPromises.splice(idx, 1);
                                console.warn(`rejected promise not handled within 1 second: ${e}`);
                                if (e.stack) {
                                    console.warn(`stack trace: ${e.stack}`);
                                }
                                errors_1.onUnexpectedError(reason);
                            });
                        }
                    }, 1000);
                });
                process.on('rejectionHandled', (promise) => {
                    const idx = unhandledPromises.indexOf(promise);
                    if (idx >= 0) {
                        unhandledPromises.splice(idx, 1);
                    }
                });
                // Print a console message when an exception isn't handled.
                process.on('uncaughtException', function (err) {
                    errors_1.onUnexpectedError(err);
                });
                // Kill oneself if one's parent dies. Much drama.
                setInterval(function () {
                    try {
                        process.kill(initData.parentPid, 0); // throws an exception if the main process doesn't exist anymore.
                    }
                    catch (e) {
                        onTerminate();
                    }
                }, 1000);
                // In certain cases, the event loop can become busy and never yield
                // e.g. while-true or process.nextTick endless loops
                // So also use the native node module to do it from a separate thread
                let watchdog;
                try {
                    if (process.env.isBrowser) {
                        watchdog = self['require'].__$__nodeRequire('native-watchdog');
                    }
                    else {
                        watchdog = require.__$__nodeRequire('native-watchdog');
                    }
                    watchdog.start(initData.parentPid);
                }
                catch (err) {
                    // no problem...
                    errors_1.onUnexpectedError(err);
                }
                // Tell the outside that we are initialized
                protocol.send(extensionHostProtocol_1.createMessageOfType(0 /* Initialized */));
                c({ protocol, initData });
            });
            // Tell the outside that we are ready to receive messages
            protocol.send(extensionHostProtocol_1.createMessageOfType(1 /* Ready */));
        });
    }
    patchExecArgv();
    createExtHostProtocol().then(protocol => {
        // connect to main side
        return connectToRenderer(protocol);
    }).then(renderer => {
        // setup things
        const extensionHostMain = new extensionHostMain_1.ExtensionHostMain(renderer.protocol, renderer.initData);
        onTerminate = () => extensionHostMain.terminate();
    }).catch(err => console.error(err));
    function patchExecArgv() {
        // when encountering the prevent-inspect flag we delete this
        // and the prior flag
        if (process.env.VSCODE_PREVENT_FOREIGN_INSPECT) {
            for (let i = 0; i < process.execArgv.length; i++) {
                if (process.execArgv[i].match(/--inspect-brk=\d+|--inspect=\d+/)) {
                    process.execArgv.splice(i, 1);
                    break;
                }
            }
        }
    }
});
//# sourceMappingURL=extensionHostProcess.js.map