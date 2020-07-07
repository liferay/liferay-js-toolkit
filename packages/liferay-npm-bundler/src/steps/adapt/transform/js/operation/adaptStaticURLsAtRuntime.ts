/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import {
	JsSourceTransform,
	mapAstNodeLocation,
	parseAsAstExpressionStatement,
	replaceJsSource,
} from 'liferay-js-toolkit-core';

import {project} from '../../../../../globals';
import {findFiles} from '../../../../../util/files';

export default function adaptStaticURLsAtRuntime(
	...assetsGlobs: string[]
): JsSourceTransform {
	return (async (source) => {
		const adaptBuildDir = project.adapt.buildDir;

		const assetURLs = new Set(
			findFiles(adaptBuildDir, assetsGlobs).map((file) => file.asPosix)
		);

		return await replaceJsSource(source, {
			enter(node, parent) {
				if (
					node.type !== 'Literal' ||
					typeof node.value !== 'string' ||
					!assetURLs.has(node.value)
				) {
					return;
				}

				// Don't process replacement nodes again
				if (
					parent.type === 'CallExpression' &&
					parent.callee.type === 'MemberExpression' &&
					parent.callee.object.type === 'Identifier' &&
					parent.callee.object.name === '_ADAPT_RT_' &&
					parent.callee.property.type === 'Identifier' &&
					parent.callee.property.name === 'adaptStaticURL'
				) {
					return;
				}

				const adaptExpression = parseAsAstExpressionStatement(`
					_ADAPT_RT_.adaptStaticURL("${node.value}")
				`);

				return mapAstNodeLocation(adaptExpression, node);
			},
		});
	}) as JsSourceTransform;
}
