/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import estree from 'estree';
import fs from 'fs-extra';
import {
	JsSourceTransform,
	getAstProgramStatements,
	parseAsAstExpressionStatement,
	parseAsAstProgram,
	removeNamespace,
	replaceJsSource,
	replaceText,
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

	return stats;
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
	for (const id of Object.keys(project.exports)) {
		const fileName = `${id}.bundle.js`;

		const sourceFile = bundlerWebpackDir.join(fileName);

		if (!fs.existsSync(sourceFile.asNative)) {
			break;
		}

		const destFile = project.outputDir.join(fileName);

		const requiredModules: RequiredModules = {};

		await transformJsSourceFile(
			sourceFile,
			destFile,
			replaceRequires(requiredModules),
			wrapModule(requiredModules)
		);

		// TODO: remove when fixed --vvv
		// Strip source map annotation to prevent fragment errors in browser
		await transformTextFile(
			destFile,
			destFile,
			replaceText(/\/\/# sourceMappingURL=.*\.map/g, '')
		);

		log.debug(`Transformed webpack bundle ${fileName}`);
	}
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

/**
 * Wraps a module into an AMD require call.
 *
 * @param requiredModules list of required modules
 */
function wrapModule(requiredModules: RequiredModules): JsSourceTransform {
	return ((source) =>
		replaceJsSource(source, {
			enter(node) {
				if (node.type !== 'Program') {
					return;
				}

				const program = node;

				const dependencies = Object.entries(requiredModules)
					.map(([module]) => `'${module}'`)
					.join(',');

				const dependencyVariables = Object.entries(requiredModules)
					.map(([, variable]) => `${variable}`)
					.join(', ');

				const wrapAst = parseAsAstProgram(`
					Liferay.Loader.require(
						[
							${dependencies}
						],
						function(${dependencyVariables}) {
						}
					);
				`);

				const {body: wrapBody} = wrapAst;

				const moduleBody = getBlockStatement(wrapAst);

				moduleBody.body = getAstProgramStatements(program);

				program.body = wrapBody;
			},
		})) as JsSourceTransform;
}

function getBlockStatement(wrapAst: estree.Program): estree.BlockStatement {
	const {body: wrapBody} = wrapAst;

	if (wrapBody.length !== 1) {
		throw new Error('Program body has more than one node');
	}

	if (wrapBody[0].type !== 'ExpressionStatement') {
		throw new Error('Program is not an expression statement');
	}

	const {expression} = wrapBody[0];

	if (expression.type !== 'CallExpression') {
		throw new Error('Program is not a call expression');
	}

	const {arguments: args} = expression;

	if (args.length !== 2) {
		throw new Error(
			'Program call expression must have exactly two arguments'
		);
	}

	if (args[1].type !== 'FunctionExpression') {
		throw new Error(
			'Second argument of program call expression is not a function'
		);
	}

	const {body: moduleBody} = args[1];

	if (moduleBody.type !== 'BlockStatement') {
		throw new Error('Argument function body is not a block statement');
	}

	return moduleBody;
}
