/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/platform/commands/common/commands"], function (require, exports, cancellation_1, errors_1, uri_1, range_1, modes_1, modelService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Link {
        constructor(link, provider) {
            this._link = link;
            this._provider = provider;
        }
        toJSON() {
            return {
                range: this.range,
                url: this.url
            };
        }
        get range() {
            return this._link.range;
        }
        get url() {
            return this._link.url;
        }
        resolve(token) {
            if (this._link.url) {
                try {
                    if (typeof this._link.url === 'string') {
                        return Promise.resolve(uri_1.URI.parse(this._link.url));
                    }
                    else {
                        return Promise.resolve(this._link.url);
                    }
                }
                catch (e) {
                    return Promise.reject(new Error('invalid'));
                }
            }
            if (typeof this._provider.resolveLink === 'function') {
                return Promise.resolve(this._provider.resolveLink(this._link, token)).then(value => {
                    this._link = value || this._link;
                    if (this._link.url) {
                        // recurse
                        return this.resolve(token);
                    }
                    return Promise.reject(new Error('missing'));
                });
            }
            return Promise.reject(new Error('missing'));
        }
    }
    exports.Link = Link;
    function getLinks(model, token) {
        let links = [];
        // ask all providers for links in parallel
        const promises = modes_1.LinkProviderRegistry.ordered(model).reverse().map(provider => {
            return Promise.resolve(provider.provideLinks(model, token)).then(result => {
                if (Array.isArray(result)) {
                    const newLinks = result.map(link => new Link(link, provider));
                    links = union(links, newLinks);
                }
            }, errors_1.onUnexpectedExternalError);
        });
        return Promise.all(promises).then(() => {
            return links;
        });
    }
    exports.getLinks = getLinks;
    function union(oldLinks, newLinks) {
        // reunite oldLinks with newLinks and remove duplicates
        let result = [];
        let oldIndex;
        let oldLen;
        let newIndex;
        let newLen;
        for (oldIndex = 0, newIndex = 0, oldLen = oldLinks.length, newLen = newLinks.length; oldIndex < oldLen && newIndex < newLen;) {
            const oldLink = oldLinks[oldIndex];
            const newLink = newLinks[newIndex];
            if (range_1.Range.areIntersectingOrTouching(oldLink.range, newLink.range)) {
                // Remove the oldLink
                oldIndex++;
                continue;
            }
            const comparisonResult = range_1.Range.compareRangesUsingStarts(oldLink.range, newLink.range);
            if (comparisonResult < 0) {
                // oldLink is before
                result.push(oldLink);
                oldIndex++;
            }
            else {
                // newLink is before
                result.push(newLink);
                newIndex++;
            }
        }
        for (; oldIndex < oldLen; oldIndex++) {
            result.push(oldLinks[oldIndex]);
        }
        for (; newIndex < newLen; newIndex++) {
            result.push(newLinks[newIndex]);
        }
        return result;
    }
    commands_1.CommandsRegistry.registerCommand('_executeLinkProvider', (accessor, ...args) => {
        const [uri] = args;
        if (!(uri instanceof uri_1.URI)) {
            return undefined;
        }
        const model = accessor.get(modelService_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        return getLinks(model, cancellation_1.CancellationToken.None);
    });
});
//# sourceMappingURL=getLinks.js.map