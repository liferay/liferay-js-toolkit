import * as test from 'liferay-npm-build-tools-common/lib/test';
import plugin from '../index';

it('correctly namespaces unqualified define calls', () => {
	test.matchSnapshot(
		plugin,
		`
		define([], function(){})
		`,
	);
});

it('does not namespace already qualified define calls', () => {
	test.matchSnapshot(
		plugin,
		`
		Other.Namespace.define([], function(){})
		`,
	);
});
