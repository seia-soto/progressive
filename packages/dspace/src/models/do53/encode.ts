import {octets} from 'buffertly';
import {THeader, TQuestionSection, TResourceRecord} from './decode.js';
import {EResourceRecord} from './definition.js';

export const header = (data: THeader) => octets([
	[data.identifier, 16],
	[data.isResponse, 1],
	[data.operationCode, 4],
	[data.flag.isAuthorized, 1],
	[data.flag.isTruncated, 1],
	[data.flag.isRecursionDesired, 1],
	[data.flag.isRecursionAvailable, 1],
	[0, 3],
	[data.responseCode, 4],
	[data.count.question, 16],
	[data.count.answer, 16],
	[data.count.nameserver, 16],
	[data.count.additionalResources, 16],
]);

export const questionSection = (data: TQuestionSection) => octets([
	...(data.domain + '\0').split('').map(char => [char.charCodeAt(0), 8] as const),
	[data.type, 16],
	[data.class, 16],
]);

export const resourceRecord = (data: TResourceRecord) => {
	const fragments: (readonly [number, number])[] = [
		...(data.domain + '\0').split('').map(char => [char.charCodeAt(0), 8] as const),
		[data.type, 16],
		[data.unit, 16],
		[data.ttl, 32],
	];

	switch (data.type) {
		case EResourceRecord.A: {
			fragments.push(
				[32, 16],
				...data.resourceData.map(entry => [entry, 8] as const),
			);

			break;
		}

		default: {
			fragments.push([data.resourceDataLength, 16]);

			break;
		}
	}

	return octets(fragments);
};

export const request = (
	_header: THeader,
	fields: {
		questions: TQuestionSection[], answers: TResourceRecord[], nameservers: TResourceRecord[], additionalResources: TResourceRecord[]
	},
) => {
	const {questions, answers, nameservers, additionalResources} = fields;
	const source = [...header(_header)];

	for (let i = 0; i < questions.length; i++) {
		source.push(...questionSection(questions[i]));
	}

	for (let i = 0; i < answers.length; i++) {
		source.push(...resourceRecord(answers[i]));
	}

	for (let i = 0; i < nameservers.length; i++) {
		source.push(...resourceRecord(nameservers[i]));
	}

	for (let i = 0; i < additionalResources.length; i++) {
		source.push(...resourceRecord(additionalResources[i]));
	}

	return source;
};
