const chalk = require('chalk');
const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');
const getProjectContent = require('../../utils/get-project-content');
const {log, logNewLine, logIndent, logSecondary} = require('../../utils/log');

/**
 * Adds a given collection object to the given zip file.
 * The zip file will be modified
 * @param {Object} collection Collection to be added
 * @param {JSZip} zip Zip file to be modified
 */
function _addCollectionToZip(collection, zip) {
	zip.file(
		`${collection.slug}/collection.json`,
		JSON.stringify(collection.metadata)
	);

	logNewLine(`Collection ${chalk.reset(collection.metadata.name)}`);

	collection.fragments.forEach(fragment => {
		_addFragmentToZip(collection, fragment, zip);
	});
}

/**
 * Adds a given fragment object to the given zip file.
 * The zip file will be modified
 * @param {Object} collection Collection to be added
 * @param {Object} fragment Fragment to be added
 * @param {JSZip} zip Zip file to be modified
 */
function _addFragmentToZip(collection, fragment, zip) {
	zip.file(
		`${collection.slug}/${fragment.slug}/fragment.json`,
		JSON.stringify(fragment.metadata)
	);

	zip.file(
		`${collection.slug}/${fragment.slug}/${fragment.metadata.htmlPath}`,
		fragment.html
	);

	zip.file(
		`${collection.slug}/${fragment.slug}/${fragment.metadata.cssPath}`,
		fragment.css
	);

	zip.file(
		`${collection.slug}/${fragment.slug}/${fragment.metadata.jsPath}`,
		fragment.js
	);

	logIndent(`fragment ${chalk.reset(fragment.metadata.name)}`);
}

/**
 * Compress a whole project from a basePath with all it's
 * fragments and collections.
 * @param {string} basePath Base path to use as project
 * @return {Promise<JSZip>} Promise with the generated zip
 */
const compress = basePath =>
	new Promise(resolve => {
		const zip = new JSZip();
		const project = getProjectContent(basePath);

		logNewLine('Generating zip file');

		project.collections.forEach(collection => {
			_addCollectionToZip(collection, zip);
		});

		try {
			fs.mkdirSync(path.join(basePath, 'build'));
		} catch (error) {}

		zip
			.generateNodeStream({
				type: 'nodebuffer',
				streamFiles: true,
			})
			.pipe(
				fs.createWriteStream(
					path.join(basePath, 'build', 'liferay-fragments.zip')
				)
			)
			.on('finish', () => {
				logNewLine('build/liferay-fragments.zip file created ');
				log('Import them to your liferay-portal to start using them:');
				logSecondary(
					'https://dev.liferay.com/discover/portal/-/knowledge_base/7-1/exporting-and-importing-fragments#importing-collections'
				);
				resolve(zip);
			});
	});

module.exports = compress;
