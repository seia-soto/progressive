import dgram from 'node:dgram';

// TODO: API will change for better use
export const createServer = () => {
	const controller = new AbortController();
	const server = dgram.createSocket({
		type: 'udp4',
		signal: controller.signal,
	});

	return {
		server,
		stop: controller.abort,
	};
};
