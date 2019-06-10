/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import prop from 'dot-prop';
import fs from 'fs';
import path from 'path';
import readJsonSync from 'read-json-sync';

import Jar from './jar';
import Localization from './localization';

/**
 * Describes a standard JS Toolkit project.
 */
export class Project {
	/**
	 * @param {string} projectDir project's path
	 */
	constructor(projectDir) {
		this._projectDir = projectDir;

		const npmbundlerrcPath = path.join(projectDir, '.npmbundlerrc');

		this._npmbundlerrc = fs.existsSync(npmbundlerrcPath)
			? readJsonSync(npmbundlerrcPath)
			: {};

		this._cachedOutputDir = undefined;

		this.jar = new Jar(this);
		this.l10n = new Localization(this);
	}

	/**
	 * Get project's directory
	 */
	get dir() {
		return this._projectDir;
	}

	/**
	 * Get project's output directory
	 */
	get outputDir() {
		if (this._cachedOutputDir === undefined) {
			this._cachedOutputDir = prop.get(
				this._npmbundlerrc,
				'output',
				this.jar.supported
					? 'build'
					: 'build/resources/main/META-INF/resources'
			);
		}

		return this._cachedOutputDir;
	}
}

export default new Project('.');
