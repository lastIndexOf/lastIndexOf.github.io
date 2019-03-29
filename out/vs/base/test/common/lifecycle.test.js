define(["require", "exports", "assert", "vs/base/common/lifecycle"], function (require, exports, assert, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Disposable {
        constructor() {
            this.isDisposed = false;
        }
        dispose() { this.isDisposed = true; }
    }
    suite('Lifecycle', () => {
        test('dispose single disposable', () => {
            const disposable = new Disposable();
            assert(!disposable.isDisposed);
            lifecycle_1.dispose(disposable);
            assert(disposable.isDisposed);
        });
        test('dispose disposable array', () => {
            const disposable = new Disposable();
            const disposable2 = new Disposable();
            assert(!disposable.isDisposed);
            assert(!disposable2.isDisposed);
            lifecycle_1.dispose([disposable, disposable2]);
            assert(disposable.isDisposed);
            assert(disposable2.isDisposed);
        });
        test('dispose disposables', () => {
            const disposable = new Disposable();
            const disposable2 = new Disposable();
            assert(!disposable.isDisposed);
            assert(!disposable2.isDisposed);
            lifecycle_1.dispose(disposable, disposable2);
            assert(disposable.isDisposed);
            assert(disposable2.isDisposed);
        });
    });
    suite('DisposableBase', () => {
        test('register should not leak if object has already been disposed', () => {
            let aCount = 0;
            let bCount = 0;
            const disposable = new class extends lifecycle_1.Disposable {
                register(other) {
                    this._register(other);
                }
            };
            disposable.register(lifecycle_1.toDisposable(() => ++aCount));
            assert.strictEqual(aCount, 0);
            assert.strictEqual(bCount, 0);
            disposable.dispose();
            assert.strictEqual(aCount, 1);
            assert.strictEqual(bCount, 0);
            // Any newly added disposables should be disposed of immediately
            disposable.register(lifecycle_1.toDisposable(() => ++bCount));
            assert.strictEqual(aCount, 1);
            assert.strictEqual(bCount, 1);
            // Further dispose calls should have no effect
            disposable.dispose();
            assert.strictEqual(aCount, 1);
            assert.strictEqual(bCount, 1);
        });
    });
    suite('Reference Collection', () => {
        class Collection extends lifecycle_1.ReferenceCollection {
            constructor() {
                super(...arguments);
                this._count = 0;
            }
            get count() { return this._count; }
            createReferencedObject(key) { this._count++; return key.length; }
            destroyReferencedObject(key, object) { this._count--; }
        }
        test('simple', () => {
            const collection = new Collection();
            const ref1 = collection.acquire('test');
            assert(ref1);
            assert.equal(ref1.object, 4);
            assert.equal(collection.count, 1);
            ref1.dispose();
            assert.equal(collection.count, 0);
            const ref2 = collection.acquire('test');
            const ref3 = collection.acquire('test');
            assert.equal(ref2.object, ref3.object);
            assert.equal(collection.count, 1);
            const ref4 = collection.acquire('monkey');
            assert.equal(ref4.object, 6);
            assert.equal(collection.count, 2);
            ref2.dispose();
            assert.equal(collection.count, 2);
            ref3.dispose();
            assert.equal(collection.count, 1);
            ref4.dispose();
            assert.equal(collection.count, 0);
        });
    });
});
//# sourceMappingURL=lifecycle.test.js.map