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
define(["require", "exports", "vs/base/common/amd", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/parts/ipc/node/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/editor/common/services/modelService", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/services/search/common/search", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/searchHelpers", "vs/workbench/services/untitled/common/untitledEditorService", "./searchIpc", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions"], function (require, exports, amd_1, arrays, errors_1, lifecycle_1, map_1, network_1, stopwatch_1, uri_1, pfs, ipc_1, ipc_cp_1, modelService_1, environment_1, instantiation_1, log_1, search_1, telemetry_1, editorService_1, extensions_1, searchHelpers_1, untitledEditorService_1, searchIpc_1, configuration_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SearchService = class SearchService extends lifecycle_1.Disposable {
        constructor(instantiationService, modelService, untitledEditorService, editorService, environmentService, telemetryService, logService, extensionService) {
            super();
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.untitledEditorService = untitledEditorService;
            this.editorService = editorService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.extensionService = extensionService;
            this.fileSearchProviders = new Map();
            this.textSearchProviders = new Map();
            this.diskSearch = this.instantiationService.createInstance(DiskSearch, !environmentService.isBuilt || environmentService.verbose, environmentService.debugSearch);
        }
        registerSearchResultProvider(scheme, type, provider) {
            let list;
            if (type === 0 /* file */) {
                list = this.fileSearchProviders;
            }
            else if (type === 1 /* text */) {
                list = this.textSearchProviders;
            }
            else {
                throw new Error('Unknown SearchProviderType');
            }
            list.set(scheme, provider);
            return lifecycle_1.toDisposable(() => {
                list.delete(scheme);
            });
        }
        textSearch(query, token, onProgress) {
            // Get local results from dirty/untitled
            const localResults = this.getLocalResults(query);
            if (onProgress) {
                arrays.coalesce(localResults.values()).forEach(onProgress);
            }
            const onProviderProgress = progress => {
                if (progress.resource) {
                    // Match
                    if (!localResults.has(progress.resource) && onProgress) { // don't override local results
                        onProgress(progress);
                    }
                }
                else if (onProgress) {
                    // Progress
                    onProgress(progress);
                }
                if (progress.message) {
                    this.logService.debug('SearchService#search', progress.message);
                }
            };
            return this.doSearch(query, token, onProviderProgress);
        }
        fileSearch(query, token) {
            return this.doSearch(query, token);
        }
        doSearch(query, token, onProgress) {
            this.logService.trace('SearchService#search', JSON.stringify(query));
            const schemesInQuery = this.getSchemesInQuery(query);
            const providerActivations = [Promise.resolve(null)];
            schemesInQuery.forEach(scheme => providerActivations.push(this.extensionService.activateByEvent(`onSearch:${scheme}`)));
            providerActivations.push(this.extensionService.activateByEvent('onSearch:file'));
            const providerPromise = Promise.all(providerActivations)
                .then(() => this.extensionService.whenInstalledExtensionsRegistered())
                .then(() => {
                // Cancel faster if search was canceled while waiting for extensions
                if (token && token.isCancellationRequested) {
                    return Promise.reject(errors_1.canceled());
                }
                const progressCallback = (item) => {
                    if (token && token.isCancellationRequested) {
                        return;
                    }
                    if (onProgress) {
                        onProgress(item);
                    }
                };
                return this.searchWithProviders(query, progressCallback, token);
            })
                .then(completes => {
                completes = arrays.coalesce(completes);
                if (!completes.length) {
                    return {
                        limitHit: false,
                        results: []
                    };
                }
                return {
                    limitHit: completes[0] && completes[0].limitHit,
                    stats: completes[0].stats,
                    results: arrays.flatten(completes.map(c => c.results))
                };
            });
            return new Promise((resolve, reject) => {
                if (token) {
                    token.onCancellationRequested(() => {
                        reject(errors_1.canceled());
                    });
                }
                providerPromise.then(resolve, reject);
            });
        }
        getSchemesInQuery(query) {
            const schemes = new Set();
            if (query.folderQueries) {
                query.folderQueries.forEach(fq => schemes.add(fq.folder.scheme));
            }
            if (query.extraFileResources) {
                query.extraFileResources.forEach(extraFile => schemes.add(extraFile.scheme));
            }
            return schemes;
        }
        searchWithProviders(query, onProviderProgress, token) {
            const e2eSW = stopwatch_1.StopWatch.create(false);
            const diskSearchQueries = [];
            const searchPs = [];
            const fqs = this.groupFolderQueriesByScheme(query);
            map_1.keys(fqs).forEach(scheme => {
                const schemeFQs = fqs.get(scheme);
                const provider = query.type === 1 /* File */ ?
                    this.fileSearchProviders.get(scheme) :
                    this.textSearchProviders.get(scheme);
                if (!provider && scheme === 'file') {
                    diskSearchQueries.push(...schemeFQs);
                }
                else if (!provider) {
                    console.warn('No search provider registered for scheme: ' + scheme);
                }
                else {
                    const oneSchemeQuery = Object.assign({}, query, {
                        folderQueries: schemeFQs
                    });
                    searchPs.push(query.type === 1 /* File */ ?
                        provider.fileSearch(oneSchemeQuery, token) :
                        provider.textSearch(oneSchemeQuery, onProviderProgress, token));
                }
            });
            const diskSearchExtraFileResources = query.extraFileResources && query.extraFileResources.filter(res => res.scheme === network_1.Schemas.file);
            if (diskSearchQueries.length || diskSearchExtraFileResources) {
                const diskSearchQuery = Object.assign({}, query, {
                    folderQueries: diskSearchQueries
                }, { extraFileResources: diskSearchExtraFileResources });
                searchPs.push(diskSearchQuery.type === 1 /* File */ ?
                    this.diskSearch.fileSearch(diskSearchQuery, token) :
                    this.diskSearch.textSearch(diskSearchQuery, onProviderProgress, token));
            }
            return Promise.all(searchPs).then(completes => {
                const endToEndTime = e2eSW.elapsed();
                this.logService.trace(`SearchService#search: ${endToEndTime}ms`);
                completes.forEach(complete => {
                    this.sendTelemetry(query, endToEndTime, complete);
                });
                return completes;
            }, err => {
                const endToEndTime = e2eSW.elapsed();
                this.logService.trace(`SearchService#search: ${endToEndTime}ms`);
                const searchError = search_1.deserializeSearchError(err.message);
                this.sendTelemetry(query, endToEndTime, null, searchError);
                throw searchError;
            });
        }
        groupFolderQueriesByScheme(query) {
            const queries = new Map();
            query.folderQueries.forEach(fq => {
                const schemeFQs = queries.get(fq.folder.scheme) || [];
                schemeFQs.push(fq);
                queries.set(fq.folder.scheme, schemeFQs);
            });
            return queries;
        }
        sendTelemetry(query, endToEndTime, complete, err) {
            const fileSchemeOnly = query.folderQueries.every(fq => fq.folder.scheme === 'file');
            const otherSchemeOnly = query.folderQueries.every(fq => fq.folder.scheme !== 'file');
            const scheme = fileSchemeOnly ? 'file' :
                otherSchemeOnly ? 'other' :
                    'mixed';
            if (query.type === 1 /* File */ && complete && complete.stats) {
                const fileSearchStats = complete.stats;
                if (fileSearchStats.fromCache) {
                    const cacheStats = fileSearchStats.detailStats;
                    /* __GDPR__
                        "cachedSearchComplete" : {
                            "reason" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth"  },
                            "resultCount" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true  },
                            "workspaceFolderCount" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true  },
                            "type" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                            "endToEndTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "sortingTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "cacheWasResolved" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                            "cacheLookupTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "cacheFilterTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "cacheEntryCount" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "scheme" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                        }
                     */
                    this.telemetryService.publicLog('cachedSearchComplete', {
                        reason: query._reason,
                        resultCount: fileSearchStats.resultCount,
                        workspaceFolderCount: query.folderQueries.length,
                        type: fileSearchStats.type,
                        endToEndTime: endToEndTime,
                        sortingTime: fileSearchStats.sortingTime,
                        cacheWasResolved: cacheStats.cacheWasResolved,
                        cacheLookupTime: cacheStats.cacheLookupTime,
                        cacheFilterTime: cacheStats.cacheFilterTime,
                        cacheEntryCount: cacheStats.cacheEntryCount,
                        scheme
                    });
                }
                else {
                    const searchEngineStats = fileSearchStats.detailStats;
                    /* __GDPR__
                        "searchComplete" : {
                            "reason" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                            "resultCount" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "workspaceFolderCount" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "type" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                            "endToEndTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "sortingTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "fileWalkTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "directoriesWalked" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "filesWalked" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "cmdTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "cmdResultCount" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                            "scheme" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                        }
                     */
                    this.telemetryService.publicLog('searchComplete', {
                        reason: query._reason,
                        resultCount: fileSearchStats.resultCount,
                        workspaceFolderCount: query.folderQueries.length,
                        type: fileSearchStats.type,
                        endToEndTime: endToEndTime,
                        sortingTime: fileSearchStats.sortingTime,
                        fileWalkTime: searchEngineStats.fileWalkTime,
                        directoriesWalked: searchEngineStats.directoriesWalked,
                        filesWalked: searchEngineStats.filesWalked,
                        cmdTime: searchEngineStats.cmdTime,
                        cmdResultCount: searchEngineStats.cmdResultCount,
                        scheme
                    });
                }
            }
            else if (query.type === 2 /* Text */) {
                let errorType;
                if (err) {
                    errorType = err.code === search_1.SearchErrorCode.regexParseError ? 'regex' :
                        err.code === search_1.SearchErrorCode.unknownEncoding ? 'encoding' :
                            err.code === search_1.SearchErrorCode.globParseError ? 'glob' :
                                err.code === search_1.SearchErrorCode.invalidLiteral ? 'literal' :
                                    err.code === search_1.SearchErrorCode.other ? 'other' :
                                        'unknown';
                }
                /* __GDPR__
                    "textSearchComplete" : {
                        "reason" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                        "workspaceFolderCount" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                        "endToEndTime" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                        "scheme" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                        "error" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                        "useRipgrep" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                        "usePCRE2" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                    }
                 */
                this.telemetryService.publicLog('textSearchComplete', {
                    reason: query._reason,
                    workspaceFolderCount: query.folderQueries.length,
                    endToEndTime: endToEndTime,
                    scheme,
                    error: errorType,
                    usePCRE2: !!query.usePCRE2
                });
            }
        }
        getLocalResults(query) {
            const localResults = new map_1.ResourceMap();
            if (query.type === 2 /* Text */) {
                const models = this.modelService.getModels();
                models.forEach((model) => {
                    const resource = model.uri;
                    if (!resource) {
                        return;
                    }
                    if (!this.editorService.isOpen({ resource })) {
                        return;
                    }
                    // Support untitled files
                    if (resource.scheme === network_1.Schemas.untitled) {
                        if (!this.untitledEditorService.exists(resource)) {
                            return;
                        }
                    }
                    // Don't support other resource schemes than files for now
                    // todo@remote
                    // why is that? we should search for resources from other
                    // schemes
                    else if (resource.scheme !== network_1.Schemas.file) {
                        return;
                    }
                    if (!this.matches(resource, query)) {
                        return; // respect user filters
                    }
                    // Use editor API to find matches
                    const matches = model.findMatches(query.contentPattern.pattern, false, query.contentPattern.isRegExp, query.contentPattern.isCaseSensitive, query.contentPattern.isWordMatch ? query.contentPattern.wordSeparators : null, false, query.maxResults);
                    if (matches.length) {
                        const fileMatch = new search_1.FileMatch(resource);
                        localResults.set(resource, fileMatch);
                        const textSearchResults = searchHelpers_1.editorMatchesToTextSearchResults(matches, model, query.previewOptions);
                        fileMatch.results = searchHelpers_1.addContextToEditorMatches(textSearchResults, model, query);
                    }
                    else {
                        localResults.set(resource, null);
                    }
                });
            }
            return localResults;
        }
        matches(resource, query) {
            // includes
            if (query.includePattern) {
                if (resource.scheme !== network_1.Schemas.file) {
                    return false; // if we match on file patterns, we have to ignore non file resources
                }
            }
            return search_1.pathIncludedInQuery(query, resource.fsPath);
        }
        clearCache(cacheKey) {
            const clearPs = [
                this.diskSearch,
                ...map_1.values(this.fileSearchProviders)
            ].map(provider => provider && provider.clearCache(cacheKey));
            return Promise.all(clearPs)
                .then(() => { });
        }
    };
    SearchService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, modelService_1.IModelService),
        __param(2, untitledEditorService_1.IUntitledEditorService),
        __param(3, editorService_1.IEditorService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, log_1.ILogService),
        __param(7, extensions_1.IExtensionService)
    ], SearchService);
    exports.SearchService = SearchService;
    let DiskSearch = class DiskSearch {
        constructor(verboseLogging, searchDebug, logService, configService) {
            this.logService = logService;
            this.configService = configService;
            const timeout = this.configService.getValue().search.maintainFileSearchCache ?
                Number.MAX_VALUE :
                60 * 60 * 1000;
            const opts = {
                serverName: 'Search',
                timeout,
                args: ['--type=searchService'],
                // See https://github.com/Microsoft/vscode/issues/27665
                // Pass in fresh execArgv to the forked process such that it doesn't inherit them from `process.execArgv`.
                // e.g. Launching the extension host process with `--inspect-brk=xxx` and then forking a process from the extension host
                // results in the forked process inheriting `--inspect-brk=xxx`.
                freshExecArgv: true,
                env: {
                    AMD_ENTRYPOINT: 'vs/workbench/services/search/node/searchApp',
                    PIPE_LOGGING: 'true',
                    VERBOSE_LOGGING: verboseLogging
                },
                useQueue: true
            };
            if (searchDebug) {
                if (searchDebug.break && searchDebug.port) {
                    opts.debugBrk = searchDebug.port;
                }
                else if (!searchDebug.break && searchDebug.port) {
                    opts.debug = searchDebug.port;
                }
            }
            const client = new ipc_cp_1.Client(amd_1.getPathFromAmdModule(require, 'bootstrap-fork'), opts);
            const channel = ipc_1.getNextTickChannel(client.getChannel('search'));
            this.raw = new searchIpc_1.SearchChannelClient(channel);
        }
        textSearch(query, onProgress, token) {
            const folderQueries = query.folderQueries || [];
            return Promise.all(folderQueries.map(q => q.folder.scheme === network_1.Schemas.file && pfs.exists(q.folder.fsPath)))
                .then(exists => {
                if (token && token.isCancellationRequested) {
                    throw errors_1.canceled();
                }
                query.folderQueries = folderQueries.filter((q, index) => exists[index]);
                const event = this.raw.textSearch(query);
                return DiskSearch.collectResultsFromEvent(event, onProgress, token);
            });
        }
        fileSearch(query, token) {
            const folderQueries = query.folderQueries || [];
            return Promise.all(folderQueries.map(q => q.folder.scheme === network_1.Schemas.file && pfs.exists(q.folder.fsPath)))
                .then(exists => {
                if (token && token.isCancellationRequested) {
                    throw errors_1.canceled();
                }
                query.folderQueries = folderQueries.filter((q, index) => exists[index]);
                let event;
                event = this.raw.fileSearch(query);
                const onProgress = (p) => {
                    if (p.message) {
                        // Should only be for logs
                        this.logService.debug('SearchService#search', p.message);
                    }
                };
                return DiskSearch.collectResultsFromEvent(event, onProgress, token);
            });
        }
        /**
         * Public for test
         */
        static collectResultsFromEvent(event, onProgress, token) {
            let result = [];
            let listener;
            return new Promise((c, e) => {
                if (token) {
                    token.onCancellationRequested(() => {
                        if (listener) {
                            listener.dispose();
                        }
                        e(errors_1.canceled());
                    });
                }
                listener = event(ev => {
                    if (search_1.isSerializedSearchComplete(ev)) {
                        if (search_1.isSerializedSearchSuccess(ev)) {
                            c({
                                limitHit: ev.limitHit,
                                results: result,
                                stats: ev.stats
                            });
                        }
                        else {
                            e(ev.error);
                        }
                        listener.dispose();
                    }
                    else {
                        // Matches
                        if (Array.isArray(ev)) {
                            const fileMatches = ev.map(d => this.createFileMatch(d));
                            result = result.concat(fileMatches);
                            if (onProgress) {
                                fileMatches.forEach(onProgress);
                            }
                        }
                        // Match
                        else if (ev.path) {
                            const fileMatch = this.createFileMatch(ev);
                            result.push(fileMatch);
                            if (onProgress) {
                                onProgress(fileMatch);
                            }
                        }
                        // Progress
                        else if (onProgress) {
                            onProgress(ev);
                        }
                    }
                });
            });
        }
        static createFileMatch(data) {
            const fileMatch = new search_1.FileMatch(uri_1.URI.file(data.path));
            if (data.results) {
                // const matches = data.results.filter(resultIsMatch);
                fileMatch.results.push(...data.results);
            }
            return fileMatch;
        }
        clearCache(cacheKey) {
            return this.raw.clearCache(cacheKey);
        }
    };
    DiskSearch = __decorate([
        __param(2, log_1.ILogService),
        __param(3, configuration_1.IConfigurationService)
    ], DiskSearch);
    exports.DiskSearch = DiskSearch;
    extensions_2.registerSingleton(search_1.ISearchService, SearchService, true);
});
//# sourceMappingURL=searchService.js.map