import fss from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {listCache} from '../../states/cache.js';
import {workspaces} from '../../states/workspace.js';

export const pull = async (id: string) => {
	const to = path.join(workspaces.user, id);

	if (!fss.existsSync(workspaces.user)) {
		await fs.mkdir(workspaces.user, {recursive: true});
		await fs.writeFile(to, '', 'utf-8');
	}

	const out = await fs.readFile(to, 'utf-8');

	return out;
};

export const push = async (id: string, filter: string) => {
	if (!fss.existsSync(workspaces.user)) {
		await fs.mkdir(workspaces.user, {recursive: true});
	}

	await fs.writeFile(path.join(workspaces.user, id), filter, 'utf-8');

	listCache.set(id, filter);
};
