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
define(["require", "exports", "vs/workbench/common/editor", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/resourceEditorModel"], function (require, exports, editor_1, resolverService_1, resourceEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A read-only text editor input whos contents are made of the provided resource that points to an existing
     * code editor model.
     */
    let ResourceEditorInput = class ResourceEditorInput extends editor_1.EditorInput {
        constructor(name, description, resource, textModelResolverService) {
            super();
            this.name = name;
            this.description = description;
            this.resource = resource;
            this.textModelResolverService = textModelResolverService;
            this.name = name;
            this.description = description;
            this.resource = resource;
        }
        getResource() {
            return this.resource;
        }
        getTypeId() {
            return ResourceEditorInput.ID;
        }
        getName() {
            return this.name;
        }
        setName(name) {
            if (this.name !== name) {
                this.name = name;
                this._onDidChangeLabel.fire();
            }
        }
        getDescription() {
            return this.description;
        }
        setDescription(description) {
            if (this.description !== description) {
                this.description = description;
                this._onDidChangeLabel.fire();
            }
        }
        resolve() {
            if (!this.modelReference) {
                this.modelReference = this.textModelResolverService.createModelReference(this.resource);
            }
            return this.modelReference.then(ref => {
                const model = ref.object;
                if (!(model instanceof resourceEditorModel_1.ResourceEditorModel)) {
                    ref.dispose();
                    this.modelReference = null;
                    return Promise.reject(new Error(`Unexpected model for ResourceInput: ${this.resource}`));
                }
                return model;
            });
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            if (otherInput instanceof ResourceEditorInput) {
                let otherResourceEditorInput = otherInput;
                // Compare by properties
                return otherResourceEditorInput.resource.toString() === this.resource.toString();
            }
            return false;
        }
        dispose() {
            if (this.modelReference) {
                this.modelReference.then(ref => ref.dispose());
                this.modelReference = null;
            }
            super.dispose();
        }
    };
    ResourceEditorInput.ID = 'workbench.editors.resourceEditorInput';
    ResourceEditorInput = __decorate([
        __param(3, resolverService_1.ITextModelService)
    ], ResourceEditorInput);
    exports.ResourceEditorInput = ResourceEditorInput;
});
//# sourceMappingURL=resourceEditorInput.js.map