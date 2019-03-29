const fs = require('fs');

const files = {};

function readdir (path, parent) {
	const dirs = fs.readdirSync(path);

	dirs.forEach(dir => {
		if (fs.statSync(dir).isDirectory()) {
			readdir(dir);
		}
	})
}
