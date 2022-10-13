import {octets, pick, range} from 'buffertly';
import {EClass, EOperationCode, EQueryOrResponse, ERecord, EResourceOrder, EResponseCode, ICounts, IOptions, IPacket, IQuestion, IResource, IResourceOfA, IResourceOfCname, IResourceOfDnskey, IResourceOfDs, IResourceOfHinfo, IResourceOfMx, IResourceOfNs, IResourceOfNsec, IResourceOfPtr, IResourceOfRrsig, IResourceOfSoa, IResourceOfTxt, IResourceOfWks, TBuildablePacket, TBuildableQuestion, TCompressionMap, TFlag, TInternetAddress, TPart, TResources} from './definition.js';

// Pack
export const packText = (text: string): TPart[] => text
	.split('')
	.map(char => [char.charCodeAt(0), 8] as const);

export const packLabel = (text: string, compressionMap: TCompressionMap): TPart[] => {
	const parts: TPart[] = [];
	const labels = text.split('.');

	for (let i = 0; i < labels.length; i++) {
		const compressionKey = labels.slice(i).join('.');

		if (compressionMap[compressionKey]) {
			parts.push(
				[0b11, 2],
				[compressionMap[compressionKey], 14],
			);
			compressionMap.__offset += 16;

			return parts;
		}

		compressionMap[compressionKey] = compressionMap.__offset / 8;
		compressionMap.__offset += 8 + (labels[i].length * 8);

		parts.push(
			[labels[i].length, 8],
			...packText(labels[i]),
		);
	}

	parts.push([0, 8]);
	compressionMap.__offset += 8;

	return parts;
};

export const packQuestion = (q: TBuildableQuestion, compressionMap: TCompressionMap) => {
	const question = [
		...packLabel(q.name, compressionMap),
		[q.type, 16],
		[q.class ?? EClass.Internet, 16],
	] as const;
	compressionMap.__offset += 32;

	return question;
};

// eslint-disable-next-line no-unused-vars
type TPackSpecificResource<IResourceSpecific> = (r: IResourceSpecific, compressionMap: TCompressionMap) => readonly (readonly [number, number])[]

const packResourceOfA: TPackSpecificResource<IResourceOfA> = (r, compressionMap) => {
	compressionMap.__offset += 32;

	return [
		[r.data.size, 16],
		...r.data.source.map(k => [k, 8] as const),
	] as const;
};

const packResourceOfCnameLike: TPackSpecificResource<IResourceOfCname | IResourceOfNs | IResourceOfPtr> = (r, compressionMap) => {
	const label = packLabel(r.data.source, compressionMap);

	return [
		[r.data.size || label.length, 16],
		...label,
	] as const;
};

const packResourceOfHinfo: TPackSpecificResource<IResourceOfHinfo> = (r, compressionMap) => {
	const text = packText(
		r.data.source.cpu + '\0'
		+ r.data.source.os + '\0',
	);
	compressionMap.__offset += text.length * 8;

	return [
		[r.data.size || text.length, 16],
		...text,
	] as const;
};

const packResourceOfMx: TPackSpecificResource<IResourceOfMx> = (r, compressionMap) => {
	compressionMap.__offset += 16;

	const label = packLabel(r.data.source.exchange, compressionMap);

	return [
		[r.data.size || (2 + label.length), 16],
		[r.data.source.preference, 16],
		...label,
	] as const;
};

const packResourceOfSoa: TPackSpecificResource<IResourceOfSoa> = (r, compressionMap) => {
	const name = packLabel(r.data.source.name, compressionMap);
	const representative = packLabel(r.data.source.representative, compressionMap);
	compressionMap.__offset += 32 * 5;

	return [
		[r.data.size || (name.length + representative.length + (4 * 5)), 16],
		...name,
		...representative,
		[r.data.source.serial, 32],
		[r.data.source.refreshIn, 32],
		[r.data.source.retryIn, 32],
		[r.data.source.expireIn, 32],
		[r.data.source.ttl, 32],
	] as const;
};

const packResourceOfTxt: TPackSpecificResource<IResourceOfTxt> = (r, compressionMap) => {
	const text = packText(r.data.source + '\0');
	compressionMap.__offset += text.length * 8;

	return [
		[r.data.size || text.length, 16],
		...text,
	] as const;
};

const packResourceOfWks: TPackSpecificResource<IResourceOfWks> = (r, compressionMap) => {
	const map: TPart[] = [];
	let pushed: number = 0;

	// 65535 - 32 - 8
	for (let i = 0; i < 65495; i++) {
		if (r.data.source.ports.indexOf(i) < 0) {
			map.push([0, 1]);

			continue;
		}

		map.push([1, 1]);

		if (++pushed === r.data.source.ports.length) {
			break;
		}
	}

	compressionMap.__offset += 16 + 32 + 8 + pushed;

	return [
		[4 + 1 + Math.ceil(pushed / 8), 16],
		...r.data.source.address.map(k => [k, 8] as const),
		[r.data.source.protocol, 8],
		...map,
	] as const;
};

const packResourceOfDnskey: TPackSpecificResource<IResourceOfDnskey> = (r, compressionMap) => {
	const publicKey = packText(r.data.source.publicKey);
	compressionMap.__offset += 32 + (publicKey.length * 8);

	return [
		[4 + publicKey.length, 16],
		[0, 7],
		[r.data.source.flags.isZoneKey, 1],
		[0, 7],
		[r.data.source.flags.isSecureEntryPoint, 1],
		[r.data.source.protocol, 8],
		[r.data.source.algorithm, 8],
		...publicKey,
	] as const;
};

const packResourceOfNsec: TPackSpecificResource<IResourceOfNsec> = (r, compressionMap) => {
	const nextName = packLabel(r.data.source.nextName, compressionMap);

	const typeBitMap = r.data.source.typeBitMap.sort((a, b) => a - b);
	const bytes: number[] = [];

	for (let i = 0; i < typeBitMap.length; i++) {
		const recordType = typeBitMap[i];
		const byteIndex = Math.floor(recordType / 8);

		bytes[byteIndex] = (bytes[byteIndex] ?? 0) | 2 ** (7 - (byteIndex % 8));
	}

	const parts: TPart[] = [];

	for (let i = 0, l = bytes.length; i < l; i++) {
		if (!(i % 32) /* 256 / 8 */) {
			parts.push([i / 32, 8]);
			parts.push([(l - i) % 32, 8]);
		}

		parts.push([bytes[i], 8]);
	}

	const size = nextName.length + parts.length;
	compressionMap.__offset += size * 8;

	return [
		[size, 16],
		...nextName,
		...parts,
	] as const;
};

const packResourceOfRrsig: TPackSpecificResource<IResourceOfRrsig> = (r, compressionMap) => {
	const emptyMap = {__offset: compressionMap.__offset};
	const signerName = packLabel(r.data.source.signerName, emptyMap);
	const signature = packText(r.data.source.signature);
	const size = (signerName.length + signature.length) + 18;
	compressionMap.__offset = size * 8;

	return [
		[size / 8, 16],
		[r.data.source.typeCovered, 16],
		[r.data.source.algorithm, 8],
		[r.data.source.labels, 8],
		[r.data.source.originalTtl, 32],
		[r.data.source.signatureExpiration, 32],
		[r.data.source.signatureInception, 32],
		[r.data.source.keyTag, 16],
		...signerName,
		...signature,
	] as const;
};

const packResourceOfDs: TPackSpecificResource<IResourceOfDs> = (r, compressionMap) => {
	const digest = packText(r.data.source.digest);
	const size = digest.length + 4;
	compressionMap.__offset += size * 8;

	return [
		[size, 16],
		[r.data.source.keyTag, 16],
		[r.data.source.algorithm, 8],
		...digest,
	] as const;
};

export const packResource = (r: TResources, compressionMap: TCompressionMap): TPart[] => {
	const parts: TPart[] = [];

	parts.push(
		...packLabel(r.name, compressionMap),
		[r.type, 16],
		[r.class ?? EClass.Internet, 16],
		[r.ttl, 32],
	);
	compressionMap.__offset += 64 + 16; // Append `r.data.size` before they used

	switch (r.type) {
		case ERecord.A:
		{
			return [...parts, ...packResourceOfA(r, compressionMap)];
		}

		case ERecord.CNAME:
		case ERecord.NS:
		case ERecord.PTR:
		{
			return [...parts, ...packResourceOfCnameLike(r, compressionMap)];
		}

		case ERecord.HINFO:
		{
			return [...parts, ...packResourceOfHinfo(r, compressionMap)];
		}

		case ERecord.MX:
		{
			return [...parts, ...packResourceOfMx(r, compressionMap)];
		}

		case ERecord.SOA:
		{
			return [...parts, ...packResourceOfSoa(r, compressionMap)];
		}

		case ERecord.TXT:
		{
			return [...parts, ...packResourceOfTxt(r, compressionMap)];
		}

		case ERecord.WKS:
		{
			return [...parts, ...packResourceOfWks(r, compressionMap)];
		}

		case ERecord.DNSKEY:
		{
			return [...parts, ...packResourceOfDnskey(r, compressionMap)];
		}

		case ERecord.RRSIG:
		{
			return [...parts, ...packResourceOfRrsig(r, compressionMap)];
		}

		case ERecord.NSEC:
		{
			return [...parts, ...packResourceOfNsec(r, compressionMap)];
		}

		case ERecord.DS:
		{
			return [...parts, ...packResourceOfDs(r, compressionMap)];
		}
	}

	return parts;
};

export const pack = (a: TBuildablePacket): Buffer => {
	const {
		id = Math.floor(Math.random() * 65535),
		isQueryOrResponse,
		operationCode = EOperationCode.Query,
		responseCode = EResponseCode.NoError,
		options = {
			isAuthoritativeAnswer: 0,
			isTruncated: 0,
			isRecursionDesired: 0,
			isRecursionAvailable: 0,
		} as IPacket['options'],
		questions = [] as IPacket['questions'],
		resources = [] as IPacket['resources'],
	} = a;

	const [header, records]: TPart[][] = [
		[
			[id, 16],
			[isQueryOrResponse, 1],
			[operationCode, 4],
			[options.isAuthoritativeAnswer ?? 0, 1],
			[options.isTruncated ?? 0, 1],
			[options.isRecursionDesired ?? 0, 1],
			[options.isRecursionAvailable ?? 0, 1],
			[0, 3],
			[responseCode, 4],
		],
		[],
	];
	const counts = [0, 0, 0];
	const compressionMap: TCompressionMap = {__offset: 96}; // Header ends after 96 bits

	// Add question sections
	for (let i = 0; i < questions.length; i++) {
		records.push(...packQuestion(questions[i], compressionMap));
	}

	// Sections at here are Answer, Authority, Additional
	const sections: [TPart[], TPart[], TPart[]] = [
		[],
		[],
		[],
	];

	for (let i = 0; i < resources.length; i++) {
		const r = resources[i];

		// Fullfill the TResources object
		r.class ??= EClass.Internet;

		counts[r.order]++;
		sections[r.order].push(...packResource(r as TResources, compressionMap));
	}

	// Add sections' data
	records.push(
		...sections[0],
		...sections[1],
		...sections[2],
	);

	// Compose
	const composed: TPart[] = [
		...header,
		...[questions.length, ...counts].map(count => [count, 16] as const),
		...records,
	];

	return Buffer.from(octets(composed));
};

// Unpack
export const unpackLabel = (buffer: Buffer, offset: number, jump: number = 0) => {
	const labels: string[] = [];

	if (jump > 1) {
		return [offset, ''] as const;
	}

	for (; ;) {
		const size = range(buffer, offset, 8);

		if ((size & 0xC0) === 0xC0) {
			const pointer = range(buffer, offset + 2, 14) * 8;
			const [, label] = unpackLabel(buffer, pointer, jump++);

			labels.push(label);
			offset += 16;

			break;
		}

		offset += 8;

		if (!size) {
			break;
		}

		let part = '';

		for (let i = 0; i < size; i++) {
			part += String.fromCharCode(range(buffer, offset, 8));
			offset += 8;
		}

		labels.push(part);
	}

	return [offset, labels.join('.')] as const;
};

export const unpackText = (buffer: Buffer, offset: number) => {
	let text = '';

	for (; ;) {
		const code = range(buffer, offset, 8);
		offset += 8;

		if (!code) {
			break;
		}

		text += String.fromCharCode(code);
	}

	return [offset, text] as const;
};

export const unpackQuestion = (buffer: Buffer, offset: number): readonly [number, IQuestion] => {
	const [n, name] = unpackLabel(buffer, offset);
	const type: ERecord = range(buffer, n, 16);
	offset = n + 16;
	const kClass: EClass = range(buffer, offset, 16);
	offset += 16;

	return [
		offset,
		{
			name,
			type,
			class: kClass,
		},
	] as const;
};

// eslint-disable-next-line no-unused-vars
type TUnpackSpecificResource<IResourceSpecific> = (buffer: Buffer, offset: number, base: IResource) => readonly [number, IResourceSpecific]

const unpackResourceOfA: TUnpackSpecificResource<IResourceOfA> = (buffer, offset, base) => {
	const source: TInternetAddress = [
		range(buffer, offset, 8),
		range(buffer, offset + 8, 8),
		range(buffer, offset + 16, 8),
		range(buffer, offset + 32, 8),
	];

	return [
		offset + 32,
		{
			...base,
			type: ERecord.A,
			data: {
				size: 4,
				source,
			},
		},
	] as const;
};

const unpackResourceOfCnameLike: TUnpackSpecificResource<IResourceOfCname | IResourceOfNs | IResourceOfPtr> = (buffer, offset, base) => {
	const [n, name] = unpackLabel(buffer, offset);

	return [
		n,
		{
			...base,
			type: ERecord.CNAME | ERecord.NS | ERecord.PTR,
			data: {
				size: base.data.size,
				source: name,
			},
		},
	] as const;
};

const unpackResourceOfHinfo: TUnpackSpecificResource<IResourceOfHinfo> = (buffer, offset, base) => {
	const [n, cpu] = unpackText(buffer, offset);
	const [n2, os] = unpackText(buffer, n);

	return [
		n2,
		{
			...base,
			type: ERecord.HINFO,
			data: {
				size: base.data.size,
				source: {cpu, os},
			},
		},
	] as const;
};

const unpackResourceOfMx: TUnpackSpecificResource<IResourceOfMx> = (buffer, offset, base) => {
	const preference = range(buffer, offset, 16);
	offset += 16;
	const [n, exchange] = unpackLabel(buffer, offset);

	return [
		n,
		{
			...base,
			type: ERecord.MX,
			data: {
				size: base.data.size,
				source: {
					preference,
					exchange,
				},
			},
		},
	] as const;
};

const unpackResourceOfSoa: TUnpackSpecificResource<IResourceOfSoa> = (buffer, offset, base) => {
	const [n, name] = unpackLabel(buffer, offset);
	const [n2, representative] = unpackLabel(buffer, n);
	const serial = range(buffer, n2, 32);
	offset = n2 + 32;
	const refreshIn = range(buffer, offset, 32);
	offset += 32;
	const retryIn = range(buffer, offset, 32);
	offset += 32;
	const expireIn = range(buffer, offset, 32);
	offset += 32;
	const ttl = range(buffer, offset, 32);

	return [
		offset + 32,
		{
			...base,
			type: ERecord.SOA,
			data: {
				size: base.data.size,
				source: {
					name,
					representative,
					serial,
					refreshIn,
					retryIn,
					expireIn,
					ttl,
				},
			},
		},
	] as const;
};

const unpackResourceOfTxt: TUnpackSpecificResource<IResourceOfTxt> = (buffer, offset, base) => {
	const [n, text] = unpackText(buffer, offset);
	offset = n;

	return [
		n,
		{
			...base,
			type: ERecord.TXT,
			data: {
				size: base.data.size,
				source: text,
			},
		},
	] as const;
};

const unpackResourceOfWks: TUnpackSpecificResource<IResourceOfWks> = (buffer, offset, base) => {
	const address: TInternetAddress = [
		range(buffer, offset, 8),
		range(buffer, offset + 8, 8),
		range(buffer, offset + 16, 8),
		range(buffer, offset + 32, 8),
	];
	offset += 32;
	const protocol = range(buffer, offset, 8);
	offset += 8;

	const ports: number[] = [];

	for (let i = 0; i < 65536; i++) {
		try {
			if (pick(buffer, offset++)) {
				ports.push(i);
			}
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			break;
		}
	}

	return [
		offset,
		{
			...base,
			type: ERecord.WKS,
			data: {
				size: base.data.size,
				source: {
					address,
					protocol,
					ports,
				},
			},
		},
	] as const;
};

const unpackResourceOfDnskey: TUnpackSpecificResource<IResourceOfDnskey> = (buffer, offset, base) => {
	const isZoneKey = pick(buffer, offset + 7) as TFlag;
	const isSecureEntryPoint = pick(buffer, offset + 15) as TFlag;
	offset += 16;
	const protocol = range(buffer, offset, 8);
	offset += 8;

	if (protocol !== 3) {
		throw new Error('The protocol field of DNSKEY resource record should be 3!');
	}

	const algorithm = range(buffer, offset, 8);
	offset += 8;
	const [n, publicKey] = unpackText(buffer, offset);

	return [
		n,
		{
			...base,
			type: ERecord.DNSKEY,
			data: {
				size: base.data.size,
				source: {
					flags: {
						isZoneKey,
						isSecureEntryPoint,
					},
					protocol,
					algorithm,
					publicKey,
				},
			},
		},
	] as const;
};

const unpackResourceOfNsec: TUnpackSpecificResource<IResourceOfNsec> = (buffer, offset, base) => {
	const [n, nextName] = unpackLabel(buffer, offset);
	offset = n;
	const typeBitMap: number[] = [];

	let lastIterate = -1;

	for (; ;) {
		const iterate = range(buffer, offset, 8);

		if (lastIterate + 1 !== iterate) {
			break;
		}

		const bias = iterate * 256;
		offset += 8;
		const width = range(buffer, offset, 8);
		offset += 8;

		for (let i = 0; i < width * 8; i++) {
			if (pick(buffer, offset++)) {
				typeBitMap.push(bias + i);
			}
		}

		lastIterate = iterate;
	}

	return [
		offset,
		{
			...base,
			type: ERecord.NSEC,
			data: {
				size: base.data.size,
				source: {
					nextName,
					typeBitMap,
				},
			},
		},
	] as const;
};

const unpackResourceOfRrsig: TUnpackSpecificResource<IResourceOfRrsig> = (buffer, offset, base) => {
	const typeCovered = range(buffer, offset, 16);
	offset += 16;
	const algorithm = range(buffer, offset, 8);
	offset += 8;
	const labels = range(buffer, offset, 8);
	offset += 8;
	const originalTtl = range(buffer, offset, 32);
	offset += 32;
	const signatureExpiration = range(buffer, offset, 32);
	offset += 32;
	const signatureInception = range(buffer, offset, 32);
	offset += 32;
	const keyTag = range(buffer, offset, 16);
	offset += 16;
	const [n, signerName] = unpackLabel(buffer, offset);
	const [n2, signature] = unpackText(buffer, n);

	return [
		n2,
		{
			...base,
			type: ERecord.RRSIG,
			data: {
				size: base.data.size,
				source: {
					typeCovered,
					algorithm,
					labels,
					originalTtl,
					signatureExpiration,
					signatureInception,
					keyTag,
					signerName,
					signature,
				},
			},
		},
	] as const;
};

const unpackResourceOfDs: TUnpackSpecificResource<IResourceOfDs> = (buffer, offset, base) => {
	const keyTag = range(buffer, offset, 16);
	offset += 16;
	const algorithm = range(buffer, offset, 8);
	offset += 8;
	const digestType = range(buffer, offset, 8);
	offset += 8;
	const [n, digest] = unpackText(buffer, offset);

	return [
		n,
		{
			...base,
			type: ERecord.DS,
			data: {
				size: base.data.size,
				source: {
					keyTag,
					algorithm,
					digestType,
					digest,
				},
			},
		},
	] as const;
};

export const unpackResource = (buffer: Buffer, offset: number, order: EResourceOrder = EResourceOrder.Answer): readonly [number, TResources] => {
	const [n, name] = unpackLabel(buffer, offset);
	const type: ERecord = range(buffer, n, 16);
	offset = n + 16;
	const kClass: EClass = range(buffer, offset, 16);
	offset += 16;
	const ttl = range(buffer, offset, 32);
	offset += 32;
	const size = range(buffer, offset, 16);
	offset += 16;

	const base: IResource = {order, name, type, class: kClass, ttl, data: {size, source: null}};

	switch (type) {
		case ERecord.A:
		{
			return unpackResourceOfA(buffer, offset, base);
		}

		case ERecord.CNAME:
		case ERecord.NS:
		case ERecord.PTR:
		{
			return unpackResourceOfCnameLike(buffer, offset, base);
		}

		case ERecord.HINFO:
		{
			return unpackResourceOfHinfo(buffer, offset, base);
		}

		case ERecord.MX:
		{
			return unpackResourceOfMx(buffer, offset, base);
		}

		case ERecord.SOA:
		{
			return unpackResourceOfSoa(buffer, offset, base);
		}

		case ERecord.TXT:
		{
			return unpackResourceOfTxt(buffer, offset, base);
		}

		case ERecord.WKS:
		{
			return unpackResourceOfWks(buffer, offset, base);
		}

		case ERecord.DNSKEY:
		{
			return unpackResourceOfDnskey(buffer, offset, base);
		}

		case ERecord.RRSIG:
		{
			return unpackResourceOfRrsig(buffer, offset, base);
		}

		case ERecord.NSEC:
		{
			return unpackResourceOfNsec(buffer, offset, base);
		}

		case ERecord.DS:
		{
			return unpackResourceOfDs(buffer, offset, base);
		}
	}

	return [
		offset,
		{
			...base,
			type: ERecord.NULL,
			data: {
				size,
				source: null,
			},
		},
	] as const;
};

export const unpack = (buffer: Buffer): IPacket => {
	const id = range(buffer, 0, 16);
	const isQueryOrResponse: EQueryOrResponse = range(buffer, 16, 1);
	const operationCode: EOperationCode = range(buffer, 17, 4);
	const isAuthoritativeAnswer = range(buffer, 21, 1) as TFlag;
	const isTruncated = range(buffer, 22, 1) as TFlag;
	const isRecursionDesired = range(buffer, 23, 1) as TFlag;
	const isRecursionAvailable = range(buffer, 24, 1) as TFlag;
	const responseCode: EResponseCode = range(buffer, 25 + 3, 4);
	const qdcount = range(buffer, 32, 16);
	const ancount = range(buffer, 48, 16);
	const nscount = range(buffer, 64, 16);
	const arcount = range(buffer, 80, 16);

	const options: IOptions = {
		isAuthoritativeAnswer,
		isTruncated,
		isRecursionDesired,
		isRecursionAvailable,
	};
	const counts: ICounts = {
		question: qdcount,
		answer: ancount,
		nameserver: nscount,
		additional: arcount,
	};
	const questions: IQuestion[] = [];
	const resources: TResources[] = [];
	let offset = 96;

	for (let i = 0; i < qdcount; i++) {
		const [n, question] = unpackQuestion(buffer, offset);
		offset = n;

		questions.push(question);
	}

	for (let i = 0; i < ancount; i++) {
		const [n, resource] = unpackResource(buffer, offset, EResourceOrder.Answer);
		offset = n;
		resources.push(resource);
	}

	for (let i = 0; i < nscount; i++) {
		const [n, resource] = unpackResource(buffer, offset, EResourceOrder.Authority);
		offset = n;
		resources.push(resource);
	}

	for (let i = 0; i < arcount; i++) {
		const [n, resource] = unpackResource(buffer, offset, EResourceOrder.Additional);
		offset = n;
		resources.push(resource);
	}

	return {
		id,
		isQueryOrResponse,
		operationCode,
		responseCode,
		options,
		counts,
		questions,
		resources,
	} as const;
};
