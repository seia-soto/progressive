import fs from 'node:fs/promises';
import path from 'node:path';
import {idToAlias} from '../instance/alias';

export const defaultPath = 'aa-user';

export const root = path.join(process.cwd(), 'zz-filters');

export const save = async (instanceId: number, filter: string) => {
	const alias = idToAlias(instanceId);

	await fs.writeFile(path.join(root, alias, defaultPath), filter, 'utf-8');

	return true;
};

export const read = async (instanceId: number) => {
	const alias = idToAlias(instanceId);

	const buffer = await fs.readFile(path.join(root, alias), 'utf-8');

	return buffer;
};
