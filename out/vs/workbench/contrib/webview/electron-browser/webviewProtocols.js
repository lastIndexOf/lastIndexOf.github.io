define(["require", "exports", "vs/base/common/path", "vs/base/common/mime", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/remote/common/remoteHosts"], function (require, exports, path_1, mime_1, strings_1, uri_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WebviewProtocol;
    (function (WebviewProtocol) {
        WebviewProtocol["CoreResource"] = "vscode-core-resource";
        WebviewProtocol["VsCodeResource"] = "vscode-resource";
    })(WebviewProtocol = exports.WebviewProtocol || (exports.WebviewProtocol = {}));
    function resolveContent(fileService, resource, mime, callback) {
        fileService.resolveContent(resource, { encoding: 'binary' }).then(contents => {
            callback({
                data: Buffer.from(contents.value, contents.encoding),
                mimeType: mime
            });
        }, (err) => {
            console.log(err);
            callback({ error: -2 /* FAILED: https://cs.chromium.org/chromium/src/net/base/net_error_list.h */ });
        });
    }
    function registerFileProtocol(contents, protocol, fileService, extensionLocation, getRoots) {
        contents.session.protocol.registerBufferProtocol(protocol, (request, callback) => {
            if (extensionLocation && extensionLocation.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                const requestUri = uri_1.URI.parse(request.url);
                const redirectedUri = uri_1.URI.from({
                    scheme: remoteHosts_1.REMOTE_HOST_SCHEME,
                    authority: extensionLocation.authority,
                    path: '/vscode-resource',
                    query: JSON.stringify({
                        requestResourcePath: requestUri.path
                    })
                });
                resolveContent(fileService, redirectedUri, getMimeType(requestUri), callback);
                return;
            }
            const requestPath = uri_1.URI.parse(request.url).path;
            const normalizedPath = uri_1.URI.file(requestPath);
            for (const root of getRoots()) {
                if (strings_1.startsWith(normalizedPath.fsPath, root.fsPath + path_1.sep)) {
                    resolveContent(fileService, normalizedPath, getMimeType(normalizedPath), callback);
                    return;
                }
            }
            console.error('Webview: Cannot load resource outside of protocol root');
            callback({ error: -10 /* ACCESS_DENIED: https://cs.chromium.org/chromium/src/net/base/net_error_list.h */ });
        }, (error) => {
            if (error) {
                console.error('Failed to register protocol ' + protocol);
            }
        });
    }
    exports.registerFileProtocol = registerFileProtocol;
    const webviewMimeTypes = {
        '.svg': 'image/svg+xml',
        '.txt': 'text/plain',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.xhtml': 'application/xhtml+xml',
        '.oft': 'font/otf',
        '.xml': 'application/xml',
    };
    function getMimeType(normalizedPath) {
        const ext = path_1.extname(normalizedPath.fsPath).toLowerCase();
        return webviewMimeTypes[ext] || mime_1.getMediaMime(normalizedPath.fsPath) || mime_1.MIME_UNKNOWN;
    }
});
//# sourceMappingURL=webviewProtocols.js.map