/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/objects", "vs/base/browser/ui/octiconLabel/octiconLabel", "vs/base/common/strings"], function (require, exports, dom, objects, octiconLabel_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HighlightedLabel {
        constructor(container, supportOcticons) {
            this.supportOcticons = supportOcticons;
            this.domNode = document.createElement('span');
            this.domNode.className = 'monaco-highlighted-label';
            this.didEverRender = false;
            container.appendChild(this.domNode);
        }
        get element() {
            return this.domNode;
        }
        set(text, highlights = [], title = '', escapeNewLines) {
            if (!text) {
                text = '';
            }
            if (escapeNewLines) {
                // adjusts highlights inplace
                text = HighlightedLabel.escapeNewLines(text, highlights);
            }
            if (this.didEverRender && this.text === text && this.title === title && objects.equals(this.highlights, highlights)) {
                return;
            }
            if (!Array.isArray(highlights)) {
                highlights = [];
            }
            this.text = text;
            this.title = title;
            this.highlights = highlights;
            this.render();
        }
        render() {
            dom.clearNode(this.domNode);
            let htmlContent = [];
            let pos = 0;
            for (const highlight of this.highlights) {
                if (highlight.end === highlight.start) {
                    continue;
                }
                if (pos < highlight.start) {
                    htmlContent.push('<span>');
                    const substring = this.text.substring(pos, highlight.start);
                    htmlContent.push(this.supportOcticons ? octiconLabel_1.renderOcticons(substring) : strings_1.escape(substring));
                    htmlContent.push('</span>');
                    pos = highlight.end;
                }
                htmlContent.push('<span class="highlight">');
                const substring = this.text.substring(highlight.start, highlight.end);
                htmlContent.push(this.supportOcticons ? octiconLabel_1.renderOcticons(substring) : strings_1.escape(substring));
                htmlContent.push('</span>');
                pos = highlight.end;
            }
            if (pos < this.text.length) {
                htmlContent.push('<span>');
                const substring = this.text.substring(pos);
                htmlContent.push(this.supportOcticons ? octiconLabel_1.renderOcticons(substring) : strings_1.escape(substring));
                htmlContent.push('</span>');
            }
            this.domNode.innerHTML = htmlContent.join('');
            this.domNode.title = this.title;
            this.didEverRender = true;
        }
        static escapeNewLines(text, highlights) {
            let total = 0;
            let extra = 0;
            return text.replace(/\r\n|\r|\n/, (match, offset) => {
                extra = match === '\r\n' ? -1 : 0;
                offset += total;
                for (const highlight of highlights) {
                    if (highlight.end <= offset) {
                        continue;
                    }
                    if (highlight.start >= offset) {
                        highlight.start += extra;
                    }
                    if (highlight.end >= offset) {
                        highlight.end += extra;
                    }
                }
                total += extra;
                return '\u23CE';
            });
        }
    }
    exports.HighlightedLabel = HighlightedLabel;
});
//# sourceMappingURL=highlightedLabel.js.map