/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/platform"], function (require, exports, uri_1, files_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toFileChangesEvent(changes) {
        // map to file changes event that talks about URIs
        return new files_1.FileChangesEvent(changes.map((c) => {
            return {
                type: c.type,
                resource: uri_1.URI.file(c.path)
            };
        }));
    }
    exports.toFileChangesEvent = toFileChangesEvent;
    /**
     * Given events that occurred, applies some rules to normalize the events
     */
    function normalize(changes) {
        // Build deltas
        let normalizer = new EventNormalizer();
        for (const event of changes) {
            normalizer.processEvent(event);
        }
        return normalizer.normalize();
    }
    exports.normalize = normalize;
    class EventNormalizer {
        constructor() {
            this.normalized = [];
            this.mapPathToChange = Object.create(null);
        }
        processEvent(event) {
            // Event path already exists
            let existingEvent = this.mapPathToChange[event.path];
            if (existingEvent) {
                let currentChangeType = existingEvent.type;
                let newChangeType = event.type;
                // ignore CREATE followed by DELETE in one go
                if (currentChangeType === 1 /* ADDED */ && newChangeType === 2 /* DELETED */) {
                    delete this.mapPathToChange[event.path];
                    this.normalized.splice(this.normalized.indexOf(existingEvent), 1);
                }
                // flatten DELETE followed by CREATE into CHANGE
                else if (currentChangeType === 2 /* DELETED */ && newChangeType === 1 /* ADDED */) {
                    existingEvent.type = 0 /* UPDATED */;
                }
                // Do nothing. Keep the created event
                else if (currentChangeType === 1 /* ADDED */ && newChangeType === 0 /* UPDATED */) {
                }
                // Otherwise apply change type
                else {
                    existingEvent.type = newChangeType;
                }
            }
            // Otherwise Store
            else {
                this.normalized.push(event);
                this.mapPathToChange[event.path] = event;
            }
        }
        normalize() {
            let addedChangeEvents = [];
            let deletedPaths = [];
            // This algorithm will remove all DELETE events up to the root folder
            // that got deleted if any. This ensures that we are not producing
            // DELETE events for each file inside a folder that gets deleted.
            //
            // 1.) split ADD/CHANGE and DELETED events
            // 2.) sort short deleted paths to the top
            // 3.) for each DELETE, check if there is a deleted parent and ignore the event in that case
            return this.normalized.filter(e => {
                if (e.type !== 2 /* DELETED */) {
                    addedChangeEvents.push(e);
                    return false; // remove ADD / CHANGE
                }
                return true; // keep DELETE
            }).sort((e1, e2) => {
                return e1.path.length - e2.path.length; // shortest path first
            }).filter(e => {
                if (deletedPaths.some(d => files_1.isParent(e.path, d, !platform_1.isLinux /* ignorecase */))) {
                    return false; // DELETE is ignored if parent is deleted already
                }
                // otherwise mark as deleted
                deletedPaths.push(e.path);
                return true;
            }).concat(addedChangeEvents);
        }
    }
});
//# sourceMappingURL=common.js.map