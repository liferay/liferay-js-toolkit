let cfg;

beforeAll(() => {
	process.chdir('./packages/liferay-npm-bundler/src/__tests__');
	cfg = require('../config');
});

afterAll(() => {
	process.chdir('../../../..');
});

describe('getOutputDir()', () => {
	it('works', () => {
		expect(cfg.getOutputDir()).toEqual('output-dir');
	});
});

describe('getExclusions()', () => {
	it('works for unversioned packages', () => {
		const pkg = {
			id: 'package-a@2.0.0',
			name: 'package-a',
			version: '2.0.0',
			dir: '',
		};

		expect(cfg.getExclusions(pkg)).toEqual(['*']);
	});

	it('works for versioned packages', () => {
		const pkg = {
			id: 'package-b@1.0.0',
			name: 'package-b',
			version: '1.0.0',
			dir: '',
		};

		expect(cfg.getExclusions(pkg)).toEqual(['**/*.js', '**/*.css']);
	});

	it('returns the default exclusions for unconfigured packages', () => {
		const pkg = {
			id: 'not-existent-package@1.0.0',
			name: 'not-existent-package',
			version: '1.0.0',
			dir: '',
		};

		expect(cfg.getExclusions(pkg)).toEqual(['test/**/*']);
	});

	// Impossible to test once we test for default exclusions
	it.skip('returns an empty array for unconfigured packages', () => {
		const pkg = {
			id: 'not-existent-package@1.0.0',
			name: 'not-existent-package',
			version: '1.0.0',
			dir: '',
		};

		expect(cfg.getExclusions(pkg)).toEqual([]);
	});
});

describe('getPlugins()', () => {
	it('loads default "pre" plugins correctly', () => {
		const plugins = cfg.getPlugins('pre', {
			id: 'package-star@1.0.0',
			name: 'package-star',
			version: '1.0.0',
			dir: '',
		});

		expect(plugins[0].run({}, {})).toEqual(0);
		expect(plugins[0].config).toEqual({});

		expect(plugins[1].run({}, {})).toEqual(1);
		expect(plugins[1].config).toEqual('config-1');
	});

	it('loads default "post" plugins correctly', () => {
		const plugins = cfg.getPlugins('post', {
			id: 'package-star@1.0.0',
			name: 'package-star',
			version: '1.0.0',
			dir: '',
		});

		expect(plugins[0].run({}, {})).toEqual(2);
		expect(plugins[0].config).toEqual({});

		expect(plugins[1].run({}, {})).toEqual(3);
		expect(plugins[1].config).toEqual('config-3');
	});

	it('loads per-package "pre" plugins correctly', () => {
		const plugins = cfg.getPlugins('pre', {
			id: 'package@1.0.0',
			name: 'package',
			version: '1.0.0',
			dir: '',
		});

		expect(plugins[0].run({}, {})).toEqual(4);
		expect(plugins[0].config).toEqual({});

		expect(plugins[1].run({}, {})).toEqual(5);
		expect(plugins[1].config).toEqual('config-5');
	});

	it('loads per-package "post" plugins correctly', () => {
		const plugins = cfg.getPlugins('post', {
			id: 'package@1.0.0',
			name: 'package',
			version: '1.0.0',
			dir: '',
		});

		expect(plugins[0].run({}, {})).toEqual(6);
		expect(plugins[0].config).toEqual({});

		expect(plugins[1].run({}, {})).toEqual(7);
		expect(plugins[1].config).toEqual('config-7');
	});
});

describe('getBabelConfig()', () => {
	it('loads default config correctly', () => {
		const config = cfg.getBabelConfig({
			id: 'package-star@1.0.0',
			name: 'package-star',
			version: '1.0.0',
			dir: '',
		});

		expect(config).toEqual({ config: 'config-*' });
	});

	it('loads per-package config correctly', () => {
		const config = cfg.getBabelConfig({
			id: 'package@1.0.0',
			name: 'package',
			version: '1.0.0',
			dir: '',
		});

		expect(config).toEqual({ config: 'config-package@1.0.0' });
	});
});
