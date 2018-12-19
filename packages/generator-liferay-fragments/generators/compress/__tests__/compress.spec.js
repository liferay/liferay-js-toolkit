const compress = require('../compress');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const checkZip = require('./check-zip');

describe('compress-generator/compress', () => {
	let tmpDir;
	let tmpDirName;

	beforeEach(() => {
		tmpDir = tmp.dirSync({unsafeCleanup: true});
		tmpDirName = tmpDir.name;

		fs.copyFileSync(
			path.join(__dirname, 'assets', 'package.json'),
			path.join(tmpDirName, 'package.json')
		);
	});

	afterEach(() => {
		tmpDir.removeCallback();
	});

	it('generates a zip file', async () => {
		await compress(tmpDirName);
		await checkZip(tmpDirName);
	});

	it('appends existing collections', async () => {
		fs.mkdirSync(path.join(tmpDirName, 'src'));
		fs.mkdirSync(path.join(tmpDirName, 'src', 'sample-collection'));

		fs.copyFileSync(
			path.join(__dirname, 'assets', 'collection.json'),
			path.join(tmpDirName, 'src', 'sample-collection', 'collection.json')
		);

		await compress(tmpDirName);
		await checkZip(tmpDirName);
	});

	it('appends existing fragments', async () => {
		fs.mkdirSync(path.join(tmpDirName, 'src'));
		fs.mkdirSync(path.join(tmpDirName, 'src', 'sample-collection'));
		fs.mkdirSync(
			path.join(tmpDirName, 'src', 'sample-collection', 'sample-fragment')
		);

		fs.copyFileSync(
			path.join(__dirname, 'assets', 'collection.json'),
			path.join(tmpDirName, 'src', 'sample-collection', 'collection.json')
		);

		fs.copyFileSync(
			path.join(__dirname, 'assets', 'fragment.json'),
			path.join(
				tmpDirName,
				'src',
				'sample-collection',
				'sample-fragment',
				'fragment.json'
			)
		);

		fs.copyFileSync(
			path.join(__dirname, 'assets', 'index.html'),
			path.join(
				tmpDirName,
				'src',
				'sample-collection',
				'sample-fragment',
				'index.html'
			)
		);

		fs.copyFileSync(
			path.join(__dirname, 'assets', 'main.js'),
			path.join(
				tmpDirName,
				'src',
				'sample-collection',
				'sample-fragment',
				'main.js'
			)
		);

		fs.copyFileSync(
			path.join(__dirname, 'assets', 'styles.css'),
			path.join(
				tmpDirName,
				'src',
				'sample-collection',
				'sample-fragment',
				'styles.css'
			)
		);

		await compress(tmpDirName);
		await checkZip(tmpDirName);
	});
});
