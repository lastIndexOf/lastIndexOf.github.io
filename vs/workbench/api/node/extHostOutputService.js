/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/services/output/node/outputAppender", "vs/base/common/date", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, extHost_protocol_1, uri_1, path_1, outputAppender_1, date_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AbstractExtHostOutputChannel extends lifecycle_1.Disposable {
        constructor(name, log, file, proxy) {
            super();
            this._onDidAppend = this._register(new event_1.Emitter());
            this.onDidAppend = this._onDidAppend.event;
            this._name = name;
            this._proxy = proxy;
            this._id = proxy.$register(this.name, log, file);
            this._offset = 0;
        }
        get name() {
            return this._name;
        }
        append(value) {
            this.validate();
            this._offset += value ? Buffer.from(value).byteLength : 0;
        }
        update() {
            this._id.then(id => this._proxy.$update(id));
        }
        appendLine(value) {
            this.validate();
            this.append(value + '\n');
        }
        clear() {
            this.validate();
            const till = this._offset;
            this._id.then(id => this._proxy.$clear(id, till));
        }
        show(columnOrPreserveFocus, preserveFocus) {
            this.validate();
            this._id.then(id => this._proxy.$reveal(id, !!(typeof columnOrPreserveFocus === 'boolean' ? columnOrPreserveFocus : preserveFocus)));
        }
        hide() {
            this.validate();
            this._id.then(id => this._proxy.$close(id));
        }
        validate() {
            if (this._disposed) {
                throw new Error('Channel has been closed');
            }
        }
        dispose() {
            super.dispose();
            if (!this._disposed) {
                this._id
                    .then(id => this._proxy.$dispose(id))
                    .then(() => this._disposed = true);
            }
        }
    }
    exports.AbstractExtHostOutputChannel = AbstractExtHostOutputChannel;
    class ExtHostPushOutputChannel extends AbstractExtHostOutputChannel {
        constructor(name, proxy) {
            super(name, false, undefined, proxy);
        }
        append(value) {
            super.append(value);
            this._id.then(id => this._proxy.$append(id, value));
            this._onDidAppend.fire();
        }
    }
    exports.ExtHostPushOutputChannel = ExtHostPushOutputChannel;
    class ExtHostOutputChannelBackedByFile extends AbstractExtHostOutputChannel {
        constructor(name, outputDir, proxy) {
            const fileName = `${ExtHostOutputChannelBackedByFile._namePool++}-${name}`;
            const file = uri_1.URI.file(path_1.join(outputDir, `${fileName}.log`));
            super(name, false, file, proxy);
            this._appender = new outputAppender_1.OutputAppender(fileName, file.fsPath);
        }
        append(value) {
            super.append(value);
            this._appender.append(value);
            this._onDidAppend.fire();
        }
        update() {
            this._appender.flush();
            super.update();
        }
        show(columnOrPreserveFocus, preserveFocus) {
            this._appender.flush();
            super.show(columnOrPreserveFocus, preserveFocus);
        }
        clear() {
            this._appender.flush();
            super.clear();
        }
    }
    ExtHostOutputChannelBackedByFile._namePool = 1;
    exports.ExtHostOutputChannelBackedByFile = ExtHostOutputChannelBackedByFile;
    class ExtHostLogFileOutputChannel extends AbstractExtHostOutputChannel {
        constructor(name, file, proxy) {
            super(name, true, file, proxy);
        }
        append(value) {
            throw new Error('Not supported');
        }
    }
    exports.ExtHostLogFileOutputChannel = ExtHostLogFileOutputChannel;
    class ExtHostOutputService {
        constructor(logsLocation, mainContext) {
            this._channels = new Map();
            this._outputDir = path_1.join(logsLocation.fsPath, `output_logging_${date_1.toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '')}`);
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadOutputService);
        }
        $setVisibleChannel(channelId) {
            if (this._visibleChannelDisposable) {
                this._visibleChannelDisposable = lifecycle_1.dispose(this._visibleChannelDisposable);
            }
            if (channelId) {
                const channel = this._channels.get(channelId);
                if (channel) {
                    this._visibleChannelDisposable = channel.onDidAppend(() => channel.update());
                }
            }
        }
        createOutputChannel(name) {
            const channel = this._createOutputChannel(name);
            channel._id.then(id => this._channels.set(id, channel));
            return channel;
        }
        _createOutputChannel(name) {
            name = name.trim();
            if (!name) {
                throw new Error('illegal argument `name`. must not be falsy');
            }
            else {
                // Do not crash if logger cannot be created
                try {
                    return new ExtHostOutputChannelBackedByFile(name, this._outputDir, this._proxy);
                }
                catch (error) {
                    console.log(error);
                    return new ExtHostPushOutputChannel(name, this._proxy);
                }
            }
        }
        createOutputChannelFromLogFile(name, file) {
            name = name.trim();
            if (!name) {
                throw new Error('illegal argument `name`. must not be falsy');
            }
            if (!file) {
                throw new Error('illegal argument `file`. must not be falsy');
            }
            return new ExtHostLogFileOutputChannel(name, file, this._proxy);
        }
    }
    exports.ExtHostOutputService = ExtHostOutputService;
});
//# sourceMappingURL=extHostOutputService.js.map