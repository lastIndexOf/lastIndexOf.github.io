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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/workbench/browser/viewlet", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/electron-browser/electronDebugActions", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/base/common/errors", "vs/base/common/filters", "vs/base/browser/ui/highlightedlabel/highlightedLabel"], function (require, exports, nls, async_1, dom, viewlet_1, debug_1, debugModel_1, contextView_1, keybinding_1, baseDebugView_1, debugActions_1, electronDebugActions_1, actionbar_1, configuration_1, panelViewlet_1, instantiation_1, event_1, contextkey_1, listService_1, themeService_1, errors_1, filters_1, highlightedLabel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    exports.variableSetEmitter = new event_1.Emitter();
    let VariablesView = class VariablesView extends panelViewlet_1.ViewletPanel {
        constructor(options, contextMenuService, debugService, keybindingService, configurationService, instantiationService, contextKeyService, listService, themeService) {
            super(Object.assign({}, options, { ariaHeaderLabel: nls.localize('variablesSection', "Variables Section") }), keybindingService, contextMenuService, configurationService);
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.listService = listService;
            this.themeService = themeService;
            // Use scheduler to prevent unnecessary flashing
            this.onFocusStackFrameScheduler = new async_1.RunOnceScheduler(() => {
                this.needsRefresh = false;
                this.tree.updateChildren().then(() => {
                    const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                    if (stackFrame) {
                        stackFrame.getScopes().then(scopes => {
                            // Expand the first scope if it is not expensive and if there is no expansion state (all are collapsed)
                            if (scopes.every(s => this.tree.getNode(s).collapsed) && scopes.length > 0 && !scopes[0].expensive) {
                                this.tree.expand(scopes[0]).then(undefined, errors_1.onUnexpectedError);
                            }
                        });
                    }
                }, errors_1.onUnexpectedError);
            }, 400);
        }
        renderBody(container) {
            dom.addClass(container, 'debug-variables');
            const treeContainer = baseDebugView_1.renderViewTree(container);
            this.tree = new listService_1.WorkbenchAsyncDataTree(treeContainer, new VariablesDelegate(), [this.instantiationService.createInstance(VariablesRenderer), new ScopesRenderer()], new VariablesDataSource(), {
                ariaLabel: nls.localize('variablesAriaTreeLabel', "Debug Variables"),
                accessibilityProvider: new VariablesAccessibilityProvider(),
                identityProvider: { getId: element => element.getId() },
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: e => e }
            }, this.contextKeyService, this.listService, this.themeService, this.configurationService, this.keybindingService);
            this.tree.setInput(this.debugService.getViewModel()).then(null, errors_1.onUnexpectedError);
            debug_1.CONTEXT_VARIABLES_FOCUSED.bindTo(this.tree.contextKeyService);
            const collapseAction = new viewlet_1.CollapseAction(this.tree, true, 'explorer-action collapse-explorer');
            this.toolbar.setActions([collapseAction])();
            this.tree.updateChildren();
            this.disposables.push(this.debugService.getViewModel().onDidFocusStackFrame(sf => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                // Refresh the tree immediately if the user explictly changed stack frames.
                // Otherwise postpone the refresh until user stops stepping.
                const timeout = sf.explicit ? 0 : undefined;
                this.onFocusStackFrameScheduler.schedule(timeout);
            }));
            this.disposables.push(exports.variableSetEmitter.event(() => this.tree.updateChildren()));
            this.disposables.push(this.tree.onMouseDblClick(e => this.onMouseDblClick(e)));
            this.disposables.push(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this.disposables.push(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onFocusStackFrameScheduler.schedule();
                }
            }));
            this.disposables.push(this.debugService.getViewModel().onDidSelectExpression(e => {
                if (e instanceof debugModel_1.Variable) {
                    this.tree.rerender(e);
                }
            }));
        }
        layoutBody(width, height) {
            this.tree.layout(width, height);
        }
        focus() {
            this.tree.domFocus();
        }
        onMouseDblClick(e) {
            const session = this.debugService.getViewModel().focusedSession;
            if (session && e.element instanceof debugModel_1.Variable && session.capabilities.supportsSetVariable) {
                this.debugService.getViewModel().setSelectedExpression(e.element);
            }
        }
        onContextMenu(e) {
            const element = e.element;
            if (element instanceof debugModel_1.Variable && !!element.value) {
                const actions = [];
                const variable = element;
                actions.push(new debugActions_1.SetValueAction(debugActions_1.SetValueAction.ID, debugActions_1.SetValueAction.LABEL, variable, this.debugService, this.keybindingService));
                actions.push(new electronDebugActions_1.CopyValueAction(electronDebugActions_1.CopyValueAction.ID, electronDebugActions_1.CopyValueAction.LABEL, variable, 'variables', this.debugService));
                actions.push(new electronDebugActions_1.CopyEvaluatePathAction(electronDebugActions_1.CopyEvaluatePathAction.ID, electronDebugActions_1.CopyEvaluatePathAction.LABEL, variable));
                actions.push(new actionbar_1.Separator());
                actions.push(new debugActions_1.AddToWatchExpressionsAction(debugActions_1.AddToWatchExpressionsAction.ID, debugActions_1.AddToWatchExpressionsAction.LABEL, variable, this.debugService, this.keybindingService));
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions,
                    getActionsContext: () => element
                });
            }
        }
    };
    VariablesView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, listService_1.IListService),
        __param(8, themeService_1.IThemeService)
    ], VariablesView);
    exports.VariablesView = VariablesView;
    function isViewModel(obj) {
        return typeof obj.getSelectedExpression === 'function';
    }
    class VariablesDataSource {
        hasChildren(element) {
            if (isViewModel(element) || element instanceof debugModel_1.Scope) {
                return true;
            }
            return element.hasChildren;
        }
        getChildren(element) {
            if (isViewModel(element)) {
                const stackFrame = element.focusedStackFrame;
                return stackFrame ? stackFrame.getScopes() : Promise.resolve([]);
            }
            return element.getChildren();
        }
    }
    exports.VariablesDataSource = VariablesDataSource;
    class VariablesDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Scope) {
                return ScopesRenderer.ID;
            }
            return VariablesRenderer.ID;
        }
    }
    class ScopesRenderer {
        get templateId() {
            return ScopesRenderer.ID;
        }
        renderTemplate(container) {
            const name = dom.append(container, $('.scope'));
            const label = new highlightedLabel_1.HighlightedLabel(name, false);
            return { name, label };
        }
        renderElement(element, index, templateData) {
            templateData.label.set(element.element.name, filters_1.createMatches(element.filterData));
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ScopesRenderer.ID = 'scope';
    class VariablesRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        get templateId() {
            return VariablesRenderer.ID;
        }
        renderExpression(expression, data, highlights) {
            baseDebugView_1.renderVariable(expression, data, true, highlights);
        }
        getInputBoxOptions(expression) {
            const variable = expression;
            return {
                initialValue: expression.value,
                ariaLabel: nls.localize('variableValueAriaLabel', "Type new variable value"),
                validationOptions: {
                    validation: () => variable.errorMessage ? ({ content: variable.errorMessage }) : null
                },
                onFinish: (value, success) => {
                    variable.errorMessage = undefined;
                    if (success && variable.value !== value) {
                        variable.setVariable(value)
                            // Need to force watch expressions and variables to update since a variable change can have an effect on both
                            .then(() => exports.variableSetEmitter.fire());
                    }
                }
            };
        }
    }
    VariablesRenderer.ID = 'variable';
    exports.VariablesRenderer = VariablesRenderer;
    class VariablesAccessibilityProvider {
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Scope) {
                return nls.localize('variableScopeAriaLabel', "Scope {0}, variables, debug", element.name);
            }
            if (element instanceof debugModel_1.Variable) {
                return nls.localize('variableAriaLabel', "{0} value {1}, variables, debug", element.name, element.value);
            }
            return null;
        }
    }
});
//# sourceMappingURL=variablesView.js.map