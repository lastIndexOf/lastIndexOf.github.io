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
define(["require", "exports", "assert", "vs/workbench/services/progress/browser/progressService", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, progressService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestViewlet {
        constructor(id) {
            this.id = id;
        }
        getId() {
            return this.id;
        }
        /**
         * Returns the name of this composite to show in the title area.
         */
        getTitle() {
            return this.id;
        }
        /**
         * Returns the primary actions of the composite.
         */
        getActions() {
            return [];
        }
        /**
         * Returns the secondary actions of the composite.
         */
        getSecondaryActions() {
            return [];
        }
        /**
         * Returns an array of actions to show in the context menu of the composite
         */
        getContextMenuActions() {
            return [];
        }
        /**
         * Returns the action item for a specific action.
         */
        getActionItem(action) {
            return null;
        }
        /**
         * Returns the underlying control of this composite.
         */
        getControl() {
            return null;
        }
        /**
         * Asks the underlying control to focus.
         */
        focus() {
        }
        getOptimalWidth() {
            return 10;
        }
    }
    class TestScopedService extends progressService_1.ScopedService {
        constructor(viewletService, panelService, scopeId) {
            super(viewletService, panelService, scopeId);
        }
        onScopeActivated() {
            this.isActive = true;
        }
        onScopeDeactivated() {
            this.isActive = false;
        }
    }
    class TestProgressBar {
        constructor() {
        }
        infinite() {
            this.fDone = null;
            this.fInfinite = true;
            return this;
        }
        total(total) {
            this.fDone = null;
            this.fTotal = total;
            return this;
        }
        hasTotal() {
            return !!this.fTotal;
        }
        worked(worked) {
            this.fDone = null;
            if (this.fWorked) {
                this.fWorked += worked;
            }
            else {
                this.fWorked = worked;
            }
            return this;
        }
        done() {
            this.fDone = true;
            this.fInfinite = null;
            this.fWorked = null;
            this.fTotal = null;
            return this;
        }
        stop() {
            return this.done();
        }
        show() {
        }
        hide() {
        }
    }
    suite('Progress Service', () => {
        test('ScopedService', () => {
            let viewletService = new workbenchTestServices_1.TestViewletService();
            let panelService = new workbenchTestServices_1.TestPanelService();
            let service = new TestScopedService(viewletService, panelService, 'test.scopeId');
            const testViewlet = new TestViewlet('test.scopeId');
            assert(!service.isActive);
            viewletService.onDidViewletOpenEmitter.fire(testViewlet);
            assert(service.isActive);
            viewletService.onDidViewletCloseEmitter.fire(testViewlet);
            assert(!service.isActive);
        });
        test('WorkbenchProgressService', () => __awaiter(this, void 0, void 0, function* () {
            let testProgressBar = new TestProgressBar();
            let viewletService = new workbenchTestServices_1.TestViewletService();
            let panelService = new workbenchTestServices_1.TestPanelService();
            let service = new progressService_1.ScopedProgressService(testProgressBar, 'test.scopeId', true, viewletService, panelService);
            // Active: Show (Infinite)
            let fn = service.show(true);
            assert.strictEqual(true, testProgressBar.fInfinite);
            fn.done();
            assert.strictEqual(true, testProgressBar.fDone);
            // Active: Show (Total / Worked)
            fn = service.show(100);
            assert.strictEqual(false, !!testProgressBar.fInfinite);
            assert.strictEqual(100, testProgressBar.fTotal);
            fn.worked(20);
            assert.strictEqual(20, testProgressBar.fWorked);
            fn.total(80);
            assert.strictEqual(80, testProgressBar.fTotal);
            fn.done();
            assert.strictEqual(true, testProgressBar.fDone);
            // Inactive: Show (Infinite)
            const testViewlet = new TestViewlet('test.scopeId');
            viewletService.onDidViewletCloseEmitter.fire(testViewlet);
            service.show(true);
            assert.strictEqual(false, !!testProgressBar.fInfinite);
            viewletService.onDidViewletOpenEmitter.fire(testViewlet);
            assert.strictEqual(true, testProgressBar.fInfinite);
            // Inactive: Show (Total / Worked)
            viewletService.onDidViewletCloseEmitter.fire(testViewlet);
            fn = service.show(100);
            fn.total(80);
            fn.worked(20);
            assert.strictEqual(false, !!testProgressBar.fTotal);
            viewletService.onDidViewletOpenEmitter.fire(testViewlet);
            assert.strictEqual(20, testProgressBar.fWorked);
            assert.strictEqual(80, testProgressBar.fTotal);
            // Acive: Show While
            let p = Promise.resolve(null);
            yield service.showWhile(p);
            assert.strictEqual(true, testProgressBar.fDone);
            viewletService.onDidViewletCloseEmitter.fire(testViewlet);
            p = Promise.resolve(null);
            yield service.showWhile(p);
            assert.strictEqual(true, testProgressBar.fDone);
            viewletService.onDidViewletOpenEmitter.fire(testViewlet);
            assert.strictEqual(true, testProgressBar.fDone);
        }));
    });
});
//# sourceMappingURL=progressService.test.js.map