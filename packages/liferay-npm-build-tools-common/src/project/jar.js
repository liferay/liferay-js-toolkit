/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import prop from 'dot-prop';
import readJsonSync from 'read-json-sync';

import {getFeaturesFilePath} from './util';

/**
 * Reflects JAR file configuration of JS Toolkit projects.
 */
export default class Jar {
	/**
	 *
	 * @param {Project} project
	 */
	constructor(project) {
		this._project = project;
		this._npmbundlerrc = project._npmbundlerrc;

		this._cachedCustomManifestHeaders = undefined;
		this._cachedOutputDir = undefined;
	}

	/**
	 * Get user configured manifest headers
	 */
	get customManifestHeaders() {
		if (this._cachedCustomManifestHeaders === undefined) {
			const manifestFilePath = getFeaturesFilePath(
				this._project,
				'create-jar.features.manifest',
				'features/manifest.json'
			);

			const featuresHeaders = manifestFilePath
				? readJsonSync(manifestFilePath)
				: {};

			const npmbundlerrcHeaders = prop.get(
				this._npmbundlerrc,
				'create-jar.customManifestHeaders',
				{}
			);

			this._cachedCustomManifestHeaders = Object.assign(
				npmbundlerrcHeaders,
				featuresHeaders
			);
		}

		return this._cachedCustomManifestHeaders;
	}

	/**
	 * Get the output directory for the JAR file
	 * @return {string|undefined} undefined if project doesn't support JAR
	 */
	get outputDir() {
		if (!this.supported) {
			return undefined;
		}

		if (this._cachedOutputDir === undefined) {
			this._cachedOutputDir = prop.get(
				this._npmbundlerrc,
				'create-jar.output-dir',
				this._project.outputDir
			);
		}

		return this._cachedOutputDir;
	}

	/**
	 * Check if project generates a JAR
	 */
	get supported() {
		return prop.has(this._npmbundlerrc, 'create-jar');
	}
}
