/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/base/common/map", "vs/platform/workspaces/common/workspaces", "vs/base/common/arrays", "vs/base/common/platform"], function (require, exports, uri_1, path_1, resources, instantiation_1, map_1, workspaces_1, arrays_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspaceContextService = instantiation_1.createDecorator('contextService');
    var WorkbenchState;
    (function (WorkbenchState) {
        WorkbenchState[WorkbenchState["EMPTY"] = 1] = "EMPTY";
        WorkbenchState[WorkbenchState["FOLDER"] = 2] = "FOLDER";
        WorkbenchState[WorkbenchState["WORKSPACE"] = 3] = "WORKSPACE";
    })(WorkbenchState = exports.WorkbenchState || (exports.WorkbenchState = {}));
    var IWorkspace;
    (function (IWorkspace) {
        function isIWorkspace(thing) {
            return thing && typeof thing === 'object'
                && typeof thing.id === 'string'
                && Array.isArray(thing.folders);
        }
        IWorkspace.isIWorkspace = isIWorkspace;
    })(IWorkspace = exports.IWorkspace || (exports.IWorkspace = {}));
    var IWorkspaceFolder;
    (function (IWorkspaceFolder) {
        function isIWorkspaceFolder(thing) {
            return thing && typeof thing === 'object'
                && uri_1.URI.isUri(thing.uri)
                && typeof thing.name === 'string'
                && typeof thing.toResource === 'function';
        }
        IWorkspaceFolder.isIWorkspaceFolder = isIWorkspaceFolder;
    })(IWorkspaceFolder = exports.IWorkspaceFolder || (exports.IWorkspaceFolder = {}));
    class Workspace {
        constructor(_id, folders = [], _configuration = null) {
            this._id = _id;
            this._configuration = _configuration;
            this._foldersMap = map_1.TernarySearchTree.forPaths();
            this.folders = folders;
        }
        update(workspace) {
            this._id = workspace.id;
            this._configuration = workspace.configuration;
            this.folders = workspace.folders;
        }
        get folders() {
            return this._folders;
        }
        set folders(folders) {
            this._folders = folders;
            this.updateFoldersMap();
        }
        get id() {
            return this._id;
        }
        get configuration() {
            return this._configuration;
        }
        set configuration(configuration) {
            this._configuration = configuration;
        }
        getFolder(resource) {
            if (!resource) {
                return null;
            }
            return this._foldersMap.findSubstr(resource.toString()) || null;
        }
        updateFoldersMap() {
            this._foldersMap = map_1.TernarySearchTree.forPaths();
            for (const folder of this.folders) {
                this._foldersMap.set(folder.uri.toString(), folder);
            }
        }
        toJSON() {
            return { id: this.id, folders: this.folders, configuration: this.configuration };
        }
    }
    exports.Workspace = Workspace;
    class WorkspaceFolder {
        constructor(data, raw) {
            this.raw = raw;
            this.uri = data.uri;
            this.index = data.index;
            this.name = data.name;
        }
        toResource(relativePath) {
            return resources.joinPath(this.uri, relativePath);
        }
        toJSON() {
            return { uri: this.uri, name: this.name, index: this.index };
        }
    }
    exports.WorkspaceFolder = WorkspaceFolder;
    function toWorkspaceFolders(configuredFolders, relativeTo) {
        let workspaceFolders = parseWorkspaceFolders(configuredFolders, relativeTo);
        return ensureUnique(arrays_1.coalesce(workspaceFolders))
            .map(({ uri, raw, name }, index) => new WorkspaceFolder({ uri, name: name || resources.basenameOrAuthority(uri), index }, raw));
    }
    exports.toWorkspaceFolders = toWorkspaceFolders;
    function parseWorkspaceFolders(configuredFolders, relativeTo) {
        return configuredFolders.map((configuredFolder, index) => {
            let uri = null;
            if (workspaces_1.isRawFileWorkspaceFolder(configuredFolder)) {
                uri = toUri(configuredFolder.path, relativeTo);
            }
            else if (workspaces_1.isRawUriWorkspaceFolder(configuredFolder)) {
                try {
                    uri = uri_1.URI.parse(configuredFolder.uri);
                    // this makes sure all workspace folder are absolute
                    if (uri.path[0] !== '/') {
                        uri = uri.with({ path: '/' + uri.path });
                    }
                }
                catch (e) {
                    console.warn(e);
                    // ignore
                }
            }
            if (!uri) {
                return undefined;
            }
            return new WorkspaceFolder({ uri, name: configuredFolder.name /*is ensured in caller*/, index }, configuredFolder);
        });
    }
    function toUri(path, relativeTo) {
        if (path) {
            if (path_1.isAbsolute(path)) {
                return uri_1.URI.file(path);
            }
            if (relativeTo) {
                return resources.joinPath(relativeTo, path);
            }
        }
        return null;
    }
    function ensureUnique(folders) {
        return arrays_1.distinct(folders, folder => platform_1.isLinux ? folder.uri.toString() : folder.uri.toString().toLowerCase());
    }
});
//# sourceMappingURL=workspace.js.map