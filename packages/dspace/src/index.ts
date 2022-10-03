import {createServer, header, questionSection} from './models/do53.js';

export const create = () => {
	const {server, stop} = createServer();
	const dspace = {
		server,
		stop,
	};

	server.on('message', (message, remote) => {
		console.log(message, 'from', remote.address, remote.port);

		const [index, request] = header(message);

		console.log(request);
		console.log(questionSection(message, index)[1]);
	});

	return dspace;
};
