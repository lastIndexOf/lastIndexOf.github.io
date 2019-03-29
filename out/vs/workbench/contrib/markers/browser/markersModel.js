/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vs/base/common/resources", "vs/editor/common/core/range", "vs/platform/markers/common/markers", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/hash"], function (require, exports, resources_1, range_1, markers_1, arrays_1, map_1, decorators_1, event_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function compareUris(a, b) {
        const astr = a.toString();
        const bstr = b.toString();
        return astr === bstr ? 0 : (astr < bstr ? -1 : 1);
    }
    function compareMarkersByUri(a, b) {
        return compareUris(a.resource, b.resource);
    }
    exports.compareMarkersByUri = compareMarkersByUri;
    function compareResourceMarkers(a, b) {
        let [firstMarkerOfA] = a.markers;
        let [firstMarkerOfB] = b.markers;
        let res = 0;
        if (firstMarkerOfA && firstMarkerOfB) {
            res = markers_1.MarkerSeverity.compare(firstMarkerOfA.marker.severity, firstMarkerOfB.marker.severity);
        }
        if (res === 0) {
            res = a.path.localeCompare(b.path) || a.name.localeCompare(b.name);
        }
        return res;
    }
    function compareMarkers(a, b) {
        return markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity)
            || range_1.Range.compareRangesUsingStarts(a.marker, b.marker);
    }
    class ResourceMarkers {
        constructor(resource, markers) {
            this.resource = resource;
            this.markers = markers;
        }
        get path() { return this.resource.fsPath; }
        get name() { return resources_1.basename(this.resource); }
        get hash() {
            const hasher = new hash_1.Hasher();
            hasher.hash(this.resource.toString());
            return `${hasher.value}`;
        }
    }
    __decorate([
        decorators_1.memoize
    ], ResourceMarkers.prototype, "path", null);
    __decorate([
        decorators_1.memoize
    ], ResourceMarkers.prototype, "name", null);
    __decorate([
        decorators_1.memoize
    ], ResourceMarkers.prototype, "hash", null);
    exports.ResourceMarkers = ResourceMarkers;
    class Marker {
        constructor(marker, relatedInformation = []) {
            this.marker = marker;
            this.relatedInformation = relatedInformation;
        }
        get resource() { return this.marker.resource; }
        get range() { return this.marker; }
        get lines() {
            if (!this._lines) {
                this._lines = this.marker.message.split(/\r\n|\r|\n/g);
            }
            return this._lines;
        }
        get hash() {
            return markers_1.IMarkerData.makeKey(this.marker);
        }
        toString() {
            return JSON.stringify(Object.assign({}, this.marker, { resource: this.marker.resource.path, relatedInformation: this.relatedInformation.length ? this.relatedInformation.map(r => (Object.assign({}, r.raw, { resource: r.raw.resource.path }))) : undefined }), null, '\t');
        }
    }
    __decorate([
        decorators_1.memoize
    ], Marker.prototype, "hash", null);
    exports.Marker = Marker;
    class RelatedInformation {
        constructor(resource, marker, raw) {
            this.resource = resource;
            this.marker = marker;
            this.raw = raw;
        }
        get hash() {
            const hasher = new hash_1.Hasher();
            hasher.hash(this.resource.toString());
            hasher.hash(this.marker.startLineNumber);
            hasher.hash(this.marker.startColumn);
            hasher.hash(this.marker.endLineNumber);
            hasher.hash(this.marker.endColumn);
            hasher.hash(this.raw.resource.toString());
            hasher.hash(this.raw.startLineNumber);
            hasher.hash(this.raw.startColumn);
            hasher.hash(this.raw.endLineNumber);
            hasher.hash(this.raw.endColumn);
            return `${hasher.value}`;
        }
    }
    __decorate([
        decorators_1.memoize
    ], RelatedInformation.prototype, "hash", null);
    exports.RelatedInformation = RelatedInformation;
    class MarkersModel {
        constructor() {
            this.cachedSortedResources = undefined;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.resourcesByUri = new Map();
        }
        get resourceMarkers() {
            if (!this.cachedSortedResources) {
                this.cachedSortedResources = map_1.values(this.resourcesByUri).sort(compareResourceMarkers);
            }
            return this.cachedSortedResources;
        }
        getResourceMarkers(resource) {
            return this.resourcesByUri.get(resource.toString()) || null;
        }
        setResourceMarkers(resource, rawMarkers) {
            if (arrays_1.isFalsyOrEmpty(rawMarkers)) {
                this.resourcesByUri.delete(resource.toString());
            }
            else {
                const markers = rawMarkers.map(rawMarker => {
                    let relatedInformation = undefined;
                    if (rawMarker.relatedInformation) {
                        relatedInformation = rawMarker.relatedInformation.map(r => new RelatedInformation(resource, rawMarker, r));
                    }
                    return new Marker(rawMarker, relatedInformation);
                });
                markers.sort(compareMarkers);
                this.resourcesByUri.set(resource.toString(), new ResourceMarkers(resource, markers));
            }
            this.cachedSortedResources = undefined;
            this._onDidChange.fire(resource);
        }
        dispose() {
            this._onDidChange.dispose();
            this.resourcesByUri.clear();
        }
    }
    exports.MarkersModel = MarkersModel;
});
//# sourceMappingURL=markersModel.js.map