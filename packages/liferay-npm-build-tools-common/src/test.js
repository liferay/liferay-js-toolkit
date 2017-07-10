import * as babel from 'babel-core';

/**
 * Run a test to transform source code with Babel and match it to a snapshot.
 * @param {Object} plugin the Babel plugin to test
 * @param {String} source the source code to transform
 * @param {Object} options a Babel options hash
 * @return {void}
 */
export function matchSnapshot(plugin, source, options = {}) {
	if (!options.filenameRelative) {
		options.filenameRelative = __filename;
	}
	options.plugins = [plugin];

	const { code } = babel.transform(source, options);

	expect(code).toMatchSnapshot();
}
