import {pick, range} from 'buffertly';
import {EClass, EFlag, EOperationCode, EQueryOrResponse, EResourceRecord, EResponseCode} from './definition.js';

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
export const header = (buffer: Buffer) => {
	let index = 0;

	const identifier = buffer.readUInt16BE(index);
	index += 16;

	const isResponse: EQueryOrResponse = pick(buffer, index++);

	const operationCode: EOperationCode = range(buffer, index, 4);
	index += 4;

	const isAuthorized: EFlag = pick(buffer, index++);

	const isTruncated: EFlag = pick(buffer, index++);

	const isRecursionDesired: EFlag = pick(buffer, index++);

	const isRecursionAvailable: EFlag = pick(buffer, index++);

	// Z: Reserved for future
	index += 3;

	const responseCode: EResponseCode = range(buffer, index, 4);
	index += 4;

	const question = buffer.readUInt16BE(index / 8);
	index += 16;

	const answer = buffer.readUint16BE(index / 8);
	index += 16;

	const nameserver = buffer.readUint16BE(index / 8);
	index += 16;

	const additionalResources = buffer.readUint16BE(index / 8);
	index += 16;

	const request = {
		identifier,
		isResponse,
		operationCode,
		flag: {
			isAuthorized,
			isTruncated,
			isRecursionDesired,
			isRecursionAvailable,
		},
		responseCode,
		count: {
			question,
			answer,
			nameserver,
			additionalResources,
		},
	};

	return [index, request] as const;
};

export type THeader = ReturnType<typeof header>[1]

/**
 * Read an arbitrary text from buffer ending with null terminator
 * @param buffer The buffer object
 * @param offsetBytes The offset in bytes (multiply 8 from bits)
 * @returns The updated offset in bytes (divde by 8 to bits)
 */
export const readArbitraryText = (buffer: Buffer, offsetBytes: number, size?: number) => {
	let index = Math.floor(offsetBytes);

	const specials: Record<number, string> = {
		3: '.',
		6: '', // ACK in ASCII table but not known yet
	};
	let text = '';

	for (let i = 0; ;) {
		const charCode = buffer.readUint8(index++);

		if (
			!charCode
      || (size && i >= size)
		) {
			break;
		}

		text += specials[charCode] ?? String.fromCharCode(charCode);
	}

	return [index, text] as const;
};

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.2
export const questionSection = (buffer: Buffer, offset: number) => {
	let index = Math.floor(offset / 8);

	const [position, domain] = readArbitraryText(buffer, index);
	index = position;

	const type: EResourceRecord = buffer.readUint16BE(index);
	index += 2;

	const _class: EClass = buffer.readUint16BE(index);
	index += 2;

	const question = {
		domain,
		type,
		class: _class,
	};

	return [index * 8, question] as const;
};

export type TQuestionSection = ReturnType<typeof questionSection>[1]

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3
export interface IResourceRecord {
	domain: string,
	type: EResourceRecord,
	unit: EClass,
	ttl: number,
	resourceDataLength: number,
}

export interface IResourceRecordOfA extends IResourceRecord {
	type: EResourceRecord.A,
	resourceData: [number, number, number, number]
}

export type TResourceRecord = IResourceRecordOfA

export const resourceRecord = (buffer: Buffer, offset: number) => {
	let index = Math.floor(offset / 8);

	// Handle pointer
	let restorationPoint = -1;

	if (pick(buffer, index) + pick(buffer, index + 1) === 2) {
		restorationPoint = index;
		index = range(buffer, index + 2, 14);
	}

	const [afterDomain, domain] = readArbitraryText(buffer, index);
	index = afterDomain;

	if (restorationPoint >= 0) {
		index = restorationPoint;
	}

	const type: EResourceRecord = buffer.readUint16BE(index);
	index += 2;

	const unit: EClass = buffer.readUint16BE(index);
	index += 2;

	const ttl = buffer.readUint32BE(index);
	index += 4;

	const resourceDataLength = buffer.readUint16BE(index);
	index += 2;

	const resourceRecord = {
		domain,
		type,
		unit,
		ttl,
		resourceDataLength,
	} as const;

	switch (type) {
		case EResourceRecord.A: {
			if (resourceDataLength !== 32) {
				throw new Error('The RDLENGTH field of A record should be 32!');
			}

			const resourceData = [
				buffer.readUint8(index++),
				buffer.readUint8(index++),
				buffer.readUint8(index++),
				buffer.readUint8(index++),
			];

			return [
				index * 8,
				{
					...resourceRecord,
					type: EResourceRecord.A,
					resourceData,
				} as const,
			] as const;
		}
	}

	return [index * 8, resourceRecord] as const;
};

/**
 * This type is used to get fully typed output of resourceRecord function instead of a pre-defined set with the resourceRecordData standards.
 */
export type TArbitraryResourceRecord = ReturnType<typeof resourceRecord>[1]

export const request = (buffer: Buffer) => {
	const [afterHeader, meta] = header(buffer);

	const questions: TQuestionSection[] = [];
	let afterQuestions = afterHeader;

	for (let i = 0; i < meta.count.question; i++) {
		const [nextOffset, question] = questionSection(buffer, afterQuestions);

		questions.push(question);
		afterQuestions = nextOffset;
	}

	const answers: TResourceRecord[] = [];
	let afterAnswers = afterQuestions;

	for (let i = 0; i < meta.count.answer; i++) {
		const [nextOffset, answer] = resourceRecord(buffer, afterAnswers);

		answers.push(answer as TResourceRecord);
		afterAnswers = nextOffset;
	}

	const nameservers: TResourceRecord[] = [];
	let afterNameservers = afterAnswers;

	for (let i = 0; i < meta.count.nameserver; i++) {
		const [nextOffset, answer] = resourceRecord(buffer, afterAnswers);

		nameservers.push(answer as TResourceRecord);
		afterNameservers = nextOffset;
	}

	const additionalResources: TResourceRecord[] = [];
	let afterAdditionalResources = afterNameservers;

	for (let i = 0; i < meta.count.additionalResources; i++) {
		const [nextOffset, answer] = resourceRecord(buffer, afterAnswers);

		additionalResources.push(answer as TResourceRecord);
		afterAdditionalResources = nextOffset;
	}

	const _request = {
		header: meta,
		questions,
		answers,
		nameservers,
		additionalResources,
	} as const;

	return [afterAdditionalResources, _request] as const;
};

export type TRequest = ReturnType<typeof request>
