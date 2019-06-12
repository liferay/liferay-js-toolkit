/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import path from 'path';
import fs from 'fs';
import project from 'liferay-npm-build-tools-common/lib/project';
import readJsonSync from 'read-json-sync';

import * as cfg from '../config';

/**
 *
 */
export default function() {
	const liferayDir = cfg.getLiferayDir();

	const pkgJson = readJsonSync(path.join(project.dir, 'package.json'));
	const jarName = pkgJson.name + '-' + pkgJson.version + '.jar';

	fs.copyFileSync(
		path.join(project.jar.outputDir, jarName),
		path.join(liferayDir, 'osgi', 'modules', jarName)
	);

	console.log(`Deployed ${jarName} to ${liferayDir}`);
}
