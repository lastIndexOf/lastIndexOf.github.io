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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/mime", "vs/base/browser/dom", "vs/base/common/map", "vs/base/common/network", "vs/base/common/numbers", "vs/workbench/common/theme", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/base/common/actions", "vs/workbench/services/editor/common/editorService", "vs/base/common/decorators", "vs/base/common/platform", "vs/css!./media/resourceviewer"], function (require, exports, nls, mimes, DOM, map_1, network_1, numbers_1, theme_1, contextView_1, lifecycle_1, themeService_1, actions_1, editorService_1, decorators_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BinarySize {
        static formatSize(size) {
            if (size < BinarySize.KB) {
                return nls.localize('sizeB', "{0}B", size);
            }
            if (size < BinarySize.MB) {
                return nls.localize('sizeKB', "{0}KB", (size / BinarySize.KB).toFixed(2));
            }
            if (size < BinarySize.GB) {
                return nls.localize('sizeMB', "{0}MB", (size / BinarySize.MB).toFixed(2));
            }
            if (size < BinarySize.TB) {
                return nls.localize('sizeGB', "{0}GB", (size / BinarySize.GB).toFixed(2));
            }
            return nls.localize('sizeTB', "{0}TB", (size / BinarySize.TB).toFixed(2));
        }
    }
    BinarySize.KB = 1024;
    BinarySize.MB = BinarySize.KB * BinarySize.KB;
    BinarySize.GB = BinarySize.MB * BinarySize.KB;
    BinarySize.TB = BinarySize.GB * BinarySize.KB;
    /**
     * Helper to actually render the given resource into the provided container. Will adjust scrollbar (if provided) automatically based on loading
     * progress of the binary resource.
     */
    class ResourceViewer {
        static show(descriptor, fileService, container, scrollbar, openInternalClb, openExternalClb, metadataClb) {
            // Ensure CSS class
            container.className = 'monaco-resource-viewer';
            // Images
            if (ResourceViewer.isImageResource(descriptor)) {
                return ImageView.create(container, descriptor, fileService, scrollbar, openExternalClb, metadataClb);
            }
            // Large Files
            if (descriptor.size > ResourceViewer.MAX_OPEN_INTERNAL_SIZE) {
                return FileTooLargeFileView.create(container, descriptor, scrollbar, metadataClb);
            }
            // Seemingly Binary Files
            else {
                return FileSeemsBinaryFileView.create(container, descriptor, scrollbar, openInternalClb, metadataClb);
            }
        }
        static isImageResource(descriptor) {
            const mime = getMime(descriptor);
            // Chrome does not support tiffs
            return mime.indexOf('image/') >= 0 && mime !== 'image/tiff';
        }
    }
    ResourceViewer.MAX_OPEN_INTERNAL_SIZE = BinarySize.MB * 200; // max size until we offer an action to open internally
    exports.ResourceViewer = ResourceViewer;
    class ImageView {
        static create(container, descriptor, fileService, scrollbar, openExternalClb, metadataClb) {
            if (ImageView.shouldShowImageInline(descriptor)) {
                return InlineImageView.create(container, descriptor, fileService, scrollbar, metadataClb);
            }
            return LargeImageView.create(container, descriptor, openExternalClb, metadataClb);
        }
        static shouldShowImageInline(descriptor) {
            let skipInlineImage;
            // Data URI
            if (descriptor.resource.scheme === network_1.Schemas.data) {
                const base64MarkerIndex = descriptor.resource.path.indexOf(ImageView.BASE64_MARKER);
                const hasData = base64MarkerIndex >= 0 && descriptor.resource.path.substring(base64MarkerIndex + ImageView.BASE64_MARKER.length).length > 0;
                skipInlineImage = !hasData || descriptor.size > ImageView.MAX_IMAGE_SIZE || descriptor.resource.path.length > ImageView.MAX_IMAGE_SIZE;
            }
            // File URI
            else {
                skipInlineImage = typeof descriptor.size !== 'number' || descriptor.size > ImageView.MAX_IMAGE_SIZE;
            }
            return !skipInlineImage;
        }
    }
    ImageView.MAX_IMAGE_SIZE = BinarySize.MB; // showing images inline is memory intense, so we have a limit
    ImageView.BASE64_MARKER = 'base64,';
    class LargeImageView {
        static create(container, descriptor, openExternalClb, metadataClb) {
            const size = BinarySize.formatSize(descriptor.size);
            metadataClb(size);
            DOM.clearNode(container);
            const disposables = [];
            const label = document.createElement('p');
            label.textContent = nls.localize('largeImageError', "The image is not displayed in the editor because it is too large ({0}).", size);
            container.appendChild(label);
            if (descriptor.resource.scheme !== network_1.Schemas.data) {
                const link = DOM.append(label, DOM.$('a.embedded-link'));
                link.setAttribute('role', 'button');
                link.textContent = nls.localize('resourceOpenExternalButton', "Open image using external program?");
                disposables.push(DOM.addDisposableListener(link, DOM.EventType.CLICK, () => openExternalClb(descriptor.resource)));
            }
            return lifecycle_1.combinedDisposable(disposables);
        }
    }
    class FileTooLargeFileView {
        static create(container, descriptor, scrollbar, metadataClb) {
            const size = BinarySize.formatSize(descriptor.size);
            metadataClb(size);
            DOM.clearNode(container);
            const label = document.createElement('span');
            label.textContent = nls.localize('nativeFileTooLargeError', "The file is not displayed in the editor because it is too large ({0}).", size);
            container.appendChild(label);
            scrollbar.scanDomNode();
            return lifecycle_1.Disposable.None;
        }
    }
    class FileSeemsBinaryFileView {
        static create(container, descriptor, scrollbar, openInternalClb, metadataClb) {
            metadataClb(typeof descriptor.size === 'number' ? BinarySize.formatSize(descriptor.size) : '');
            DOM.clearNode(container);
            const disposables = [];
            const label = document.createElement('p');
            label.textContent = nls.localize('nativeBinaryError', "The file is not displayed in the editor because it is either binary or uses an unsupported text encoding.");
            container.appendChild(label);
            if (descriptor.resource.scheme !== network_1.Schemas.data) {
                const link = DOM.append(label, DOM.$('a.embedded-link'));
                link.setAttribute('role', 'button');
                link.textContent = nls.localize('openAsText', "Do you want to open it anyway?");
                disposables.push(DOM.addDisposableListener(link, DOM.EventType.CLICK, () => openInternalClb(descriptor.resource)));
            }
            scrollbar.scanDomNode();
            return lifecycle_1.combinedDisposable(disposables);
        }
    }
    let ZoomStatusbarItem = class ZoomStatusbarItem extends theme_1.Themable {
        constructor(contextMenuService, editorService, themeService) {
            super(themeService);
            this.contextMenuService = contextMenuService;
            ZoomStatusbarItem.instance = this;
            this._register(editorService.onDidActiveEditorChange(() => this.onActiveEditorChanged()));
        }
        onActiveEditorChanged() {
            this.hide();
            this.onSelectScale = undefined;
        }
        show(scale, onSelectScale) {
            clearTimeout(this.showTimeout);
            this.showTimeout = setTimeout(() => {
                this.onSelectScale = onSelectScale;
                this.statusBarItem.style.display = 'block';
                this.updateLabel(scale);
            }, 0);
        }
        hide() {
            this.statusBarItem.style.display = 'none';
        }
        render(container) {
            if (!this.statusBarItem && container) {
                this.statusBarItem = DOM.append(container, DOM.$('a.zoom-statusbar-item'));
                this.statusBarItem.setAttribute('role', 'button');
                this.statusBarItem.style.display = 'none';
                DOM.addDisposableListener(this.statusBarItem, DOM.EventType.CLICK, () => {
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => container,
                        getActions: () => this.zoomActions
                    });
                });
            }
            return this;
        }
        updateLabel(scale) {
            this.statusBarItem.textContent = ZoomStatusbarItem.zoomLabel(scale);
        }
        get zoomActions() {
            const scales = [10, 5, 2, 1, 0.5, 0.2, 'fit'];
            return scales.map(scale => new actions_1.Action(`zoom.${scale}`, ZoomStatusbarItem.zoomLabel(scale), undefined, undefined, () => {
                if (this.onSelectScale) {
                    this.onSelectScale(scale);
                }
                return Promise.resolve(undefined);
            }));
        }
        static zoomLabel(scale) {
            return scale === 'fit'
                ? nls.localize('zoom.action.fit.label', 'Whole Image')
                : `${Math.round(scale * 100)}%`;
        }
    };
    __decorate([
        decorators_1.memoize
    ], ZoomStatusbarItem.prototype, "zoomActions", null);
    ZoomStatusbarItem = __decorate([
        __param(0, contextView_1.IContextMenuService),
        __param(1, editorService_1.IEditorService),
        __param(2, themeService_1.IThemeService)
    ], ZoomStatusbarItem);
    exports.ZoomStatusbarItem = ZoomStatusbarItem;
    class InlineImageView {
        static create(container, descriptor, fileService, scrollbar, metadataClb) {
            const disposables = [];
            const context = {
                layout(dimension) { },
                dispose: () => lifecycle_1.combinedDisposable(disposables).dispose()
            };
            const cacheKey = descriptor.resource.toString();
            let ctrlPressed = false;
            let altPressed = false;
            const initialState = InlineImageView.imageStateCache.get(cacheKey) || { scale: 'fit', offsetX: 0, offsetY: 0 };
            let scale = initialState.scale;
            let image = null;
            function updateScale(newScale) {
                if (!image || !image.parentElement) {
                    return;
                }
                if (newScale === 'fit') {
                    scale = 'fit';
                    DOM.addClass(image, 'scale-to-fit');
                    DOM.removeClass(image, 'pixelated');
                    image.style.minWidth = 'auto';
                    image.style.width = 'auto';
                    InlineImageView.imageStateCache.delete(cacheKey);
                }
                else {
                    const oldWidth = image.width;
                    const oldHeight = image.height;
                    scale = numbers_1.clamp(newScale, InlineImageView.MIN_SCALE, InlineImageView.MAX_SCALE);
                    if (scale >= InlineImageView.PIXELATION_THRESHOLD) {
                        DOM.addClass(image, 'pixelated');
                    }
                    else {
                        DOM.removeClass(image, 'pixelated');
                    }
                    const { scrollTop, scrollLeft } = image.parentElement;
                    const dx = (scrollLeft + image.parentElement.clientWidth / 2) / image.parentElement.scrollWidth;
                    const dy = (scrollTop + image.parentElement.clientHeight / 2) / image.parentElement.scrollHeight;
                    DOM.removeClass(image, 'scale-to-fit');
                    image.style.minWidth = `${(image.naturalWidth * scale)}px`;
                    image.style.width = `${(image.naturalWidth * scale)}px`;
                    const newWidth = image.width;
                    const scaleFactor = (newWidth - oldWidth) / oldWidth;
                    const newScrollLeft = ((oldWidth * scaleFactor * dx) + scrollLeft);
                    const newScrollTop = ((oldHeight * scaleFactor * dy) + scrollTop);
                    scrollbar.setScrollPosition({
                        scrollLeft: newScrollLeft,
                        scrollTop: newScrollTop,
                    });
                    InlineImageView.imageStateCache.set(cacheKey, { scale: scale, offsetX: newScrollLeft, offsetY: newScrollTop });
                }
                ZoomStatusbarItem.instance.show(scale, updateScale);
                scrollbar.scanDomNode();
            }
            function firstZoom() {
                if (!image) {
                    return;
                }
                scale = image.clientWidth / image.naturalWidth;
                updateScale(scale);
            }
            disposables.push(DOM.addDisposableListener(window, DOM.EventType.KEY_DOWN, (e) => {
                if (!image) {
                    return;
                }
                ctrlPressed = e.ctrlKey;
                altPressed = e.altKey;
                if (platform.isMacintosh ? altPressed : ctrlPressed) {
                    DOM.removeClass(container, 'zoom-in');
                    DOM.addClass(container, 'zoom-out');
                }
            }));
            disposables.push(DOM.addDisposableListener(window, DOM.EventType.KEY_UP, (e) => {
                if (!image) {
                    return;
                }
                ctrlPressed = e.ctrlKey;
                altPressed = e.altKey;
                if (!(platform.isMacintosh ? altPressed : ctrlPressed)) {
                    DOM.removeClass(container, 'zoom-out');
                    DOM.addClass(container, 'zoom-in');
                }
            }));
            disposables.push(DOM.addDisposableListener(container, DOM.EventType.CLICK, (e) => {
                if (!image) {
                    return;
                }
                if (e.button !== 0) {
                    return;
                }
                // left click
                if (scale === 'fit') {
                    firstZoom();
                }
                if (!(platform.isMacintosh ? altPressed : ctrlPressed)) { // zoom in
                    let i = 0;
                    for (; i < InlineImageView.zoomLevels.length; ++i) {
                        if (InlineImageView.zoomLevels[i] > scale) {
                            break;
                        }
                    }
                    updateScale(InlineImageView.zoomLevels[i] || InlineImageView.MAX_SCALE);
                }
                else {
                    let i = InlineImageView.zoomLevels.length - 1;
                    for (; i >= 0; --i) {
                        if (InlineImageView.zoomLevels[i] < scale) {
                            break;
                        }
                    }
                    updateScale(InlineImageView.zoomLevels[i] || InlineImageView.MIN_SCALE);
                }
            }));
            disposables.push(DOM.addDisposableListener(container, DOM.EventType.WHEEL, (e) => {
                if (!image) {
                    return;
                }
                const isScrollWhellKeyPressed = platform.isMacintosh ? altPressed : ctrlPressed;
                if (!isScrollWhellKeyPressed && !e.ctrlKey) { // pinching is reported as scroll wheel + ctrl
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                if (scale === 'fit') {
                    firstZoom();
                }
                let delta = e.deltaY < 0 ? 1 : -1;
                // Pinching should increase the scale
                if (e.ctrlKey && !isScrollWhellKeyPressed) {
                    delta *= -1;
                }
                updateScale(scale * (1 - delta * InlineImageView.SCALE_PINCH_FACTOR));
            }));
            disposables.push(DOM.addDisposableListener(container, DOM.EventType.SCROLL, () => {
                if (!image || !image.parentElement || scale === 'fit') {
                    return;
                }
                const entry = InlineImageView.imageStateCache.get(cacheKey);
                if (entry) {
                    const { scrollTop, scrollLeft } = image.parentElement;
                    InlineImageView.imageStateCache.set(cacheKey, { scale: entry.scale, offsetX: scrollLeft, offsetY: scrollTop });
                }
            }));
            DOM.clearNode(container);
            DOM.addClasses(container, 'image', 'zoom-in');
            image = DOM.append(container, DOM.$('img.scale-to-fit'));
            image.style.visibility = 'hidden';
            disposables.push(DOM.addDisposableListener(image, DOM.EventType.LOAD, e => {
                if (!image) {
                    return;
                }
                if (typeof descriptor.size === 'number') {
                    metadataClb(nls.localize('imgMeta', '{0}x{1} {2}', image.naturalWidth, image.naturalHeight, BinarySize.formatSize(descriptor.size)));
                }
                else {
                    metadataClb(nls.localize('imgMetaNoSize', '{0}x{1}', image.naturalWidth, image.naturalHeight));
                }
                scrollbar.scanDomNode();
                image.style.visibility = 'visible';
                updateScale(scale);
                if (initialState.scale !== 'fit') {
                    scrollbar.setScrollPosition({
                        scrollLeft: initialState.offsetX,
                        scrollTop: initialState.offsetY,
                    });
                }
            }));
            InlineImageView.imageSrc(descriptor, fileService).then(dataUri => {
                const imgs = container.getElementsByTagName('img');
                if (imgs.length) {
                    imgs[0].src = dataUri;
                }
            });
            return context;
        }
        static imageSrc(descriptor, fileService) {
            if (descriptor.resource.scheme === network_1.Schemas.data) {
                return Promise.resolve(descriptor.resource.toString(true /* skip encoding */));
            }
            return fileService.resolveContent(descriptor.resource, { encoding: 'base64' }).then(data => {
                const mime = getMime(descriptor);
                return `data:${mime};base64,${data.value}`;
            });
        }
    }
    InlineImageView.SCALE_PINCH_FACTOR = 0.075;
    InlineImageView.MAX_SCALE = 20;
    InlineImageView.MIN_SCALE = 0.1;
    InlineImageView.zoomLevels = [
        0.1,
        0.2,
        0.3,
        0.4,
        0.5,
        0.6,
        0.7,
        0.8,
        0.9,
        1,
        1.5,
        2,
        3,
        5,
        7,
        10,
        15,
        20
    ];
    /**
     * Enable image-rendering: pixelated for images scaled by more than this.
     */
    InlineImageView.PIXELATION_THRESHOLD = 3;
    /**
     * Store the scale and position of an image so it can be restored when changing editor tabs
     */
    InlineImageView.imageStateCache = new map_1.LRUCache(100);
    function getMime(descriptor) {
        let mime = descriptor.mime;
        if (!mime && descriptor.resource.scheme !== network_1.Schemas.data) {
            mime = mimes.getMediaMime(descriptor.resource.path);
        }
        return mime || mimes.MIME_BINARY;
    }
});
//# sourceMappingURL=resourceViewer.js.map