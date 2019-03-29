/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uuid", "os", "vs/base/common/map"], function (require, exports, errors, uuid, os_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // http://www.techrepublic.com/blog/data-center/mac-address-scorecard-for-common-virtual-machine-platforms/
    // VMware ESX 3, Server, Workstation, Player	00-50-56, 00-0C-29, 00-05-69
    // Microsoft Hyper-V, Virtual Server, Virtual PC	00-03-FF
    // Parallells Desktop, Workstation, Server, Virtuozzo	00-1C-42
    // Virtual Iron 4	00-0F-4B
    // Red Hat Xen	00-16-3E
    // Oracle VM	00-16-3E
    // XenSource	00-16-3E
    // Novell Xen	00-16-3E
    // Sun xVM VirtualBox	08-00-27
    exports.virtualMachineHint = new class {
        _isVirtualMachineMacAdress(mac) {
            if (!this._virtualMachineOUIs) {
                this._virtualMachineOUIs = map_1.TernarySearchTree.forStrings();
                // dash-separated
                this._virtualMachineOUIs.set('00-50-56', true);
                this._virtualMachineOUIs.set('00-0C-29', true);
                this._virtualMachineOUIs.set('00-05-69', true);
                this._virtualMachineOUIs.set('00-03-FF', true);
                this._virtualMachineOUIs.set('00-1C-42', true);
                this._virtualMachineOUIs.set('00-16-3E', true);
                this._virtualMachineOUIs.set('08-00-27', true);
                // colon-separated
                this._virtualMachineOUIs.set('00:50:56', true);
                this._virtualMachineOUIs.set('00:0C:29', true);
                this._virtualMachineOUIs.set('00:05:69', true);
                this._virtualMachineOUIs.set('00:03:FF', true);
                this._virtualMachineOUIs.set('00:1C:42', true);
                this._virtualMachineOUIs.set('00:16:3E', true);
                this._virtualMachineOUIs.set('08:00:27', true);
            }
            return !!this._virtualMachineOUIs.findSubstr(mac);
        }
        value() {
            if (this._value === undefined) {
                let vmOui = 0;
                let interfaceCount = 0;
                const interfaces = os_1.networkInterfaces();
                for (let name in interfaces) {
                    if (Object.prototype.hasOwnProperty.call(interfaces, name)) {
                        for (const { mac, internal } of interfaces[name]) {
                            if (!internal) {
                                interfaceCount += 1;
                                if (this._isVirtualMachineMacAdress(mac.toUpperCase())) {
                                    vmOui += 1;
                                }
                            }
                        }
                    }
                }
                this._value = interfaceCount > 0
                    ? vmOui / interfaceCount
                    : 0;
            }
            return this._value;
        }
    };
    let machineId;
    function getMachineId() {
        return machineId || (machineId = getMacMachineId()
            .then(id => id || uuid.generateUuid())); // fallback, generate a UUID
    }
    exports.getMachineId = getMachineId;
    function getMacMachineId() {
        return new Promise(resolve => {
            Promise.all([new Promise((resolve_1, reject_1) => { require(['crypto'], resolve_1, reject_1); }), new Promise((resolve_2, reject_2) => { require(['getmac'], resolve_2, reject_2); })]).then(([crypto, getmac]) => {
                try {
                    getmac.getMac((error, macAddress) => {
                        if (!error) {
                            resolve(crypto.createHash('sha256').update(macAddress, 'utf8').digest('hex'));
                        }
                        else {
                            resolve(undefined);
                        }
                    });
                    // Timeout due to hang with reduced privileges #58392
                    // TODO@sbatten: Remove this when getmac is patched
                    setTimeout(() => {
                        resolve(undefined);
                    }, 10000);
                }
                catch (err) {
                    errors.onUnexpectedError(err);
                    resolve(undefined);
                }
            }, err => {
                errors.onUnexpectedError(err);
                resolve(undefined);
            });
        });
    }
});
//# sourceMappingURL=id.js.map