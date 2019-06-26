/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import path from 'path';
import Generator from 'yeoman-generator';

import {Copier} from '../utils';
import ProjectAnalyzer from '../utils/ProjectAnalyzer';
import NpmbuildrcModifier from '../utils/modifier/npmbuildrc';
import PkgJsonModifier from '../utils/modifier/package.json.js';
import * as standardTarget from '../utils/target/standard';
import dependenciesJson from './dependencies.json';

/**
 * Implementation of generation of React portlets.
 */
export default class extends Generator {
	/**
	 * Standard Yeoman initialization function
	 */
	initializing() {
		this.sourceRoot(path.join(__dirname, 'templates'));
		this.namespace = 'target-react-portlet';
	}

	/**
	 * Standard Yeoman prompt function
	 */
	async prompting() {
		await standardTarget.prompting(this);
	}

	/**
	 * Standard Yeoman generation function
	 */
	writing() {
		const cp = new Copier(this);
		const npmbuildrc = new NpmbuildrcModifier(this);
		const pkgJson = new PkgJsonModifier(this);
		const projectAnalyzer = new ProjectAnalyzer(this);
		const {sampleWanted} = this.answers;

		// Configure build
		pkgJson.mergeDependencies(dependenciesJson);
		pkgJson.addBuildStep('babel --source-maps -d build src');
		pkgJson.addBuildStep('npm run compile-sass');
		pkgJson.addBuildStep('npm run clean');
		pkgJson.addScript('start', 'npm-run-all -p watch-sass dev-server');
		pkgJson.addScript('dev-server', 'lnbs-start');
		pkgJson.addScript('compile-sass', 'node-sass assets/css -o assets/css');
		pkgJson.addScript(
			'clean',
			'shx rm -rf build dist && shx echo cleaning complete'
		);
		pkgJson.addScript(
			'watch-sass',
			'node-sass --watch assets/css -o assets/css'
		);
		cp.copyFile('.babelrc');

		// Configure webpack
		//pkgJson.addDevDependency('babel-loader', '7.1.5');
		npmbuildrc.addWebpackRule(/src\/.*\.js$/, 'babel-loader');

		// Prepare text labels
		const labels = standardTarget.generateLabels(this);

		// Prepare context
		const context = standardTarget.generateContext(this, {
			labels: labels[projectAnalyzer.hasLocalization ? 'jsx' : 'raw'],
		});

		// Copy javascript files
		pkgJson.setMain('index.js');
		cp.copyFile('src/index.js', {context});

		// Generate sample contents
		standardTarget.generateSamples(this, labels);
		if (sampleWanted) {
			cp.copyDir('src', {context});
		}
	}
}
