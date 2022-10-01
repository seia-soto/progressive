import * as filter from 'filter';
import got, {Progress} from 'got';
import {Node} from 'vertical-radix';
import {filterCache} from '../states/cache.js';
import derive from './error/derive.js';

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

export const load = async (url: string) => {
	const cache = filterCache.get(url);

	if (cache) {
		return cache.value;
	}

	const [, head] = await derive(fetcher.head(url));

	if (
		head
		&& parseInt(head.headers['content-length'] ?? '', 10) > downloadLimit
	) {
		return '';
	}

	let [, response] = await derive(fetcher.get(url).text());

	if (!response) {
		response = '';
	}

	filterCache.set(url, response);

	return response;
};

export const build = async (urls: string[]) => {
	const built = {
		positive: new Node(),
		negative: new Node(),
	};
	const files = await Promise.all(urls.map(url => load(url)));

	for (let i = 0; i < files.length; i++) {
		files[i]
			.split('\n')
			.map(line => filter.parseDNS(line))
			.forEach(entry => {
				if (!entry) {
					return;
				}

				if (entry.type === filter.EFilterType.StaticException) {
					built.negative.insert(entry.pattern);
				} else {
					built.positive.insert(entry.pattern);
				}
			});
	}

	return built;
};
