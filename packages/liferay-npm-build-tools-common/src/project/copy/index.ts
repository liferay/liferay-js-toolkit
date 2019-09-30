/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import prop from 'dot-prop';

import PkgDesc from '../../pkg-desc';
import * as util from '../util';
import {Project} from '..';
import {BundlerCopyPluginDescriptor} from './types';

/**
 * Defines configuration for the copy step.
 */
export default class Copy {
	constructor(project: Project) {
		this._project = project;
	}

	/**
	 * Extra dependencies to add to the final bundle (in addition to those
	 * listed under the dependencies section of package.json).
	 */
	get includedDependencies(): string[] {
		const {_npmbundlerrc} = this._project;

		return prop.get(_npmbundlerrc, 'include-dependencies', []);
	}

	/**
	 * Get the configured file exclusions for a given package.
	 * @param pkg the package descriptor
	 */
	getExclusions(pkg: PkgDesc): glob[] {
		const {_npmbundlerrc} = this._project;

		let exclusions = _npmbundlerrc['exclude'] || {};

		// If it is explicitly false, return an empty exclusions array
		if (
			exclusions[pkg.id] === false ||
			exclusions[pkg.name] === false ||
			exclusions['*'] === false
		) {
			return [];
		}

		// If it is explicitly true, return an array with '**/*'
		if (
			exclusions[pkg.id] === true ||
			exclusions[pkg.name] === true ||
			exclusions['*'] === true
		) {
			return ['**/*'];
		}

		// In any other case, return what's in the config
		exclusions =
			exclusions[pkg.id] || exclusions[pkg.name] || exclusions['*'] || [];

		return exclusions;
	}

	getPluginDescriptors(pkg: PkgDesc): BundlerCopyPluginDescriptor[] {
		const {_project} = this;

		const pkgConfig = util.getPackageConfig(
			_project,
			pkg,
			'copy-plugins',
			[]
		) as [];

		return util.createBundlerPluginDescriptors(_project, pkgConfig);
	}

	_project: Project;
}
