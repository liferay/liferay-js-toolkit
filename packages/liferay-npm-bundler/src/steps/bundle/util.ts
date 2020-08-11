/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import webpack from 'webpack';

import * as log from '../../log';
import {abort} from '../../util';
import ExplainedError from './ExplainedError';

export function overrideWarn(fieldName: string, value: unknown): void {
	if (value !== undefined) {
		log.warn(
			'Your liferay-npm-bundler.config.js file is configuring webpack option\n' +
				`'${fieldName}', but it will be ignored`
		);
	}
}

export function abortWithErrors(stats: webpack.Stats): void {
	const {errors} = stats.compilation;

	errors.forEach((err) =>
		log.error(`${new ExplainedError(err).toString()}\n`)
	);

	abort(`Build failed: webpack build finished with errors`);
}
