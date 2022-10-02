import got, {Progress} from 'got';
import fs from 'node:fs/promises';
import path from 'node:path';
import fss from 'node:fs';
import {filterCache} from '../../states/cache.js';
import {workspaces} from '../../states/workspace.js';

export const downloadLimit = 2 * 1000 * 1000; // 2MB

export const fetcher = got.extend({
	headers: {
		'user-agent': 'seia-soto/progressive (v1)',
	},
	maxRedirects: 4,
	timeout: {
		connect: 200,
		secureConnect: 200,
		socket: 1000,
		send: 500,
		response: 5000,
	},
	retry: {
		limit: 2,
	},
	dnsCache: true,
	handlers: [
		(options, next) => {
			const {downloadLimit} = options.context;
			const client = next(options);

			if (typeof downloadLimit === 'number') {
				// @ts-expect-error
				client.on('downloadProgress', (progress: Progress) => {
					if (progress.transferred > downloadLimit && progress.percent !== 1) {
						// @ts-expect-error
						client.cancel();

						throw new Error('You exceeded the download limit!');
					}
				});
			}

			return client;
		},
	],
	context: {
		downloadLimit,
	},
});

export const push = async (id: string, filter: string) => {
	const to = path.join(workspaces.filter, id);

	if (!fss.existsSync(workspaces.filter)) {
		await fs.mkdir(workspaces.filter, {recursive: true});
		await fs.writeFile(to, '', 'utf-8');
	}

	await fs.writeFile(to, filter, 'utf-8');

	filterCache.set(id, filter);
};

export const pull = async (id: string) => {
	const entry = filterCache.get(id);

	if (entry) {
		return entry.value;
	}

	if (!fss.existsSync(workspaces.filter)) {
		await fs.mkdir(workspaces.filter, {recursive: true});
	}

	const out = await fs.readFile(path.join(workspaces.filter, id), 'utf-8');

	return out;
};
