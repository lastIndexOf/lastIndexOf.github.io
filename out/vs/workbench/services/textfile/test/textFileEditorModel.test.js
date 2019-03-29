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
define(["require", "exports", "assert", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/test/workbenchTestServices", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/base/common/async"], function (require, exports, assert, textFileEditorModel_1, textfiles_1, workbenchTestServices_1, utils_1, files_1, modelService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(textFileService, modelService, fileService) {
            this.textFileService = textFileService;
            this.modelService = modelService;
            this.fileService = fileService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, textfiles_1.ITextFileService), __param(1, modelService_1.IModelService), __param(2, files_1.IFileService)
    ], ServiceAccessor);
    function getLastModifiedTime(model) {
        const stat = model.getStat();
        return stat ? stat.mtime : -1;
    }
    suite('Files - TextFileEditorModel', () => {
        let instantiationService;
        let accessor;
        let content;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
            content = accessor.fileService.getContent();
        });
        teardown(() => {
            accessor.textFileService.models.clear();
            textFileEditorModel_1.TextFileEditorModel.setSaveParticipant(null); // reset any set participant
            accessor.fileService.setContent(content);
        });
        test('Save', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            return model.load().then(() => {
                model.textEditorModel.setValue('bar');
                assert.ok(getLastModifiedTime(model) <= Date.now());
                return model.save().then(() => {
                    assert.ok(model.getLastSaveAttemptTime() <= Date.now());
                    assert.ok(!model.isDirty());
                    model.dispose();
                    assert.ok(!accessor.modelService.getModel(model.getResource()));
                });
            });
        });
        test('setEncoding - encode', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            model.setEncoding('utf8', 0 /* Encode */); // no-op
            assert.equal(getLastModifiedTime(model), -1);
            model.setEncoding('utf16', 0 /* Encode */);
            assert.ok(getLastModifiedTime(model) <= Date.now()); // indicates model was saved due to encoding change
            model.dispose();
        });
        test('setEncoding - decode', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            model.setEncoding('utf16', 1 /* Decode */);
            return async_1.timeout(0).then(() => {
                assert.ok(model.isResolved()); // model got loaded due to decoding
                model.dispose();
            });
        });
        test('disposes when underlying model is destroyed', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            return model.load().then(() => {
                model.textEditorModel.dispose();
                assert.ok(model.isDisposed());
            });
        });
        test('Load does not trigger save', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index.txt'), 'utf8');
            assert.ok(model.hasState(0 /* SAVED */));
            model.onDidStateChange(e => {
                assert.ok(e !== 0 /* DIRTY */ && e !== 3 /* SAVED */);
            });
            return model.load().then(() => {
                assert.ok(model.isResolved());
                model.dispose();
                assert.ok(!accessor.modelService.getModel(model.getResource()));
            });
        });
        test('Load returns dirty model as long as model is dirty', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            return model.load().then(() => {
                model.textEditorModel.setValue('foo');
                assert.ok(model.isDirty());
                assert.ok(model.hasState(1 /* DIRTY */));
                return model.load().then(() => {
                    assert.ok(model.isDirty());
                    model.dispose();
                });
            });
        });
        test('Revert', function () {
            let eventCounter = 0;
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            model.onDidStateChange(e => {
                if (e === 4 /* REVERTED */) {
                    eventCounter++;
                }
            });
            return model.load().then(() => {
                model.textEditorModel.setValue('foo');
                assert.ok(model.isDirty());
                return model.revert().then(() => {
                    assert.ok(!model.isDirty());
                    assert.equal(model.textEditorModel.getValue(), 'Hello Html');
                    assert.equal(eventCounter, 1);
                    model.dispose();
                });
            });
        });
        test('Revert (soft)', function () {
            let eventCounter = 0;
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            model.onDidStateChange(e => {
                if (e === 4 /* REVERTED */) {
                    eventCounter++;
                }
            });
            return model.load().then(() => {
                model.textEditorModel.setValue('foo');
                assert.ok(model.isDirty());
                return model.revert(true /* soft revert */).then(() => {
                    assert.ok(!model.isDirty());
                    assert.equal(model.textEditorModel.getValue(), 'foo');
                    assert.equal(eventCounter, 1);
                    model.dispose();
                });
            });
        });
        test('Load and undo turns model dirty', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            return model.load().then(() => {
                accessor.fileService.setContent('Hello Change');
                return model.load().then(() => {
                    model.textEditorModel.undo();
                    assert.ok(model.isDirty());
                });
            });
        });
        test('File not modified error is handled gracefully', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            return model.load().then(() => {
                const mtime = getLastModifiedTime(model);
                accessor.textFileService.setResolveTextContentErrorOnce(new files_1.FileOperationError('error', 3 /* FILE_NOT_MODIFIED_SINCE */));
                return model.load().then((model) => {
                    assert.ok(model);
                    assert.equal(getLastModifiedTime(model), mtime);
                    model.dispose();
                });
            });
        });
        test('Load error is handled gracefully if model already exists', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            return model.load().then(() => {
                accessor.textFileService.setResolveTextContentErrorOnce(new files_1.FileOperationError('error', 2 /* FILE_NOT_FOUND */));
                return model.load().then((model) => {
                    assert.ok(model);
                    model.dispose();
                });
            });
        });
        test('save() and isDirty() - proper with check for mtimes', function () {
            const input1 = workbenchTestServices_1.createFileInput(instantiationService, utils_1.toResource.call(this, '/path/index_async2.txt'));
            const input2 = workbenchTestServices_1.createFileInput(instantiationService, utils_1.toResource.call(this, '/path/index_async.txt'));
            return input1.resolve().then((model1) => {
                return input2.resolve().then((model2) => {
                    model1.textEditorModel.setValue('foo');
                    const m1Mtime = model1.getStat().mtime;
                    const m2Mtime = model2.getStat().mtime;
                    assert.ok(m1Mtime > 0);
                    assert.ok(m2Mtime > 0);
                    assert.ok(accessor.textFileService.isDirty());
                    assert.ok(accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async2.txt')));
                    assert.ok(!accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async.txt')));
                    model2.textEditorModel.setValue('foo');
                    assert.ok(accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async.txt')));
                    return async_1.timeout(10).then(() => {
                        accessor.textFileService.saveAll().then(() => {
                            assert.ok(!accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async.txt')));
                            assert.ok(!accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async2.txt')));
                            assert.ok(model1.getStat().mtime > m1Mtime);
                            assert.ok(model2.getStat().mtime > m2Mtime);
                            assert.ok(model1.getLastSaveAttemptTime() > m1Mtime);
                            assert.ok(model2.getLastSaveAttemptTime() > m2Mtime);
                            model1.dispose();
                            model2.dispose();
                        });
                    });
                });
            });
        });
        test('Save Participant', function () {
            let eventCounter = 0;
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            model.onDidStateChange(e => {
                if (e === 3 /* SAVED */) {
                    assert.equal(files_1.snapshotToString(model.createSnapshot()), 'bar');
                    assert.ok(!model.isDirty());
                    eventCounter++;
                }
            });
            textFileEditorModel_1.TextFileEditorModel.setSaveParticipant({
                participate: (model) => {
                    assert.ok(model.isDirty());
                    model.textEditorModel.setValue('bar');
                    assert.ok(model.isDirty());
                    eventCounter++;
                    return Promise.resolve();
                }
            });
            return model.load().then(() => {
                model.textEditorModel.setValue('foo');
                return model.save().then(() => {
                    model.dispose();
                    assert.equal(eventCounter, 2);
                });
            });
        });
        test('Save Participant, async participant', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            textFileEditorModel_1.TextFileEditorModel.setSaveParticipant({
                participate: (model) => {
                    return async_1.timeout(10);
                }
            });
            return model.load().then(() => {
                model.textEditorModel.setValue('foo');
                const now = Date.now();
                return model.save().then(() => {
                    assert.ok(Date.now() - now >= 10);
                    model.dispose();
                });
            });
        });
        test('Save Participant, bad participant', function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8');
            textFileEditorModel_1.TextFileEditorModel.setSaveParticipant({
                participate: (model) => {
                    return Promise.reject(new Error('boom'));
                }
            });
            return model.load().then(() => {
                model.textEditorModel.setValue('foo');
                return model.save().then(() => {
                    model.dispose();
                });
            });
        });
        test('SaveSequentializer - pending basics', function () {
            const sequentializer = new textFileEditorModel_1.SaveSequentializer();
            assert.ok(!sequentializer.hasPendingSave());
            assert.ok(!sequentializer.hasPendingSave(2323));
            assert.ok(!sequentializer.pendingSave);
            // pending removes itself after done
            return sequentializer.setPending(1, Promise.resolve()).then(() => {
                assert.ok(!sequentializer.hasPendingSave());
                assert.ok(!sequentializer.hasPendingSave(1));
                assert.ok(!sequentializer.pendingSave);
                // pending removes itself after done (use timeout)
                sequentializer.setPending(2, async_1.timeout(1));
                assert.ok(sequentializer.hasPendingSave());
                assert.ok(sequentializer.hasPendingSave(2));
                assert.ok(!sequentializer.hasPendingSave(1));
                assert.ok(sequentializer.pendingSave);
                return async_1.timeout(2).then(() => {
                    assert.ok(!sequentializer.hasPendingSave());
                    assert.ok(!sequentializer.hasPendingSave(2));
                    assert.ok(!sequentializer.pendingSave);
                });
            });
        });
        test('SaveSequentializer - pending and next (finishes instantly)', function () {
            const sequentializer = new textFileEditorModel_1.SaveSequentializer();
            let pendingDone = false;
            sequentializer.setPending(1, async_1.timeout(1).then(() => { pendingDone = true; return; }));
            // next finishes instantly
            let nextDone = false;
            const res = sequentializer.setNext(() => Promise.resolve(null).then(() => { nextDone = true; return; }));
            return res.then(() => {
                assert.ok(pendingDone);
                assert.ok(nextDone);
            });
        });
        test('SaveSequentializer - pending and next (finishes after timeout)', function () {
            const sequentializer = new textFileEditorModel_1.SaveSequentializer();
            let pendingDone = false;
            sequentializer.setPending(1, async_1.timeout(1).then(() => { pendingDone = true; return; }));
            // next finishes after timeout
            let nextDone = false;
            const res = sequentializer.setNext(() => async_1.timeout(1).then(() => { nextDone = true; return; }));
            return res.then(() => {
                assert.ok(pendingDone);
                assert.ok(nextDone);
            });
        });
        test('SaveSequentializer - pending and multiple next (last one wins)', function () {
            const sequentializer = new textFileEditorModel_1.SaveSequentializer();
            let pendingDone = false;
            sequentializer.setPending(1, async_1.timeout(1).then(() => { pendingDone = true; return; }));
            // next finishes after timeout
            let firstDone = false;
            let firstRes = sequentializer.setNext(() => async_1.timeout(2).then(() => { firstDone = true; return; }));
            let secondDone = false;
            let secondRes = sequentializer.setNext(() => async_1.timeout(3).then(() => { secondDone = true; return; }));
            let thirdDone = false;
            let thirdRes = sequentializer.setNext(() => async_1.timeout(4).then(() => { thirdDone = true; return; }));
            return Promise.all([firstRes, secondRes, thirdRes]).then(() => {
                assert.ok(pendingDone);
                assert.ok(!firstDone);
                assert.ok(!secondDone);
                assert.ok(thirdDone);
            });
        });
    });
});
//# sourceMappingURL=textFileEditorModel.test.js.map