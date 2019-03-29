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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/nls", "crypto", "vs/base/common/errors", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/environment/common/environment", "vs/platform/windows/common/windows", "vs/base/common/strings", "vs/base/common/network", "vs/platform/notification/common/notification", "vs/platform/workspaces/common/workspaces", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/base/common/resources", "vs/base/node/stats"], function (require, exports, nls_1, crypto, errors_1, uri_1, files_1, telemetry_1, workspace_1, environment_1, windows_1, strings_1, network_1, notification_1, workspaces_1, quickInput_1, storage_1, resources_1, stats_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SshProtocolMatcher = /^([^@:]+@)?([^:]+):/;
    const SshUrlMatcher = /^([^@:]+@)?([^:]+):(.+)$/;
    const AuthorityMatcher = /^([^@]+@)?([^:]+)(:\d+)?$/;
    const SecondLevelDomainMatcher = /([^@:.]+\.[^@:.]+)(:\d+)?$/;
    const RemoteMatcher = /^\s*url\s*=\s*(.+\S)\s*$/mg;
    const AnyButDot = /[^.]/g;
    const SecondLevelDomainWhitelist = [
        'github.com',
        'bitbucket.org',
        'visualstudio.com',
        'gitlab.com',
        'heroku.com',
        'azurewebsites.net',
        'ibm.com',
        'amazon.com',
        'amazonaws.com',
        'cloudapp.net',
        'rhcloud.com',
        'google.com'
    ];
    const ModulesToLookFor = [
        // Packages that suggest a node server
        'express',
        'sails',
        'koa',
        'hapi',
        'socket.io',
        'restify',
        // JS frameworks
        'react',
        'react-native',
        '@angular/core',
        '@ionic',
        'vue',
        'tns-core-modules',
        // Other interesting packages
        'aws-sdk',
        'aws-amplify',
        'azure',
        'azure-storage',
        'firebase',
        '@google-cloud/common',
        'heroku-cli'
    ];
    const PyModulesToLookFor = [
        'azure',
        'azure-storage-common',
        'azure-storage-blob',
        'azure-storage-file',
        'azure-storage-queue',
        'azure-shell',
        'azure-cosmos',
        'azure-devtools',
        'azure-elasticluster',
        'azure-eventgrid',
        'azure-functions',
        'azure-graphrbac',
        'azure-keyvault',
        'azure-loganalytics',
        'azure-monitor',
        'azure-servicebus',
        'azure-servicefabric',
        'azure-storage',
        'azure-translator',
        'azure-iothub-device-client',
        'adal',
        'pydocumentdb',
        'botbuilder-core',
        'botbuilder-schema',
        'botframework-connector'
    ];
    function stripLowLevelDomains(domain) {
        const match = domain.match(SecondLevelDomainMatcher);
        return match ? match[1] : null;
    }
    function extractDomain(url) {
        if (url.indexOf('://') === -1) {
            const match = url.match(SshProtocolMatcher);
            if (match) {
                return stripLowLevelDomains(match[2]);
            }
            else {
                return null;
            }
        }
        try {
            const uri = uri_1.URI.parse(url);
            if (uri.authority) {
                return stripLowLevelDomains(uri.authority);
            }
        }
        catch (e) {
            // ignore invalid URIs
        }
        return null;
    }
    function getDomainsOfRemotes(text, whitelist) {
        const domains = new Set();
        let match;
        while (match = RemoteMatcher.exec(text)) {
            const domain = extractDomain(match[1]);
            if (domain) {
                domains.add(domain);
            }
        }
        const whitemap = whitelist.reduce((map, key) => {
            map[key] = true;
            return map;
        }, Object.create(null));
        const elements = [];
        domains.forEach(e => elements.push(e));
        return elements
            .map(key => whitemap[key] ? key : key.replace(AnyButDot, 'a'));
    }
    exports.getDomainsOfRemotes = getDomainsOfRemotes;
    function stripPort(authority) {
        const match = authority.match(AuthorityMatcher);
        return match ? match[2] : null;
    }
    function normalizeRemote(host, path, stripEndingDotGit) {
        if (host && path) {
            if (stripEndingDotGit && strings_1.endsWith(path, '.git')) {
                path = path.substr(0, path.length - 4);
            }
            return (path.indexOf('/') === 0) ? `${host}${path}` : `${host}/${path}`;
        }
        return null;
    }
    function extractRemote(url, stripEndingDotGit) {
        if (url.indexOf('://') === -1) {
            const match = url.match(SshUrlMatcher);
            if (match) {
                return normalizeRemote(match[2], match[3], stripEndingDotGit);
            }
        }
        try {
            const uri = uri_1.URI.parse(url);
            if (uri.authority) {
                return normalizeRemote(stripPort(uri.authority), uri.path, stripEndingDotGit);
            }
        }
        catch (e) {
            // ignore invalid URIs
        }
        return null;
    }
    function getRemotes(text, stripEndingDotGit = false) {
        const remotes = [];
        let match;
        while (match = RemoteMatcher.exec(text)) {
            const remote = extractRemote(match[1], stripEndingDotGit);
            if (remote) {
                remotes.push(remote);
            }
        }
        return remotes;
    }
    exports.getRemotes = getRemotes;
    function getHashedRemotesFromConfig(text, stripEndingDotGit = false) {
        return getRemotes(text, stripEndingDotGit).map(r => {
            return crypto.createHash('sha1').update(r).digest('hex');
        });
    }
    exports.getHashedRemotesFromConfig = getHashedRemotesFromConfig;
    function getHashedRemotesFromUri(workspaceUri, fileService, stripEndingDotGit = false) {
        const path = workspaceUri.path;
        const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/.git/config` });
        return fileService.resolveFile(uri).then(() => {
            return fileService.resolveContent(uri, { acceptTextOnly: true }).then(content => getHashedRemotesFromConfig(content.value, stripEndingDotGit), err => [] // ignore missing or binary file
            );
        }, err => []);
    }
    exports.getHashedRemotesFromUri = getHashedRemotesFromUri;
    let WorkspaceStats = class WorkspaceStats {
        constructor(fileService, contextService, telemetryService, environmentService, windowService, notificationService, quickInputService, storageService) {
            this.fileService = fileService;
            this.contextService = contextService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.windowService = windowService;
            this.notificationService = notificationService;
            this.quickInputService = quickInputService;
            this.storageService = storageService;
            this.report();
        }
        report() {
            // Workspace Tags
            this.resolveWorkspaceTags(this.windowService.getConfiguration(), rootFiles => this.handleWorkspaceFiles(rootFiles))
                .then(tags => this.reportWorkspaceTags(tags), error => errors_1.onUnexpectedError(error));
            // Workspace file types, config files, and launch configs
            this.getWorkspaceMetadata().then(stats => {
                this.reportWorkspaceMetadata(stats);
            });
            // Cloud Stats
            this.reportCloudStats();
            this.reportProxyStats();
        }
        static searchArray(arr, regEx) {
            return arr.some(v => v.search(regEx) > -1) || undefined;
        }
        /* __GDPR__FRAGMENT__
            "WorkspaceTags" : {
                "workbench.filesToOpen" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workbench.filesToCreate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workbench.filesToDiff" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "workspace.roots" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.empty" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.grunt" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gulp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.jake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.tsconfig" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.jsconfig" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.config.xml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.vsc.extension" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.asp<NUMBER>" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.sln" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.unity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.express" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.sails" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.koa" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.hapi" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.socket.io" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.restify" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.react" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@angular/core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.vue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.aws-sdk" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.aws-amplify-sdk" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@google-cloud/common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.firebase" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.heroku-cli" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.bower" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.yeoman.code.ext" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.cordova.high" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.cordova.low" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.xamarin.android" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.xamarin.ios" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.android.cpp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.reactNative" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.ionic" : { "classification" : "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": "true" },
                "workspace.nativeScript" : { "classification" : "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": "true" },
                "workspace.py.requirements" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.requirements.star" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.Pipfile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.conda" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.any-azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-blob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-file" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-queue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-shell" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.pulumi-azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-devtools" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-elasticluster" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-functions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-graphrbac" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-loganalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-monitor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-servicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-servicefabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-translator" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-iothub-device-client" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.adal" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.pydocumentdb" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botbuilder-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botbuilder-schema" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botframework-connector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
    
            }
        */
        resolveWorkspaceTags(configuration, participant) {
            const tags = Object.create(null);
            const state = this.contextService.getWorkbenchState();
            const workspace = this.contextService.getWorkspace();
            function createHash(uri) {
                return crypto.createHash('sha1').update(uri.scheme === network_1.Schemas.file ? uri.fsPath : uri.toString()).digest('hex');
            }
            let workspaceId;
            switch (state) {
                case 1 /* EMPTY */:
                    workspaceId = undefined;
                    break;
                case 2 /* FOLDER */:
                    workspaceId = createHash(workspace.folders[0].uri);
                    break;
                case 3 /* WORKSPACE */:
                    if (workspace.configuration) {
                        workspaceId = createHash(workspace.configuration);
                    }
            }
            tags['workspace.id'] = workspaceId;
            const { filesToOpen, filesToCreate, filesToDiff } = configuration;
            tags['workbench.filesToOpen'] = filesToOpen && filesToOpen.length || 0;
            tags['workbench.filesToCreate'] = filesToCreate && filesToCreate.length || 0;
            tags['workbench.filesToDiff'] = filesToDiff && filesToDiff.length || 0;
            const isEmpty = state === 1 /* EMPTY */;
            tags['workspace.roots'] = isEmpty ? 0 : workspace.folders.length;
            tags['workspace.empty'] = isEmpty;
            const folders = !isEmpty ? workspace.folders.map(folder => folder.uri) : this.environmentService.appQuality !== 'stable' && this.findFolders(configuration);
            if (!folders || !folders.length || !this.fileService) {
                return Promise.resolve(tags);
            }
            return this.fileService.resolveFiles(folders.map(resource => ({ resource }))).then((files) => {
                const names = [].concat(...files.map(result => result.success ? (result.stat.children || []) : [])).map(c => c.name);
                const nameSet = names.reduce((s, n) => s.add(n.toLowerCase()), new Set());
                if (participant) {
                    participant(names);
                }
                tags['workspace.grunt'] = nameSet.has('gruntfile.js');
                tags['workspace.gulp'] = nameSet.has('gulpfile.js');
                tags['workspace.jake'] = nameSet.has('jakefile.js');
                tags['workspace.tsconfig'] = nameSet.has('tsconfig.json');
                tags['workspace.jsconfig'] = nameSet.has('jsconfig.json');
                tags['workspace.config.xml'] = nameSet.has('config.xml');
                tags['workspace.vsc.extension'] = nameSet.has('vsc-extension-quickstart.md');
                tags['workspace.ASP5'] = nameSet.has('project.json') && WorkspaceStats.searchArray(names, /^.+\.cs$/i);
                tags['workspace.sln'] = WorkspaceStats.searchArray(names, /^.+\.sln$|^.+\.csproj$/i);
                tags['workspace.unity'] = nameSet.has('assets') && nameSet.has('library') && nameSet.has('projectsettings');
                tags['workspace.npm'] = nameSet.has('package.json') || nameSet.has('node_modules');
                tags['workspace.bower'] = nameSet.has('bower.json') || nameSet.has('bower_components');
                tags['workspace.yeoman.code.ext'] = nameSet.has('vsc-extension-quickstart.md');
                tags['workspace.py.requirements'] = nameSet.has('requirements.txt');
                tags['workspace.py.requirements.star'] = WorkspaceStats.searchArray(names, /^(.*)requirements(.*)\.txt$/i);
                tags['workspace.py.Pipfile'] = nameSet.has('pipfile');
                tags['workspace.py.conda'] = WorkspaceStats.searchArray(names, /^environment(\.yml$|\.yaml$)/i);
                const mainActivity = nameSet.has('mainactivity.cs') || nameSet.has('mainactivity.fs');
                const appDelegate = nameSet.has('appdelegate.cs') || nameSet.has('appdelegate.fs');
                const androidManifest = nameSet.has('androidmanifest.xml');
                const platforms = nameSet.has('platforms');
                const plugins = nameSet.has('plugins');
                const www = nameSet.has('www');
                const properties = nameSet.has('properties');
                const resources = nameSet.has('resources');
                const jni = nameSet.has('jni');
                if (tags['workspace.config.xml'] &&
                    !tags['workspace.language.cs'] && !tags['workspace.language.vb'] && !tags['workspace.language.aspx']) {
                    if (platforms && plugins && www) {
                        tags['workspace.cordova.high'] = true;
                    }
                    else {
                        tags['workspace.cordova.low'] = true;
                    }
                }
                if (tags['workspace.config.xml'] &&
                    !tags['workspace.language.cs'] && !tags['workspace.language.vb'] && !tags['workspace.language.aspx']) {
                    if (nameSet.has('ionic.config.json')) {
                        tags['workspace.ionic'] = true;
                    }
                }
                if (mainActivity && properties && resources) {
                    tags['workspace.xamarin.android'] = true;
                }
                if (appDelegate && resources) {
                    tags['workspace.xamarin.ios'] = true;
                }
                if (androidManifest && jni) {
                    tags['workspace.android.cpp'] = true;
                }
                function getFilePromises(filename, fileService, contentHandler) {
                    return !nameSet.has(filename) ? [] : folders.map(workspaceUri => {
                        const uri = workspaceUri.with({ path: `${workspaceUri.path !== '/' ? workspaceUri.path : ''}/${filename}` });
                        return fileService.resolveFile(uri).then(() => {
                            return fileService.resolveContent(uri, { acceptTextOnly: true }).then(contentHandler);
                        }, err => {
                            // Ignore missing file
                        });
                    });
                }
                function addPythonTags(packageName) {
                    if (PyModulesToLookFor.indexOf(packageName) > -1) {
                        tags['workspace.py.' + packageName] = true;
                    }
                    // cognitive services has a lot of tiny packages. eg. 'azure-cognitiveservices-search-autosuggest'
                    if (packageName.indexOf('azure-cognitiveservices') > -1) {
                        tags['workspace.py.azure-cognitiveservices'] = true;
                    }
                    if (packageName.indexOf('azure-mgmt') > -1) {
                        tags['workspace.py.azure-mgmt'] = true;
                    }
                    if (packageName.indexOf('azure-ml') > -1) {
                        tags['workspace.py.azure-ml'] = true;
                    }
                    if (!tags['workspace.py.any-azure']) {
                        tags['workspace.py.any-azure'] = /azure/i.test(packageName);
                    }
                }
                const requirementsTxtPromises = getFilePromises('requirements.txt', this.fileService, content => {
                    const dependencies = content.value.split(/\r\n|\r|\n/);
                    for (let dependency of dependencies) {
                        // Dependencies in requirements.txt can have 3 formats: `foo==3.1, foo>=3.1, foo`
                        const format1 = dependency.split('==');
                        const format2 = dependency.split('>=');
                        const packageName = (format1.length === 2 ? format1[0] : format2[0]).trim();
                        addPythonTags(packageName);
                    }
                });
                const pipfilePromises = getFilePromises('pipfile', this.fileService, content => {
                    let dependencies = content.value.split(/\r\n|\r|\n/);
                    // We're only interested in the '[packages]' section of the Pipfile
                    dependencies = dependencies.slice(dependencies.indexOf('[packages]') + 1);
                    for (let dependency of dependencies) {
                        if (dependency.trim().indexOf('[') > -1) {
                            break;
                        }
                        // All dependencies in Pipfiles follow the format: `<package> = <version, or git repo, or something else>`
                        if (dependency.indexOf('=') === -1) {
                            continue;
                        }
                        const packageName = dependency.split('=')[0].trim();
                        addPythonTags(packageName);
                    }
                });
                const packageJsonPromises = getFilePromises('package.json', this.fileService, content => {
                    try {
                        const packageJsonContents = JSON.parse(content.value);
                        if (packageJsonContents['dependencies']) {
                            for (let module of ModulesToLookFor) {
                                if ('react-native' === module) {
                                    if (packageJsonContents['dependencies'][module]) {
                                        tags['workspace.reactNative'] = true;
                                    }
                                }
                                else if ('tns-core-modules' === module) {
                                    if (packageJsonContents['dependencies'][module]) {
                                        tags['workspace.nativescript'] = true;
                                    }
                                }
                                else {
                                    if (packageJsonContents['dependencies'][module]) {
                                        tags['workspace.npm.' + module] = true;
                                    }
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving file or parsing file contents
                    }
                });
                return Promise.all([...packageJsonPromises, ...requirementsTxtPromises, ...pipfilePromises]).then(() => tags);
            });
        }
        handleWorkspaceFiles(rootFiles) {
            const state = this.contextService.getWorkbenchState();
            const workspace = this.contextService.getWorkspace();
            // Handle top-level workspace files for local single folder workspace
            if (state === 2 /* FOLDER */ && workspace.folders[0].uri.scheme === network_1.Schemas.file) {
                const workspaceFiles = rootFiles.filter(workspaces_1.hasWorkspaceFileExtension);
                if (workspaceFiles.length > 0) {
                    this.doHandleWorkspaceFiles(workspace.folders[0].uri, workspaceFiles);
                }
            }
        }
        doHandleWorkspaceFiles(folder, workspaces) {
            if (this.storageService.getBoolean(WorkspaceStats.DISABLE_WORKSPACE_PROMPT_KEY, 1 /* WORKSPACE */)) {
                return; // prompt disabled by user
            }
            const doNotShowAgain = {
                label: nls_1.localize('never again', "Don't Show Again"),
                isSecondary: true,
                run: () => this.storageService.store(WorkspaceStats.DISABLE_WORKSPACE_PROMPT_KEY, true, 1 /* WORKSPACE */)
            };
            // Prompt to open one workspace
            if (workspaces.length === 1) {
                const workspaceFile = workspaces[0];
                this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('workspaceFound', "This folder contains a workspace file '{0}'. Do you want to open it? [Learn more]({1}) about workspace files.", workspaceFile, 'https://go.microsoft.com/fwlink/?linkid=2025315'), [{
                        label: nls_1.localize('openWorkspace', "Open Workspace"),
                        run: () => this.windowService.openWindow([{ uri: resources_1.joinPath(folder, workspaceFile), typeHint: 'file' }])
                    }, doNotShowAgain]);
            }
            // Prompt to select a workspace from many
            else if (workspaces.length > 1) {
                this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('workspacesFound', "This folder contains multiple workspace files. Do you want to open one? [Learn more]({0}) about workspace files.", 'https://go.microsoft.com/fwlink/?linkid=2025315'), [{
                        label: nls_1.localize('selectWorkspace', "Select Workspace"),
                        run: () => {
                            this.quickInputService.pick(workspaces.map(workspace => ({ label: workspace })), { placeHolder: nls_1.localize('selectToOpen', "Select a workspace to open") }).then(pick => {
                                if (pick) {
                                    this.windowService.openWindow([{ uri: resources_1.joinPath(folder, pick.label), typeHint: 'file' }]);
                                }
                            });
                        }
                    }, doNotShowAgain]);
            }
        }
        findFolders(configuration) {
            const folder = this.findFolder(configuration);
            return folder && [folder];
        }
        findFolder({ filesToOpen, filesToCreate, filesToDiff }) {
            if (filesToOpen && filesToOpen.length) {
                return this.parentURI(filesToOpen[0].fileUri);
            }
            else if (filesToCreate && filesToCreate.length) {
                return this.parentURI(filesToCreate[0].fileUri);
            }
            else if (filesToDiff && filesToDiff.length) {
                return this.parentURI(filesToDiff[0].fileUri);
            }
            return undefined;
        }
        parentURI(uri) {
            if (!uri) {
                return undefined;
            }
            const path = uri.path;
            const i = path.lastIndexOf('/');
            return i !== -1 ? uri.with({ path: path.substr(0, i) }) : undefined;
        }
        reportWorkspaceTags(tags) {
            /* __GDPR__
                "workspce.tags" : {
                    "${include}": [
                        "${WorkspaceTags}"
                    ]
                }
            */
            this.telemetryService.publicLog('workspce.tags', tags);
            WorkspaceStats.TAGS = tags;
        }
        reportRemoteDomains(workspaceUris) {
            Promise.all(workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/.git/config` });
                return this.fileService.resolveFile(uri).then(() => {
                    return this.fileService.resolveContent(uri, { acceptTextOnly: true }).then(content => getDomainsOfRemotes(content.value, SecondLevelDomainWhitelist), err => [] // ignore missing or binary file
                    );
                }, err => []);
            })).then(domains => {
                const set = domains.reduce((set, list) => list.reduce((set, item) => set.add(item), set), new Set());
                const list = [];
                set.forEach(item => list.push(item));
                /* __GDPR__
                    "workspace.remotes" : {
                        "domains" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog('workspace.remotes', { domains: list.sort() });
            }, errors_1.onUnexpectedError);
        }
        reportRemotes(workspaceUris) {
            Promise.all(workspaceUris.map(workspaceUri => {
                return getHashedRemotesFromUri(workspaceUri, this.fileService, true);
            })).then(hashedRemotes => {
                /* __GDPR__
                        "workspace.hashedRemotes" : {
                            "remotes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                this.telemetryService.publicLog('workspace.hashedRemotes', { remotes: hashedRemotes });
            }, errors_1.onUnexpectedError);
        }
        /* __GDPR__FRAGMENT__
            "AzureTags" : {
                "node" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        reportAzureNode(workspaceUris, tags) {
            // TODO: should also work for `node_modules` folders several levels down
            const uris = workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                return workspaceUri.with({ path: `${path !== '/' ? path : ''}/node_modules` });
            });
            return this.fileService.resolveFiles(uris.map(resource => ({ resource }))).then(results => {
                const names = [].concat(...results.map(result => result.success ? (result.stat.children || []) : [])).map(c => c.name);
                const referencesAzure = WorkspaceStats.searchArray(names, /azure/i);
                if (referencesAzure) {
                    tags['node'] = true;
                }
                return tags;
            }, err => {
                return tags;
            });
        }
        /* __GDPR__FRAGMENT__
            "AzureTags" : {
                "java" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        reportAzureJava(workspaceUris, tags) {
            return Promise.all(workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/pom.xml` });
                return this.fileService.resolveFile(uri).then(stats => {
                    return this.fileService.resolveContent(uri, { acceptTextOnly: true }).then(content => !!content.value.match(/azure/i), err => false);
                }, err => false);
            })).then(javas => {
                if (javas.indexOf(true) !== -1) {
                    tags['java'] = true;
                }
                return tags;
            });
        }
        reportAzure(uris) {
            const tags = Object.create(null);
            this.reportAzureNode(uris, tags).then((tags) => {
                return this.reportAzureJava(uris, tags);
            }).then((tags) => {
                if (Object.keys(tags).length) {
                    /* __GDPR__
                        "workspace.azure" : {
                            "${include}": [
                                "${AzureTags}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog('workspace.azure', tags);
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
        reportCloudStats() {
            const uris = this.contextService.getWorkspace().folders.map(folder => folder.uri);
            if (uris.length && this.fileService) {
                this.reportRemoteDomains(uris);
                this.reportRemotes(uris);
                this.reportAzure(uris);
            }
        }
        reportProxyStats() {
            this.windowService.resolveProxy('https://www.example.com/')
                .then(proxy => {
                let type = proxy ? String(proxy).trim().split(/\s+/, 1)[0] : 'EMPTY';
                if (['DIRECT', 'PROXY', 'HTTPS', 'SOCKS', 'EMPTY'].indexOf(type) === -1) {
                    type = 'UNKNOWN';
                }
                /* __GDPR__
                    "resolveProxy.stats" : {
                        "type": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                    }
                */
                this.telemetryService.publicLog('resolveProxy.stats', { type });
            }).then(undefined, errors_1.onUnexpectedError);
        }
        /* __GDPR__
            "workspace.metadata" : {
                "fileTypes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "configTypes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "launchConfigs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        reportWorkspaceMetadata(stats) {
            for (let stat of stats) { // one event for each root folder in the workspace
                this.telemetryService.publicLog('workspace.metadata', {
                    'fileTypes': stat.fileTypes,
                    'configTypes': stat.configFiles,
                    'launchConfigs': stat.launchConfigFiles
                });
            }
        }
        getWorkspaceMetadata() {
            const workspaceStatPromises = [];
            const workspace = this.contextService.getWorkspace();
            workspace.folders.forEach(folder => {
                const folderUri = uri_1.URI.revive(folder.uri);
                if (folderUri.scheme === 'file') {
                    const folder = folderUri.fsPath;
                    workspaceStatPromises.push(stats_1.collectWorkspaceStats(folder, ['node_modules', '.git']).then((stats) => __awaiter(this, void 0, void 0, function* () {
                        return stats;
                    })));
                }
            });
            return Promise.all(workspaceStatPromises).then((stats) => {
                return stats;
            });
        }
    };
    WorkspaceStats.DISABLE_WORKSPACE_PROMPT_KEY = 'workspaces.dontPromptToOpen';
    WorkspaceStats = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, windows_1.IWindowService),
        __param(5, notification_1.INotificationService),
        __param(6, quickInput_1.IQuickInputService),
        __param(7, storage_1.IStorageService)
    ], WorkspaceStats);
    exports.WorkspaceStats = WorkspaceStats;
});
//# sourceMappingURL=workspaceStats.js.map