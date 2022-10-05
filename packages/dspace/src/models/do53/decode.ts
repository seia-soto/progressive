import {pick, range} from 'buffertly';
import {EClass, EFlag, EOperationCode, EQueryOrResponse, EResourceRecord, EResponseCode} from './definition.js';

/**
 * Read an arbitrary labels from buffer ending with null terminator
 * @param buffer The buffer object
 * @param offset The offset
 * @returns The new offset
 */
export const readArbitraryLabel = (buffer: Buffer, offset: number) => {
	let index = offset;
	let text = '';
	let restorationPoint = 0;

	if ((pick(buffer, index) + pick(buffer, index + 1)) === 2) {
		restorationPoint = index + 16;
		index = range(buffer, index + 2, 14);
	}

	for (; ;) {
		const labelSize = range(buffer, index, 8);
		index += 8;

		if (!labelSize) {
			break;
		}

		text += '.';

		for (let i = 0; i < labelSize; i++) {
			const charCode = range(buffer, index, 8);
			index += 8;

			text += String.fromCharCode(charCode);
		}
	}

	if (restorationPoint) { // When restorationPoint set, it's always starts from 16.
		index = restorationPoint;
	}

	return [index, text.slice(1)] as const;
};

/**
 * Read an arbitrary text from buffer ending with null terminator
 * @param buffer The buffer object
 * @param offset The offset
 * @returns The new offset
 */
export const readArbitraryText = (buffer: Buffer, offset: number, size?: number) => {
	let index = offset;
	let text = '';

	for (let i = 0; ;) {
		const charCode = range(buffer, index, 8);
		index += 8;

		if (
			!charCode
			|| (size && i >= size)
		) {
			break;
		}

		text += String.fromCharCode(charCode);
	}

	return [index, text] as const;
};

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
export const header = (buffer: Buffer) => {
	let index = 0;

	const identifier = range(buffer, index, 16);
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

	const question = range(buffer, index, 16);
	index += 16;

	const answer = range(buffer, index, 16);
	index += 16;

	const nameserver = range(buffer, index, 16);
	index += 16;

	const additionalResources = range(buffer, index, 16);
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

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.2
export const questionSection = (buffer: Buffer, offset: number) => {
	let index = offset;

	const [position, domain] = readArbitraryLabel(buffer, index);
	index = position;

	const type: EResourceRecord = range(buffer, index, 16);
	index += 16;

	const _class: EClass = range(buffer, index, 16);
	index += 16;

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

export interface IResourceRecordOfCname extends IResourceRecord {
	type: EResourceRecord.CNAME,
	resourceData: string
}

export interface IResourceRecordOfHinfo extends IResourceRecord {
	type: EResourceRecord.HINFO,
	resourceData: {
		cpu: string,
		operatingSystem: string
	}
}

export interface IResourceRecordOfMb extends IResourceRecord {
	type: EResourceRecord.MB,
	resourceData: string
}

export interface IResourceRecordOfMg extends IResourceRecord {
	type: EResourceRecord.MG,
	resourceData: string
}

export interface IResourceRecordOfMinfo extends IResourceRecord {
	type: EResourceRecord.MINFO,
	resourceData: {
		receiveMailbox: string,
		errorMailbox: string
	}
}

export interface IResourceRecordOfMr extends IResourceRecord {
	type: EResourceRecord.MR,
	resourceData: string
}

export interface IResourceRecordOfMx extends IResourceRecord {
	type: EResourceRecord.MX,
	resourceData: {
		preference: number,
		domain: string
	}
}

export interface IResourceRecordOfNs extends IResourceRecord {
	type: EResourceRecord.NS,
	resourceData: string
}

export interface IResourceRecordOfPtr extends IResourceRecord {
	type: EResourceRecord.PTR,
	resourceData: string
}

/**
 * Note that NULL record is not handled.
 */
export interface IResourceRecordOfNull extends IResourceRecord {
	type: EResourceRecord.NULL,
	resourceData: number[]
}

export type TResourceRecord = IResourceRecordOfA
	| IResourceRecordOfCname
  | IResourceRecordOfHinfo
	| IResourceRecordOfMb
	| IResourceRecordOfMg
	| IResourceRecordOfMinfo
	| IResourceRecordOfMr
	| IResourceRecordOfMx
	| IResourceRecordOfNs
	| IResourceRecordOfPtr

export const resourceRecord = (buffer: Buffer, offset: number) => {
	let index = offset;

	const [afterDomain, domain] = readArbitraryLabel(buffer, index);
	index = afterDomain;

	const type: EResourceRecord = range(buffer, index, 16);
	index += 16;

	const unit: EClass = range(buffer, index, 16);
	index += 16;

	const ttl = range(buffer, index, 32);
	index += 32;

	const resourceDataLength = range(buffer, index, 16);
	index += 16;

	const resourceRecord = {
		domain,
		type,
		unit,
		ttl,
		resourceDataLength,
	} as const;

	switch (type) {
		case EResourceRecord.A:
		{
			if (resourceDataLength !== 4) {
				throw new Error('The RDLENGTH field of A record should be 4!');
			}

			const resourceData = [
				range(buffer, index, 8),
				range(buffer, index + 8, 8),
				range(buffer, index + 16, 8),
				range(buffer, index + 24, 8),
			];
			index += 32;

			return [
				index,
				{
					...resourceRecord,
					type: EResourceRecord.A,
					resourceData,
				} as IResourceRecordOfA,
			] as const;
		}

		case EResourceRecord.CNAME:
		case EResourceRecord.MB:
		case EResourceRecord.MG:
		case EResourceRecord.MR:
		case EResourceRecord.NS:
		case EResourceRecord.PTR:
		{
			const [afterResourceData, resourceData] = readArbitraryLabel(buffer, index);
			index = afterResourceData;

			return [
				index,
				{
					...resourceRecord,
					type: EResourceRecord.CNAME,
					resourceData,
				} as IResourceRecordOfCname,
			] as const;
		}

		case EResourceRecord.HINFO:
		{
			const [afterCpu, cpu] = readArbitraryText(buffer, index, resourceDataLength);
			const [afterOperatingSystem, operatingSystem] = readArbitraryText(buffer, afterCpu, resourceDataLength);
			index = afterOperatingSystem;

			return [
				index,
				{
					...resourceRecord,
					type: EResourceRecord.HINFO,
					resourceData: {
						cpu,
						operatingSystem,
					},
				} as IResourceRecordOfHinfo,
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
