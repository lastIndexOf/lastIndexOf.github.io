define(["require", "exports", "vs/base/common/uri", "vs/platform/history/common/history"], function (require, exports, uri_1, history_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function restoreRecentlyOpened(data) {
        const result = { workspaces: [], files: [] };
        if (data) {
            const storedRecents = data;
            if (Array.isArray(storedRecents.workspaces3)) {
                for (let i = 0; i < storedRecents.workspaces3.length; i++) {
                    const workspace = storedRecents.workspaces3[i];
                    const label = (Array.isArray(storedRecents.workspaceLabels) && storedRecents.workspaceLabels[i]) || undefined;
                    if (typeof workspace === 'object' && typeof workspace.id === 'string' && typeof workspace.configURIPath === 'string') {
                        result.workspaces.push({ label, workspace: { id: workspace.id, configPath: uri_1.URI.parse(workspace.configURIPath) } });
                    }
                    else if (typeof workspace === 'string') {
                        result.workspaces.push({ label, folderUri: uri_1.URI.parse(workspace) });
                    }
                }
            }
            else if (Array.isArray(storedRecents.workspaces2)) {
                for (const workspace of storedRecents.workspaces2) {
                    if (typeof workspace === 'object' && typeof workspace.id === 'string' && typeof workspace.configPath === 'string') {
                        result.workspaces.push({ workspace: { id: workspace.id, configPath: uri_1.URI.file(workspace.configPath) } });
                    }
                    else if (typeof workspace === 'string') {
                        result.workspaces.push({ folderUri: uri_1.URI.parse(workspace) });
                    }
                }
            }
            else if (Array.isArray(storedRecents.workspaces)) {
                // TODO@martin legacy support can be removed at some point (6 month?)
                // format of 1.25 and before
                for (const workspace of storedRecents.workspaces) {
                    if (typeof workspace === 'string') {
                        result.workspaces.push({ folderUri: uri_1.URI.file(workspace) });
                    }
                    else if (typeof workspace === 'object' && typeof workspace['id'] === 'string' && typeof workspace['configPath'] === 'string') {
                        result.workspaces.push({ workspace: { id: workspace['id'], configPath: uri_1.URI.file(workspace['configPath']) } });
                    }
                    else if (workspace && typeof workspace['path'] === 'string' && typeof workspace['scheme'] === 'string') {
                        // added by 1.26-insiders
                        result.workspaces.push({ folderUri: uri_1.URI.revive(workspace) });
                    }
                }
            }
            if (Array.isArray(storedRecents.files2)) {
                for (let i = 0; i < storedRecents.files2.length; i++) {
                    const file = storedRecents.files2[i];
                    const label = (Array.isArray(storedRecents.fileLabels) && storedRecents.fileLabels[i]) || undefined;
                    if (typeof file === 'string') {
                        result.files.push({ label, fileUri: uri_1.URI.parse(file) });
                    }
                }
            }
            else if (Array.isArray(storedRecents.files)) {
                for (const file of storedRecents.files) {
                    if (typeof file === 'string') {
                        result.files.push({ fileUri: uri_1.URI.file(file) });
                    }
                }
            }
        }
        return result;
    }
    exports.restoreRecentlyOpened = restoreRecentlyOpened;
    function toStoreData(recents) {
        const serialized = { workspaces3: [], files2: [] };
        let hasLabel = false;
        const workspaceLabels = [];
        for (const recent of recents.workspaces) {
            if (history_1.isRecentFolder(recent)) {
                serialized.workspaces3.push(recent.folderUri.toString());
            }
            else {
                serialized.workspaces3.push({ id: recent.workspace.id, configURIPath: recent.workspace.configPath.toString() });
            }
            workspaceLabels.push(recent.label || null);
            hasLabel = hasLabel || !!recent.label;
        }
        if (hasLabel) {
            serialized.workspaceLabels = workspaceLabels;
        }
        hasLabel = false;
        const fileLabels = [];
        for (const recent of recents.files) {
            serialized.files2.push(recent.fileUri.toString());
            fileLabels.push(recent.label || null);
            hasLabel = hasLabel || !!recent.label;
        }
        if (hasLabel) {
            serialized.fileLabels = fileLabels;
        }
        return serialized;
    }
    exports.toStoreData = toStoreData;
});
//# sourceMappingURL=historyStorage.js.map