/* eslint-disable no-unused-vars */
export const enum EFilterType {
  Static = 'static',
	StaticException = 'static.exception',
  Cosmetic = 'cosmetic',
	CosmeticException = 'cosmetic.exception',
	CosmeticStyle = 'consmetic.style',
	Script = 'script',
	Url = 'url',
	Comment = 'comment',
	Invalid = 'invalid'
}

export const enum EHostnameParsingError {
  UnexpectedToken = 'unexpectedToken',
  ExpectedAlphabetOrNumber = 'expectedAlphabetOrNumber'
}
/* eslint-enable no-unused-vars */

export interface IFilter {
	type: EFilterType,
	source: string,
}

export interface IStaticFilter extends IFilter {
	type: EFilterType.Static | EFilterType.StaticException | EFilterType.Url,
	pattern: string,
	modifiers: string[]
}

export interface ICosmeticFilter extends IFilter {
	type: EFilterType.Cosmetic | EFilterType.CosmeticStyle | EFilterType.CosmeticException,
	domain: string,
	content: string
}

export interface IScriptableFilter extends IFilter {
	type: EFilterType.Script,
	domain: string,
	content: string[]
}

export interface INotFilter extends IFilter {
	type: EFilterType.Comment | EFilterType.Invalid
}

export type TFilter = IStaticFilter | ICosmeticFilter | IScriptableFilter | INotFilter

export const isCharacterAlphabet = (char: string) => char >= 'a' && char <= 'z';

export const isCharacterNumber = (char: string) => char >= '0' && char <= '9';

export const isComment = (text: string) => {
	const normalized = text.trimStart();

	return normalized[0] === '!';
};

export const isHostname = (text: string) => {
	let isPreviousCharacterDot = false;

	if (
		!isCharacterAlphabet(text[0])
    && !isCharacterNumber(text[0])
	) {
		return [false, EHostnameParsingError.ExpectedAlphabetOrNumber, 'Expected alphabet or number at first character.'] as const;
	}

	for (let i = 0; i < text.length; i++) {
		if (text[i] === '.') {
			if (isPreviousCharacterDot) {
				return [false, EHostnameParsingError.ExpectedAlphabetOrNumber, 'Expected alphabet or number after dot at position ' + i + '!'] as const;
			}

			if (i === text.length - 1) {
				return [false, EHostnameParsingError.ExpectedAlphabetOrNumber, 'Expected alphabet or number at the end of the line!'] as const;
			}

			isPreviousCharacterDot = true;
		} else if (
			!isCharacterAlphabet(text[i])
			&& !isCharacterNumber(text[i])
			&& text[i] !== '-'
		) {
			return [false, EHostnameParsingError.UnexpectedToken, 'Expected alphabet or number at position ' + i + '!'] as const;
		} else {
			isPreviousCharacterDot = false;
		}
	}

	return [true] as const;
};

export const parseCommonModifiers = (text: string) => {
	const [pattern, _modifiers = ''] = text.split('$');
	const modifiers: string[] = _modifiers
		.split(',')
		.filter(modifier => modifier.length);

	return [pattern, modifiers] as const;
};

export const parseStatic = (text: string): IStaticFilter | false => {
	let offset = 0;
	let type = EFilterType.Static;

	if (text[offset] === '@' && text[offset + 1] === '@') {
		offset += 2;
		type = EFilterType.StaticException;
	}

	if (text[offset] !== '|' || text[offset + 1] !== '|') {
		return false;
	}

	const [pattern, modifiers] = parseCommonModifiers(text.slice(offset + 2));

	return {
		type,
		source: text,
		pattern,
		modifiers,
	};
};

export const parseScriptletArguments = (text: string, token: string, offset: number) => {
	const scriptInjectable = text.indexOf(token, offset);

	if (scriptInjectable < 0) {
		return false;
	}

	const start = scriptInjectable + token.length;
	const end = text.indexOf(')', start);

	if (end < 0) {
		return false;
	}

	const context: string[] = [];
	let buffer = '';
	let isFixed = false;

	for (let i = start; i < end; i++) {
		if (text[i] === '"' || text[i] === '\'') {
			isFixed = !isFixed;

			continue;
		}

		if (text[i] === '\\') {
			buffer += text[++i];

			continue;
		}

		if (text[i] === ',' && !isFixed) {
			context.push(buffer);
			buffer = '';

			continue;
		}

		buffer += text[i];
	}

	context.push(buffer);

	return context;
};

export const parseCosmetic = (text: string): ICosmeticFilter | IScriptableFilter | false => {
	const offset = text.indexOf('#');

	if (offset < 0) {
		return false;
	}

	const delimiter = text.indexOf('#', offset + 1);
	const diff = delimiter - offset;

	if (diff < 1 && diff > 2) {
		return false;
	}

	const domain = text.slice(0, offset);
	let type = EFilterType.Cosmetic;
	let scriptable = '+js(';

	if (diff === 1) {
		// Handle uBlock Origin styles
		for (let last = offset; ;) {
			const position = text.indexOf(':', last);

			if (position < 0) {
				break;
			}

			if (text.indexOf('style(', position) >= 0) {
				type = EFilterType.CosmeticStyle;

				break;
			}

			last = position + 1;
		}
	} else {
		// Handle AdGuard styles & shared exception expression
		switch (text[offset + 1]) {
			case '@': {
				type = EFilterType.CosmeticException;

				break;
			}

			case '$': {
				type = EFilterType.CosmeticStyle;

				break;
			}

			case '%': {
				type = EFilterType.Script;
				scriptable = '//scriptlet(';

				break;
			}
		}
	}

	const content = parseScriptletArguments(text, scriptable, delimiter + 1);

	if (content) {
		return {
			type: EFilterType.Script,
			domain,
			source: text,
			content,
		} as IScriptableFilter;
	}

	if (type === EFilterType.Script) {
		return false;
	}

	return {
		type,
		domain,
		source: text,
		content: text.slice(delimiter + 1),
	} as ICosmeticFilter;
};

export const parseUrl = (text: string) => {
	let isCommonCharacterFound = false;
	let isPreviousCharacterSpecial = false;

	for (let i = 0; i < text.length; i++) {
		if (!isCharacterAlphabet(text[i]) && !isCharacterNumber(text[i])) {
			if (isPreviousCharacterSpecial) {
				return false;
			}

			isCommonCharacterFound = true;
			isPreviousCharacterSpecial = true;

			break;
		}

		isPreviousCharacterSpecial = false;
	}

	if (!isCommonCharacterFound) {
		return false;
	}

	const [pattern, modifiers] = parseCommonModifiers(text);

	return {
		type: EFilterType.Url,
		source: text,
		pattern,
		modifiers,
	} as IStaticFilter;
};

export const parseComment = (text: string) => {
	if (!isComment(text)) {
		return false;
	}

	return {
		type: EFilterType.Comment,
		source: text,
	} as INotFilter;
};

export const parseHostname = (text: string) => isHostname(text)[0]
	? ({
		type: EFilterType.Static,
		source: text,
		pattern: text,
		modifiers: [],
	}) as IStaticFilter
	: ({
		type: EFilterType.Invalid,
		source: text,
	}) as INotFilter;

export const gateDnsFilter = (item: TFilter) => {
	if (
		item.type !== EFilterType.Static
		&& item.type !== EFilterType.StaticException
	) {
		return false;
	}

	if (item.pattern.endsWith('^')) {
		item.pattern = item.pattern.slice(0, item.pattern.length - 1);
	}

	if (!isHostname(item.pattern)[0]) {
		return false;
	}

	return item;
};

export const parse = (text: string) => parseComment(text)
	|| parseCosmetic(text)
	|| parseStatic(text)
	|| parseHostname(text);

export const parseDNS = (text: string) => gateDnsFilter(parseComment(text)
	|| parseStatic(text)
	|| parseHostname(text));
