/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/types"], function (require, exports, path_1, platform_1, instantiation_1, strings_1, resources_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IFileService = instantiation_1.createDecorator('fileService');
    var FileType;
    (function (FileType) {
        FileType[FileType["Unknown"] = 0] = "Unknown";
        FileType[FileType["File"] = 1] = "File";
        FileType[FileType["Directory"] = 2] = "Directory";
        FileType[FileType["SymbolicLink"] = 64] = "SymbolicLink";
    })(FileType = exports.FileType || (exports.FileType = {}));
    var FileSystemProviderCapabilities;
    (function (FileSystemProviderCapabilities) {
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileReadWrite"] = 2] = "FileReadWrite";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileOpenReadWriteClose"] = 4] = "FileOpenReadWriteClose";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileFolderCopy"] = 8] = "FileFolderCopy";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["PathCaseSensitive"] = 1024] = "PathCaseSensitive";
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["Readonly"] = 2048] = "Readonly";
    })(FileSystemProviderCapabilities = exports.FileSystemProviderCapabilities || (exports.FileSystemProviderCapabilities = {}));
    var FileOperation;
    (function (FileOperation) {
        FileOperation[FileOperation["CREATE"] = 0] = "CREATE";
        FileOperation[FileOperation["DELETE"] = 1] = "DELETE";
        FileOperation[FileOperation["MOVE"] = 2] = "MOVE";
        FileOperation[FileOperation["COPY"] = 3] = "COPY";
    })(FileOperation = exports.FileOperation || (exports.FileOperation = {}));
    class FileOperationEvent {
        constructor(_resource, _operation, _target) {
            this._resource = _resource;
            this._operation = _operation;
            this._target = _target;
        }
        get resource() {
            return this._resource;
        }
        get target() {
            return this._target;
        }
        get operation() {
            return this._operation;
        }
    }
    exports.FileOperationEvent = FileOperationEvent;
    /**
     * Possible changes that can occur to a file.
     */
    var FileChangeType;
    (function (FileChangeType) {
        FileChangeType[FileChangeType["UPDATED"] = 0] = "UPDATED";
        FileChangeType[FileChangeType["ADDED"] = 1] = "ADDED";
        FileChangeType[FileChangeType["DELETED"] = 2] = "DELETED";
    })(FileChangeType = exports.FileChangeType || (exports.FileChangeType = {}));
    class FileChangesEvent {
        constructor(changes) {
            this._changes = changes;
        }
        get changes() {
            return this._changes;
        }
        /**
         * Returns true if this change event contains the provided file with the given change type (if provided). In case of
         * type DELETED, this method will also return true if a folder got deleted that is the parent of the
         * provided file path.
         */
        contains(resource, type) {
            if (!resource) {
                return false;
            }
            const checkForChangeType = !types_1.isUndefinedOrNull(type);
            return this._changes.some(change => {
                if (checkForChangeType && change.type !== type) {
                    return false;
                }
                // For deleted also return true when deleted folder is parent of target path
                if (change.type === 2 /* DELETED */) {
                    return resources_1.isEqualOrParent(resource, change.resource, !platform_1.isLinux /* ignorecase */);
                }
                return resources_1.isEqual(resource, change.resource, !platform_1.isLinux /* ignorecase */);
            });
        }
        /**
         * Returns the changes that describe added files.
         */
        getAdded() {
            return this.getOfType(1 /* ADDED */);
        }
        /**
         * Returns if this event contains added files.
         */
        gotAdded() {
            return this.hasType(1 /* ADDED */);
        }
        /**
         * Returns the changes that describe deleted files.
         */
        getDeleted() {
            return this.getOfType(2 /* DELETED */);
        }
        /**
         * Returns if this event contains deleted files.
         */
        gotDeleted() {
            return this.hasType(2 /* DELETED */);
        }
        /**
         * Returns the changes that describe updated files.
         */
        getUpdated() {
            return this.getOfType(0 /* UPDATED */);
        }
        /**
         * Returns if this event contains updated files.
         */
        gotUpdated() {
            return this.hasType(0 /* UPDATED */);
        }
        getOfType(type) {
            return this._changes.filter(change => change.type === type);
        }
        hasType(type) {
            return this._changes.some(change => {
                return change.type === type;
            });
        }
    }
    exports.FileChangesEvent = FileChangesEvent;
    function isParent(path, candidate, ignoreCase) {
        if (!path || !candidate || path === candidate) {
            return false;
        }
        if (candidate.length > path.length) {
            return false;
        }
        if (candidate.charAt(candidate.length - 1) !== path_1.sep) {
            candidate += path_1.sep;
        }
        if (ignoreCase) {
            return strings_1.startsWithIgnoreCase(path, candidate);
        }
        return path.indexOf(candidate) === 0;
    }
    exports.isParent = isParent;
    class StringSnapshot {
        constructor(value) {
            this._value = value;
        }
        read() {
            let ret = this._value;
            this._value = null;
            return ret;
        }
    }
    exports.StringSnapshot = StringSnapshot;
    /**
     * Helper method to convert a snapshot into its full string form.
     */
    function snapshotToString(snapshot) {
        const chunks = [];
        let chunk;
        while (typeof (chunk = snapshot.read()) === 'string') {
            chunks.push(chunk);
        }
        return chunks.join('');
    }
    exports.snapshotToString = snapshotToString;
    class FileOperationError extends Error {
        constructor(message, fileOperationResult, options) {
            super(message);
            this.fileOperationResult = fileOperationResult;
            this.options = options;
        }
        static isFileOperationError(obj) {
            return obj instanceof Error && !types_1.isUndefinedOrNull(obj.fileOperationResult);
        }
    }
    exports.FileOperationError = FileOperationError;
    var FileOperationResult;
    (function (FileOperationResult) {
        FileOperationResult[FileOperationResult["FILE_IS_BINARY"] = 0] = "FILE_IS_BINARY";
        FileOperationResult[FileOperationResult["FILE_IS_DIRECTORY"] = 1] = "FILE_IS_DIRECTORY";
        FileOperationResult[FileOperationResult["FILE_NOT_FOUND"] = 2] = "FILE_NOT_FOUND";
        FileOperationResult[FileOperationResult["FILE_NOT_MODIFIED_SINCE"] = 3] = "FILE_NOT_MODIFIED_SINCE";
        FileOperationResult[FileOperationResult["FILE_MODIFIED_SINCE"] = 4] = "FILE_MODIFIED_SINCE";
        FileOperationResult[FileOperationResult["FILE_MOVE_CONFLICT"] = 5] = "FILE_MOVE_CONFLICT";
        FileOperationResult[FileOperationResult["FILE_READ_ONLY"] = 6] = "FILE_READ_ONLY";
        FileOperationResult[FileOperationResult["FILE_PERMISSION_DENIED"] = 7] = "FILE_PERMISSION_DENIED";
        FileOperationResult[FileOperationResult["FILE_TOO_LARGE"] = 8] = "FILE_TOO_LARGE";
        FileOperationResult[FileOperationResult["FILE_INVALID_PATH"] = 9] = "FILE_INVALID_PATH";
        FileOperationResult[FileOperationResult["FILE_EXCEED_MEMORY_LIMIT"] = 10] = "FILE_EXCEED_MEMORY_LIMIT";
    })(FileOperationResult = exports.FileOperationResult || (exports.FileOperationResult = {}));
    exports.AutoSaveConfiguration = {
        OFF: 'off',
        AFTER_DELAY: 'afterDelay',
        ON_FOCUS_CHANGE: 'onFocusChange',
        ON_WINDOW_CHANGE: 'onWindowChange'
    };
    exports.HotExitConfiguration = {
        OFF: 'off',
        ON_EXIT: 'onExit',
        ON_EXIT_AND_WINDOW_CLOSE: 'onExitAndWindowClose'
    };
    exports.CONTENT_CHANGE_EVENT_BUFFER_DELAY = 1000;
    exports.FILES_ASSOCIATIONS_CONFIG = 'files.associations';
    exports.FILES_EXCLUDE_CONFIG = 'files.exclude';
    exports.SUPPORTED_ENCODINGS = {
        utf8: {
            labelLong: 'UTF-8',
            labelShort: 'UTF-8',
            order: 1,
            alias: 'utf8bom'
        },
        utf8bom: {
            labelLong: 'UTF-8 with BOM',
            labelShort: 'UTF-8 with BOM',
            encodeOnly: true,
            order: 2,
            alias: 'utf8'
        },
        utf16le: {
            labelLong: 'UTF-16 LE',
            labelShort: 'UTF-16 LE',
            order: 3
        },
        utf16be: {
            labelLong: 'UTF-16 BE',
            labelShort: 'UTF-16 BE',
            order: 4
        },
        windows1252: {
            labelLong: 'Western (Windows 1252)',
            labelShort: 'Windows 1252',
            order: 5
        },
        iso88591: {
            labelLong: 'Western (ISO 8859-1)',
            labelShort: 'ISO 8859-1',
            order: 6
        },
        iso88593: {
            labelLong: 'Western (ISO 8859-3)',
            labelShort: 'ISO 8859-3',
            order: 7
        },
        iso885915: {
            labelLong: 'Western (ISO 8859-15)',
            labelShort: 'ISO 8859-15',
            order: 8
        },
        macroman: {
            labelLong: 'Western (Mac Roman)',
            labelShort: 'Mac Roman',
            order: 9
        },
        cp437: {
            labelLong: 'DOS (CP 437)',
            labelShort: 'CP437',
            order: 10
        },
        windows1256: {
            labelLong: 'Arabic (Windows 1256)',
            labelShort: 'Windows 1256',
            order: 11
        },
        iso88596: {
            labelLong: 'Arabic (ISO 8859-6)',
            labelShort: 'ISO 8859-6',
            order: 12
        },
        windows1257: {
            labelLong: 'Baltic (Windows 1257)',
            labelShort: 'Windows 1257',
            order: 13
        },
        iso88594: {
            labelLong: 'Baltic (ISO 8859-4)',
            labelShort: 'ISO 8859-4',
            order: 14
        },
        iso885914: {
            labelLong: 'Celtic (ISO 8859-14)',
            labelShort: 'ISO 8859-14',
            order: 15
        },
        windows1250: {
            labelLong: 'Central European (Windows 1250)',
            labelShort: 'Windows 1250',
            order: 16
        },
        iso88592: {
            labelLong: 'Central European (ISO 8859-2)',
            labelShort: 'ISO 8859-2',
            order: 17
        },
        cp852: {
            labelLong: 'Central European (CP 852)',
            labelShort: 'CP 852',
            order: 18
        },
        windows1251: {
            labelLong: 'Cyrillic (Windows 1251)',
            labelShort: 'Windows 1251',
            order: 19
        },
        cp866: {
            labelLong: 'Cyrillic (CP 866)',
            labelShort: 'CP 866',
            order: 20
        },
        iso88595: {
            labelLong: 'Cyrillic (ISO 8859-5)',
            labelShort: 'ISO 8859-5',
            order: 21
        },
        koi8r: {
            labelLong: 'Cyrillic (KOI8-R)',
            labelShort: 'KOI8-R',
            order: 22
        },
        koi8u: {
            labelLong: 'Cyrillic (KOI8-U)',
            labelShort: 'KOI8-U',
            order: 23
        },
        iso885913: {
            labelLong: 'Estonian (ISO 8859-13)',
            labelShort: 'ISO 8859-13',
            order: 24
        },
        windows1253: {
            labelLong: 'Greek (Windows 1253)',
            labelShort: 'Windows 1253',
            order: 25
        },
        iso88597: {
            labelLong: 'Greek (ISO 8859-7)',
            labelShort: 'ISO 8859-7',
            order: 26
        },
        windows1255: {
            labelLong: 'Hebrew (Windows 1255)',
            labelShort: 'Windows 1255',
            order: 27
        },
        iso88598: {
            labelLong: 'Hebrew (ISO 8859-8)',
            labelShort: 'ISO 8859-8',
            order: 28
        },
        iso885910: {
            labelLong: 'Nordic (ISO 8859-10)',
            labelShort: 'ISO 8859-10',
            order: 29
        },
        iso885916: {
            labelLong: 'Romanian (ISO 8859-16)',
            labelShort: 'ISO 8859-16',
            order: 30
        },
        windows1254: {
            labelLong: 'Turkish (Windows 1254)',
            labelShort: 'Windows 1254',
            order: 31
        },
        iso88599: {
            labelLong: 'Turkish (ISO 8859-9)',
            labelShort: 'ISO 8859-9',
            order: 32
        },
        windows1258: {
            labelLong: 'Vietnamese (Windows 1258)',
            labelShort: 'Windows 1258',
            order: 33
        },
        gbk: {
            labelLong: 'Simplified Chinese (GBK)',
            labelShort: 'GBK',
            order: 34
        },
        gb18030: {
            labelLong: 'Simplified Chinese (GB18030)',
            labelShort: 'GB18030',
            order: 35
        },
        cp950: {
            labelLong: 'Traditional Chinese (Big5)',
            labelShort: 'Big5',
            order: 36
        },
        big5hkscs: {
            labelLong: 'Traditional Chinese (Big5-HKSCS)',
            labelShort: 'Big5-HKSCS',
            order: 37
        },
        shiftjis: {
            labelLong: 'Japanese (Shift JIS)',
            labelShort: 'Shift JIS',
            order: 38
        },
        eucjp: {
            labelLong: 'Japanese (EUC-JP)',
            labelShort: 'EUC-JP',
            order: 39
        },
        euckr: {
            labelLong: 'Korean (EUC-KR)',
            labelShort: 'EUC-KR',
            order: 40
        },
        windows874: {
            labelLong: 'Thai (Windows 874)',
            labelShort: 'Windows 874',
            order: 41
        },
        iso885911: {
            labelLong: 'Latin/Thai (ISO 8859-11)',
            labelShort: 'ISO 8859-11',
            order: 42
        },
        koi8ru: {
            labelLong: 'Cyrillic (KOI8-RU)',
            labelShort: 'KOI8-RU',
            order: 43
        },
        koi8t: {
            labelLong: 'Tajik (KOI8-T)',
            labelShort: 'KOI8-T',
            order: 44
        },
        gb2312: {
            labelLong: 'Simplified Chinese (GB 2312)',
            labelShort: 'GB 2312',
            order: 45
        },
        cp865: {
            labelLong: 'Nordic DOS (CP 865)',
            labelShort: 'CP 865',
            order: 46
        },
        cp850: {
            labelLong: 'Western European DOS (CP 850)',
            labelShort: 'CP 850',
            order: 47
        }
    };
    var FileKind;
    (function (FileKind) {
        FileKind[FileKind["FILE"] = 0] = "FILE";
        FileKind[FileKind["FOLDER"] = 1] = "FOLDER";
        FileKind[FileKind["ROOT_FOLDER"] = 2] = "ROOT_FOLDER";
    })(FileKind = exports.FileKind || (exports.FileKind = {}));
    exports.MIN_MAX_MEMORY_SIZE_MB = 2048;
    exports.FALLBACK_MAX_MEMORY_SIZE_MB = 4096;
});
//# sourceMappingURL=files.js.map