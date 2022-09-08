import got, {Response, Progress} from 'got';

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

export type TGotResponseFailable = (string | (void | Response<string>)) | false

export const load = async (url: string) => {
	let head: TGotResponseFailable = await instance.head(url)
		.catch(() => {
			head = false;
		});

	if (
		head
		&& parseInt(head.headers['content-length'] ?? '', 10) > downloadLimit
	) {
		return '';
	}

	let response: TGotResponseFailable = await instance.get(url).text()
		.catch(() => {
			response = false;
		});

	return response;
};
