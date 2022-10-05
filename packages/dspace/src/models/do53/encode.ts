import {octets} from 'buffertly';
import {TQuestionSection, TRequest, TResourceRecord} from './decode.js';
import {EResourceRecordType} from './definition.js';

export const header = (data: TRequest) => octets([
	[data.identifier, 16],
	[data.type, 1],
	[data.operation, 4],
	[data.flag.authorized, 1],
	[data.flag.truncated, 1],
	[data.flag.recursionDesired, 1],
	[data.flag.recursionAvailable, 1],
	[0, 1],
	[data.flag.authenticData, 1],
	[data.flag.checkingDisabled, 1],
	[data.responseCode, 4],
	[data.count.query, 16],
	[data.count.answer, 16],
	[data.count.nameserver, 16],
	[data.count.additional, 16],
]);

export const questionSection = (data: TQuestionSection) => octets([
	...(data.domain + '\0').split('').map(char => [char.charCodeAt(0), 8] as const),
	[data.record, 16],
	[data.unit, 16],
]);

export const resourceRecord = (data: TResourceRecord) => {
	const fragments: (readonly [number, number])[] = [
		...(data.domain + '\0').split('').map(char => [char.charCodeAt(0), 8] as const),
		[data.type, 16],
		[data.unit, 16],
		[data.ttl, 32],
	];

	switch (data.type) {
		case EResourceRecordType.A: {
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
