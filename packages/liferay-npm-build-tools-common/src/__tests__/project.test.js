/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import path from 'path';

import {Project} from '../project';

let project;

describe('empty project', () => {
	beforeEach(() => {
		project = new Project(
			path.join(__dirname, '__fixtures__', 'project', 'empty')
		);
	});

	describe('project', () => {
		it('loads liferay-npm-bundler-preset-standard preset', () => {
			expect(project._npmbundlerrc['*']['.babelrc']['presets']).toEqual([
				'liferay-standard',
			]);
		});

		it('returns dir', () => {
			expect(project.dir).toBe(
				path.join(__dirname, '__fixtures__', 'project', 'empty')
			);
		});

		it('returns outputDir', () => {
			expect(project.outputDir).toBe(
				'build/resources/main/META-INF/resources'
			);
		});
	});

	describe('project.jar', () => {
		it('returns customManifestHeaders', () => {
			expect(project.jar.customManifestHeaders).toEqual({});
		});

		it('returns outputDir', () => {
			expect(project.jar.outputDir).toBeUndefined();
		});

		it('returns supported', () => {
			expect(project.jar.supported).toBe(false);
		});
	});

	describe('project.l10n', () => {
		it('returns availableLocales', () => {
			expect(project.l10n.availableLocales).toEqual([]);
		});

		it('returns labels for default locale', () => {
			expect(project.l10n.getLabels()).toEqual({});
		});

		it('returns labels for missing locale', () => {
			expect(project.l10n.getLabels('fr_FR')).toEqual({});
		});

		it('returns languageFileBaseName', () => {
			expect(project.l10n.languageFileBaseName).toBeUndefined();
		});

		it('returns localizationFileMap', () => {
			expect(project.l10n.localizationFileMap).toEqual({});
		});

		it('returns supported', () => {
			expect(project.l10n.supported).toBe(false);
		});
	});
});

describe('standard project', () => {
	beforeEach(() => {
		project = new Project(
			path.join(__dirname, '__fixtures__', 'project', 'standard')
		);
	});

	describe('project', () => {
		it('returns dir', () => {
			expect(project.dir).toBe(
				path.join(__dirname, '__fixtures__', 'project', 'standard')
			);
		});

		it('returns outputDir', () => {
			expect(project.outputDir).toBe('build');
		});
	});

	describe('project.jar', () => {
		it('returns customManifestHeaders', () => {
			expect(project.jar.customManifestHeaders).toEqual({
				// Coming from .npmbundlerrc
				Responsible: 'john.doe@somewhere.net',
				// Coming from manifest.json
				'Project-Web': 'https://somewhere.net/test-project',
				'Project-UUID': 'ED7BA470-8E54-465E-825C-99712043E01C',
				// Coming from both, but .npmbundlerrc wins
				'Project-Name': 'Test Project',
			});
		});

		it('returns outputDir', () => {
			expect(project.jar.outputDir).toBe('dist');
		});

		it('returns supported', () => {
			expect(project.jar.supported).toBe(true);
		});
	});

	describe('project.l10n', () => {
		it('returns availableLocales', () => {
			expect(project.l10n.availableLocales).toEqual(['es_ES']);
		});

		it('returns labels for default locale', () => {
			expect(project.l10n.getLabels()).toEqual({
				'test-project': 'Test Project',
			});
		});

		it('returns labels for existing locale', () => {
			expect(project.l10n.getLabels('es_ES')).toEqual({
				'test-project': 'Proyecto de prueba',
			});
		});

		it('returns labels for missing locale', () => {
			expect(project.l10n.getLabels('fr_FR')).toEqual({});
		});

		it('returns languageFileBaseName', () => {
			expect(project.l10n.languageFileBaseName).toEqual(
				path.join(
					__dirname,
					'__fixtures__',
					'project',
					'standard',
					'features',
					'localization',
					'Language'
				)
			);
		});

		it('returns localizationFileMap', () => {
			expect(project.l10n.localizationFileMap).toEqual({
				default: path.join(
					__dirname,
					'__fixtures__',
					'project',
					'standard',
					'features',
					'localization',
					'Language.properties'
				),
				es_ES: path.join(
					__dirname,
					'__fixtures__',
					'project',
					'standard',
					'features',
					'localization',
					'Language_es_ES.properties'
				),
			});
		});

		it('returns supported', () => {
			expect(project.l10n.supported).toBe(true);
		});
	});
});

describe('honors presets', () => {
	beforeEach(() => {
		project = new Project(
			path.join(__dirname, '__fixtures__', 'project', 'with-preset')
		);
	});

	it('loads project.dir from preset', () => {
		expect(project.dir).toBe(
			path.join(__dirname, '__fixtures__', 'project', 'with-preset')
		);
	});

	it('loads project.outputDir from preset', () => {
		expect(project.outputDir).toBe('preset-build');
	});

	it('loads project.jar.outputDir from preset', () => {
		expect(project.jar.outputDir).toBe('preset-dist');
	});

	it('detects JAR configuration even if only in preset', () => {
		expect(project.jar.supported).toBe(true);
	});
});
