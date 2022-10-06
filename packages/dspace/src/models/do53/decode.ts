import {pick, range} from 'buffertly';
import {EClass, EFlag, EOperationCode, EProtocol, EQueryOrResponse, EResourceRecord, EResponseCode} from './definition.js';

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

	return [index, question] as const;
};

export type TQuestionSection = ReturnType<typeof questionSection>[1]

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3
export interface IResourceRecord {
	domain: string,
	type: EResourceRecord,
	unit: EClass,
	ttl: number
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

export interface IResourceRecordOfSoa extends IResourceRecord {
	type: EResourceRecord.SOA,
	resourceData: {
		mainDomain: string,
		representativeName: string,
		serial: number,
		refreshIn: number,
		retryIn: number,
		expireIn: number,
		minimumTtl: number
	}
}

export interface IResourceRecordOfTxt extends IResourceRecord {
	type: EResourceRecord.TXT,
	resourceData: string
}

export interface IResourceRecordOfWks extends IResourceRecord {
	type: EResourceRecord.WKS,
	resourceData: {
		address: [number, number, number, number],
		protocol: EProtocol,
		ports: number[]
	}
}

/**
 * Note that NULL record is not handled.
 */
export interface IResourceRecordOfNull extends IResourceRecord {
	type: EResourceRecord.NULL,
	resourceData: number[]
}

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
	} as const;

	switch (type) {
		case EResourceRecord.A:
		{
			if (unit !== EClass.Internet) {
				throw new Error('An A resource record only accepts EClass.Internet!');
			}

			const resourceData = [
				range(buffer, index, 8),
				range(buffer, index + 8, 8),
				range(buffer, index + 16, 8),
				range(buffer, index + 24, 8),
			];

			return [
				index + 32,
				{
					...resourceRecord,
					type,
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

			return [
				afterResourceData,
				{
					...resourceRecord,
					type,
					resourceData,
				} as IResourceRecordOfCname | IResourceRecordOfMb | IResourceRecordOfMg | IResourceRecordOfMr | IResourceRecordOfNs | IResourceRecordOfPtr,
			] as const;
		}

		case EResourceRecord.HINFO:
		{
			const [afterCpu, cpu] = readArbitraryText(buffer, index, resourceDataLength);
			const [afterOperatingSystem, operatingSystem] = readArbitraryText(buffer, afterCpu, resourceDataLength);

			return [
				afterOperatingSystem,
				{
					...resourceRecord,
					type,
					resourceData: {
						cpu,
						operatingSystem,
					},
				} as IResourceRecordOfHinfo,
			] as const;
		}

		case EResourceRecord.MINFO:
		{
			const [afterRmailbox, rmailbox] = readArbitraryLabel(buffer, index);
			const [afterEmailbox, emailbox] = readArbitraryLabel(buffer, afterRmailbox);

			return [
				afterEmailbox,
				{
					...resourceRecord,
					type,
					resourceData: {
						receiveMailbox: rmailbox,
						errorMailbox: emailbox,
					},
				} as IResourceRecordOfMinfo,
			] as const;
		}

		case EResourceRecord.MX:
		{
			const preference = range(buffer, index, 16);
			index += 16;

			const [afterDomain, domain] = readArbitraryLabel(buffer, index);

			return [
				afterDomain,
				{
					...resourceRecord,
					type,
					resourceData: {
						preference,
						domain,
					},
				} as IResourceRecordOfMx,
			] as const;
		}

		case EResourceRecord.SOA:
		{
			const [afterMainDomain, mainDomain] = readArbitraryLabel(buffer, index);
			const [afterRepresentativeName, representativeName] = readArbitraryLabel(buffer, afterMainDomain);

			const serial = range(buffer, afterRepresentativeName, 32);
			index = afterRepresentativeName + 32;

			const refreshIn = range(buffer, index, 32);
			index += 32;

			const retryIn = range(buffer, index, 32);
			index += 32;

			const expireIn = range(buffer, index, 32);
			index += 32;

			const minimumTtl = range(buffer, index, 32);

			return [
				index + 32,
				{
					...resourceRecord,
					type,
					resourceData: {
						mainDomain,
						representativeName,
						serial,
						refreshIn,
						retryIn,
						expireIn,
						minimumTtl,
					},
				} as IResourceRecordOfSoa,
			] as const;
		}

		case EResourceRecord.TXT:
		{
			const [afterResourceData, resourceData] = readArbitraryText(buffer, index);

			return [
				afterResourceData,
				{
					...resourceRecord,
					type,
					resourceData,
				} as IResourceRecordOfTxt,
			] as const;
		}

		case EResourceRecord.WKS:
		{
			const address = [
				range(buffer, index, 8),
				range(buffer, index + 8, 8),
				range(buffer, index + 16, 8),
				range(buffer, index + 24, 8),
			];
			index += 32;

			const protocol = range(buffer, index, 8);
			index += 8;

			const ports: number[] = [];

			for (let i = 0; i < 65536; i++) {
				try {
					if (pick(buffer, index++)) {
						ports.push(i);
					}
				// eslint-disable-next-line no-unused-vars
				} catch (error) {
					break;
				}
			}

			return [
				Math.ceil(index / 8) * 8, // Normalize the length of dynamic bitmap.
				{
					...resourceRecord,
					type,
					resourceData: {
						address,
						protocol,
						ports,
					},
				} as IResourceRecordOfWks,
			] as const;
		}

		default: {
			return [
				index + (resourceDataLength * 8),
				resourceRecord as IResourceRecord,
			] as never;
		}
	}
};

export type TResourceRecord = ReturnType<typeof resourceRecord>[1]

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

export type TRequest = ReturnType<typeof request>[1]
