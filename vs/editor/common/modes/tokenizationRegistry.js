/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TokenizationRegistryImpl {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._map = Object.create(null);
            this._promises = Object.create(null);
            this._colorMap = null;
        }
        fire(languages) {
            this._onDidChange.fire({
                changedLanguages: languages,
                changedColorMap: false
            });
        }
        register(language, support) {
            this._map[language] = support;
            this.fire([language]);
            return lifecycle_1.toDisposable(() => {
                if (this._map[language] !== support) {
                    return;
                }
                delete this._map[language];
                this.fire([language]);
            });
        }
        registerPromise(language, supportPromise) {
            let registration = null;
            let isDisposed = false;
            this._promises[language] = supportPromise.then(support => {
                delete this._promises[language];
                if (isDisposed || !support) {
                    return;
                }
                registration = this.register(language, support);
            });
            return lifecycle_1.toDisposable(() => {
                isDisposed = true;
                if (registration) {
                    registration.dispose();
                }
            });
        }
        getPromise(language) {
            const support = this.get(language);
            if (support) {
                return Promise.resolve(support);
            }
            const promise = this._promises[language];
            if (promise) {
                return promise.then(_ => this.get(language));
            }
            return null;
        }
        get(language) {
            return (this._map[language] || null);
        }
        setColorMap(colorMap) {
            this._colorMap = colorMap;
            this._onDidChange.fire({
                changedLanguages: Object.keys(this._map),
                changedColorMap: true
            });
        }
        getColorMap() {
            return this._colorMap;
        }
        getDefaultBackground() {
            if (this._colorMap && this._colorMap.length > 2 /* DefaultBackground */) {
                return this._colorMap[2 /* DefaultBackground */];
            }
            return null;
        }
    }
    exports.TokenizationRegistryImpl = TokenizationRegistryImpl;
});
//# sourceMappingURL=tokenizationRegistry.js.map