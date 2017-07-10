import * as test from 'liferay-npm-build-tools-common/lib/test';
import plugin from '../index';

// We need to give the correct file path so that the plugin finds the test
// package.json file.
const opts = {
	filenameRelative: __filename,
};

// We store the patched package.json information in this global var
let patchedPackageJson;

/**
 * Run a matchSnapshot Babel test and check modification of package.json file 
 * too
 * @param {String} source the ES source code to transform
 */
function matchSnapshotAndPackageJson(source) {
	patchedPackageJson = {};

	// We pass a customized patchPackageJson to the plugin to be able to test
	// patching of package.json files
	const configuredPlugin = [
		[
			plugin,
			{
				patchPackageJson: (pkgJsonPath, moduleShims) => {
					patchedPackageJson = moduleShims;
				},
			},
		],
	];

	test.matchSnapshot(configuredPlugin, source, opts);

	expect(patchedPackageJson).toMatchSnapshot();
}

describe('when using Node.js globals', () => {
	it('shims Buffer global', () => {
		matchSnapshotAndPackageJson(`
			const b = Buffer.alloc(10);
		`);
	});

	it('shims __dirname global', () => {
		matchSnapshotAndPackageJson(`
			console.log(__dirname);
		`);
	});

	it('shims __filename global', () => {
		matchSnapshotAndPackageJson(`
			console.log(__filename);
		`);
	});

	it('shims clearImmediate global', () => {
		matchSnapshotAndPackageJson(`
			clearImmediate({});
		`);
	});

	it('shims global global', () => {
		matchSnapshotAndPackageJson(`
			console.log(global);
		`);
	});

	it('shims process global', () => {
		matchSnapshotAndPackageJson(`
			console.log(process.env);
		`);
	});

	it('shims setImmediate global', () => {
		matchSnapshotAndPackageJson(`
			const a = setImmediate(() => {});
		`);
	});
});

describe('when using Node.js modules', () => {
	[
		'assert',
		'buffer',
		'child_process',
		'cluster',
		'console',
		'constants',
		'crypto',
		'dgram',
		'dns',
		'domain',
		'events',
		'fs',
		'http',
		'https',
		'module',
		'net',
		'os',
		'path',
		'process',
		'punycode',
		'querystring',
		'readline',
		'repl',
		'stream',
		'string_decoder',
		'timers',
		'tls',
		'tty',
		'url',
		'util',
		'v8',
		'vm',
		'zlib',
	].forEach(module => {
		it(`shims ${module} builtin module`, () => {
			matchSnapshotAndPackageJson(`
				require('${module}');
			`);
		});
	});
});
