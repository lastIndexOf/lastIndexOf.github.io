/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/functional"], function (require, exports, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isDisposable(thing) {
        return typeof thing.dispose === 'function'
            && thing.dispose.length === 0;
    }
    exports.isDisposable = isDisposable;
    function dispose(first, ...rest) {
        if (Array.isArray(first)) {
            first.forEach(d => d && d.dispose());
            return [];
        }
        else if (rest.length === 0) {
            if (first) {
                first.dispose();
                return first;
            }
            return undefined;
        }
        else {
            dispose(first);
            dispose(rest);
            return [];
        }
    }
    exports.dispose = dispose;
    function combinedDisposable(disposables) {
        return { dispose: () => dispose(disposables) };
    }
    exports.combinedDisposable = combinedDisposable;
    function toDisposable(fn) {
        return { dispose() { fn(); } };
    }
    exports.toDisposable = toDisposable;
    class Disposable {
        constructor() {
            this._toDispose = [];
            this._lifecycle_disposable_isDisposed = false;
        }
        get toDispose() { return this._toDispose; }
        dispose() {
            this._lifecycle_disposable_isDisposed = true;
            this._toDispose = dispose(this._toDispose);
        }
        _register(t) {
            if (this._lifecycle_disposable_isDisposed) {
                console.warn('Registering disposable on object that has already been disposed.');
                t.dispose();
            }
            else {
                this._toDispose.push(t);
            }
            return t;
        }
    }
    Disposable.None = Object.freeze({ dispose() { } });
    exports.Disposable = Disposable;
    class ReferenceCollection {
        constructor() {
            this.references = Object.create(null);
        }
        acquire(key) {
            let reference = this.references[key];
            if (!reference) {
                reference = this.references[key] = { counter: 0, object: this.createReferencedObject(key) };
            }
            const { object } = reference;
            const dispose = functional_1.once(() => {
                if (--reference.counter === 0) {
                    this.destroyReferencedObject(key, reference.object);
                    delete this.references[key];
                }
            });
            reference.counter++;
            return { object, dispose };
        }
    }
    exports.ReferenceCollection = ReferenceCollection;
    class ImmortalReference {
        constructor(object) {
            this.object = object;
        }
        dispose() { }
    }
    exports.ImmortalReference = ImmortalReference;
});
//# sourceMappingURL=lifecycle.js.map