/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/controller/cursorCommon", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, cursorCommon_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ColumnSelection {
        static _columnSelect(config, model, fromLineNumber, fromVisibleColumn, toLineNumber, toVisibleColumn) {
            let lineCount = Math.abs(toLineNumber - fromLineNumber) + 1;
            let reversed = (fromLineNumber > toLineNumber);
            let isRTL = (fromVisibleColumn > toVisibleColumn);
            let isLTR = (fromVisibleColumn < toVisibleColumn);
            let result = [];
            // console.log(`fromVisibleColumn: ${fromVisibleColumn}, toVisibleColumn: ${toVisibleColumn}`);
            for (let i = 0; i < lineCount; i++) {
                let lineNumber = fromLineNumber + (reversed ? -i : i);
                let startColumn = cursorCommon_1.CursorColumns.columnFromVisibleColumn2(config, model, lineNumber, fromVisibleColumn);
                let endColumn = cursorCommon_1.CursorColumns.columnFromVisibleColumn2(config, model, lineNumber, toVisibleColumn);
                let visibleStartColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(config, model, new position_1.Position(lineNumber, startColumn));
                let visibleEndColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(config, model, new position_1.Position(lineNumber, endColumn));
                // console.log(`lineNumber: ${lineNumber}: visibleStartColumn: ${visibleStartColumn}, visibleEndColumn: ${visibleEndColumn}`);
                if (isLTR) {
                    if (visibleStartColumn > toVisibleColumn) {
                        continue;
                    }
                    if (visibleEndColumn < fromVisibleColumn) {
                        continue;
                    }
                }
                if (isRTL) {
                    if (visibleEndColumn > fromVisibleColumn) {
                        continue;
                    }
                    if (visibleStartColumn < toVisibleColumn) {
                        continue;
                    }
                }
                result.push(new cursorCommon_1.SingleCursorState(new range_1.Range(lineNumber, startColumn, lineNumber, startColumn), 0, new position_1.Position(lineNumber, endColumn), 0));
            }
            return {
                viewStates: result,
                reversed: reversed,
                toLineNumber: toLineNumber,
                toVisualColumn: toVisibleColumn
            };
        }
        static columnSelect(config, model, fromViewSelection, toViewLineNumber, toViewVisualColumn) {
            const fromViewPosition = new position_1.Position(fromViewSelection.selectionStartLineNumber, fromViewSelection.selectionStartColumn);
            const fromViewVisibleColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(config, model, fromViewPosition);
            return ColumnSelection._columnSelect(config, model, fromViewPosition.lineNumber, fromViewVisibleColumn, toViewLineNumber, toViewVisualColumn);
        }
        static columnSelectLeft(config, model, cursor, toViewLineNumber, toViewVisualColumn) {
            if (toViewVisualColumn > 1) {
                toViewVisualColumn--;
            }
            return this.columnSelect(config, model, cursor.selection, toViewLineNumber, toViewVisualColumn);
        }
        static columnSelectRight(config, model, cursor, toViewLineNumber, toViewVisualColumn) {
            let maxVisualViewColumn = 0;
            let minViewLineNumber = Math.min(cursor.position.lineNumber, toViewLineNumber);
            let maxViewLineNumber = Math.max(cursor.position.lineNumber, toViewLineNumber);
            for (let lineNumber = minViewLineNumber; lineNumber <= maxViewLineNumber; lineNumber++) {
                let lineMaxViewColumn = model.getLineMaxColumn(lineNumber);
                let lineMaxVisualViewColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(config, model, new position_1.Position(lineNumber, lineMaxViewColumn));
                maxVisualViewColumn = Math.max(maxVisualViewColumn, lineMaxVisualViewColumn);
            }
            if (toViewVisualColumn < maxVisualViewColumn) {
                toViewVisualColumn++;
            }
            return this.columnSelect(config, model, cursor.selection, toViewLineNumber, toViewVisualColumn);
        }
        static columnSelectUp(config, model, cursor, isPaged, toViewLineNumber, toViewVisualColumn) {
            let linesCount = isPaged ? config.pageSize : 1;
            toViewLineNumber -= linesCount;
            if (toViewLineNumber < 1) {
                toViewLineNumber = 1;
            }
            return this.columnSelect(config, model, cursor.selection, toViewLineNumber, toViewVisualColumn);
        }
        static columnSelectDown(config, model, cursor, isPaged, toViewLineNumber, toViewVisualColumn) {
            let linesCount = isPaged ? config.pageSize : 1;
            toViewLineNumber += linesCount;
            if (toViewLineNumber > model.getLineCount()) {
                toViewLineNumber = model.getLineCount();
            }
            return this.columnSelect(config, model, cursor.selection, toViewLineNumber, toViewVisualColumn);
        }
    }
    exports.ColumnSelection = ColumnSelection;
});
//# sourceMappingURL=cursorColumnSelection.js.map