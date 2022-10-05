import {decode} from './models/do53/index.js';
import {createServer} from './models/do53/server.js';

export const create = () => {
	const {server, stop} = createServer();
	const dspace = {
		server,
		stop,
	};

	server.on('message', (message, remote) => {
		console.log(message, 'from', remote.address, remote.port);

		const request = decode.request(message);

		console.log(JSON.stringify(request[1], null, 2));
	});

	return dspace;
};
