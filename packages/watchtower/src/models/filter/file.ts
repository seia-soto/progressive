import cbor from 'cbor';
import fs from 'node:fs/promises';
import path from 'node:path';
import {Node} from 'vertical-radix';
import {root} from '../../def.js';
import {idToAlias} from '../instance/alias.js';

export const save = async (instanceId: number, filter: {p: Node, n: Node}) => {
	const alias = idToAlias(instanceId);

	await fs.writeFile(path.join(root, alias, 'zz-comp'), cbor.encode(filter), 'utf-8');

	return true;
};

export const read = async (instanceId: number) => {
	const alias = idToAlias(instanceId);

	const buffer = await fs.readFile(path.join(root, alias, 'zz-comp'), 'utf-8');

	if (!buffer) {
		return '';
	}

	return cbor.decode(buffer);
};
