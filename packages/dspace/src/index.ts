import {createSocket} from 'dgram';
import {header, IResourceRecordOfA, questionSection, resourceRecord, TRequest} from './models/do53/decode.js';
import {EClassType, EFlagType, EOperationType, EQueryType, EResourceRecordType, EResponseType} from './models/do53/definition.js';
import * as encode from './models/do53/encode.js';
import {createServer} from './models/do53/server.js';

export const create = () => {
	const {server, stop} = createServer();
	const dspace = {
		server,
		stop,
	};

	server.on('message', (message, remote) => {
		console.log(message, 'from', remote.address, remote.port);

		let index = 0;
		const [questionIndex, request] = header(message);
		index = questionIndex;

		console.log('----> incoming request');
		console.log(request);

		for (let i = 0; i < request.count.query; i++) {
			const [next, question] = questionSection(message, index);
			index = next;

			if (question.record === EResourceRecordType.A) {
				const head: TRequest = {
					identifier: request.identifier,
					type: EQueryType.Response,
					operation: EOperationType.Query,
					flag: {
						authorized: EFlagType.Disabled,
						truncated: EFlagType.Disabled,
						recursionDesired: EFlagType.Disabled,
						recursionAvailable: EFlagType.Disabled,
						authenticData: EFlagType.Disabled,
						checkingDisabled: EFlagType.Disabled,
					},
					responseCode: EResponseType.NoError,
					count: {
						query: 0,
						answer: 1,
						nameserver: 0,
						additional: 0,
					},
				};
				const rr: IResourceRecordOfA = {
					domain: question.domain,
					type: EResourceRecordType.A,
					unit: EClassType.Internet,
					ttl: 1,
					resourceData: [127, 0, 0, 1],
					resourceDataLength: 32,
				};

				console.log('<---- outgoing response');

				const response = Buffer.from([...encode.header(head), ...encode.resourceRecord(rr)]);

				const [di, responseSample] = header(response);

				console.log(response, responseSample, resourceRecord(response, di));

				const client = createSocket('udp4');

				client.send(response, remote.port, remote.address, err => {
					console.error(err);

					client.close();
				});
			}
		}
	});

	return dspace;
};
