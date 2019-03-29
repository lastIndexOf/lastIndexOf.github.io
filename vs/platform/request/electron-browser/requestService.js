/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "stream", "vs/platform/request/node/requestService", "vs/base/common/errors"], function (require, exports, stream_1, requestService_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This service exposes the `request` API, while using the global
     * or configured proxy settings.
     */
    class RequestService extends requestService_1.RequestService {
        request(options, token) {
            return super.request(options, token, exports.xhrRequest);
        }
    }
    exports.RequestService = RequestService;
    exports.xhrRequest = (options, token) => {
        const xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.open(options.type || 'GET', options.url || '', true, options.user, options.password);
            setRequestHeaders(xhr, options);
            xhr.responseType = 'arraybuffer';
            xhr.onerror = e => reject(new Error(xhr.statusText && ('XHR failed: ' + xhr.statusText)));
            xhr.onload = (e) => {
                resolve({
                    res: {
                        statusCode: xhr.status,
                        headers: getResponseHeaders(xhr)
                    },
                    stream: new class ArrayBufferStream extends stream_1.Readable {
                        constructor(arraybuffer) {
                            super();
                            this._buffer = Buffer.from(new Uint8Array(arraybuffer));
                            this._offset = 0;
                            this._length = this._buffer.length;
                        }
                        _read(size) {
                            if (this._offset < this._length) {
                                this.push(this._buffer.slice(this._offset, (this._offset + size)));
                                this._offset += size;
                            }
                            else {
                                this.push(null);
                            }
                        }
                    }(xhr.response)
                });
            };
            xhr.ontimeout = e => reject(new Error(`XHR timeout: ${options.timeout}ms`));
            if (options.timeout) {
                xhr.timeout = options.timeout;
            }
            // TODO: remove any
            xhr.send(options.data);
            // cancel
            token.onCancellationRequested(() => {
                xhr.abort();
                reject(errors_1.canceled());
            });
        });
    };
    function setRequestHeaders(xhr, options) {
        if (options.headers) {
            outer: for (let k in options.headers) {
                switch (k) {
                    case 'User-Agent':
                    case 'Accept-Encoding':
                    case 'Content-Length':
                        // unsafe headers
                        continue outer;
                }
                xhr.setRequestHeader(k, options.headers[k]);
            }
        }
    }
    function getResponseHeaders(xhr) {
        const headers = Object.create(null);
        for (const line of xhr.getAllResponseHeaders().split(/\r\n|\n|\r/g)) {
            if (line) {
                const idx = line.indexOf(':');
                headers[line.substr(0, idx).trim().toLowerCase()] = line.substr(idx + 1).trim();
            }
        }
        return headers;
    }
});
//# sourceMappingURL=requestService.js.map