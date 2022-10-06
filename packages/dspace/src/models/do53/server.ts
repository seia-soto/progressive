import dgram, {RemoteInfo, Socket} from 'node:dgram';
import * as decode from './decode.js';
import {EClass, EFlag, EOperationCode, EQueryOrResponse, EResourceRecord, EResponseCode} from './definition.js';
import * as encode from './encode.js';

export interface IResponse {
	records: decode.TResourceRecord[],
	flags: decode.THeader['flag'],
}

/* eslint-disable no-unused-vars */
export type THandler = (
	connection: {
		server: Socket,
		message: Buffer,
		remote: RemoteInfo
	},
	request: decode.TRequest,
	response: IResponse
) => Promise<void> | void
/* eslint-enable no-unused-vars */

export const createForwardingHandler = (
	upstream: string,
) => {
	const queryUpstream = (type: EResourceRecord, domain: string) => new Promise<decode.TResourceRecord[]>((resolve, reject) => {
		const identifier = Math.random() * 65535;
		const query = encode.request({
			identifier,
			isResponse: EQueryOrResponse.Query,
			operationCode: EOperationCode.Query,
			flag: {
				isAuthorized: 0,
				isTruncated: 0,
				isRecursionDesired: 0,
				isRecursionAvailable: 0,
			},
			responseCode: EResponseCode.NoError,
			count: {
				question: 1,
				answer: 0,
				nameserver: 0,
				additionalResources: 0,
			},
		}, {
			questions: [{
				domain,
				type,
				class: EClass.Internet,
			}],
			answers: [],
			nameservers: [],
			additionalResources: [],
		});

		const socket = dgram.createSocket('udp4');

		socket.once('message', answer => {
			const [, result] = decode.request(answer);

			socket.close(() => resolve(result.answers));
		});
		socket.send(Buffer.from(query), 53, upstream, error => {
			console.log('[forward] sent request to ' + upstream);

			if (error) {
				reject(error);
			}
		});
	});

	const handler: THandler = async (connection, request, response) => {
		const answers = await Promise.all(request.questions.map(question => queryUpstream(question.type, question.domain)));

		console.log(JSON.stringify(answers, null, 2));

		answers.forEach(entries => response.records.push(...entries));
	};

	return handler;
};

export const createServer = (handlers: THandler[]) => {
	const abortController = new AbortController();
	const server = dgram.createSocket({
		type: 'udp4',
		signal: abortController.signal,
	});

	server.on('message', async (message, remote) => {
		const [, request] = decode.request(Buffer.from(message));

		console.log(`[request] ${request.header.identifier} from ${remote.address}:${remote.port}`);

		const response: IResponse = {
			flags: {
				isAuthorized: EFlag.Disabled,
				isTruncated: EFlag.Disabled,
				isRecursionDesired: EFlag.Disabled,
				isRecursionAvailable: EFlag.Disabled,
			},
			records: [],
		};

		for (let i = 0; i < handlers.length; i++) {
			await handlers[i](
				{
					server,
					message,
					remote,
				},
				request,
				response,
			);
		}

		const packet = encode.request(
			{
				identifier: request.header.identifier,
				isResponse: EQueryOrResponse.Response,
				operationCode: request.header.operationCode,
				flag: response.flags,
				responseCode: EResponseCode.NoError,
				count: {
					question: request.header.count.question,
					answer: response.records.length,
					nameserver: 0,
					additionalResources: 0,
				},
			},
			{
				questions: request.questions,
				answers: response.records,
				nameservers: [],
				additionalResources: [],
			},
		);

		server.send(Buffer.from(packet), remote.port, remote.address, error => {
			if (error) {
				console.error(error);
			}
		});
	});

	return {
		server,
		stop: abortController.abort,
	};
};
