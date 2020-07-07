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

const {expression: portletElementIdExpression} = parseAsAstExpressionStatement(
	'_LIFERAY_PARAMS_.portletElementId'
);

/**
 * Changes `document.getElementById('root')` to
 * `document.getElementById(_LIFERAY_PARAMS_.portletElementId)` so that React
 * attaches to the portlet's DIV node.
 */
export default function tweakAttachmentToDOM(): JsSourceTransform {
	return (async (source) =>
		await replaceJsSource(source, {
			enter(node) {
				if (node.type !== 'CallExpression') {
					return;
				}

				const {arguments: args, callee} = node;

				if (callee.type !== 'MemberExpression') {
					return;
				}

				const {object, property} = callee;

				if (
					object.type !== 'Identifier' ||
					object.name !== 'document'
				) {
					return;
				}

				if (
					property.type !== 'Identifier' ||
					property.name !== 'getElementById'
				) {
					return;
				}

				if (args.length !== 1) {
					return;
				}

				if (args[0].type !== 'Literal' || args[0].value !== 'root') {
					return;
				}

				args[0] = mapAstNodeLocation(
					portletElementIdExpression,
					args[0]
				);
			},
		})) as JsSourceTransform;
}
