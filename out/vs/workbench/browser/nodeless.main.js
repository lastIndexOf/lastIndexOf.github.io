/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/performance", "vs/base/browser/dom", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/workbench/browser/nodeless.simpleservices", "vs/workbench/browser/workbench"], function (require, exports, performance_1, dom_1, serviceCollection_1, log_1, lifecycle_1, nodeless_simpleservices_1, workbench_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeRendererMain extends lifecycle_1.Disposable {
        open() {
            const services = this.initServices();
            return dom_1.domContentLoaded().then(() => {
                performance_1.mark('willStartWorkbench');
                // Create Workbench
                this.workbench = new workbench_1.Workbench(document.body, services.serviceCollection, services.logService);
                // Layout
                this._register(dom_1.addDisposableListener(window, dom_1.EventType.RESIZE, () => this.workbench.layout()));
                // Workbench Lifecycle
                this._register(this.workbench.onShutdown(() => this.dispose()));
                // Startup
                this.workbench.startup();
            });
        }
        initServices() {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            const logService = new nodeless_simpleservices_1.SimpleLogService();
            serviceCollection.set(log_1.ILogService, logService);
            return { serviceCollection, logService };
        }
    }
    function main() {
        const renderer = new CodeRendererMain();
        return renderer.open();
    }
    exports.main = main;
});
//# sourceMappingURL=nodeless.main.js.map