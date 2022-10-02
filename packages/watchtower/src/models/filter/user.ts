import fs from 'node:fs/promises';
import path from 'node:path';
import {listCache} from '../../states/cache.js';
import {workspaces} from '../../states/workspace.js';
import derive from '../error/derive.js';

export const pull = async (id: string): Promise<string> => {
	const [error, out] = await derive(fs.readFile(path.join(workspaces.user, id), 'utf-8'));

	if (error) {
		await fs.mkdir(workspaces.user, {recursive: true});

		return pull(id);
	}

	return out;
};

export const push = async (id: string, filter: string): Promise<void> => {
	const [error] = await derive(fs.writeFile(path.join(workspaces.filter, id), filter, 'utf-8'));

	if (error) {
		await fs.mkdir(workspaces.filter, {recursive: true});

		return push(id, filter);
	}

	listCache.set(id, filter);
};
