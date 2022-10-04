import {EClassType, EFlagType, EOperationType, EQueryType, EResourceRecordType, EResponseType} from './definition.js';

/**
 * Read a single bit from buffer
 * @param buffer The buffer object
 * @param offset The offset in bits
 */
export const pick = (buffer: Buffer, offset: number): number => (buffer[offset >> 3] >> (7 - offset & 7)) & 1;

export const range = (buffer: Buffer, offset: number, size: number): number => {
	let value = 0x0;

	for (let i = 0; i < size; i++) {
		if (pick(buffer, offset + i)) {
			value |= 2 ** i;
		}
	}

	return value;
};

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
export const header = (buffer: Buffer) => {
	let index = 0;

	const identifier = buffer.readUInt16BE(index);
	index += 16;

	const type: EQueryType = pick(buffer, index++);

	const operation: EOperationType = range(buffer, index, 4);
	index += 4;

	const authorized: EFlagType = pick(buffer, index++);

	const truncated: EFlagType = pick(buffer, index++);

	const recursionDesired: EFlagType = pick(buffer, index++);

	const recursionAvailable: EFlagType = pick(buffer, index++);

	// Z: Reserved for future
	index += 1;

	const authenticData: EFlagType = pick(buffer, index++);

	const checkingDisabled: EFlagType = pick(buffer, index++);

	const responseCode: EResponseType = range(buffer, index, 4);
	index += 4;

	const query = buffer.readUInt16BE(index / 8);
	index += 16;

	const answer = buffer.readUint16BE(index / 8);
	index += 16;

	const nameserver = buffer.readUint16BE(index / 8);
	index += 16;

	const additional = buffer.readUint16BE(index / 8);
	index += 16;

	const request = {
		identifier,
		type,
		operation,
		flag: {
			authorized,
			truncated,
			recursionDesired,
			recursionAvailable,
			authenticData,
			checkingDisabled,
		},
		responseCode,
		count: {
			query,
			answer,
			nameserver,
			additional,
		},
	};

	return [index, request] as const;
};

export type TRequest = ReturnType<typeof header>[1]

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
		const charCode = buffer.readUint8(index);
		index += 1;

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

	const record: EResourceRecordType = buffer.readUint16BE(index);
	index += 2;

	const unit: EClassType = buffer.readUint16BE(index);
	index += 2;

	const question = {
		record,
		domain,
		unit,
	};

	return [index * 8, question] as const;
};

export type TQuestionSection = ReturnType<typeof questionSection>[1]

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3
export const resourceRecord = (buffer: Buffer, offset: number) => {
	let index = Math.floor(offset / 8);

	const [afterDomain, domain] = readArbitraryText(buffer, index);
	index = afterDomain;

	const type: EResourceRecordType = buffer.readUint16BE(index);
	index += 2;

	const unit: EClassType = buffer.readUint16BE(index);
	index += 2;

	const ttl = buffer.readUint32BE(index);
	index += 4;

	const resourceDataLength = buffer.readUint16BE(index);
	index += 2;

	const [afterData, resourceData] = readArbitraryText(buffer, index, resourceDataLength);
	index = afterData;

	const resourceRecord = {
		domain,
		type,
		unit,
		ttl,
		resourceDataLength,
		resourceData,
	};

	return [index * 8, resourceRecord] as const;
};

export type TResourceRecord = ReturnType<typeof resourceRecord>[1]
