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
define(["require", "exports", "vs/base/common/types", "url", "fs", "vs/base/common/objects", "zlib", "vs/base/common/errors"], function (require, exports, types_1, url_1, fs_1, objects_1, zlib_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getNodeRequest(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = url_1.parse(options.url);
            const module = endpoint.protocol === 'https:' ? yield new Promise((resolve_1, reject_1) => { require(['https'], resolve_1, reject_1); }) : yield new Promise((resolve_2, reject_2) => { require(['http'], resolve_2, reject_2); });
            return module.request;
        });
    }
    function request(options, token) {
        let req;
        const rawRequestPromise = options.getRawRequest
            ? Promise.resolve(options.getRawRequest(options))
            : Promise.resolve(getNodeRequest(options));
        return rawRequestPromise.then(rawRequest => {
            return new Promise((c, e) => {
                const endpoint = url_1.parse(options.url);
                const opts = {
                    hostname: endpoint.hostname,
                    port: endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80),
                    protocol: endpoint.protocol,
                    path: endpoint.path,
                    method: options.type || 'GET',
                    headers: options.headers,
                    agent: options.agent,
                    rejectUnauthorized: types_1.isBoolean(options.strictSSL) ? options.strictSSL : true
                };
                if (options.user && options.password) {
                    opts.auth = options.user + ':' + options.password;
                }
                req = rawRequest(opts, (res) => {
                    const followRedirects = types_1.isNumber(options.followRedirects) ? options.followRedirects : 3;
                    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && followRedirects > 0 && res.headers['location']) {
                        request(objects_1.assign({}, options, {
                            url: res.headers['location'],
                            followRedirects: followRedirects - 1
                        }), token).then(c, e);
                    }
                    else {
                        let stream = res;
                        if (res.headers['content-encoding'] === 'gzip') {
                            stream = stream.pipe(zlib_1.createGunzip());
                        }
                        c({ res, stream });
                    }
                });
                req.on('error', e);
                if (options.timeout) {
                    req.setTimeout(options.timeout);
                }
                if (options.data) {
                    if (typeof options.data === 'string') {
                        req.write(options.data);
                    }
                    else {
                        options.data.pipe(req);
                        return;
                    }
                }
                req.end();
                token.onCancellationRequested(() => {
                    req.abort();
                    e(errors_1.canceled());
                });
            });
        });
    }
    exports.request = request;
    function isSuccess(context) {
        return (context.res.statusCode && context.res.statusCode >= 200 && context.res.statusCode < 300) || context.res.statusCode === 1223;
    }
    function hasNoContent(context) {
        return context.res.statusCode === 204;
    }
    function download(filePath, context) {
        return new Promise((c, e) => {
            const out = fs_1.createWriteStream(filePath);
            out.once('finish', () => c(undefined));
            context.stream.once('error', e);
            context.stream.pipe(out);
        });
    }
    exports.download = download;
    function asText(context) {
        return new Promise((c, e) => {
            if (!isSuccess(context)) {
                return e('Server returned ' + context.res.statusCode);
            }
            if (hasNoContent(context)) {
                return c(null);
            }
            const buffer = [];
            context.stream.on('data', (d) => buffer.push(d));
            context.stream.on('end', () => c(buffer.join('')));
            context.stream.on('error', e);
        });
    }
    exports.asText = asText;
    function asJson(context) {
        return new Promise((c, e) => {
            if (!isSuccess(context)) {
                return e('Server returned ' + context.res.statusCode);
            }
            if (hasNoContent(context)) {
                return c(null);
            }
            const buffer = [];
            context.stream.on('data', (d) => buffer.push(d));
            context.stream.on('end', () => {
                try {
                    c(JSON.parse(buffer.join('')));
                }
                catch (err) {
                    e(err);
                }
            });
            context.stream.on('error', e);
        });
    }
    exports.asJson = asJson;
});
//# sourceMappingURL=request.js.map