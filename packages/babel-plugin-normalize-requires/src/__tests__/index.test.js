import * as test from 'liferay-npm-build-tools-common/lib/test';
import plugin from '../index';

describe('when requiring local modules', () => {
	it('removes trailing ".js" from module names', () => {
		test.matchSnapshot(
			plugin,
			`
			require('./a-module.js')
			`,
		);
	});

	it('removes trailing "/" from module names', () => {
		test.matchSnapshot(
			plugin,
			`
			require('./a-module/')
			`,
		);
	});
});

describe('when requiring external modules', () => {
	it('removes trailing ".js" from module names', () => {
		test.matchSnapshot(
			plugin,
			`
			require('a-package/a-module.js')
			`,
		);
	});

	it('removes trailing "/" from module names', () => {
		test.matchSnapshot(
			plugin,
			`
			require('a-package/a-module/')
			`,
		);
	});
});
