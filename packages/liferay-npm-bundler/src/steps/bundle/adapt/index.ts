/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import fs from 'fs-extra';
import {
	FilePath,
	JsonTransform,
	addNamespace,
	addPkgJsonDependencies,
	deletePkgJsonDependencies,
	transformJsSourceFile,
	transformJsonFile,
	wrapModule,
} from 'liferay-js-toolkit-core';
import path from 'path';
import {URL} from 'url';

import {bundlerWebpackDir, project} from '../../../globals';
import * as log from '../../../log';
import Renderer from '../../../util/renderer';
import replaceWebpackJsonp from './replaceWebpackJsonp';
import writeExportModules from './write-export-modules';

export default async function adapt(): Promise<void> {
	await writeExportModules();
	await writeManifestModule();
	await transformBundles();
	await relocateSourceMaps();
	await injectImportsInPkgJson();
}

/**
 * Inject imported packages in `package.json` so that the AMD loader may find
 * them.
 */
async function injectImportsInPkgJson(): Promise<void> {
	const {imports} = project;

	const file = project.outputDir.join('package.json');

	await transformJsonFile(
		file,
		file,
		addPkgJsonDependencies(
			Object.entries(imports).reduce(
				(dependencies, [packageName, config]) => {
					const {provider, version} = config;

					const namespacedPkgName = addNamespace(packageName, {
						name: provider,
					});

					dependencies[namespacedPkgName] = version;

					return dependencies;
				},
				{}
			)
		),
		deletePkgJsonDependencies(
			...Object.entries(imports).map(([packageName]) => packageName)
		)
	);

	log.debug(`Replaced imported packages in package.json`);
}

/**
 * Rewrite the `sources` field of source map files to avoid naming collisions.
 */
async function relocateSourceMaps(): Promise<void> {
	for (const id of ['runtime', 'vendor', ...Object.keys(project.exports)]) {
		const mapFile = project.outputDir.join(`${id}.bundle.js.map`);

		await transformJsonFile(mapFile, mapFile, transformSourceMapSources());

		log.debug(`Relocated source map ${mapFile.basename()}`);
	}
}

/**
 * Transform webpack bundles internalizing webpack manifest and wrapping them
 * in AMD define() calls.
 */
async function transformBundles(): Promise<void> {
	for (const id of ['runtime', 'vendor', ...Object.keys(project.exports)]) {
		const fileName = `${id}.bundle.js`;

		const sourceFile = bundlerWebpackDir.join(fileName);
		const destFile = project.outputDir.join(fileName);

		const {name, version} = project.pkgJson;

		await transformJsSourceFile(
			sourceFile,
			destFile,
			replaceWebpackJsonp(),
			wrapModule(`${name}@${version}/${id}.bundle`, {
				defineDependencies: {
					__MODULE__: 'module',
					__REQUIRE__: 'require',
					__WEBPACK_MANIFEST__: './webpack.manifest',
				},
				requireIdentifier: '__REQUIRE__',
			})
		);

		log.debug(`Transformed webpack bundle ${fileName}`);
	}
}

/**
 * A `JsonTransform` to tweak the `sources` field of a source map file.
 */
function transformSourceMapSources(): JsonTransform<{sources: string[]}> {
	const {pkgJson} = project;

	const projectId = `${pkgJson.name}@${pkgJson.version}`;

	return (async (map) => {
		map.sources = map.sources.map((source) => {
			const url = new URL(source);

			let file;

			if (url.pathname.startsWith('//')) {
				file = new FilePath(url.pathname.substring(1), {posix: true});
			} else {
				file = project.dir.join(
					new FilePath(url.pathname, {posix: true})
				);
			}

			const filePath = project.dir
				.relative(file)
				.asPosix.replace(/\.\.\//g, '[..]/');

			url.protocol = 'liferay:';
			url.pathname = `${projectId}/${filePath}`;

			return url.toString();
		});

		return map;
	}) as JsonTransform<{sources: string[]}>;
}

/**
 * Generates an AMD module to hold webpack manifest so that it is not placed in
 * `window["webpackJsonp"]`
 */
async function writeManifestModule(): Promise<void> {
	const {name, version} = project.pkgJson;
	const moduleName = `${name}@${version}/webpack.manifest`;

	const renderer = new Renderer(path.join(__dirname, 'template'));

	fs.writeFileSync(
		project.outputDir.join(`webpack.manifest.js`).asNative,
		await renderer.render('manifest-module', {moduleName})
	);

	log.debug(`Generated AMD module to hold webpack manifest`);
}
