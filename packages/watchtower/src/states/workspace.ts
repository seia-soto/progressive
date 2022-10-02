import path from 'node:path';

export const shared = path.join(process.cwd(), 'ws');

export const workspaces = {
	filter: path.join(shared, 'filter.compiled'),
	user: path.join(shared, 'filter.user'),
};
