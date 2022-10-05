import {EClass, EQueryOrResponse, EResourceRecord} from './models/do53/definition.js';
import {decode, encode} from './models/do53/index.js';
import {createServer} from './models/do53/server.js';

export const create = () => {
	const {server, stop} = createServer();
	const dspace = {
		server,
		stop,
	};

	server.on('message', (message, remote) => {
		console.log(message, 'from', remote.address, remote.port);

		const [, request] = decode.request(message);

		request.header.isResponse = EQueryOrResponse.Response;

		const response = encode.request(
			request.header,
			{
				questions: [],
				answers: [
					{
						domain: 'google.com',
						type: EResourceRecord.A,
						unit: EClass.Internet,
						ttl: 60,
						resourceDataLength: 32,
						resourceData: [127, 0, 0, 1],
					},
				],
				nameservers: [],
				additionalResources: [],
			},
		);

		server.send(Buffer.from(response), remote.port, remote.address, error => {
			if (error) {
				console.error(error);
			}

			console.log('response sent');
		});
	});

	return dspace;
};
