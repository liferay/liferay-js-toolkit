const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

module.exports = async function(tmpDirName) {
	const data = fs.readFileSync(
		path.join(tmpDirName, 'build', 'liferay-fragments.zip')
	);

	const zip = await JSZip.loadAsync(data);
	const promises = [];

	zip.forEach((relativePath, file) => {
		const readable = file.nodeStream();
		let fileContent = '';

		promises.push(
			new Promise(resolve => {
				readable.on('data', chunk => {
					fileContent += chunk;
				});

				readable.on('end', () => {
					expect({
						relativePath,
						fileContent,
						dir: file.dir,
					}).toMatchSnapshot();

					resolve();
				});
			})
		);
	});

	await Promise.all(promises);
};
