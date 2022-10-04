import {header, questionSection, resourceRecord, TQuestionSection, TResourceRecord} from './models/do53/decode.js';
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

		const questions: TQuestionSection[] = [];

		for (let i = 0; i < request.count.query; i++) {
			const [next, question] = questionSection(message, index);
			index = next;

			questions.push(question);
		}

		const resourceRecords: TResourceRecord[] = [];

		for (let i = 0; i < request.count.answer; i++) {
			const [next, record] = resourceRecord(message, index);
			index = next;

			resourceRecords.push(record);
		}

		console.log({
			request,
			questions,
			resourceRecords,
		});

		console.log('------');
		console.log(
			header(Buffer.from(encode.header(request))),
		);
	});

	return dspace;
};
