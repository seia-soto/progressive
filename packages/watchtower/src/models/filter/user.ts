import {listCache} from '../../states/cache.js';
import {EWorkspaceKey, read, write} from '../../states/workspace.js';

export const pull = async (id: string) => {
	const cached = listCache.get(id);

	if (cached) {
		return cached.value;
	}

	const value = await read(EWorkspaceKey.filterUser, id);

	listCache.set(id, value);

	return value;
};

export const push = async (id: string, filter: string) => {
	await write(EWorkspaceKey.filterUser, id, filter);

	listCache.set(id, filter);
};
