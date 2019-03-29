/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/core/lineTokens", "vs/editor/common/core/position", "vs/editor/common/modes", "vs/editor/common/modes/nullMode"], function (require, exports, arrays, errors_1, lineTokens_1, position_1, modes_1, nullMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getDefaultMetadata(topLevelLanguageId) {
        return ((topLevelLanguageId << 0 /* LANGUAGEID_OFFSET */)
            | (0 /* Other */ << 8 /* TOKEN_TYPE_OFFSET */)
            | (0 /* None */ << 11 /* FONT_STYLE_OFFSET */)
            | (1 /* DefaultForeground */ << 14 /* FOREGROUND_OFFSET */)
            | (2 /* DefaultBackground */ << 23 /* BACKGROUND_OFFSET */)) >>> 0;
    }
    const EMPTY_LINE_TOKENS = (new Uint32Array(0)).buffer;
    class ModelLineTokens {
        constructor(state) {
            this._state = state;
            this._lineTokens = null;
            this._invalid = true;
        }
        deleteBeginning(toChIndex) {
            if (this._lineTokens === null || this._lineTokens === EMPTY_LINE_TOKENS) {
                return;
            }
            this.delete(0, toChIndex);
        }
        deleteEnding(fromChIndex) {
            if (this._lineTokens === null || this._lineTokens === EMPTY_LINE_TOKENS) {
                return;
            }
            const tokens = new Uint32Array(this._lineTokens);
            const lineTextLength = tokens[tokens.length - 2];
            this.delete(fromChIndex, lineTextLength);
        }
        delete(fromChIndex, toChIndex) {
            if (this._lineTokens === null || this._lineTokens === EMPTY_LINE_TOKENS || fromChIndex === toChIndex) {
                return;
            }
            const tokens = new Uint32Array(this._lineTokens);
            const tokensCount = (tokens.length >>> 1);
            // special case: deleting everything
            if (fromChIndex === 0 && tokens[tokens.length - 2] === toChIndex) {
                this._lineTokens = EMPTY_LINE_TOKENS;
                return;
            }
            const fromTokenIndex = lineTokens_1.LineTokens.findIndexInTokensArray(tokens, fromChIndex);
            const fromTokenStartOffset = (fromTokenIndex > 0 ? tokens[(fromTokenIndex - 1) << 1] : 0);
            const fromTokenEndOffset = tokens[fromTokenIndex << 1];
            if (toChIndex < fromTokenEndOffset) {
                // the delete range is inside a single token
                const delta = (toChIndex - fromChIndex);
                for (let i = fromTokenIndex; i < tokensCount; i++) {
                    tokens[i << 1] -= delta;
                }
                return;
            }
            let dest;
            let lastEnd;
            if (fromTokenStartOffset !== fromChIndex) {
                tokens[fromTokenIndex << 1] = fromChIndex;
                dest = ((fromTokenIndex + 1) << 1);
                lastEnd = fromChIndex;
            }
            else {
                dest = (fromTokenIndex << 1);
                lastEnd = fromTokenStartOffset;
            }
            const delta = (toChIndex - fromChIndex);
            for (let tokenIndex = fromTokenIndex + 1; tokenIndex < tokensCount; tokenIndex++) {
                const tokenEndOffset = tokens[tokenIndex << 1] - delta;
                if (tokenEndOffset > lastEnd) {
                    tokens[dest++] = tokenEndOffset;
                    tokens[dest++] = tokens[(tokenIndex << 1) + 1];
                    lastEnd = tokenEndOffset;
                }
            }
            if (dest === tokens.length) {
                // nothing to trim
                return;
            }
            let tmp = new Uint32Array(dest);
            tmp.set(tokens.subarray(0, dest), 0);
            this._lineTokens = tmp.buffer;
        }
        append(_otherTokens) {
            if (_otherTokens === EMPTY_LINE_TOKENS) {
                return;
            }
            if (this._lineTokens === EMPTY_LINE_TOKENS) {
                this._lineTokens = _otherTokens;
                return;
            }
            if (this._lineTokens === null) {
                return;
            }
            if (_otherTokens === null) {
                // cannot determine combined line length...
                this._lineTokens = null;
                return;
            }
            const myTokens = new Uint32Array(this._lineTokens);
            const otherTokens = new Uint32Array(_otherTokens);
            const otherTokensCount = (otherTokens.length >>> 1);
            let result = new Uint32Array(myTokens.length + otherTokens.length);
            result.set(myTokens, 0);
            let dest = myTokens.length;
            const delta = myTokens[myTokens.length - 2];
            for (let i = 0; i < otherTokensCount; i++) {
                result[dest++] = otherTokens[(i << 1)] + delta;
                result[dest++] = otherTokens[(i << 1) + 1];
            }
            this._lineTokens = result.buffer;
        }
        insert(chIndex, textLength) {
            if (!this._lineTokens) {
                // nothing to do
                return;
            }
            const tokens = new Uint32Array(this._lineTokens);
            const tokensCount = (tokens.length >>> 1);
            let fromTokenIndex = lineTokens_1.LineTokens.findIndexInTokensArray(tokens, chIndex);
            if (fromTokenIndex > 0) {
                const fromTokenStartOffset = tokens[(fromTokenIndex - 1) << 1];
                if (fromTokenStartOffset === chIndex) {
                    fromTokenIndex--;
                }
            }
            for (let tokenIndex = fromTokenIndex; tokenIndex < tokensCount; tokenIndex++) {
                tokens[tokenIndex << 1] += textLength;
            }
        }
    }
    class ModelLinesTokens {
        constructor(languageIdentifier, tokenizationSupport) {
            this.languageIdentifier = languageIdentifier;
            this.tokenizationSupport = tokenizationSupport;
            this._tokens = [];
            if (this.tokenizationSupport) {
                let initialState = null;
                try {
                    initialState = this.tokenizationSupport.getInitialState();
                }
                catch (e) {
                    errors_1.onUnexpectedError(e);
                    this.tokenizationSupport = null;
                }
                if (initialState) {
                    this._tokens[0] = new ModelLineTokens(initialState);
                }
            }
            this._invalidLineStartIndex = 0;
            this._lastState = null;
        }
        get inValidLineStartIndex() {
            return this._invalidLineStartIndex;
        }
        getTokens(topLevelLanguageId, lineIndex, lineText) {
            let rawLineTokens = null;
            if (lineIndex < this._tokens.length && this._tokens[lineIndex]) {
                rawLineTokens = this._tokens[lineIndex]._lineTokens;
            }
            if (rawLineTokens !== null && rawLineTokens !== EMPTY_LINE_TOKENS) {
                return new lineTokens_1.LineTokens(new Uint32Array(rawLineTokens), lineText);
            }
            let lineTokens = new Uint32Array(2);
            lineTokens[0] = lineText.length;
            lineTokens[1] = getDefaultMetadata(topLevelLanguageId);
            return new lineTokens_1.LineTokens(lineTokens, lineText);
        }
        isCheapToTokenize(lineNumber) {
            const firstInvalidLineNumber = this._invalidLineStartIndex + 1;
            return (firstInvalidLineNumber >= lineNumber);
        }
        hasLinesToTokenize(buffer) {
            return (this._invalidLineStartIndex < buffer.getLineCount());
        }
        invalidateLine(lineIndex) {
            this._setIsInvalid(lineIndex, true);
            if (lineIndex < this._invalidLineStartIndex) {
                this._setIsInvalid(this._invalidLineStartIndex, true);
                this._invalidLineStartIndex = lineIndex;
            }
        }
        _setIsInvalid(lineIndex, invalid) {
            if (lineIndex < this._tokens.length && this._tokens[lineIndex]) {
                this._tokens[lineIndex]._invalid = invalid;
            }
        }
        _isInvalid(lineIndex) {
            if (lineIndex < this._tokens.length && this._tokens[lineIndex]) {
                return this._tokens[lineIndex]._invalid;
            }
            return true;
        }
        _getState(lineIndex) {
            if (lineIndex < this._tokens.length && this._tokens[lineIndex]) {
                return this._tokens[lineIndex]._state;
            }
            return null;
        }
        _setTokens(topLevelLanguageId, lineIndex, lineTextLength, tokens) {
            let target;
            if (lineIndex < this._tokens.length && this._tokens[lineIndex]) {
                target = this._tokens[lineIndex];
            }
            else {
                target = new ModelLineTokens(null);
                this._tokens[lineIndex] = target;
            }
            if (lineTextLength === 0) {
                let hasDifferentLanguageId = false;
                if (tokens && tokens.length > 1) {
                    hasDifferentLanguageId = (modes_1.TokenMetadata.getLanguageId(tokens[1]) !== topLevelLanguageId);
                }
                if (!hasDifferentLanguageId) {
                    target._lineTokens = EMPTY_LINE_TOKENS;
                    return;
                }
            }
            if (!tokens || tokens.length === 0) {
                tokens = new Uint32Array(2);
                tokens[0] = 0;
                tokens[1] = getDefaultMetadata(topLevelLanguageId);
            }
            lineTokens_1.LineTokens.convertToEndOffset(tokens, lineTextLength);
            target._lineTokens = tokens.buffer;
        }
        _setState(lineIndex, state) {
            if (lineIndex < this._tokens.length && this._tokens[lineIndex]) {
                this._tokens[lineIndex]._state = state;
            }
            else {
                const tmp = new ModelLineTokens(state);
                this._tokens[lineIndex] = tmp;
            }
        }
        //#region Editing
        applyEdits(range, eolCount, firstLineLength) {
            const deletingLinesCnt = range.endLineNumber - range.startLineNumber;
            const insertingLinesCnt = eolCount;
            const editingLinesCnt = Math.min(deletingLinesCnt, insertingLinesCnt);
            for (let j = editingLinesCnt; j >= 0; j--) {
                this.invalidateLine(range.startLineNumber + j - 1);
            }
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount, firstLineLength);
        }
        _acceptDeleteRange(range) {
            const firstLineIndex = range.startLineNumber - 1;
            if (firstLineIndex >= this._tokens.length) {
                return;
            }
            if (range.startLineNumber === range.endLineNumber) {
                if (range.startColumn === range.endColumn) {
                    // Nothing to delete
                    return;
                }
                this._tokens[firstLineIndex].delete(range.startColumn - 1, range.endColumn - 1);
                return;
            }
            const firstLine = this._tokens[firstLineIndex];
            firstLine.deleteEnding(range.startColumn - 1);
            const lastLineIndex = range.endLineNumber - 1;
            let lastLineTokens = null;
            if (lastLineIndex < this._tokens.length) {
                const lastLine = this._tokens[lastLineIndex];
                lastLine.deleteBeginning(range.endColumn - 1);
                lastLineTokens = lastLine._lineTokens;
            }
            // Take remaining text on last line and append it to remaining text on first line
            firstLine.append(lastLineTokens);
            // Delete middle lines
            this._tokens.splice(range.startLineNumber, range.endLineNumber - range.startLineNumber);
        }
        _acceptInsertText(position, eolCount, firstLineLength) {
            if (eolCount === 0 && firstLineLength === 0) {
                // Nothing to insert
                return;
            }
            const lineIndex = position.lineNumber - 1;
            if (lineIndex >= this._tokens.length) {
                return;
            }
            if (eolCount === 0) {
                // Inserting text on one line
                this._tokens[lineIndex].insert(position.column - 1, firstLineLength);
                return;
            }
            const line = this._tokens[lineIndex];
            line.deleteEnding(position.column - 1);
            line.insert(position.column - 1, firstLineLength);
            let insert = new Array(eolCount);
            for (let i = eolCount - 1; i >= 0; i--) {
                insert[i] = new ModelLineTokens(null);
            }
            this._tokens = arrays.arrayInsert(this._tokens, position.lineNumber, insert);
        }
        //#endregion
        //#region Tokenization
        _tokenizeOneLine(buffer, eventBuilder) {
            if (!this.hasLinesToTokenize(buffer)) {
                return buffer.getLineCount() + 1;
            }
            const lineNumber = this._invalidLineStartIndex + 1;
            this._updateTokensUntilLine(buffer, eventBuilder, lineNumber);
            return lineNumber;
        }
        _tokenizeText(buffer, text, state) {
            let r = null;
            if (this.tokenizationSupport) {
                try {
                    r = this.tokenizationSupport.tokenize2(text, state, 0);
                }
                catch (e) {
                    errors_1.onUnexpectedError(e);
                }
            }
            if (!r) {
                r = nullMode_1.nullTokenize2(this.languageIdentifier.id, text, state, 0);
            }
            return r;
        }
        _updateTokensUntilLine(buffer, eventBuilder, lineNumber) {
            if (!this.tokenizationSupport) {
                this._invalidLineStartIndex = buffer.getLineCount();
                return;
            }
            const linesLength = buffer.getLineCount();
            const endLineIndex = lineNumber - 1;
            // Validate all states up to and including endLineIndex
            for (let lineIndex = this._invalidLineStartIndex; lineIndex <= endLineIndex; lineIndex++) {
                const endStateIndex = lineIndex + 1;
                const text = buffer.getLineContent(lineIndex + 1);
                const lineStartState = this._getState(lineIndex);
                let r = null;
                try {
                    // Tokenize only the first X characters
                    let freshState = lineStartState.clone();
                    r = this.tokenizationSupport.tokenize2(text, freshState, 0);
                }
                catch (e) {
                    errors_1.onUnexpectedError(e);
                }
                if (!r) {
                    r = nullMode_1.nullTokenize2(this.languageIdentifier.id, text, lineStartState, 0);
                }
                this._setTokens(this.languageIdentifier.id, lineIndex, text.length, r.tokens);
                eventBuilder.registerChangedTokens(lineIndex + 1);
                this._setIsInvalid(lineIndex, false);
                if (endStateIndex < linesLength) {
                    const previousEndState = this._getState(endStateIndex);
                    if (previousEndState !== null && r.endState.equals(previousEndState)) {
                        // The end state of this line remains the same
                        let nextInvalidLineIndex = lineIndex + 1;
                        while (nextInvalidLineIndex < linesLength) {
                            if (this._isInvalid(nextInvalidLineIndex)) {
                                break;
                            }
                            if (nextInvalidLineIndex + 1 < linesLength) {
                                if (this._getState(nextInvalidLineIndex + 1) === null) {
                                    break;
                                }
                            }
                            else {
                                if (this._lastState === null) {
                                    break;
                                }
                            }
                            nextInvalidLineIndex++;
                        }
                        this._invalidLineStartIndex = Math.max(this._invalidLineStartIndex, nextInvalidLineIndex);
                        lineIndex = nextInvalidLineIndex - 1; // -1 because the outer loop increments it
                    }
                    else {
                        this._setState(endStateIndex, r.endState);
                    }
                }
                else {
                    this._lastState = r.endState;
                }
            }
            this._invalidLineStartIndex = Math.max(this._invalidLineStartIndex, endLineIndex + 1);
        }
    }
    exports.ModelLinesTokens = ModelLinesTokens;
    class ModelTokensChangedEventBuilder {
        constructor() {
            this._ranges = [];
        }
        registerChangedTokens(lineNumber) {
            const ranges = this._ranges;
            const rangesLength = ranges.length;
            const previousRange = rangesLength > 0 ? ranges[rangesLength - 1] : null;
            if (previousRange && previousRange.toLineNumber === lineNumber - 1) {
                // extend previous range
                previousRange.toLineNumber++;
            }
            else {
                // insert new range
                ranges[rangesLength] = {
                    fromLineNumber: lineNumber,
                    toLineNumber: lineNumber
                };
            }
        }
        build() {
            if (this._ranges.length === 0) {
                return null;
            }
            return {
                tokenizationSupportChanged: false,
                ranges: this._ranges
            };
        }
    }
    exports.ModelTokensChangedEventBuilder = ModelTokensChangedEventBuilder;
});
//# sourceMappingURL=textModelTokens.js.map