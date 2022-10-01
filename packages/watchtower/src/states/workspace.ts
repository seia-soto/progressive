import path from 'node:path';

export const shared = path.join(process.cwd(), 'ws');

export const workspaces = {
	filter: path.join(shared, 'filter'),
};
