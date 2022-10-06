import {EClass, EFlag, EQueryOrResponse, EResourceRecord, EResponseCode} from './models/do53/definition.js';
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
		const response = encode.request(
			{
				identifier: request.header.identifier,
				isResponse: EQueryOrResponse.Response,
				operationCode: request.header.operationCode,
				flag: {
					isAuthorized: EFlag.Disabled,
					isTruncated: EFlag.Disabled,
					isRecursionDesired: EFlag.Disabled,
					isRecursionAvailable: EFlag.Disabled,
				},
				responseCode: EResponseCode.NoError,
				count: {
					question: request.header.count.question,
					answer: 1,
					nameserver: 0,
					additionalResources: 0,
				},
			},
			{
				questions: request.questions,
				answers: [
					{
						domain: 'google.com',
						type: EResourceRecord.A,
						unit: EClass.Internet,
						ttl: 60,
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
