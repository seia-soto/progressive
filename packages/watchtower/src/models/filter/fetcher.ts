import got, {Progress} from 'got';
import derive from '../error/derive.js';

export const downloadLimit = 2 * 1000 * 1000; // 2MB

export const instance = got.extend({
	headers: {
		'user-agent': 'seia-soto/progressive',
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
			const instance = next(options);

			if (typeof downloadLimit === 'number') {
				// @ts-expect-error
				instance.on('downloadProgress', (progress: Progress) => {
					if (progress.transferred > downloadLimit && progress.percent !== 1) {
						// @ts-expect-error
						instance.cancel();
					}
				});
			}

			return instance;
		},
	],
	context: {
		downloadLimit,
	},
});

export const load = async (url: string) => {
	const [, head] = await derive(instance.head(url));

	if (
		head
		&& parseInt(head.headers['content-length'] ?? '', 10) > downloadLimit
	) {
		return '';
	}

	const [, response] = await derive(instance.get(url).text());

	return response || '';
};
