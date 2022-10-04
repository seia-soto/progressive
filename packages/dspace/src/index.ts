import {createServer} from './models/do53/server.js';

export const create = () => {
	const {server, stop} = createServer();
	const dspace = {
		server,
		stop,
	};

	server.on('message', (message, remote) => {
		console.log(message, 'from', remote.address, remote.port);
	});

	return dspace;
};
