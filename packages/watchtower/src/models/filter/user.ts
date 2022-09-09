import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from '../../def.js';
import {idToAlias} from '../instance/alias.js';

export const save = async (instanceId: number, filter: string) => {
	const alias = idToAlias(instanceId);

	await fs.writeFile(path.join(root, alias, 'aa-user'), filter, 'utf-8');

	return true;
};

export const read = async (instanceId: number) => {
	const alias = idToAlias(instanceId);

	const buffer = await fs.readFile(path.join(root, alias, 'aa-user'), 'utf-8');

	return buffer;
};
