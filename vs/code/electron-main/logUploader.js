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
define(["require", "exports", "os", "child_process", "fs", "vs/base/common/path", "vs/nls", "vs/platform/product/node/product", "vs/base/common/cancellation"], function (require, exports, os, cp, fs, path, nls_1, product_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Endpoint {
        constructor(url) {
            this.url = url;
        }
        static getFromProduct() {
            const logUploaderUrl = product_1.default.logUploaderUrl;
            return logUploaderUrl ? new Endpoint(logUploaderUrl) : undefined;
        }
    }
    function uploadLogs(launchService, requestService, environmentService) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = Endpoint.getFromProduct();
            if (!endpoint) {
                console.error(nls_1.localize('invalidEndpoint', 'Invalid log uploader endpoint'));
                return;
            }
            const logsPath = yield launchService.getLogsPath();
            if (yield promptUserToConfirmLogUpload(logsPath, environmentService)) {
                console.log(nls_1.localize('beginUploading', 'Uploading...'));
                const outZip = yield zipLogs(logsPath);
                const result = yield postLogs(endpoint, outZip, requestService);
                console.log(nls_1.localize('didUploadLogs', 'Upload successful! Log file ID: {0}', result.blob_id));
            }
        });
    }
    exports.uploadLogs = uploadLogs;
    function promptUserToConfirmLogUpload(logsPath, environmentService) {
        const confirmKey = 'iConfirmLogsUpload';
        if ((environmentService.args['upload-logs'] || '').toLowerCase() === confirmKey.toLowerCase()) {
            return true;
        }
        else {
            const message = nls_1.localize('logUploadPromptHeader', 'You are about to upload your session logs to a secure Microsoft endpoint that only Microsoft\'s members of the VS Code team can access.')
                + '\n\n' + nls_1.localize('logUploadPromptBody', 'Session logs may contain personal information such as full paths or file contents. Please review and redact your session log files here: \'{0}\'', logsPath)
                + '\n\n' + nls_1.localize('logUploadPromptBodyDetails', 'By continuing you confirm that you have reviewed and redacted your session log files and that you agree to Microsoft using them to debug VS Code.')
                + '\n\n' + nls_1.localize('logUploadPromptAcceptInstructions', 'Please run code with \'--upload-logs={0}\' to proceed with upload', confirmKey);
            console.log(message);
            return false;
        }
    }
    function postLogs(endpoint, outZip, requestService) {
        return __awaiter(this, void 0, void 0, function* () {
            const dotter = setInterval(() => console.log('.'), 5000);
            let result;
            try {
                result = yield requestService.request({
                    url: endpoint.url,
                    type: 'POST',
                    data: Buffer.from(fs.readFileSync(outZip)).toString('base64'),
                    headers: {
                        'Content-Type': 'application/zip'
                    }
                }, cancellation_1.CancellationToken.None);
            }
            catch (e) {
                clearInterval(dotter);
                console.log(nls_1.localize('postError', 'Error posting logs: {0}', e));
                throw e;
            }
            return new Promise((resolve, reject) => {
                const parts = [];
                result.stream.on('data', data => {
                    parts.push(data);
                });
                result.stream.on('end', () => {
                    clearInterval(dotter);
                    try {
                        const response = Buffer.concat(parts).toString('utf-8');
                        if (result.res.statusCode === 200) {
                            resolve(JSON.parse(response));
                        }
                        else {
                            const errorMessage = nls_1.localize('responseError', 'Error posting logs. Got {0} — {1}', result.res.statusCode, response);
                            console.log(errorMessage);
                            reject(new Error(errorMessage));
                        }
                    }
                    catch (e) {
                        console.log(nls_1.localize('parseError', 'Error parsing response'));
                        reject(e);
                    }
                });
            });
        });
    }
    function zipLogs(logsPath) {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-log-upload'));
        const outZip = path.join(tempDir, 'logs.zip');
        return new Promise((resolve, reject) => {
            doZip(logsPath, outZip, tempDir, (err, stdout, stderr) => {
                if (err) {
                    console.error(nls_1.localize('zipError', 'Error zipping logs: {0}', err.message));
                    reject(err);
                }
                else {
                    resolve(outZip);
                }
            });
        });
    }
    function doZip(logsPath, outZip, tempDir, callback) {
        switch (os.platform()) {
            case 'win32':
                // Copy directory first to avoid file locking issues
                const sub = path.join(tempDir, 'sub');
                return cp.execFile('powershell', ['-Command',
                    `[System.IO.Directory]::CreateDirectory("${sub}"); Copy-Item -recurse "${logsPath}" "${sub}"; Compress-Archive -Path "${sub}" -DestinationPath "${outZip}"`], { cwd: logsPath }, callback);
            default:
                return cp.execFile('zip', ['-r', outZip, '.'], { cwd: logsPath }, callback);
        }
    }
});
//# sourceMappingURL=logUploader.js.map