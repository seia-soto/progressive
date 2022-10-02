import * as filter from 'filter';
import {Node} from 'vertical-radix';
import {listCache} from '../../states/cache.js';
import retry from '../error/retry.js';
import {downloadLimit, fetcher} from './binary.js';
import {pull} from './user.js';

export const loadRemote = async (url: string) => retry<string>(async () => {
	const cache = listCache.get(url);

	if (cache) {
		return '';
	}

	const head = await fetcher.head(url);

	if (
		head
		&& parseInt(head.headers['content-length'] ?? '', 10) > downloadLimit
	) {
		throw new Error('You exceeded the download limit!');
	}

	const response = await fetcher.get(url).text();

	listCache.set(url, response);

	return response;
}, 2);

export const loadLocal = async (id: string) => retry<string>(async () => {
	const out = await pull(id);

	return out;
}, 2);

export const load = async (url: string) => {
	const [protocol, rest] = url.split('://');

	switch (protocol) {
		case 'http':
		case 'https': {
			return loadRemote(url);
		}

		case 'progressive': {
			return loadLocal(rest);
		}

		default: {
			return {
				success: false,
				did: [new Error('Unknown protocol!')],
			} as const;
		}
	}
};

export const build = async (urls: string[]) => {
	const built = {
		positive: new Node(),
		negative: new Node(),
	};
	const files = await Promise.all(urls.map(url => load(url)));
	const refined = files
		.filter((file): file is { success: true, did: string } => file.success);

	for (let i = 0; i < refined.length; i++) {
		refined[i].did
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
