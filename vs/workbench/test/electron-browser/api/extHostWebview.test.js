/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/workbench/api/node/extHostWebview", "vs/workbench/test/electron-browser/api/mock", "./testRPCProtocol"], function (require, exports, assert, extHostWebview_1, mock_1, testRPCProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostWebview', function () {
        test('Cannot register multiple serializers for the same view type', () => __awaiter(this, void 0, void 0, function* () {
            const viewType = 'view.type';
            const shape = createNoopMainThreadWebviews();
            const extHostWebviews = new extHostWebview_1.ExtHostWebviews(testRPCProtocol_1.SingleProxyRPCProtocol(shape));
            let lastInvokedDeserializer = undefined;
            class NoopSerializer {
                deserializeWebviewPanel(_webview, _state) {
                    return __awaiter(this, void 0, void 0, function* () {
                        lastInvokedDeserializer = this;
                    });
                }
            }
            const serializerA = new NoopSerializer();
            const serializerB = new NoopSerializer();
            const serializerARegistration = extHostWebviews.registerWebviewPanelSerializer(viewType, serializerA);
            yield extHostWebviews.$deserializeWebviewPanel('x', viewType, 'title', {}, 0, {});
            assert.strictEqual(lastInvokedDeserializer, serializerA);
            assert.throws(() => extHostWebviews.registerWebviewPanelSerializer(viewType, serializerB), 'Should throw when registering two serializers for the same view');
            serializerARegistration.dispose();
            extHostWebviews.registerWebviewPanelSerializer(viewType, serializerB);
            yield extHostWebviews.$deserializeWebviewPanel('x', viewType, 'title', {}, 0, {});
            assert.strictEqual(lastInvokedDeserializer, serializerB);
        }));
    });
    function createNoopMainThreadWebviews() {
        return new class extends mock_1.mock() {
            $registerSerializer() { }
            $unregisterSerializer() { }
        };
    }
});
//# sourceMappingURL=extHostWebview.test.js.map