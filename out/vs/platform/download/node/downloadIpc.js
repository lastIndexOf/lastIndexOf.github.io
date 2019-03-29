/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/path", "fs", "vs/base/common/event", "vs/base/node/pfs", "os", "vs/base/common/uuid"], function (require, exports, uri_1, path, fs, event_1, pfs_1, os_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function upload(uri) {
        const stream = new event_1.Emitter();
        const readstream = fs.createReadStream(uri.fsPath);
        readstream.on('data', data => stream.fire(data));
        readstream.on('error', error => stream.fire(error.toString()));
        readstream.on('close', () => stream.fire(undefined));
        return stream.event;
    }
    class DownloadServiceChannel {
        constructor() { }
        listen(_, event, arg) {
            switch (event) {
                case 'upload': return event_1.Event.buffer(upload(uri_1.URI.revive(arg)));
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command) {
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.DownloadServiceChannel = DownloadServiceChannel;
    class DownloadServiceChannelClient {
        constructor(channel, getUriTransformer) {
            this.channel = channel;
            this.getUriTransformer = getUriTransformer;
        }
        download(from, to = path.join(os_1.tmpdir(), uuid_1.generateUuid())) {
            from = this.getUriTransformer().transformOutgoingURI(from);
            const dirName = path.dirname(to);
            let out;
            return new Promise((c, e) => {
                return pfs_1.mkdirp(dirName)
                    .then(() => {
                    out = fs.createWriteStream(to);
                    out.once('close', () => c(to));
                    out.once('error', e);
                    const uploadStream = this.channel.listen('upload', from);
                    const disposable = uploadStream(result => {
                        if (result === undefined) {
                            disposable.dispose();
                            out.end(() => c(to));
                        }
                        else if (Buffer.isBuffer(result)) {
                            out.write(result);
                        }
                        else if (typeof result === 'string') {
                            disposable.dispose();
                            out.end(() => e(result));
                        }
                    });
                });
            });
        }
    }
    exports.DownloadServiceChannelClient = DownloadServiceChannelClient;
});
//# sourceMappingURL=downloadIpc.js.map