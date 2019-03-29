/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/extfs", "vs/base/common/path", "vs/base/common/async", "fs", "os", "vs/base/common/platform", "vs/base/common/event"], function (require, exports, extfs, path_1, async_1, fs, os, platform, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function readdir(path) {
        return async_1.nfcall(extfs.readdir, path);
    }
    exports.readdir = readdir;
    function exists(path) {
        return new Promise(c => fs.exists(path, c));
    }
    exports.exists = exists;
    function chmod(path, mode) {
        return async_1.nfcall(fs.chmod, path, mode);
    }
    exports.chmod = chmod;
    exports.mkdirp = extfs.mkdirp;
    function rimraf(path) {
        return lstat(path).then(stat => {
            if (stat.isDirectory() && !stat.isSymbolicLink()) {
                return readdir(path)
                    .then(children => Promise.all(children.map(child => rimraf(path_1.join(path, child)))))
                    .then(() => rmdir(path));
            }
            else {
                return unlink(path);
            }
        }, (err) => {
            if (err.code === 'ENOENT') {
                return undefined;
            }
            return Promise.reject(err);
        });
    }
    exports.rimraf = rimraf;
    function realpath(path) {
        return async_1.nfcall(extfs.realpath, path);
    }
    exports.realpath = realpath;
    function stat(path) {
        return async_1.nfcall(fs.stat, path);
    }
    exports.stat = stat;
    function statLink(path) {
        return async_1.nfcall(extfs.statLink, path);
    }
    exports.statLink = statLink;
    function lstat(path) {
        return async_1.nfcall(fs.lstat, path);
    }
    exports.lstat = lstat;
    function rename(oldPath, newPath) {
        return async_1.nfcall(fs.rename, oldPath, newPath);
    }
    exports.rename = rename;
    function renameIgnoreError(oldPath, newPath) {
        return new Promise(resolve => {
            fs.rename(oldPath, newPath, () => resolve());
        });
    }
    exports.renameIgnoreError = renameIgnoreError;
    function rmdir(path) {
        return async_1.nfcall(fs.rmdir, path);
    }
    exports.rmdir = rmdir;
    function unlink(path) {
        return async_1.nfcall(fs.unlink, path);
    }
    exports.unlink = unlink;
    function symlink(target, path, type) {
        return async_1.nfcall(fs.symlink, target, path, type);
    }
    exports.symlink = symlink;
    function readlink(path) {
        return async_1.nfcall(fs.readlink, path);
    }
    exports.readlink = readlink;
    function truncate(path, len) {
        return async_1.nfcall(fs.truncate, path, len);
    }
    exports.truncate = truncate;
    function readFile(path, encoding) {
        return async_1.nfcall(fs.readFile, path, encoding);
    }
    exports.readFile = readFile;
    // According to node.js docs (https://nodejs.org/docs/v6.5.0/api/fs.html#fs_fs_writefile_file_data_options_callback)
    // it is not safe to call writeFile() on the same path multiple times without waiting for the callback to return.
    // Therefor we use a Queue on the path that is given to us to sequentialize calls to the same path properly.
    const writeFilePathQueue = Object.create(null);
    function writeFile(path, data, options) {
        const queueKey = toQueueKey(path);
        return ensureWriteFileQueue(queueKey).queue(() => async_1.nfcall(extfs.writeFileAndFlush, path, data, options));
    }
    exports.writeFile = writeFile;
    function toQueueKey(path) {
        let queueKey = path;
        if (platform.isWindows || platform.isMacintosh) {
            queueKey = queueKey.toLowerCase(); // accomodate for case insensitive file systems
        }
        return queueKey;
    }
    function ensureWriteFileQueue(queueKey) {
        let writeFileQueue = writeFilePathQueue[queueKey];
        if (!writeFileQueue) {
            writeFileQueue = new async_1.Queue();
            writeFilePathQueue[queueKey] = writeFileQueue;
            const onFinish = event_1.Event.once(writeFileQueue.onFinished);
            onFinish(() => {
                delete writeFilePathQueue[queueKey];
                writeFileQueue.dispose();
            });
        }
        return writeFileQueue;
    }
    /**
    * Read a dir and return only subfolders
    */
    function readDirsInDir(dirPath) {
        return readdir(dirPath).then(children => {
            return Promise.all(children.map(c => dirExists(path_1.join(dirPath, c)))).then(exists => {
                return children.filter((_, i) => exists[i]);
            });
        });
    }
    exports.readDirsInDir = readDirsInDir;
    /**
    * `path` exists and is a directory
    */
    function dirExists(path) {
        return stat(path).then(stat => stat.isDirectory(), () => false);
    }
    exports.dirExists = dirExists;
    /**
    * `path` exists and is a file.
    */
    function fileExists(path) {
        return stat(path).then(stat => stat.isFile(), () => false);
    }
    exports.fileExists = fileExists;
    /**
     * Deletes a path from disk.
     */
    let _tmpDir = null;
    function getTmpDir() {
        if (!_tmpDir) {
            _tmpDir = os.tmpdir();
        }
        return _tmpDir;
    }
    function del(path, tmp = getTmpDir()) {
        return async_1.nfcall(extfs.del, path, tmp);
    }
    exports.del = del;
    function whenDeleted(path) {
        // Complete when wait marker file is deleted
        return new Promise(resolve => {
            let running = false;
            const interval = setInterval(() => {
                if (!running) {
                    running = true;
                    fs.exists(path, exists => {
                        running = false;
                        if (!exists) {
                            clearInterval(interval);
                            resolve(undefined);
                        }
                    });
                }
            }, 1000);
        });
    }
    exports.whenDeleted = whenDeleted;
    function copy(source, target) {
        return async_1.nfcall(extfs.copy, source, target);
    }
    exports.copy = copy;
});
//# sourceMappingURL=pfs.js.map