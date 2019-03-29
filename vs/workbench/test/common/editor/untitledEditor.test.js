var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/uri", "assert", "vs/base/common/path", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/configuration/common/configuration", "vs/workbench/test/workbenchTestServices", "vs/workbench/common/editor/untitledEditorModel", "vs/editor/common/services/modeService", "vs/platform/files/common/files", "vs/base/common/async"], function (require, exports, uri_1, assert, path_1, untitledEditorService_1, configuration_1, workbenchTestServices_1, untitledEditorModel_1, modeService_1, files_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestUntitledEditorService extends untitledEditorService_1.UntitledEditorService {
        get(resource) { return super.get(resource); }
        getAll(resources) { return super.getAll(resources); }
    }
    exports.TestUntitledEditorService = TestUntitledEditorService;
    let ServiceAccessor = class ServiceAccessor {
        constructor(untitledEditorService, modeService, testConfigurationService) {
            this.untitledEditorService = untitledEditorService;
            this.modeService = modeService;
            this.testConfigurationService = testConfigurationService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, untitledEditorService_1.IUntitledEditorService),
        __param(1, modeService_1.IModeService),
        __param(2, configuration_1.IConfigurationService)
    ], ServiceAccessor);
    suite('Workbench untitled editors', () => {
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        teardown(() => {
            accessor.untitledEditorService.revertAll();
            accessor.untitledEditorService.dispose();
        });
        test('Untitled Editor Service', function (done) {
            const service = accessor.untitledEditorService;
            assert.equal(service.getAll().length, 0);
            const input1 = service.createOrGet();
            assert.equal(input1, service.createOrGet(input1.getResource()));
            assert.ok(service.exists(input1.getResource()));
            assert.ok(!service.exists(uri_1.URI.file('testing')));
            const input2 = service.createOrGet();
            // get() / getAll()
            assert.equal(service.get(input1.getResource()), input1);
            assert.equal(service.getAll().length, 2);
            assert.equal(service.getAll([input1.getResource(), input2.getResource()]).length, 2);
            // revertAll()
            service.revertAll([input1.getResource()]);
            assert.ok(input1.isDisposed());
            assert.equal(service.getAll().length, 1);
            // dirty
            input2.resolve().then(model => {
                assert.ok(!service.isDirty(input2.getResource()));
                const listener = service.onDidChangeDirty(resource => {
                    listener.dispose();
                    assert.equal(resource.toString(), input2.getResource().toString());
                    assert.ok(service.isDirty(input2.getResource()));
                    assert.equal(service.getDirty()[0].toString(), input2.getResource().toString());
                    assert.equal(service.getDirty([input2.getResource()])[0].toString(), input2.getResource().toString());
                    assert.equal(service.getDirty([input1.getResource()]).length, 0);
                    service.revertAll();
                    assert.equal(service.getAll().length, 0);
                    assert.ok(!input2.isDirty());
                    assert.ok(!model.isDirty());
                    input2.dispose();
                    assert.ok(!service.exists(input2.getResource()));
                    done();
                });
                model.textEditorModel.setValue('foo bar');
            }, err => done(err));
        });
        test('Untitled with associated resource', function () {
            const service = accessor.untitledEditorService;
            const file = uri_1.URI.file(path_1.join('C:\\', '/foo/file.txt'));
            const untitled = service.createOrGet(file);
            assert.ok(service.hasAssociatedFilePath(untitled.getResource()));
            untitled.dispose();
        });
        test('Untitled no longer dirty when content gets empty', function () {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            // dirty
            return input.resolve().then(model => {
                model.textEditorModel.setValue('foo bar');
                assert.ok(model.isDirty());
                model.textEditorModel.setValue('');
                assert.ok(!model.isDirty());
                input.dispose();
            });
        });
        test('Untitled via loadOrCreate', function () {
            const service = accessor.untitledEditorService;
            service.loadOrCreate().then(model1 => {
                model1.textEditorModel.setValue('foo bar');
                assert.ok(model1.isDirty());
                model1.textEditorModel.setValue('');
                assert.ok(!model1.isDirty());
                return service.loadOrCreate({ initialValue: 'Hello World' }).then(model2 => {
                    assert.equal(files_1.snapshotToString(model2.createSnapshot()), 'Hello World');
                    const input = service.createOrGet();
                    return service.loadOrCreate({ resource: input.getResource() }).then(model3 => {
                        assert.equal(model3.getResource().toString(), input.getResource().toString());
                        const file = uri_1.URI.file(path_1.join('C:\\', '/foo/file44.txt'));
                        return service.loadOrCreate({ resource: file }).then(model4 => {
                            assert.ok(service.hasAssociatedFilePath(model4.getResource()));
                            assert.ok(model4.isDirty());
                            model1.dispose();
                            model2.dispose();
                            model3.dispose();
                            model4.dispose();
                            input.dispose();
                        });
                    });
                });
            });
        });
        test('Untitled suggest name', function () {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            assert.ok(service.suggestFileName(input.getResource()));
        });
        test('Untitled with associated path remains dirty when content gets empty', function () {
            const service = accessor.untitledEditorService;
            const file = uri_1.URI.file(path_1.join('C:\\', '/foo/file.txt'));
            const input = service.createOrGet(file);
            // dirty
            return input.resolve().then(model => {
                model.textEditorModel.setValue('foo bar');
                assert.ok(model.isDirty());
                model.textEditorModel.setValue('');
                assert.ok(model.isDirty());
                input.dispose();
            });
        });
        test('Untitled created with files.defaultLanguage setting', function () {
            const defaultLanguage = 'javascript';
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': defaultLanguage });
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            assert.equal(input.getModeId(), defaultLanguage);
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
            input.dispose();
        });
        test('Untitled created with modeId overrides files.defaultLanguage setting', function () {
            const modeId = 'typescript';
            const defaultLanguage = 'javascript';
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': defaultLanguage });
            const service = accessor.untitledEditorService;
            const input = service.createOrGet(null, modeId);
            assert.equal(input.getModeId(), modeId);
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
            input.dispose();
        });
        test('encoding change event', function () {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            let counter = 0;
            service.onDidChangeEncoding(r => {
                counter++;
                assert.equal(r.toString(), input.getResource().toString());
            });
            // dirty
            return input.resolve().then(model => {
                model.setEncoding('utf16');
                assert.equal(counter, 1);
                input.dispose();
            });
        });
        test('onDidChangeContent event', () => {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            untitledEditorModel_1.UntitledEditorModel.DEFAULT_CONTENT_CHANGE_BUFFER_DELAY = 0;
            let counter = 0;
            service.onDidChangeContent(r => {
                counter++;
                assert.equal(r.toString(), input.getResource().toString());
            });
            return input.resolve().then(model => {
                model.textEditorModel.setValue('foo');
                assert.equal(counter, 0, 'Dirty model should not trigger event immediately');
                return async_1.timeout(3).then(() => {
                    assert.equal(counter, 1, 'Dirty model should trigger event');
                    model.textEditorModel.setValue('bar');
                    return async_1.timeout(3).then(() => {
                        assert.equal(counter, 2, 'Content change when dirty should trigger event');
                        model.textEditorModel.setValue('');
                        return async_1.timeout(3).then(() => {
                            assert.equal(counter, 3, 'Manual revert should trigger event');
                            model.textEditorModel.setValue('foo');
                            return async_1.timeout(3).then(() => {
                                assert.equal(counter, 4, 'Dirty model should trigger event');
                                model.revert();
                                return async_1.timeout(3).then(() => {
                                    assert.equal(counter, 5, 'Revert should trigger event');
                                    input.dispose();
                                });
                            });
                        });
                    });
                });
            });
        });
        test('onDidDisposeModel event', () => {
            const service = accessor.untitledEditorService;
            const input = service.createOrGet();
            let counter = 0;
            service.onDidDisposeModel(r => {
                counter++;
                assert.equal(r.toString(), input.getResource().toString());
            });
            return input.resolve().then(model => {
                assert.equal(counter, 0);
                input.dispose();
                assert.equal(counter, 1);
            });
        });
    });
});
//# sourceMappingURL=untitledEditor.test.js.map