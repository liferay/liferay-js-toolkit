/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import estree from 'estree';
import {
	JsSourceTransform,
	getAstProgramStatements,
	mapAstNodeLocation,
	parseAsAstProgram,
	replaceJsSource,
} from 'liferay-js-toolkit-core';

const exportModuleProgram = parseAsAstProgram(`
	module.exports = function(_LIFERAY_PARAMS_, _ADAPT_RT_) {
	};
`);

export default function exportModuleAsFunction(): JsSourceTransform {
	return ((source) =>
		replaceJsSource(source, {
			enter(node) {
				if (node.type !== 'Program') {
					return;
				}

				const newProgram = mapAstNodeLocation(
					exportModuleProgram,
					node
				);

				const functionBody = getFunctionBody(newProgram);

				functionBody.body = getAstProgramStatements(node);

				return newProgram;
			},
		})) as JsSourceTransform;
}

function getFunctionBody(program: estree.Program): estree.BlockStatement {
	const {body: programBody} = program;

	if (
		programBody.length === 1 &&
		programBody[0].type === 'ExpressionStatement' &&
		programBody[0].expression.type === 'AssignmentExpression' &&
		programBody[0].expression.right &&
		programBody[0].expression.right.type === 'FunctionExpression' &&
		programBody[0].expression.right.body.type === 'BlockStatement'
	) {
		return programBody[0].expression.right.body;
	} else {
		throw new Error(
			'Provided program does not match the expected structure'
		);
	}
}
