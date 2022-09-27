import got, {Progress} from 'got';
import derive from './error/derive.js';

export const downloadLimit = 2 * 1000 * 1000; // 2MB

export const fetcher = got.extend({
	headers: {
		'user-agent': 'seia-soto/progressive (a DNS server)',
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

                        // TODO: throw an Error here to handle the download size limit error!
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
	const [, head] = await derive(fetcher.head(url));

	if (
		head
		&& parseInt(head.headers['content-length'] ?? '', 10) > downloadLimit
	) {
		return '';
	}

	const [, response] = await derive(fetcher.get(url).text());

	return response || '';
};
