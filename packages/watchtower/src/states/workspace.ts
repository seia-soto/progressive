import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';

export const shared = path.join(process.cwd(), 'ws');

/* eslint-disable no-unused-vars */
export const enum EWorkspaceKey {
	filterCompiled = 'filter.compiled',
	filterUser = 'filter.user'
}
/* eslint-enable no-unused-vars */

export const dirnames: Record<EWorkspaceKey, string> = {
	[EWorkspaceKey.filterCompiled]: path.join(shared, EWorkspaceKey.filterCompiled),
	[EWorkspaceKey.filterUser]: path.join(shared, EWorkspaceKey.filterUser),
};

export const write = async (scope: EWorkspaceKey, to: string, what: string) => {
	if (!fss.existsSync(dirnames[scope])) {
		await fs.mkdir(dirnames[scope], {recursive: true});
	}

	await fs.writeFile(path.join(dirnames[scope], to), what, 'utf-8');
};

export const read = async (scope: EWorkspaceKey, from: string) => {
	if (!fss.existsSync(dirnames[scope])) {
		await fs.mkdir(dirnames[scope], {recursive: true});
		await fs.writeFile(path.join(dirnames[scope], from), '', 'utf-8');

		return '';
	}

	const buffer = await fs.readFile(path.join(dirnames[scope], from), 'utf-8');

	return buffer;
};
