import * as tests from 'liferay-npm-build-tools-common/lib/tests';
import plugin from '../index';

it('correctly names anonymous modules', () => {
	tests.matchSnapshot(
		plugin,
		`
		define([], function(){})
		`,
		{
			filenameRelative: __filename,
		},
	);
});

it('correctly renames named modules', () => {
	tests.matchSnapshot(
		plugin,
		`
		define('my-invalid-name', [], function(){})
		`,
		{
			filenameRelative: __filename,
		},
	);
});
