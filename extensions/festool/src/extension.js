const humps = getHump();
const uuidV4 = getUUidV4();
const shortId = getShortId();
const upperCamelCase = getUpperCamelCase();
const vscode = require('vscode');

const VERSION = '0.1';
const WEBVIEW_PATH = '/workspace/extensions/festool/media';
let actived;
let compiler;
let _webview;
/**
 * 插件被激活时触发，所有代码总入口
 * @param {*} context 插件上下文
 */
exports.activate = function(context) {
	compiler = new Worker('/extensions/festool/out/compiler.worker.js');
	const treeDataProvider = getTreeNodeProvider();
	const depsDataProvider = getDepNodeProvider();
	// 注册网站结构Tree数据源
	const treeTreeView = vscode.window.createTreeView('tree', {
		treeDataProvider: treeDataProvider,
		showCollapseAll: true
	});
	const depTreeView = vscode.window.createTreeView('depsOutline', {
		treeDataProvider: depsDataProvider
	});
	// vscode.window.registerTreeDataProvider('tree', treeDataProvider);
	// vscode.window.registerTreeDataProvider('depsOutline', depsDataProvider);


	vscode.commands.registerCommand('tree.checkPage', checkPage);
	vscode.commands.registerCommand('tree.editPage', openPageText);
	vscode.commands.registerCommand('tree.refreshTree', () => treeDataProvider.getTree());
	vscode.commands.registerCommand('tree.preview', () => self.postMessage({ $type: 'preview' }));
	vscode.commands.registerCommand('depsOutline.addDepdence', () => depsDataProvider.addDepdence());
	vscode.commands.registerCommand('depsOutline.deleteDep', (node) => depsDataProvider.deleteDepdence(node));
	vscode.commands.registerCommand('depsOutline.doAddDepdence', (node) => depsDataProvider.doAddDepdence(node));
	// babylon操作
	vscode.commands.registerCommand('tree.addDir', (node) => treeDataProvider.addDir(node));
	vscode.commands.registerCommand('tree.addPage', (node) => treeDataProvider.addPage(node));
	vscode.commands.registerCommand('tree.deleteDir', (node) => treeDataProvider.deleteDir(node));
	vscode.commands.registerCommand('tree.deletePage', (node) => treeDataProvider.deletePage(node));
	vscode.commands.registerCommand('tree.deleteMaterial', (node) => treeDataProvider.deleteMaterial(node));
	vscode.commands.registerCommand('tree.moveMaterialToUp', (node) => treeDataProvider.moveToUp(node));
	vscode.commands.registerCommand('tree.moveMaterialToDown', (node) => treeDataProvider.moveToDown(node));
	// 添加物料页面webview
	context.subscriptions.push(vscode.commands.registerCommand('tree.componentView', registerWebview(context, treeDataProvider)));

	// vscode.commands.executeCommand('tree.componentView');
};

/**
 * 插件被释放时触发
 */
exports.deactivate = function() {
};

function checkPage (node) {
	actived = node;
	vscode.commands.executeCommand('tree.componentView');
}

function openPageText (node) {
	let target = self._sandbox.modules.find(it => it.shortid === node.moduleId);
	if (!target.directory) {
		generatePath();
		target = self._sandbox.modules.find(it => it.shortid === node.moduleId);
	}
	vscode.commands.executeCommand('vscode.open', vscode.Uri.file(`/workspace/${target.directory}${target.title}`));
}

function getTreeNodeProvider () {
	class TreeProvider {
		constructor () {
			this.tree = [];
			this._onDidChangeTreeData = new vscode.EventEmitter();
			this.onDidChangeTreeData = this._onDidChangeTreeData.event;
			this.getTree();
		}

		refresh() {
			this._onDidChangeTreeData.fire();
		}
		getTreeItem(element) {
			return element;
		}
		getChildren(element) {
			if (!self._sandbox) {
				return Promise.resolve([]);
			}

			if (element) {
				if (element.pages) {
					return Promise.resolve(this.getPageNodes(element.pages));
				} else if (element.materials) {
					return Promise.resolve(this.getMaterialNodes(element.materials));
				} else {
					return Promise.resolve([]);
				}
			} else {
				if (this.tree.length) {
					return Promise.resolve(this.getDirNodes());
				} else {
					vscode.window.showInformationMessage('该项目暂时没有结构树');
					return Promise.resolve([]);
				}
			}
		}
		sendMessage(data, callback) {
			let _timer = setTimeout(() => {
				_timer = null;
				compiler.onmessage = null;
				callback(new Error('================ compiler timeout ================'));
			}, 1e4);
			compiler.onmessage = function ({ data }) {
				clearTimeout(_timer);
				_timer = null;
				compiler.onmessage = null;
				if (data.code === 200) {
					callback(null, data);
					vscode.window.showInformationMessage('操作成功');
				} else {
					callback(new Error(data.message));
				}
			};
			compiler.postMessage(data);
		}
		getTree() {
			try {
				if (!self._sandbox.sourceId) {
					this._timer = setTimeout(() => {
						this.getTree();
					}, 400);
					return;
				}
				this._timer = null;
				// const menuConfig = fs.readFileSync('/workspace/src/menuConfig.js');
				// const routerConfig = fs.readFileSync('/workspace/src/routerConfig.js');
				const srcDir = self._sandbox.directories.find(it => !it.directoryShortid && it.title === 'src');
				const menuConfig = self._sandbox.modules.find(it => it.directoryShortid === srcDir.shortid && it.title === 'menuConfig.js');
				const routerConfig = self._sandbox.modules.find(it => it.directoryShortid === srcDir.shortid && it.title === 'routerConfig.js');
				this.sendMessage({
					type: 'get-tree',
					data: {
						sandbox: self._sandbox,
						menuConfig: menuConfig && menuConfig.code,
						routerConfig: routerConfig && routerConfig.code
					}
				}, (err, data) => {
					if (err)
						return;

					this.tree = data.data && data.data.pageTree;
					this.refresh();
					vscode.window.showInformationMessage('成功加载网站结构');
				});
			} catch (e) {
				vscode.window.showErrorMessage('项目结构已发生变更，请联系@zhengfankai');
				return;
			}
		}
		getDirNodes() {
			return Promise.resolve(this.tree.map(dir => {
				if (dir.children) {
					return dir.children.length
						? new DirNode(dir.name, VERSION, vscode.TreeItemCollapsibleState.Collapsed, null, dir.path, dir.children)
						: new DirNode(dir.name, VERSION, vscode.TreeItemCollapsibleState.None, null, dir.path, dir.children);
				} else if (dir.materials) {
					return dir.materials.length
						? new PageNode(dir.name, VERSION, vscode.TreeItemCollapsibleState.Expanded, {
							command: 'tree.checkPage',
							title: '',
							arguments: [dir],
						}, dir.path, dir.pageId, dir.moduleId, dir.component, dir.materials)
						: new PageNode(dir.name, VERSION, vscode.TreeItemCollapsibleState.None, {
							command: 'tree.checkPage',
							title: '',
							arguments: [dir],
						}, dir.path, dir.pageId, dir.moduleId, dir.component, dir.materials);
				}
			}));
		}
		getPageNodes(pages) {
			return Promise.resolve(pages.map(page => {
				return (page.materials && page.materials.length)
					? new PageNode(page.name, VERSION, vscode.TreeItemCollapsibleState.Expanded, {
						command: 'tree.checkPage',
						title: '',
						arguments: [page],
					}, page.path, page.pageId, page.moduleId, page.component, page.materials)
					: new PageNode(page.name, VERSION, vscode.TreeItemCollapsibleState.None, {
						command: 'tree.checkPage',
						title: '',
						arguments: [page],
					}, page.path, page.pageId, page.moduleId, page.component, page.materials);
			}));
		}
		getMaterialNodes(materials) {
			return Promise.resolve(materials.map((material, index) => {
				let target = self._sandbox.modules.find(it => it.shortid === material.moduleId);
				if (!target.directory) {
					generatePath();
					target = self._sandbox.modules.find(it => it.shortid === material.moduleId);
				}
				return new MaterialNode(material.title, VERSION, vscode.TreeItemCollapsibleState.None, {
					command: 'vscode.open',
					title: '',
					arguments: [vscode.Uri.file(`/workspace/${target.directory}${target.title}`), null]
				}, material.pageId, material.moduleId, material.__id__, material.__key__, index);
			}));
		}
		sandboxSync() {
			self.postMessage({
				$type: 'sandbox-compile',
				$data: self._sandbox,
			});
		}
		addDir(node) {
			let routeName = '';
			let menuName = '';
			vscode.window.showInputBox({
				placeHolder: '请输入目录route',
				validateInput: function (value) {
					if (!value) {
						vscode.window.showErrorMessage('目录route不可为空');
						return false;
					}
					if (!/^[a-z][a-zA-Z0-9_]*/.test(value)) {
						vscode.window.showErrorMessage('目录route请以驼峰命名');
						return false;
					}
				}
				// placeHolder: '请输入目录导航名'
			})
			.then(value => {
				if (!value || !/^[a-z][a-zA-Z0-9_]+/.test(value)) {
					return;
				}
				routeName = value;
				return vscode.window.showInputBox({
					placeHolder: '请输入目录导航名',
				});
			})
			.then(value => {
				if (!/^[a-z][a-zA-Z0-9_]+/.test(routeName)) {
					return;
				}
				menuName = value;
				console.log(routeName ,menuName);
				const srcDir = self._sandbox.directories.find(it => !it.directoryShortid && it.title === 'src');
				const menuModule = self._sandbox.modules.find(it => it.directoryShortid === srcDir.shortid && it.title === 'menuConfig.js');
				const menuSrc = menuModule.code;
				this.sendMessage({
					type: 'add-dir',
					data: {
						routeName,
						menuName,
						menuSrc
					}
				}, (err, data) => {
					if (err)
						return;
					console.log(data);
					menuModule.code = data.data.menuConfig;
					setTimeout(() => {
						this.getTree();
					}, 100);
					this.sandboxSync();
				});
			});
		}
		addPage(node) {
			let routeName = '';
			let menuName = '';
			vscode.window.showInputBox({
				placeHolder: '请输入页面目录名',
				validateInput: function (value) {
					if (!value) {
						vscode.window.showErrorMessage('页面目录名不可为空');
						return false;
					}
					if (!/^[a-z][a-zA-Z0-9_]*/.test(value)) {
						vscode.window.showErrorMessage('页面目录名请以驼峰命名');
						return false;
					}
				}
				// placeHolder: '请输入目录导航名'
			})
			.then(value => {
				if (!value || !/^[a-z][a-zA-Z0-9_]+/.test(value)) {
					return;
				}
				routeName = value;
				return vscode.window.showInputBox({
					placeHolder: '请输入页面导航名',
				});
			})
			.then(value => {
				if (!/^[a-z][a-zA-Z0-9_]+/.test(routeName)) {
					return;
				}
				menuName = value;
				console.log(routeName ,menuName);
				const basePath = node.path;
				const srcDir = self._sandbox.directories.find(it => !it.directoryShortid && it.title === 'src');
				const srcId = srcDir.shortid;
				const pageId = self._sandbox.directories.find(
						(it) => it.title === 'pages' && it.directoryShortid === srcId
				).shortid;

				const res = this.addPageFile({
						pageId,
						basePath,
						routeName,
						menuName,
				});
				const { dirId, tmpId } = res;

				const menuModule = self._sandbox.modules.find(it => it.directoryShortid === srcDir.shortid && it.title === 'menuConfig.js');
				const routerModule = self._sandbox.modules.find(it => it.directoryShortid === srcDir.shortid && it.title === 'routerConfig.js');
				const menuSrc = menuModule.code;
				const routerSrc = routerModule.code;

				const payload = {
						dirId,
						tmpId,
						routerSrc,
						menuSrc,
						basePath,
						routeName,
						menuName,
				};

				this.sendMessage({
					type: 'add-page',
					data: payload
				}, (err, data) => {
					if (err)
						return;
					console.log(data);
					menuModule.code = data.data.menuConfig;
					routerModule.code = data.data.routerConfig;
					setTimeout(() => {
						this.getTree();
					}, 100);
					this.sandboxSync();
				});
			});
		}
		addPageFile (data) {
			const res = this.doAddPage(data);
			if (res) {
				this.updateSandbox(res);
				return {
						dirId: res.directory[0].shortid,
						tmpId: res.modules[0].shortid,
				};
			} else {
				return res;
			}
		}
		doAddPage ({
				routeName,
				basePath,
				pageId
		}) {
				const sandbox = self._sandbox;
				const title = basePath === '' ? routeName : `${humps.camelize(basePath.replace(/^\//, ''))}${upperCamelCase(routeName)}`;
				if (sandbox.directories.some(dir => dir.title === title)) {
						return false;
				}
				const nextDirectories = sandbox.directories[0];
				const nextModule = sandbox.modules[0];
				const newDirectories = {
						title,
						sourceId: nextDirectories.sourceId,
						shortid: shortId.generate(),
						id: uuidV4(),
						directoryShortid: pageId
				};
				const newComponentsDirectories = {
						title: `components`,
						sourceId: nextDirectories.sourceId,
						shortid: shortId.generate(),
						id: uuidV4(),
						directoryShortid: newDirectories.shortid,
				};
				const newModule = {
						title: `${title}.jsx`,
						sourceId: nextModule.sourceId,
						shortid: shortId.generate(),
						isBinary: false,
						id: uuidV4(),
						directoryShortid: newDirectories.shortid,
						code: `import React from 'react';
export default class extends React.Component {
	render() {
		return (
			<div></div>
		);
	}
};`
				};
				const newIndexModule = {
						title: `index.js`,
						sourceId: nextModule.sourceId,
						shortid: shortId.generate(),
						isBinary: false,
						id: uuidV4(),
						directoryShortid: newDirectories.shortid,
						code: `import ${upperCamelCase(title)} from './${title}';
export default ${upperCamelCase(title)};`
				};
				return {
						directory: [
								newDirectories,
								newComponentsDirectories,
						],
						modules: [
								newModule,
								newIndexModule,
						]
				};
		}
		deleteDir(dir) {
			vscode.window.showWarningMessage(
				"确定要移除这个目录吗(该目录下的所有页面及物料都将被移除)?",
				{ title: "是" },
				{ title: "否", isCloseAffordance: !0 }
			)
			.then(e => {
				if (!e || e.isCloseAffordance) return;

				const pageIds = dir.pages.map(page => page.pageId);
				const components = dir.pages.map(page => page.component);
				const { directories, modules } = this.doDeleteDirectory(pageIds);

				const routerIndex = modules.findIndex(
						(file) => file.title === 'routerConfig.js'
				);
				const menuIndex = modules.findIndex(
						(file) => file.title === 'menuConfig.js'
				);
				const routePath = dir.path;
				const payload = {
						routerSrc: modules[routerIndex].code,
						menuSrc: modules[menuIndex].code,
						routePath,
						components,
						pageIds,
				};
				this.sendMessage({
						type: 'delete-dir',
						data: payload
				}, (err, data) => {
					if (err)
						return console.log(err);
					console.log(data);
					self._sandbox.directories = directories;
					self._sandbox.modules = modules;
					modules[routerIndex].code = data.data.routerConfig;
					modules[menuIndex].code = data.data.menuConfig;
					setTimeout(() => {
						this.getTree();
					}, 100);
					this.sandboxSync();
				});
			});
		}
		doDeleteDirectory (directoryShortids) {
			const sandbox = self._sandbox;
			const { directories, modules } = sandbox;
			const newDirectories = directories.filter(it => {
					if (directoryShortids.includes(it.directoryShortid)) {
							directoryShortids.push(it.shortid);
							return false;
					} else if (directoryShortids.includes(it.shortid)) {
							return false;
					} else {
							return true;
					}
			});
			const newModules = modules.filter(it => !directoryShortids.includes(it.directoryShortid));
			return {
				...sandbox,
				directories: newDirectories,
				modules: newModules,
			};
		}
		deletePage(node) {
			vscode.window.showWarningMessage(
				"确定要移除这个页面吗(该页面下的所有物料都将被移除)?",
				{ title: "是" },
				{ title: "否", isCloseAffordance: !0 }
			)
			.then(e => {
				if (!e || e.isCloseAffordance) return;

				const routeName = node.name;
				const routePath = node.path;

				const directoryShortid = node.pageId;
				const delDir = self._sandbox.directories.find(
						(it) => it.shortid === directoryShortid
				);
				delDir.isDirectory = true;
				delDir.isDeleted = true;

				const { directories, modules } = this.doDeleteDirectory([directoryShortid]);

				const routerIndex = modules.findIndex(
						(file) => file.title === 'routerConfig.js'
				);
				const menuIndex = modules.findIndex(
						(file) => file.title === 'menuConfig.js'
				);
				const payload = {
						routerSrc: modules[routerIndex].code,
						menuSrc: modules[menuIndex].code,
						routeName,
						routePath,
						pageId: node.pageId,
						moduleId: node.moduleId
				};
				this.sendMessage({
						type: 'delete-page',
						data: payload,
				}, (err, data) => {
					if (err)
						return console.log(err);
					console.log(data);
					self._sandbox.directories = directories;
					self._sandbox.modules = modules;
					modules[routerIndex].code = data.data.routerConfig;
					modules[menuIndex].code = data.data.menuConfig;
					setTimeout(() => {
						this.getTree();
					}, 100);
					this.sandboxSync();
				});
			});
		}
		deleteMaterial(node) {
			vscode.window.showWarningMessage(
				"确定要移除这个物料吗?",
				{ title: "是" },
				{ title: "否", isCloseAffordance: !0 }
			)
			.then(e => {
				if (!e || e.isCloseAffordance) return;

				const { pageId, label, __key__ } = node;
				const { directories, modules } = this.doDeleteDirectory([pageId]);
				let parentNode;
				const getParent = function (it) {
					if (it.materials) {
						if (it.materials.some(item => node.moduleId === item.moduleId)) {
							parentNode = it;
						}
					} else if (it.children) {
						it.children.forEach(getParent);
					}
				};
				this.tree.forEach(getParent);
				const page = modules.find(it => it.shortid === parentNode.moduleId);
				const payload = {
						pageJsx: page.code,
						material: {
								title: label,
								__key__
						}
				};
				this.sendMessage({
						type: 'delete-material',
						data: payload
				}, (err, data) => {
					if (err)
						return console.log(err);
					console.log(data);
					self._sandbox.directories = directories;
					self._sandbox.modules = modules;
					page.code = data.data.code;
					setTimeout(() => {
						this.getTree();
					}, 100);
					this.sandboxSync();
				});
			});
		}
		updateSandbox (data) {
			const { directory, modules } = data;

			self._sandbox.directories = self._sandbox.directories.concat(directory);
			self._sandbox.modules = self._sandbox.modules.concat(modules);
		}
		moveToUp(node) {
			if (node.__index__ <= 0) {
				return;
			}
			const dragKey = node.__key__;
			const dropIndex = node.__index__ - 1;
			let pageModule;
			this.tree.forEach(it => {
				if (it.children) {
					it.children.forEach(page => {
						if (page.materials) {
							if (page.materials.some(it => it.__key__ === node.__key__)) {
								pageModule = self._sandbox.modules.find(item => item.shortid === page.moduleId);
							}
						}
					});
				} else if (it.materials) {
					if (it.materials.some(it => it.__key__ === node.__key__)) {
						pageModule = self._sandbox.modules.find(item => item.shortid === it.moduleId);
					}
				}
			});
			if (!pageModule) {
				return;
			}
			const pageCode = pageModule.code;
			// const pageCode = self._sandbox.modules.find(it => it.)
			this.sendMessage({
				type: 'move-material-splice',
				data: {
					dragKey,
					dropIndex,
					pageCode
				}
			}, (err, data) => {
				if (err)
					return;
				console.log(data);
				pageModule.code = data.data.code;
				setTimeout(() => {
					this.getTree();
				}, 100);
				this.sandboxSync();
			});
			// dragId, dropId, pageCode, direction
		}
		moveToDown(node) {
			const dragKey = node.__key__;
			const dropIndex = node.__index__ + 1;
			let _page;
			this.tree.forEach(it => {
				if (it.children) {
					it.children.forEach(page => {
						if (page.materials) {
							if (page.materials.some(it => it.__key__ === node.__key__)) {
								_page = page
							}
						}
					});
				} else if (it.materials) {
					if (it.materials.some(it => it.__key__ === node.__key__)) {
						_page = it;
					}
				}
			});
			if (!_page || dropIndex >= _page.materials.length) {
				return;
			}
			const pageModule = self._sandbox.modules.find(it => it.shortid === _page.moduleId)
			const pageCode = pageModule.code;
			this.sendMessage({
				type: 'move-material-splice',
				data: {
					dragKey,
					dropIndex,
					pageCode
				}
			}, (err, data) => {
				if (err)
					return;
				pageModule.code = data.data.code;
				setTimeout(() => {
					this.getTree();
				}, 100);
				this.sandboxSync();
			});
		}
	}

	class DirNode extends vscode.TreeItem {
		constructor(label, version, collapsibleState, command, path, pages) {
			super(label, collapsibleState);
			this.label = label;
			this.version = version;
			this.collapsibleState = collapsibleState;
			this.command = command;
			this.path = path;
			this.pages = pages;
			this.iconPath = {
				light: '/extensions/festool/resources/dir.svg',
				dark: '/extensions/festool/resources/dir.svg'
			};
			this.contextValue = 'dir';
		}
		get tooltip() {
			return `${this.label} (${this.path})`;
		}
		get description() {
			return `(${this.path})`;
		}
	}

	class PageNode extends vscode.TreeItem {
		constructor(label, version, collapsibleState, command, path, pageId, moduleId, name, materials) {
			super(label, collapsibleState);
			this.label = label;
			this.version = version;
			this.collapsibleState = collapsibleState;
			this.command = command;
			this.path = path;
			this.pageId = pageId;
			this.moduleId = moduleId;
			this.materials = materials;
			this.name = name;
			this.iconPath = {
				light: '/extensions/festool/resources/page.svg',
				dark: '/extensions/festool/resources/page.svg'
			};
			this.contextValue = 'page';
		}
		get tooltip() {
			return `${this.label} (${this.path})`;
		}
		get description() {
			return `(${this.path})`;
		}
	}

	class MaterialNode extends vscode.TreeItem {
		constructor(label, version, collapsibleState, command, pageId, moduleId, __id__, __key__, index) {
			super(label, collapsibleState);
			this.label = label;
			this.version = version;
			this.collapsibleState = collapsibleState;
			this.command = command;
			this.pageId = pageId;
			this.moduleId = moduleId;
			this.__id__ = __id__;
			this.__key__ = __key__;
			this.__index__ = index;
			this.iconPath = {
				light: '/extensions/festool/resources/material.svg',
				dark: '/extensions/festool/resources/material.svg'
			};
			this.contextValue = 'material';
		}
		get tooltip() {
			return `${this.label}`;
		}
		get description() {
			return '';
		}
	}

	return new TreeProvider();
}

function getDepNodeProvider () {
	class DepProvider {
		constructor () {
			this.type = 'resolve';
			this.deps = [];
			this._onDidChangeTreeData = new vscode.EventEmitter();
			this.onDidChangeTreeData = this._onDidChangeTreeData.event;
			this.getDeps();
		}

		refresh() {
			this._onDidChangeTreeData.fire();
		}
		getTreeItem(element) {
			return element;
		}
		getChildren(element) {
			if (!self._sandbox) {
				return Promise.resolve([]);
			}

			if (this.type === 'resolve') {
				if (element) {
					return Promise.resolve([]);
				} else {
					if (this.deps.length) {
						return Promise.resolve(this.getDepNodes());
					} else {
						return Promise.resolve([]);
					}
				}
			} else if (this.type === 'pending') {
				if (element) {
					return Promise.resolve([]);
				} else {
					return this.queryNpmDeps(this.pkgName);
				}
			}
		}
		getDepNodes() {
			return Promise.resolve(this.deps.map(dep =>
				new DepNode(dep.name, VERSION, vscode.TreeItemCollapsibleState.None, null, dep.version, dep.description)
			));
		}
		getDeps() {
			if (!self._sandbox.sourceId) {
				this._timer = setTimeout(() => {
					this.getDeps();
				}, 400);
				return;
			}
			this._timer = null;

			this.deps = Object.keys(self._sandbox.npmDependencies).map(name => ({
				name,
				version: self._sandbox.npmDependencies[name],
			}));
			this.refresh();
		}
		addDepdence () {
			var that = this;
			var disposables = [];
			var input = vscode.window.createInputBox();
			input.title = '请输入npm包名';
			disposables.push(
				input.onDidAccept(function () {
					return new Promise((resolve, reject) => {
						var value = input.value;
						input.enabled = false;
						input.busy = true;
						that
							.queryNpmDeps(value)
							.then(function (pkgs) {
								input.enabled = true;
								input.busy = false;
								that.openQuickPick(pkgs);
								dispose();
							});
					})
				}),
				input.onDidTriggerButton(function () {
				}),
				input.onDidChangeValue(function () {
				}),
			)
			input.show();

			function dispose () {
				disposables.forEach(d => d.dispose());
				input.dispose();
			}
		}
		openQuickPick(items) {
			var disposables = [];
			var input = vscode.window.createQuickPick();
			input.title = '请选择npm包:';
			input.items = items;
			disposables.push(
				input.onDidTriggerButton(function (item) {
					console.log(item)
				}),
				input.onDidChangeSelection(function (item) {
					return new Promise((resolve, reject) => {
						input.enabled = false;
						input.busy = true;
						if (item && item.length && item[0]) {
							vscode.commands.executeCommand('depsOutline.doAddDepdence', item[0]);
						}
						input.enabled = true;
						input.busy = false;
						dispose();
					})
				}),
			)
			input.show();

			function dispose () {
				disposables.forEach(d => d.dispose());
				input.dispose();
			}
		}
		queryNpmDeps(name) {
			name = encodeURIComponent(name);
			return fetch(`/api/v2/packages/query/${name}`)
				.then(res => res.json())
				.then(data => {
					return this.handleDeps(data);
				})
				.catch(err => {
					vscode.window.showErrorMessage(err.message);
				});
		}
		doAddDepdence(node) {
			this.type = 'resolve';
			this.pkgName = undefined;
			Object.assign(self._sandbox.npmDependencies, {
				[node.label]: node.version
			});
			setTimeout(() => {
				this.getDeps();
			}, 100);
			this.sandboxSync();
		}
		deleteDepdence(node) {
			delete self._sandbox.npmDependencies[node.label];
			setTimeout(() => {
				this.getDeps();
			}, 100);
			this.sandboxSync();
		}
		sandboxSync() {
			self.postMessage({
				$type: 'sandbox-compile',
				$data: self._sandbox,
			});
		}
		handleDeps(data) {
			return Promise.resolve(data.map(dep =>
				({
					label: dep.name,
					description: dep.version,
					detail: dep.description,
					version: dep.version
				})
			));
		}
	}

	class DepNode extends vscode.TreeItem {
		constructor(label, version, collapsibleState, command, depVersion) {
			super(label, collapsibleState);
			this.label = decodeURIComponent(label);
			this.version = version;
			this.collapsibleState = collapsibleState;
			this.command = command;
			this.depVersion = depVersion;
			this.iconPath = {
				light: '',
				dark: ''
			};
			this.contextValue = 'dependence';
		}
		get tooltip() {
			return `${this.label} : ${this.depVersion}`;
		}
		get description() {
			return ` : ${this.depVersion}`;
		}
	}

	class NewDepNode extends vscode.TreeItem {
		constructor(label, version, collapsibleState, command, depVersion, depDescription) {
			super(label, collapsibleState);
			this.label = label;
			this.version = version;
			this.collapsibleState = collapsibleState;
			this.command = command;
			this.depVersion = depVersion;
			this.depDescription = depDescription;
			this.iconPath = {
				light: '',
				dark: ''
			};
			this.contextValue = 'newDependence';
		}
		get tooltip() {
			return `${this.label} : ${this.depVersion}`;
		}
		get description() {
			return ` : ${this.depVersion}`;
		}
	}

	return new DepProvider();
}

function addMaterials (materials, treeDataProvider) {
	if (materials.length) {
		const first = materials[0];
		addMaterial(first, treeDataProvider, materials, 0, materials.length - 1);
	}
}

function addMaterial (material, treeDataProvider, _materials, _index, _total) {
	const { sourceId, title, } = material;
	const { pageId } = actived;
	const { modules, directories, npmDependencies, materialDirectory } = doAddMaterial({ material, directoryShortid: pageId, sandbox: self._sandbox });

	const page = modules.find(
			(it) => it.shortid === actived.moduleId
	);
	const materialJsx = modules.find(
			(it) =>
					it.title === `${title}.jsx` &&
					it.directoryShortid === materialDirectory.shortid
	);
	const pageJsx = page.code;
	const payload = {
			material: {
					title: materialDirectory.title,
					pageId: materialDirectory.shortid,
					templateId: materialJsx.shortid
			},
			pageJsx,
			materialId: sourceId
	};
	treeDataProvider.sendMessage({
			type: 'add-material',
			data: payload,
	}, (err, data) => {
		if (err)
			return;
		console.log(data);
		self._sandbox.modules = modules;
		self._sandbox.directories = directories;
		self._sandbox.npmDependencies = npmDependencies;
		page.code = data.data.code;
		if (_index < _total) {
			addMaterial(_materials[_index + 1], treeDataProvider, _materials, _index + 1, _total);
		} else {
			setTimeout(() => {
				treeDataProvider.getTree();
			}, 100);
			treeDataProvider.sandboxSync();
		}
	});
}

function doAddMaterial ({
	material,
	directoryShortid,
	sandbox: { directories, modules, npmDependencies },
}) {
	material.code = humps.camelizeKeys(material.code);
	const { code, title } = material;
	const componentContainer = directories.find(
			it => it.title === 'components' &&
					it.directoryShortid === directoryShortid
	);
	const newMaterialName = `${title}${hashGenerator()}`;
	const materialDirectory = {
			title: newMaterialName,
			shortid: shortId.generate(),
			id: uuidV4(),
			directoryShortid: componentContainer.shortid,
	};
	// 每次添加物料源码时需要修改一次物料的shortid和directoryShortid避免重复
	code.directories.forEach(it => {
			const oldId = it.shortid;
			const newId = shortId.generate();

			code.directories.forEach(item => {
					if (item.directoryShortid === oldId) {
							item.directoryShortid = newId;
					}
			});

			code.modules.forEach(item => {
					if (item.directoryShortid === oldId) {
							item.directoryShortid = newId;
					}
			});
			it.shortid = newId;
	});
	modules = modules.concat(code.modules.map(it => ({
			title: it.title,
			code: it.code,
			directoryShortid: it.directoryShortid || materialDirectory.shortid,
			shortid: shortId.generate(),
			isBinary: false,
			sourceId: null,
			id: uuidV4(),
	})));
	directories = directories.concat(
		materialDirectory,
			...code.directories.map(it => ({
					title: it.title,
					directoryShortid: it.directoryShortid || materialDirectory.shortid,
					shortid: it.shortid,
					sourceId: null,
					id: uuidV4(),
		}))
	);
	npmDependencies = {
			...npmDependencies,
			...material.npmDependencies,
	}

	return {
			directories,
			modules,
			npmDependencies,
			materialDirectory,
	}
}

function registerWebview (context, treeDataProvider) {
	return function (uri) {
		if (_webview && !_webview._isDisposed) {
			_webview.webview.postMessage({
				type: 'actived',
				data: actived,
			});
			return;
		}
		_webview = null;
		// 工程目录一定要提前获取，因为创建了webview之后activeTextEditor会不准确
		const panel = vscode.window.createWebviewPanel(
			'componentView', // viewType
			"物料管理", // 视图标题
			vscode.ViewColumn.One, // 显示在编辑器的哪个部位
			{
				enableScripts: true, // 启用JS，默认禁用
				retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置,
			}
		);

		panel.webview.html = WEBVIEW_HTML;
		panel.webview.onDidReceiveMessage(e => {
			const { $type, $data } = e.data;
			if ($type === 'onready') {
				_webview = panel;
				panel.webview.postMessage({
					type: 'actived',
					data: actived,
				});
			}
			if ($type === 'message') {
				if (!$data[0].type)
					addMaterials($data, treeDataProvider);
				return;
			}
		}, undefined, context.subscriptions);
	};
}

function generatePath () {
	const { directories, modules } = self._sandbox;
	const dirMap = {};
	directories.forEach(({ shortid, directoryShortid, title }) => {
		dirMap[shortid] = {
			pid: directoryShortid,
			title
		};
	});
	directories.forEach((directory) => {
		const { directoryShortid } = directory;
		const path = [];
		let pid = directoryShortid;
		while (pid != null) {
			const parent = dirMap[pid];
			path.unshift(parent.title);
			pid = parent.pid;
		}
		const dir = path.join('/');
		directory.directory = dir ? `${dir}/` : '';
	});
	modules.forEach((module) => {
		const { directoryShortid } = module;
		const path = [];
		let pid = directoryShortid;
		while (pid != null) {
			const parent = dirMap[pid];
			path.unshift(parent.title);
			pid = parent.pid;
		}
		const dir = path.join('/');
		module.directory = dir ? `${dir}/` : '';
	});
}

const WEBVIEW_HTML = `<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>添加物料</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/element-ui/lib/theme-chalk/index.css">
	<style>
		html,
		body {
			margin: 0;
			padding: 0;
			color: #ffffee;
			background-color: rgb(30, 30, 30);
		}
	</style>
	<style>
		.el-row .el-col {
			border-radius: 4px;
		}

		.bg-purple-dark {
			background: #99a9bf;
		}

		.bg-purple {
			background: #d3dce6;
		}

		.bg-purple-light {
			background: #e5e9f2;
		}

		.grid-content {
			border-radius: 4px;
			min-height: 36px;
		}

		.row-bg {
			padding: 10px 0;
			background-color: #f9fafc;
		}

		#app .loading {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 99;
			background: rgb(29, 29, 29);
		}

		#app .fixed {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			height: 100px;
			line-height: 100px;
			text-align: center;
			background-image: linear-gradient(to top, #ffffff, transparent);
		}

		#app .actived {
			position: fixed;
			z-index: 9;
			top: 0;
			left: 0;
			right: 0;
			height: 48px;
			line-height: 48px;
			text-align: center;
			color: #fa3140;
			background: linear-gradient(to right, #3c8cff, #00c8d2);
		}

		#app .avatar.preview .mask {
			position: relative;
			width: 100%;
			text-align: center;
		}

		#app .avatar.preview .mask .toolist {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			transition: all .3s;
			background-color: rgba(0, 0, 0, .8);
		}

		#app .avatar.preview .mask .toolist .title {
			position: absolute;
			left: 50%;
			top: 50%;
			color: #fff;
			transform: translate(-50%, -50%);
		}

		#app .avatar.preview .mask:hover {
			cursor: pointer;
		}

		.el-card {
			border: 0;
		}

		.boxLoading {
			width: 50px;
			height: 50px;
			margin: auto;
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
		}
		.boxLoading::before {
			content: '';
			width: 50px;
			height: 5px;
			background: #000;
			opacity: 0.1;
			position: absolute;
			top: 59px;
			left: 0;
			border-radius: 50%;
			animation: shadow .5s linear infinite;
		}
		.boxLoading::after {
			content: '';
			width: 50px;
			height: 50px;
			background: #1A6844;
			animation: animate .5s linear infinite;
			position: absolute;
			top: 0;
			left: 0;
			border-radius: 3px;
		}

		@keyframes animate {
			17% {
				border-bottom-right-radius: 3px;
			}
			25% {
				transform: translateY(9px) rotate(22.5deg);
			}
			50% {
				transform: translateY(18px) scale(1, .9) rotate(45deg);
				border-bottom-right-radius: 40px;
			}
			75% {
				transform: translateY(9px) rotate(67.5deg);
			}
			100% {
				transform: translateY(0) rotate(90deg);
			}
		}


		@keyframes shadow {
			0%, 100% {
				transform: scale(1, 1);
			}
			50% {
				transform: scale(1.2, 1);
			}
		}
	</style>
</head>

<body>
	<br />
	<div id="app">
		<div style="padding: 0 24px;">
			<div class="loading" v-show="loading">
				<div class="boxLoading">
				</div>
			</div>
			<div class="actived">
				<span v-if="actived && actived.moduleId">当前已选中 \`{{actived.name}} ({{actived.path}})\`</span>
				<span v-else>未选中页面节点</span>
			</div>
			<br />
			<br />
			<el-row :gutter="20">
				<el-col v-for="(el, index) of data" :span="6" :key="el.sourceId">
					<div>
						<el-card :body-style="{ padding: '0px' }">
							<div class="avatar preview" @mouseenter="el.hover = true" @mouseleave="el.hover = false"
								@click="checked(el)">
								<div class="mask">
									<div class="toolist" v-show="!el.checked" :style="{opacity: el.hover ? '1' : '0'}">
										<div class="title">点击添加物料</div>
									</div>
									<div class="toolist" style="background: rgba(60,140,255,0.6);"
										:style="{opacity: el.checked ? '1' : '0'}">
										<div class="title">已选择</div>
									</div>
									<img style="height: 12vw" class="image" :src="el.cover">
								</div>
							</div>
							<div style="padding: 14px; color: #fff; background: linear-gradient(to right, #3c8cff, #00c8d2)">
								<span style="line-height: 40px; display: inline-block; width: 100%; vertical-align: top;">
									<span style="font-size: 12px; margin: 0; padding: 0">{{el.name}}</span>
									<el-button style="float: right;" type="primary" icon="el-icon-view" circle></el-button>
								</span>
							</div>
						</el-card>
					</div>
					<br v-if="(index + 1) % 4 === 0" />
				</el-col>
			</el-row>
			<div class="fixed" v-show="targets.length">
				<el-button type="primary" @click="addMaterials">确定</el-button>
			</div>
		</div>
	</div>

	<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/element-ui/lib/index.js"></script>
	<script src="/extensions/festool/src/script.js"></script>
</body>

</html>`;

function getUUidV4 () {
	return /******/ (function(modules) { // webpackBootstrap
		/******/ 	// The module cache
		/******/ 	var installedModules = {};
		/******/
		/******/ 	// The require function
		/******/ 	function __webpack_require__(moduleId) {
		/******/
		/******/ 		// Check if module is in cache
		/******/ 		if(installedModules[moduleId]) {
		/******/ 			return installedModules[moduleId].exports;
		/******/ 		}
		/******/ 		// Create a new module (and put it into the cache)
		/******/ 		var module = installedModules[moduleId] = {
		/******/ 			i: moduleId,
		/******/ 			l: false,
		/******/ 			exports: {}
		/******/ 		};
		/******/
		/******/ 		// Execute the module function
		/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
		/******/
		/******/ 		// Flag the module as loaded
		/******/ 		module.l = true;
		/******/
		/******/ 		// Return the exports of the module
		/******/ 		return module.exports;
		/******/ 	}
		/******/
		/******/
		/******/ 	// expose the modules object (__webpack_modules__)
		/******/ 	__webpack_require__.m = modules;
		/******/
		/******/ 	// expose the module cache
		/******/ 	__webpack_require__.c = installedModules;
		/******/
		/******/ 	// define getter function for harmony exports
		/******/ 	__webpack_require__.d = function(exports, name, getter) {
		/******/ 		if(!__webpack_require__.o(exports, name)) {
		/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
		/******/ 		}
		/******/ 	};
		/******/
		/******/ 	// define __esModule on exports
		/******/ 	__webpack_require__.r = function(exports) {
		/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
		/******/ 		}
		/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
		/******/ 	};
		/******/
		/******/ 	// create a fake namespace object
		/******/ 	// mode & 1: value is a module id, require it
		/******/ 	// mode & 2: merge all properties of value into the ns
		/******/ 	// mode & 4: return value when already ns object
		/******/ 	// mode & 8|1: behave like require
		/******/ 	__webpack_require__.t = function(value, mode) {
		/******/ 		if(mode & 1) value = __webpack_require__(value);
		/******/ 		if(mode & 8) return value;
		/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
		/******/ 		var ns = Object.create(null);
		/******/ 		__webpack_require__.r(ns);
		/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
		/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
		/******/ 		return ns;
		/******/ 	};
		/******/
		/******/ 	// getDefaultExport function for compatibility with non-harmony modules
		/******/ 	__webpack_require__.n = function(module) {
		/******/ 		var getter = module && module.__esModule ?
		/******/ 			function getDefault() { return module['default']; } :
		/******/ 			function getModuleExports() { return module; };
		/******/ 		__webpack_require__.d(getter, 'a', getter);
		/******/ 		return getter;
		/******/ 	};
		/******/
		/******/ 	// Object.prototype.hasOwnProperty.call
		/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
		/******/
		/******/ 	// __webpack_public_path__
		/******/ 	__webpack_require__.p = "/";
		/******/
		/******/
		/******/ 	// Load entry module and return exports
		/******/ 	return __webpack_require__(__webpack_require__.s = "./v4.js");
		/******/ })
		/************************************************************************/
		/******/ ({

		/***/ "./lib/bytesToUuid.js":
		/*!****************************!*\
			!*** ./lib/bytesToUuid.js ***!
			\****************************/
		/*! no static exports found */
		/***/ (function(module, exports) {

		eval("/**\n * Convert array of 16 byte values to UUID string format of the form:\n * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX\n */\nvar byteToHex = [];\nfor (var i = 0; i < 256; ++i) {\n  byteToHex[i] = (i + 0x100).toString(16).substr(1);\n}\n\nfunction bytesToUuid(buf, offset) {\n  var i = offset || 0;\n  var bth = byteToHex;\n  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4\n  return ([bth[buf[i++]], bth[buf[i++]], \n\tbth[buf[i++]], bth[buf[i++]], '-',\n\tbth[buf[i++]], bth[buf[i++]], '-',\n\tbth[buf[i++]], bth[buf[i++]], '-',\n\tbth[buf[i++]], bth[buf[i++]], '-',\n\tbth[buf[i++]], bth[buf[i++]],\n\tbth[buf[i++]], bth[buf[i++]],\n\tbth[buf[i++]], bth[buf[i++]]]).join('');\n}\n\nmodule.exports = bytesToUuid;\n\n\n//# sourceURL=webpack:///./lib/bytesToUuid.js?");

		/***/ }),

		/***/ "./lib/rng-browser.js":
		/*!****************************!*\
			!*** ./lib/rng-browser.js ***!
			\****************************/
		/*! no static exports found */
		/***/ (function(module, exports) {

		eval("// Unique ID creation requires a high quality random # generator.  In the\n// browser this is a little complicated due to unknown quality of Math.random()\n// and inconsistent support for the `crypto` API.  We do the best we can via\n// feature-detection\n\n// getRandomValues needs to be invoked in a context where \"this\" is a Crypto\n// implementation. Also, find the complete implementation of crypto on IE11.\nvar getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||\n                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));\n\nif (getRandomValues) {\n  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto\n  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef\n\n  module.exports = function whatwgRNG() {\n    getRandomValues(rnds8);\n    return rnds8;\n  };\n} else {\n  // Math.random()-based (RNG)\n  //\n  // If all else fails, use Math.random().  It's fast, but is of unspecified\n  // quality.\n  var rnds = new Array(16);\n\n  module.exports = function mathRNG() {\n    for (var i = 0, r; i < 16; i++) {\n      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;\n      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;\n    }\n\n    return rnds;\n  };\n}\n\n\n//# sourceURL=webpack:///./lib/rng-browser.js?");

		/***/ }),

		/***/ "./v4.js":
		/*!***************!*\
			!*** ./v4.js ***!
			\***************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		eval("var rng = __webpack_require__(/*! ./lib/rng */ \"./lib/rng-browser.js\");\nvar bytesToUuid = __webpack_require__(/*! ./lib/bytesToUuid */ \"./lib/bytesToUuid.js\");\n\nfunction v4(options, buf, offset) {\n  var i = buf && offset || 0;\n\n  if (typeof(options) == 'string') {\n    buf = options === 'binary' ? new Array(16) : null;\n    options = null;\n  }\n  options = options || {};\n\n  var rnds = options.random || (options.rng || rng)();\n\n  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`\n  rnds[6] = (rnds[6] & 0x0f) | 0x40;\n  rnds[8] = (rnds[8] & 0x3f) | 0x80;\n\n  // Copy bytes to buffer, if provided\n  if (buf) {\n    for (var ii = 0; ii < 16; ++ii) {\n      buf[i + ii] = rnds[ii];\n    }\n  }\n\n  return buf || bytesToUuid(rnds);\n}\n\nmodule.exports = v4;\n\n\n//# sourceURL=webpack:///./v4.js?");

		/***/ })

		/******/ });
}

function getShortId () {
	return /******/ (function(modules) { // webpackBootstrap
		/******/ 	// The module cache
		/******/ 	var installedModules = {};
		/******/
		/******/ 	// The require function
		/******/ 	function __webpack_require__(moduleId) {
		/******/
		/******/ 		// Check if module is in cache
		/******/ 		if(installedModules[moduleId]) {
		/******/ 			return installedModules[moduleId].exports;
		/******/ 		}
		/******/ 		// Create a new module (and put it into the cache)
		/******/ 		var module = installedModules[moduleId] = {
		/******/ 			i: moduleId,
		/******/ 			l: false,
		/******/ 			exports: {}
		/******/ 		};
		/******/
		/******/ 		// Execute the module function
		/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
		/******/
		/******/ 		// Flag the module as loaded
		/******/ 		module.l = true;
		/******/
		/******/ 		// Return the exports of the module
		/******/ 		return module.exports;
		/******/ 	}
		/******/
		/******/
		/******/ 	// expose the modules object (__webpack_modules__)
		/******/ 	__webpack_require__.m = modules;
		/******/
		/******/ 	// expose the module cache
		/******/ 	__webpack_require__.c = installedModules;
		/******/
		/******/ 	// define getter function for harmony exports
		/******/ 	__webpack_require__.d = function(exports, name, getter) {
		/******/ 		if(!__webpack_require__.o(exports, name)) {
		/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
		/******/ 		}
		/******/ 	};
		/******/
		/******/ 	// define __esModule on exports
		/******/ 	__webpack_require__.r = function(exports) {
		/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
		/******/ 		}
		/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
		/******/ 	};
		/******/
		/******/ 	// create a fake namespace object
		/******/ 	// mode & 1: value is a module id, require it
		/******/ 	// mode & 2: merge all properties of value into the ns
		/******/ 	// mode & 4: return value when already ns object
		/******/ 	// mode & 8|1: behave like require
		/******/ 	__webpack_require__.t = function(value, mode) {
		/******/ 		if(mode & 1) value = __webpack_require__(value);
		/******/ 		if(mode & 8) return value;
		/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
		/******/ 		var ns = Object.create(null);
		/******/ 		__webpack_require__.r(ns);
		/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
		/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
		/******/ 		return ns;
		/******/ 	};
		/******/
		/******/ 	// getDefaultExport function for compatibility with non-harmony modules
		/******/ 	__webpack_require__.n = function(module) {
		/******/ 		var getter = module && module.__esModule ?
		/******/ 			function getDefault() { return module['default']; } :
		/******/ 			function getModuleExports() { return module; };
		/******/ 		__webpack_require__.d(getter, 'a', getter);
		/******/ 		return getter;
		/******/ 	};
		/******/
		/******/ 	// Object.prototype.hasOwnProperty.call
		/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
		/******/
		/******/ 	// __webpack_public_path__
		/******/ 	__webpack_require__.p = "/";
		/******/
		/******/
		/******/ 	// Load entry module and return exports
		/******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
		/******/ })
		/************************************************************************/
		/******/ ({

		/***/ "../nanoid/format.js":
		/*!***************************!*\
			!*** ../nanoid/format.js ***!
			\***************************/
		/*! no static exports found */
		/***/ (function(module, exports) {

		eval("/**\n * Secure random string generator with custom alphabet.\n *\n * Alphabet must contain 256 symbols or less. Otherwise, the generator\n * will not be secure.\n *\n * @param {generator} random The random bytes generator.\n * @param {string} alphabet Symbols to be used in new random string.\n * @param {size} size The number of symbols in new random string.\n *\n * @return {string} Random string.\n *\n * @example\n * const format = require('nanoid/format')\n *\n * function random (size) {\n *   const result = []\n *   for (let i = 0; i < size; i++) {\n *     result.push(randomByte())\n *   }\n *   return result\n * }\n *\n * format(random, \"abcdef\", 5) //=> \"fbaef\"\n *\n * @name format\n * @function\n */\nmodule.exports = function (random, alphabet, size) {\n  var mask = (2 << Math.log(alphabet.length - 1) / Math.LN2) - 1\n  var step = Math.ceil(1.6 * mask * size / alphabet.length)\n\n  var id = ''\n  while (true) {\n    var bytes = random(step)\n    for (var i = 0; i < step; i++) {\n      var byte = bytes[i] & mask\n      if (alphabet[byte]) {\n        id += alphabet[byte]\n        if (id.length === size) return id\n      }\n    }\n  }\n}\n\n/**\n * @callback generator\n * @param {number} bytes The number of bytes to generate.\n * @return {number[]} Random bytes.\n */\n\n\n//# sourceURL=webpack:///../nanoid/format.js?");

		/***/ }),

		/***/ "./index.js":
		/*!******************!*\
			!*** ./index.js ***!
			\******************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\nmodule.exports = __webpack_require__(/*! ./lib/index */ \"./lib/index.js\");\n\n\n//# sourceURL=webpack:///./index.js?");

		/***/ }),

		/***/ "./lib/alphabet.js":
		/*!*************************!*\
			!*** ./lib/alphabet.js ***!
			\*************************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\n\nvar randomFromSeed = __webpack_require__(/*! ./random/random-from-seed */ \"./lib/random/random-from-seed.js\");\n\nvar ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';\nvar alphabet;\nvar previousSeed;\n\nvar shuffled;\n\nfunction reset() {\n    shuffled = false;\n}\n\nfunction setCharacters(_alphabet_) {\n    if (!_alphabet_) {\n        if (alphabet !== ORIGINAL) {\n            alphabet = ORIGINAL;\n            reset();\n        }\n        return;\n    }\n\n    if (_alphabet_ === alphabet) {\n        return;\n    }\n\n    if (_alphabet_.length !== ORIGINAL.length) {\n        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);\n    }\n\n    var unique = _alphabet_.split('').filter(function(item, ind, arr){\n       return ind !== arr.lastIndexOf(item);\n    });\n\n    if (unique.length) {\n        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));\n    }\n\n    alphabet = _alphabet_;\n    reset();\n}\n\nfunction characters(_alphabet_) {\n    setCharacters(_alphabet_);\n    return alphabet;\n}\n\nfunction setSeed(seed) {\n    randomFromSeed.seed(seed);\n    if (previousSeed !== seed) {\n        reset();\n        previousSeed = seed;\n    }\n}\n\nfunction shuffle() {\n    if (!alphabet) {\n        setCharacters(ORIGINAL);\n    }\n\n    var sourceArray = alphabet.split('');\n    var targetArray = [];\n    var r = randomFromSeed.nextValue();\n    var characterIndex;\n\n    while (sourceArray.length > 0) {\n        r = randomFromSeed.nextValue();\n        characterIndex = Math.floor(r * sourceArray.length);\n        targetArray.push(sourceArray.splice(characterIndex, 1)[0]);\n    }\n    return targetArray.join('');\n}\n\nfunction getShuffled() {\n    if (shuffled) {\n        return shuffled;\n    }\n    shuffled = shuffle();\n    return shuffled;\n}\n\n/**\n * lookup shuffled letter\n * @param index\n * @returns {string}\n */\nfunction lookup(index) {\n    var alphabetShuffled = getShuffled();\n    return alphabetShuffled[index];\n}\n\nfunction get () {\n  return alphabet || ORIGINAL;\n}\n\nmodule.exports = {\n    get: get,\n    characters: characters,\n    seed: setSeed,\n    lookup: lookup,\n    shuffled: getShuffled\n};\n\n\n//# sourceURL=webpack:///./lib/alphabet.js?");

		/***/ }),

		/***/ "./lib/build.js":
		/*!**********************!*\
			!*** ./lib/build.js ***!
			\**********************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\n\nvar generate = __webpack_require__(/*! ./generate */ \"./lib/generate.js\");\nvar alphabet = __webpack_require__(/*! ./alphabet */ \"./lib/alphabet.js\");\n\n// Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.\n// This number should be updated every year or so to keep the generated id short.\n// To regenerate `new Date() - 0` and bump the version. Always bump the version!\nvar REDUCE_TIME = 1459707606518;\n\n// don't change unless we change the algos or REDUCE_TIME\n// must be an integer and less than 16\nvar version = 6;\n\n// Counter is used when shortid is called multiple times in one second.\nvar counter;\n\n// Remember the last time shortid was called in case counter is needed.\nvar previousSeconds;\n\n/**\n * Generate unique id\n * Returns string id\n */\nfunction build(clusterWorkerId) {\n    var str = '';\n\n    var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);\n\n    if (seconds === previousSeconds) {\n        counter++;\n    } else {\n        counter = 0;\n        previousSeconds = seconds;\n    }\n\n    str = str + generate(version);\n    str = str + generate(clusterWorkerId);\n    if (counter > 0) {\n        str = str + generate(counter);\n    }\n    str = str + generate(seconds);\n    return str;\n}\n\nmodule.exports = build;\n\n\n//# sourceURL=webpack:///./lib/build.js?");

		/***/ }),

		/***/ "./lib/generate.js":
		/*!*************************!*\
			!*** ./lib/generate.js ***!
			\*************************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\n\nvar alphabet = __webpack_require__(/*! ./alphabet */ \"./lib/alphabet.js\");\nvar random = __webpack_require__(/*! ./random/random-byte */ \"./lib/random/random-byte-browser.js\");\nvar format = __webpack_require__(/*! nanoid/format */ \"../nanoid/format.js\");\n\nfunction generate(number) {\n    var loopCounter = 0;\n    var done;\n\n    var str = '';\n\n    while (!done) {\n        str = str + format(random, alphabet.get(), 1);\n        done = number < (Math.pow(16, loopCounter + 1 ) );\n        loopCounter++;\n    }\n    return str;\n}\n\nmodule.exports = generate;\n\n\n//# sourceURL=webpack:///./lib/generate.js?");

		/***/ }),

		/***/ "./lib/index.js":
		/*!**********************!*\
			!*** ./lib/index.js ***!
			\**********************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\n\nvar alphabet = __webpack_require__(/*! ./alphabet */ \"./lib/alphabet.js\");\nvar build = __webpack_require__(/*! ./build */ \"./lib/build.js\");\nvar isValid = __webpack_require__(/*! ./is-valid */ \"./lib/is-valid.js\");\n\n// if you are using cluster or multiple servers use this to make each instance\n// has a unique value for worker\n// Note: I don't know if this is automatically set when using third\n// party cluster solutions such as pm2.\nvar clusterWorkerId = __webpack_require__(/*! ./util/cluster-worker-id */ \"./lib/util/cluster-worker-id-browser.js\") || 0;\n\n/**\n * Set the seed.\n * Highly recommended if you don't want people to try to figure out your id schema.\n * exposed as shortid.seed(int)\n * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.\n */\nfunction seed(seedValue) {\n    alphabet.seed(seedValue);\n    return module.exports;\n}\n\n/**\n * Set the cluster worker or machine id\n * exposed as shortid.worker(int)\n * @param workerId worker must be positive integer.  Number less than 16 is recommended.\n * returns shortid module so it can be chained.\n */\nfunction worker(workerId) {\n    clusterWorkerId = workerId;\n    return module.exports;\n}\n\n/**\n *\n * sets new characters to use in the alphabet\n * returns the shuffled alphabet\n */\nfunction characters(newCharacters) {\n    if (newCharacters !== undefined) {\n        alphabet.characters(newCharacters);\n    }\n\n    return alphabet.shuffled();\n}\n\n/**\n * Generate unique id\n * Returns string id\n */\nfunction generate() {\n  return build(clusterWorkerId);\n}\n\n// Export all other functions as properties of the generate function\nmodule.exports = generate;\nmodule.exports.generate = generate;\nmodule.exports.seed = seed;\nmodule.exports.worker = worker;\nmodule.exports.characters = characters;\nmodule.exports.isValid = isValid;\n\n\n//# sourceURL=webpack:///./lib/index.js?");

		/***/ }),

		/***/ "./lib/is-valid.js":
		/*!*************************!*\
			!*** ./lib/is-valid.js ***!
			\*************************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\nvar alphabet = __webpack_require__(/*! ./alphabet */ \"./lib/alphabet.js\");\n\nfunction isShortId(id) {\n    if (!id || typeof id !== 'string' || id.length < 6 ) {\n        return false;\n    }\n\n    var nonAlphabetic = new RegExp('[^' +\n      alphabet.get().replace(/[|\\\\{}()[\\]^$+*?.-]/g, '\\\\$&') +\n    ']');\n    return !nonAlphabetic.test(id);\n}\n\nmodule.exports = isShortId;\n\n\n//# sourceURL=webpack:///./lib/is-valid.js?");

		/***/ }),

		/***/ "./lib/random/random-byte-browser.js":
		/*!*******************************************!*\
			!*** ./lib/random/random-byte-browser.js ***!
			\*******************************************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\n\nvar crypto = typeof window === 'object' && (window.crypto || window.msCrypto); // IE 11 uses window.msCrypto\n\nvar randomByte;\n\nif (!crypto || !crypto.getRandomValues) {\n    randomByte = function(size) {\n        var bytes = [];\n        for (var i = 0; i < size; i++) {\n            bytes.push(Math.floor(Math.random() * 256));\n        }\n        return bytes;\n    };\n} else {\n    randomByte = function(size) {\n        return crypto.getRandomValues(new Uint8Array(size));\n    };\n}\n\nmodule.exports = randomByte;\n\n\n//# sourceURL=webpack:///./lib/random/random-byte-browser.js?");

		/***/ }),

		/***/ "./lib/random/random-from-seed.js":
		/*!****************************************!*\
			!*** ./lib/random/random-from-seed.js ***!
			\****************************************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\n\n// Found this seed-based random generator somewhere\n// Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)\n\nvar seed = 1;\n\n/**\n * return a random number based on a seed\n * @param seed\n * @returns {number}\n */\nfunction getNextValue() {\n    seed = (seed * 9301 + 49297) % 233280;\n    return seed/(233280.0);\n}\n\nfunction setSeed(_seed_) {\n    seed = _seed_;\n}\n\nmodule.exports = {\n    nextValue: getNextValue,\n    seed: setSeed\n};\n\n\n//# sourceURL=webpack:///./lib/random/random-from-seed.js?");

		/***/ }),

		/***/ "./lib/util/cluster-worker-id-browser.js":
		/*!***********************************************!*\
			!*** ./lib/util/cluster-worker-id-browser.js ***!
			\***********************************************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\n\nmodule.exports = 0;\n\n\n//# sourceURL=webpack:///./lib/util/cluster-worker-id-browser.js?");

		/***/ })

		/******/ });
}

function getHump () {
	var module = {
		exports: {}
	};
	;(function(global) {

		var _processKeys = function(convert, obj, options) {
			if(!_isObject(obj) || _isDate(obj) || _isRegExp(obj) || _isBoolean(obj) || _isFunction(obj)) {
				return obj;
			}

			var output,
					i = 0,
					l = 0;

			if(_isArray(obj)) {
				output = [];
				for(l=obj.length; i<l; i++) {
					output.push(_processKeys(convert, obj[i], options));
				}
			}
			else {
				output = {};
				for(var key in obj) {
					if(Object.prototype.hasOwnProperty.call(obj, key)) {
						output[convert(key, options)] = _processKeys(convert, obj[key], options);
					}
				}
			}
			return output;
		};

		// String conversion methods

		var separateWords = function(string, options) {
			options = options || {};
			var separator = options.separator || '_';
			var split = options.split || /(?=[A-Z])/;

			return string.split(split).join(separator);
		};

		var camelize = function(string) {
			if (_isNumerical(string)) {
				return string;
			}
			string = string.replace(/[\-_\s]+(.)?/g, function(match, chr) {
				return chr ? chr.toUpperCase() : '';
			});
			// Ensure 1st char is always lowercase
			return string.substr(0, 1).toLowerCase() + string.substr(1);
		};

		var pascalize = function(string) {
			var camelized = camelize(string);
			// Ensure 1st char is always uppercase
			return camelized.substr(0, 1).toUpperCase() + camelized.substr(1);
		};

		var decamelize = function(string, options) {
			return separateWords(string, options).toLowerCase();
		};

		// Utilities
		// Taken from Underscore.js

		var toString = Object.prototype.toString;

		var _isFunction = function(obj) {
			return typeof(obj) === 'function';
		};
		var _isObject = function(obj) {
			return obj === Object(obj);
		};
		var _isArray = function(obj) {
			return toString.call(obj) == '[object Array]';
		};
		var _isDate = function(obj) {
			return toString.call(obj) == '[object Date]';
		};
		var _isRegExp = function(obj) {
			return toString.call(obj) == '[object RegExp]';
		};
		var _isBoolean = function(obj) {
			return toString.call(obj) == '[object Boolean]';
		};

		// Performant way to determine if obj coerces to a number
		var _isNumerical = function(obj) {
			obj = obj - 0;
			return obj === obj;
		};

		// Sets up function which handles processing keys
		// allowing the convert function to be modified by a callback
		var _processor = function(convert, options) {
			var callback = options && 'process' in options ? options.process : options;

			if(typeof(callback) !== 'function') {
				return convert;
			}

			return function(string, options) {
				return callback(string, convert, options);
			}
		};

		var humps = {
			camelize: camelize,
			decamelize: decamelize,
			pascalize: pascalize,
			depascalize: decamelize,
			camelizeKeys: function(object, options) {
				return _processKeys(_processor(camelize, options), object);
			},
			decamelizeKeys: function(object, options) {
				return _processKeys(_processor(decamelize, options), object, options);
			},
			pascalizeKeys: function(object, options) {
				return _processKeys(_processor(pascalize, options), object);
			},
			depascalizeKeys: function () {
				return this.decamelizeKeys.apply(this, arguments);
			}
		};

		if (typeof define === 'function' && define.amd) {
			define(humps);
		} else if (typeof module !== 'undefined' && module.exports) {
			module.exports = humps;
		} else {
			global.humps = humps;
		}

	})(self);
	return module.exports;
}

function getUpperCamelCase () {
	return /******/ (function(modules) { // webpackBootstrap
		/******/ 	// The module cache
		/******/ 	var installedModules = {};
		/******/
		/******/ 	// The require function
		/******/ 	function __webpack_require__(moduleId) {
		/******/
		/******/ 		// Check if module is in cache
		/******/ 		if(installedModules[moduleId]) {
		/******/ 			return installedModules[moduleId].exports;
		/******/ 		}
		/******/ 		// Create a new module (and put it into the cache)
		/******/ 		var module = installedModules[moduleId] = {
		/******/ 			i: moduleId,
		/******/ 			l: false,
		/******/ 			exports: {}
		/******/ 		};
		/******/
		/******/ 		// Execute the module function
		/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
		/******/
		/******/ 		// Flag the module as loaded
		/******/ 		module.l = true;
		/******/
		/******/ 		// Return the exports of the module
		/******/ 		return module.exports;
		/******/ 	}
		/******/
		/******/
		/******/ 	// expose the modules object (__webpack_modules__)
		/******/ 	__webpack_require__.m = modules;
		/******/
		/******/ 	// expose the module cache
		/******/ 	__webpack_require__.c = installedModules;
		/******/
		/******/ 	// define getter function for harmony exports
		/******/ 	__webpack_require__.d = function(exports, name, getter) {
		/******/ 		if(!__webpack_require__.o(exports, name)) {
		/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
		/******/ 		}
		/******/ 	};
		/******/
		/******/ 	// define __esModule on exports
		/******/ 	__webpack_require__.r = function(exports) {
		/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
		/******/ 		}
		/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
		/******/ 	};
		/******/
		/******/ 	// create a fake namespace object
		/******/ 	// mode & 1: value is a module id, require it
		/******/ 	// mode & 2: merge all properties of value into the ns
		/******/ 	// mode & 4: return value when already ns object
		/******/ 	// mode & 8|1: behave like require
		/******/ 	__webpack_require__.t = function(value, mode) {
		/******/ 		if(mode & 1) value = __webpack_require__(value);
		/******/ 		if(mode & 8) return value;
		/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
		/******/ 		var ns = Object.create(null);
		/******/ 		__webpack_require__.r(ns);
		/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
		/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
		/******/ 		return ns;
		/******/ 	};
		/******/
		/******/ 	// getDefaultExport function for compatibility with non-harmony modules
		/******/ 	__webpack_require__.n = function(module) {
		/******/ 		var getter = module && module.__esModule ?
		/******/ 			function getDefault() { return module['default']; } :
		/******/ 			function getModuleExports() { return module; };
		/******/ 		__webpack_require__.d(getter, 'a', getter);
		/******/ 		return getter;
		/******/ 	};
		/******/
		/******/ 	// Object.prototype.hasOwnProperty.call
		/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
		/******/
		/******/ 	// __webpack_public_path__
		/******/ 	__webpack_require__.p = "/";
		/******/
		/******/
		/******/ 	// Load entry module and return exports
		/******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
		/******/ })
		/************************************************************************/
		/******/ ({

		/***/ "../camelcase/index.js":
		/*!*****************************!*\
			!*** ../camelcase/index.js ***!
			\*****************************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\n\nfunction preserveCamelCase(str) {\n\tlet isLastCharLower = false;\n\tlet isLastCharUpper = false;\n\tlet isLastLastCharUpper = false;\n\n\tfor (let i = 0; i < str.length; i++) {\n\t\tconst c = str[i];\n\n\t\tif (isLastCharLower && /[a-zA-Z]/.test(c) && c.toUpperCase() === c) {\n\t\t\tstr = str.substr(0, i) + '-' + str.substr(i);\n\t\t\tisLastCharLower = false;\n\t\t\tisLastLastCharUpper = isLastCharUpper;\n\t\t\tisLastCharUpper = true;\n\t\t\ti++;\n\t\t} else if (isLastCharUpper && isLastLastCharUpper && /[a-zA-Z]/.test(c) && c.toLowerCase() === c) {\n\t\t\tstr = str.substr(0, i - 1) + '-' + str.substr(i - 1);\n\t\t\tisLastLastCharUpper = isLastCharUpper;\n\t\t\tisLastCharUpper = false;\n\t\t\tisLastCharLower = true;\n\t\t} else {\n\t\t\tisLastCharLower = c.toLowerCase() === c;\n\t\t\tisLastLastCharUpper = isLastCharUpper;\n\t\t\tisLastCharUpper = c.toUpperCase() === c;\n\t\t}\n\t}\n\n\treturn str;\n}\n\nmodule.exports = function (str) {\n\tif (arguments.length > 1) {\n\t\tstr = Array.from(arguments)\n\t\t\t.map(x => x.trim())\n\t\t\t.filter(x => x.length)\n\t\t\t.join('-');\n\t} else {\n\t\tstr = str.trim();\n\t}\n\n\tif (str.length === 0) {\n\t\treturn '';\n\t}\n\n\tif (str.length === 1) {\n\t\treturn str.toLowerCase();\n\t}\n\n\tif (/^[a-z0-9]+$/.test(str)) {\n\t\treturn str;\n\t}\n\n\tconst hasUpperCase = str !== str.toLowerCase();\n\n\tif (hasUpperCase) {\n\t\tstr = preserveCamelCase(str);\n\t}\n\n\treturn str\n\t\t.replace(/^[_.\\- ]+/, '')\n\t\t.toLowerCase()\n\t\t.replace(/[_.\\- ]+(\\w|$)/g, (m, p1) => p1.toUpperCase());\n};\n\n\n//# sourceURL=webpack:///../camelcase/index.js?");

		/***/ }),

		/***/ "./index.js":
		/*!******************!*\
			!*** ./index.js ***!
			\******************/
		/*! no static exports found */
		/***/ (function(module, exports, __webpack_require__) {

		"use strict";
		eval("\nconst camelCase = __webpack_require__(/*! camelcase */ \"../camelcase/index.js\");\n\nmodule.exports = function () {\n\tconst cased = camelCase.apply(camelCase, arguments);\n\treturn cased.charAt(0).toUpperCase() + cased.slice(1);\n};\n\n\n//# sourceURL=webpack:///./index.js?");

		/***/ })

		/******/ });
}

function hashGenerator () {
	return [
    (Math.random() * 10000000).toString(16).substr(0, 3),
    (new Date()).getTime().toString(16).substr(0, 3),
    Math.random().toString(16).substr(2, 3),
	].join('');
}