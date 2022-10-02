import got, {Progress} from 'got';
import {filterCache} from '../../states/cache.js';
import {EWorkspaceKey, read, write} from '../../states/workspace.js';

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

export const pull = async (id: string) => {
	const cached = filterCache.get(id);

	if (cached) {
		return cached.value;
	}

	const value = await read(EWorkspaceKey.filterUser, id);

	filterCache.set(id, value);

	return value;
};

export const push = async (id: string, filter: string) => {
	await write(EWorkspaceKey.filterUser, id, filter);

	filterCache.set(id, filter);
};
