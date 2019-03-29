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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/base/common/async"], function (require, exports, assert, uri_1, utils_1, fileEditorInput_1, editorService_1, workbenchTestServices_1, textfiles_1, files_1, modelService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(editorService, textFileService, modelService) {
            this.editorService = editorService;
            this.textFileService = textFileService;
            this.modelService = modelService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, modelService_1.IModelService)
    ], ServiceAccessor);
    suite('Files - FileEditorInput', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        test('Basics', function () {
            let input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/file.js'), undefined);
            const otherInput = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, 'foo/bar/otherfile.js'), undefined);
            const otherInputSame = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, 'foo/bar/file.js'), undefined);
            assert(input.matches(input));
            assert(input.matches(otherInputSame));
            assert(!input.matches(otherInput));
            assert(!input.matches(null));
            assert.ok(input.getName());
            assert.ok(input.getDescription());
            assert.ok(input.getTitle(0 /* SHORT */));
            assert.strictEqual('file.js', input.getName());
            assert.strictEqual(utils_1.toResource.call(this, '/foo/bar/file.js').fsPath, input.getResource().fsPath);
            assert(input.getResource() instanceof uri_1.URI);
            input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar.html'), undefined);
            const inputToResolve = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/file.js'), undefined);
            const sameOtherInput = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/file.js'), undefined);
            return inputToResolve.resolve().then(resolved => {
                assert.ok(inputToResolve.isResolved());
                const resolvedModelA = resolved;
                return inputToResolve.resolve().then(resolved => {
                    assert(resolvedModelA === resolved); // OK: Resolved Model cached globally per input
                    return sameOtherInput.resolve().then(otherResolved => {
                        assert(otherResolved === resolvedModelA); // OK: Resolved Model cached globally per input
                        inputToResolve.dispose();
                        return inputToResolve.resolve().then(resolved => {
                            assert(resolvedModelA === resolved); // Model is still the same because we had 2 clients
                            inputToResolve.dispose();
                            sameOtherInput.dispose();
                            resolvedModelA.dispose();
                            return inputToResolve.resolve().then(resolved => {
                                assert(resolvedModelA !== resolved); // Different instance, because input got disposed
                                let stat = resolved.getStat();
                                return inputToResolve.resolve().then(resolved => {
                                    return async_1.timeout(0).then(() => {
                                        assert(stat !== resolved.getStat()); // Different stat, because resolve always goes to the server for refresh
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        test('matches', function () {
            const input1 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined);
            const input2 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined);
            const input3 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/other.js'), undefined);
            const input2Upper = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/UPDATEFILE.js'), undefined);
            assert.strictEqual(input1.matches(null), false);
            assert.strictEqual(input1.matches(input1), true);
            assert.strictEqual(input1.matches(input2), true);
            assert.strictEqual(input1.matches(input3), false);
            assert.strictEqual(input1.matches(input2Upper), false);
        });
        test('getEncoding/setEncoding', function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined);
            input.setEncoding('utf16', 0 /* Encode */);
            assert.equal(input.getEncoding(), 'utf16');
            return input.resolve().then((resolved) => {
                assert.equal(input.getEncoding(), resolved.getEncoding());
                resolved.dispose();
            });
        });
        test('save', function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined);
            return input.resolve().then((resolved) => {
                resolved.textEditorModel.setValue('changed');
                assert.ok(input.isDirty());
                return input.save().then(() => {
                    assert.ok(!input.isDirty());
                    resolved.dispose();
                });
            });
        });
        test('revert', function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined);
            return input.resolve().then((resolved) => {
                resolved.textEditorModel.setValue('changed');
                assert.ok(input.isDirty());
                return input.revert().then(() => {
                    assert.ok(!input.isDirty());
                    resolved.dispose();
                });
            });
        });
        test('resolve handles binary files', function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined);
            accessor.textFileService.setResolveTextContentErrorOnce(new files_1.FileOperationError('error', 0 /* FILE_IS_BINARY */));
            return input.resolve().then(resolved => {
                assert.ok(resolved);
                resolved.dispose();
            });
        });
        test('resolve handles too large files', function () {
            const input = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined);
            accessor.textFileService.setResolveTextContentErrorOnce(new files_1.FileOperationError('error', 8 /* FILE_TOO_LARGE */));
            return input.resolve().then(resolved => {
                assert.ok(resolved);
                resolved.dispose();
            });
        });
    });
});
//# sourceMappingURL=fileEditorInput.test.js.map