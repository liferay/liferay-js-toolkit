/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import fs from 'fs-extra';
import {
	JsSourceTransform,
	TextTransform,
	parseAsAstExpressionStatement,
	removeNamespace,
	replaceJsSource,
	replaceText,
	splitModuleName,
	transformJsSourceFile,
	transformTextFile,
} from 'liferay-js-toolkit-core';
import webpack from 'webpack';

import {
	bundlerGeneratedDir,
	bundlerWebpackDir,
	project,
} from '../../../globals';
import * as log from '../../../log';
import {abort} from '../../../util';
import {findFiles} from '../../../util/files';
import run from '../run';
import {abortWithErrors, overrideWarn} from '../util';
import writeResults from '../write-results';

interface RequiredModules {
	[module: string]: string;
}

/**
 * Run configured rules.
 */
export default async function bundleFragment(): Promise<webpack.Stats> {
	log.debug('Using webpack at', require.resolve('webpack'));

	log.info('Configuring webpack build...');

	const options = configure();

	log.info('Running webpack...');

	const stats = await run(options);

	if (stats.hasErrors()) {
		abortWithErrors(stats);
	}

	writeResults(stats);

	log.info('Adapting webpack output to Liferay platform...');

	await transformBundles();

	log.info('Webpack phase finished successfully');

	await copyAssets();

	return stats;
}

async function copyAssets(): Promise<void> {
	const files = findFiles(project.sourceDir, ['**/*', '!**/*.js']);

	files.forEach((file) => {
		const destFile = project.outputDir.join(file);

		fs.ensureDirSync(destFile.dirname().asNative);

		fs.copyFileSync(
			project.sourceDir.join(file).asNative,
			destFile.asNative
		);
	});

	log.info(`Copied ${files.length} static files to output directory`);
}

function configure(): webpack.Configuration {
	// Get user's config
	const webpackConfig = project.webpackConfiguration;

	// Provide defaults
	webpackConfig.devtool = webpackConfig.devtool || 'source-map';
	webpackConfig.mode = webpackConfig.mode || 'development';

	// TODO: check if any overriden field should be smart-merged instead

	// Override entry configuration
	overrideWarn('entry', webpackConfig.entry);
	// TODO: maybe autodetect fragments
	webpackConfig.entry = Object.entries(project.exports).reduce(
		(entry, [id, moduleName]) => {
			entry[id] = project.dir
				.relative(project.sourceDir.join(moduleName))
				.toDotRelative().asPosix;

			return entry;
		},
		{}
	);

	if (Object.keys(webpackConfig.entry).length === 0) {
		abort(
			'Please configure at least one export in the project ' +
				`(or add a 'main' entry to your package.json, or create an ` +
				`'index.js' file in the project's folder)`
		);
	}

	// Override output configuration
	overrideWarn('output', webpackConfig.output);
	webpackConfig.output = {
		filename: '[name].bundle.js',
		path: bundlerWebpackDir.asNative,
	};

	// Override optimization configuration
	overrideWarn('optimization', webpackConfig.optimization);
	delete webpackConfig.optimization;

	// Insert our imports loader in first position
	webpackConfig.module = webpackConfig.module || {rules: []};
	webpackConfig.module.rules.unshift({
		enforce: 'post',
		test: /.*/,
		use: [require.resolve('../plugin/imports-loader')],
	});

	// Write webpack.config.js for debugging purposes
	fs.writeFileSync(
		bundlerGeneratedDir.join('webpack.config.json').asNative,
		JSON.stringify(webpackConfig, null, '\t')
	);

	return webpackConfig;
}

/**
 * Transform webpack bundles internalizing webpack manifest and wrapping them
 * in AMD define() calls.
 */
async function transformBundles(): Promise<void> {
	for (const [id, file] of Object.entries(project.exports)) {
		const sourceFile = bundlerWebpackDir.join(`${id}.bundle.js`);

		if (!fs.existsSync(sourceFile.asNative)) {
			break;
		}

		const destFile = project.outputDir.join(file);

		const requiredModules: RequiredModules = {};

		await transformJsSourceFile(
			sourceFile,
			destFile,
			replaceRequires(requiredModules)
		);

		// TODO: remove when fixed --vvv
		// Strip source map annotation to prevent fragment errors in browser
		await transformTextFile(
			destFile,
			destFile,
			addImportsHeader(requiredModules),
			replaceText(/\/\/# sourceMappingURL=.*\.map/g, '')
		);

		log.debug(`Transformed webpack bundle ${sourceFile.basename()}`);
	}
}

function addImportsHeader(requiredModules: RequiredModules): TextTransform {
	return (async (text) => {
		const imports = Object.entries(requiredModules)
			.map(
				([module, variable]) =>
					`//${variable}|${module}|${findImportVersion(module)}`
			)
			.join('\n');

		return '//{imports\n' + imports + '\n//}imports\n' + text;
	}) as TextTransform;
}

function findImportVersion(moduleName: string): string {
	const parts = splitModuleName(moduleName);

	const pkgName = removeNamespace(parts.pkgName);

	return project.imports[pkgName].version;
}

function replaceRequires(requiredModules: RequiredModules): JsSourceTransform {
	return ((source) =>
		replaceJsSource(source, {
			enter(node) {
				if (node.type !== 'CallExpression') {
					return;
				}

				const {callee} = node;

				if (
					callee.type !== 'Identifier' ||
					callee.name !== '__REQUIRE__'
				) {
					return;
				}

				const {arguments: params} = node;

				if (params.length != 1) {
					return;
				}

				const param0 = params[0];

				if (param0.type !== 'Literal') {
					return;
				}

				const {value: moduleName} = param0;

				if (typeof moduleName !== 'string') {
					return;
				}

				let variable = requiredModules[moduleName];

				if (!variable) {
					requiredModules[moduleName] = variable =
						removeNamespace(moduleName).replace(/[^A-Za-z]/g, '_') +
						'_' +
						Object.keys(requiredModules).length.toString();
				}

				return parseAsAstExpressionStatement(variable).expression;
			},
		})) as JsSourceTransform;
}
