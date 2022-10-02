import * as filter from 'filter';
import {Node} from 'vertical-radix';
import {listCache} from '../../states/cache.js';
import derive from '../error/derive.js';
import {downloadLimit, fetcher} from './binary.js';
import {pull} from './user.js';

export const loadRemote = async (url: string) => {
	const cache = listCache.get(url);

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

	listCache.set(url, response);

	return response;
};

export const loadLocal = async (id: string): Promise<string> => {
	const [error, out] = await derive(pull(id));

	if (error) {
		return '';
	}

	return out;
};

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
			return '';
		}
	}
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
