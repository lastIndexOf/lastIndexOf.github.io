
new Vue({
	data: function () {
		return {
			loading: true,
			actived: {},
			data: [],
			targets: [],
		};
	},
	methods: {
		addMaterials() {
			if (!this.actived.moduleId) {
				return this.$message.error('请选择需要添加物料的\`Page\`');
			}
			window.postMessage({
				$type: 'message',
				$data: this.targets,
			});
			this.targets = [];
			this.data.forEach(it => {
				it.checked = false;
			});
		},
		checked(el) {
			el.checked = !el.checked;
			if (el.checked) {
				this.targets.push(el);
			} else {
				var index = this.targets.find(function (it) {
					return it.sourceId === el.sourceId;
				});
				this.targets.splice(index, 1);
			}
		},
		initProtocol() {
			var that = this;
			window.onmessage = function (e) {
				var data = e.data;
				if (data.type) {
					switch (data.type) {
						case 'message':
							if (data.data[0].type === 'actived') {
								that.actived = data.data && data.data[0].data;
							}
							break;
						default: return;
					}
				}
			};
		}
	},
	created() {
		this.initProtocol();
		var that = this;
		var start = Date.now();
		// fetch('https://fes.bytedance.net/packager/source1?@fes/materials')
		//     .then(function (res) {
		//         return res.json()
		//     })
		//     .then(function (data) {
		//         return fetch(data.url)
		//     })
		fetch('https://cloudapi.bytedance.net/faas/invoke/tt5487tivmcdreob10/materialsCollections')
			.then(function (res) {
				return res.json();
			})
			.then(function (data) {
				return fetch(`https://cloudapi.bytedance.net/faas/invoke/tt5487tivmcdreob10/proxyUnpkg`, {
					method: 'POST',
					body: JSON.stringify({
						url: data.data['@fes/materials']
					}),
					headers: new Headers({
						'Content-Type': 'application/json'
					})
				});
			})
			.then(function (res) {
				return res.json();
			})
			.then(function (data) {
				try {
					that.data = data.map(function (it) {
						it.hover = false;
						it.checked = false;
						return it;
					});
				} catch (err) {
					that.data = [];
				}
				var end = Date.now();
				if (end - start < 1500) {
					setTimeout(function () {
						that.loading = false;
					}, 1500 - end + start);
				} else {
					that.loading = false;
				}
			})
	}
}).$mount('#app');