/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import {TextTransform} from '..';

/**
 * Replace text as String.replace() does
 *
 * @param searchValue same parameter as in String.replace()
 * @param replaceValue same parameter as in String.replace()
 */
export default function replaceText(
	searchValue: string | RegExp,
	replaceValue: string
): TextTransform {
	return (async (text) =>
		text.replace(searchValue, replaceValue)) as TextTransform;
}
