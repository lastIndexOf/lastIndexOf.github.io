/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/node/extHostDocumentData", "vs/workbench/api/node/extHostTextEditor", "vs/workbench/api/node/extHostTypeConverters"], function (require, exports, assert, event_1, lifecycle_1, uri_1, extHost_protocol_1, extHostDocumentData_1, extHostTextEditor_1, typeConverters) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostDocumentsAndEditors {
        constructor(_mainContext) {
            this._mainContext = _mainContext;
            this._disposables = [];
            this._editors = new Map();
            this._documents = new Map();
            this._onDidAddDocuments = new event_1.Emitter();
            this._onDidRemoveDocuments = new event_1.Emitter();
            this._onDidChangeVisibleTextEditors = new event_1.Emitter();
            this._onDidChangeActiveTextEditor = new event_1.Emitter();
            this.onDidAddDocuments = this._onDidAddDocuments.event;
            this.onDidRemoveDocuments = this._onDidRemoveDocuments.event;
            this.onDidChangeVisibleTextEditors = this._onDidChangeVisibleTextEditors.event;
            this.onDidChangeActiveTextEditor = this._onDidChangeActiveTextEditor.event;
        }
        dispose() {
            this._disposables = lifecycle_1.dispose(this._disposables);
        }
        $acceptDocumentsAndEditorsDelta(delta) {
            const removedDocuments = [];
            const addedDocuments = [];
            const removedEditors = [];
            if (delta.removedDocuments) {
                for (const uriComponent of delta.removedDocuments) {
                    const uri = uri_1.URI.revive(uriComponent);
                    const id = uri.toString();
                    const data = this._documents.get(id);
                    this._documents.delete(id);
                    if (data) {
                        removedDocuments.push(data);
                    }
                }
            }
            if (delta.addedDocuments) {
                for (const data of delta.addedDocuments) {
                    const resource = uri_1.URI.revive(data.uri);
                    assert.ok(!this._documents.has(resource.toString()), `document '${resource} already exists!'`);
                    const documentData = new extHostDocumentData_1.ExtHostDocumentData(this._mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDocuments), resource, data.lines, data.EOL, data.modeId, data.versionId, data.isDirty);
                    this._documents.set(resource.toString(), documentData);
                    addedDocuments.push(documentData);
                }
            }
            if (delta.removedEditors) {
                for (const id of delta.removedEditors) {
                    const editor = this._editors.get(id);
                    this._editors.delete(id);
                    if (editor) {
                        removedEditors.push(editor);
                    }
                }
            }
            if (delta.addedEditors) {
                for (const data of delta.addedEditors) {
                    const resource = uri_1.URI.revive(data.documentUri);
                    assert.ok(this._documents.has(resource.toString()), `document '${resource}' does not exist`);
                    assert.ok(!this._editors.has(data.id), `editor '${data.id}' already exists!`);
                    const documentData = this._documents.get(resource.toString());
                    const editor = new extHostTextEditor_1.ExtHostTextEditor(this._mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTextEditors), data.id, documentData, data.selections.map(typeConverters.Selection.to), data.options, data.visibleRanges.map(range => typeConverters.Range.to(range)), typeof data.editorPosition === 'number' ? typeConverters.ViewColumn.to(data.editorPosition) : undefined);
                    this._editors.set(data.id, editor);
                }
            }
            if (delta.newActiveEditor !== undefined) {
                assert.ok(delta.newActiveEditor === null || this._editors.has(delta.newActiveEditor), `active editor '${delta.newActiveEditor}' does not exist`);
                this._activeEditorId = delta.newActiveEditor;
            }
            lifecycle_1.dispose(removedDocuments);
            lifecycle_1.dispose(removedEditors);
            // now that the internal state is complete, fire events
            if (delta.removedDocuments) {
                this._onDidRemoveDocuments.fire(removedDocuments);
            }
            if (delta.addedDocuments) {
                this._onDidAddDocuments.fire(addedDocuments);
            }
            if (delta.removedEditors || delta.addedEditors) {
                this._onDidChangeVisibleTextEditors.fire(this.allEditors());
            }
            if (delta.newActiveEditor !== undefined) {
                this._onDidChangeActiveTextEditor.fire(this.activeEditor());
            }
        }
        getDocument(uri) {
            return this._documents.get(uri.toString());
        }
        allDocuments() {
            const result = [];
            this._documents.forEach(data => result.push(data));
            return result;
        }
        getEditor(id) {
            return this._editors.get(id);
        }
        activeEditor() {
            if (!this._activeEditorId) {
                return undefined;
            }
            else {
                return this._editors.get(this._activeEditorId);
            }
        }
        allEditors() {
            const result = [];
            this._editors.forEach(data => result.push(data));
            return result;
        }
    }
    exports.ExtHostDocumentsAndEditors = ExtHostDocumentsAndEditors;
});
//# sourceMappingURL=extHostDocumentsAndEditors.js.map