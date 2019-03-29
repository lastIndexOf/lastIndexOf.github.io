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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/api/electron-browser/extHostCustomers", "../node/extHost.protocol", "vs/platform/label/common/label"], function (require, exports, event_1, lifecycle_1, uri_1, files_1, extHostCustomers_1, extHost_protocol_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadFileSystem = class MainThreadFileSystem {
        constructor(extHostContext, _fileService, _labelService) {
            this._fileService = _fileService;
            this._labelService = _labelService;
            this._fileProvider = new Map();
            this._resourceLabelFormatters = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystem);
        }
        dispose() {
            this._fileProvider.forEach(value => value.dispose());
            this._fileProvider.clear();
        }
        $registerFileSystemProvider(handle, scheme, capabilities) {
            this._fileProvider.set(handle, new RemoteFileSystemProvider(this._fileService, scheme, capabilities, handle, this._proxy));
        }
        $unregisterProvider(handle) {
            lifecycle_1.dispose(this._fileProvider.get(handle));
            this._fileProvider.delete(handle);
        }
        $registerResourceLabelFormatter(handle, formatter) {
            // Dynamicily registered formatters should have priority over those contributed via package.json
            formatter.priority = true;
            const disposable = this._labelService.registerFormatter(formatter);
            this._resourceLabelFormatters.set(handle, disposable);
        }
        $unregisterResourceLabelFormatter(handle) {
            lifecycle_1.dispose(this._resourceLabelFormatters.get(handle));
            this._resourceLabelFormatters.delete(handle);
        }
        $onFileSystemChange(handle, changes) {
            const fileProvider = this._fileProvider.get(handle);
            if (!fileProvider) {
                throw new Error('Unknown file provider');
            }
            fileProvider.$onFileSystemChange(changes);
        }
    };
    MainThreadFileSystem = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadFileSystem),
        __param(1, files_1.IFileService),
        __param(2, label_1.ILabelService)
    ], MainThreadFileSystem);
    exports.MainThreadFileSystem = MainThreadFileSystem;
    class RemoteFileSystemProvider {
        constructor(fileService, scheme, capabilities, _handle, _proxy) {
            this._handle = _handle;
            this._proxy = _proxy;
            this._onDidChange = new event_1.Emitter();
            this.onDidChangeFile = this._onDidChange.event;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.capabilities = capabilities;
            this._registration = fileService.registerProvider(scheme, this);
        }
        dispose() {
            this._registration.dispose();
            this._onDidChange.dispose();
        }
        watch(resource, opts) {
            const session = Math.random();
            this._proxy.$watch(this._handle, session, resource, opts);
            return lifecycle_1.toDisposable(() => {
                this._proxy.$unwatch(this._handle, session);
            });
        }
        $onFileSystemChange(changes) {
            this._onDidChange.fire(changes.map(RemoteFileSystemProvider._createFileChange));
        }
        static _createFileChange(dto) {
            return { resource: uri_1.URI.revive(dto.resource), type: dto.type };
        }
        // --- forwarding calls
        static _asBuffer(data) {
            return Buffer.isBuffer(data) ? data : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
        }
        stat(resource) {
            return this._proxy.$stat(this._handle, resource).then(undefined, err => {
                throw err;
            });
        }
        readFile(resource) {
            return this._proxy.$readFile(this._handle, resource);
        }
        writeFile(resource, content, opts) {
            return this._proxy.$writeFile(this._handle, resource, RemoteFileSystemProvider._asBuffer(content), opts);
        }
        delete(resource, opts) {
            return this._proxy.$delete(this._handle, resource, opts);
        }
        mkdir(resource) {
            return this._proxy.$mkdir(this._handle, resource);
        }
        readdir(resource) {
            return this._proxy.$readdir(this._handle, resource);
        }
        rename(resource, target, opts) {
            return this._proxy.$rename(this._handle, resource, target, opts);
        }
        copy(resource, target, opts) {
            return this._proxy.$copy(this._handle, resource, target, opts);
        }
        open(resource, opts) {
            return this._proxy.$open(this._handle, resource, opts);
        }
        close(fd) {
            return this._proxy.$close(this._handle, fd);
        }
        read(fd, pos, data, offset, length) {
            return this._proxy.$read(this._handle, fd, pos, length).then(readData => {
                data.set(readData, offset);
                return readData.byteLength;
            });
        }
        write(fd, pos, data, offset, length) {
            return this._proxy.$write(this._handle, fd, pos, Buffer.from(data, offset, length));
        }
    }
});
//# sourceMappingURL=mainThreadFileSystem.js.map