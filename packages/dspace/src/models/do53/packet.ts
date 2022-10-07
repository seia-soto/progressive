import {octets, pick, range} from 'buffertly';
import {EClass, EOperationCode, EQueryOrResponse, ERecord, EResourceOrder, EResponseCode, ICounts, IOptions, IPacket, IQuestion, IResource, TBuildablePacket, TBuildableQuestion, TFlag, TInternetAddress, TPart, TResources} from './definition.js';

// Pack
export const packText = (text: string): TPart[] => text
	.split('')
	.map(char => [char.charCodeAt(0), 8] as const);

export const packLabel = (text: string): TPart[] => {
	const parts: TPart[] = [];
	const labels = text.split('.');

	for (let i = 0; i < labels.length; i++) {
		parts.push(
			[labels[i].length, 8],
			...packText(labels[i]),
		);
	}

	parts.push([0, 8]);

	return parts;
};

export const packQuestion = (q: TBuildableQuestion) => [
	...packLabel(q.name),
	[q.type, 16],
	[q.class ?? EClass.Internet, 16],
] as const;

export const packResource = (r: TResources) => {
	const parts: TPart[] = [];

	parts.push(
		...packLabel(r.name),
		[r.type, 16],
		[r.class ?? EClass.Internet, 16],
		[r.ttl, 32],
	);

	switch (r.type) {
		case ERecord.A:
		{
			parts.push(
				[r.data.size, 16],
				...r.data.source.map(k => [k, 8] as const),
			);

			break;
		}

		case ERecord.CNAME:
		case ERecord.NS:
		case ERecord.PTR:
		{
			const label = packLabel(r.data.source);

			parts.push(
				[r.data.size || label.length, 16],
				...label,
			);

			break;
		}

		case ERecord.HINFO:
		{
			const text = packText(
				r.data.source.cpu + '\0'
				+ r.data.source.os + '\0',
			);

			parts.push(
				[r.data.size || text.length, 16],
				...text,
			);

			break;
		}

		case ERecord.MX:
		{
			const label = packLabel(r.data.source.exchange);

			parts.push(
				[r.data.size || (2 + label.length), 16],
				[r.data.source.preference, 16],
				...label,
			);

			break;
		}

		case ERecord.SOA:
		{
			const name = packLabel(r.data.source.name);
			const representative = packLabel(r.data.source.representative);

			parts.push(
				[r.data.size || (name.length + representative.length + (4 * 5)), 16],
				...name,
				...representative,
				[r.data.source.serial, 32],
				[r.data.source.refreshIn, 32],
				[r.data.source.retryIn, 32],
				[r.data.source.expireIn, 32],
				[r.data.source.ttl, 32],
			);

			break;
		}

		case ERecord.TXT:
		{
			const text = packText(r.data.source);

			parts.push(
				[r.data.size || text.length, 16],
				...text,
			);

			break;
		}

		case ERecord.WKS:
		{
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

			parts.push(
				[4 + 1 + Math.ceil(pushed / 8), 16],
				...r.data.source.address.map(k => [k, 8] as const),
				[r.data.source.protocol, 8],
				...map,
			);

			break;
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

	// Add question sections
	for (let i = 0; i < questions.length; i++) {
		records.push(...packQuestion(questions[i]));
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
		sections[r.order].push(...packResource(r as TResources));
	}

	// Add sections' data
	records.push(
		...sections[0],
		...sections[1],
		...sections[2],
	);

	// Compose
	const b: TPart[] = [
		...header,
		...[questions.length, ...counts].map(count => [count, 16] as const),
		...records,
	];

	return Buffer.from(octets(b));
};

// Unpack
export const unpackLabel = (buffer: Buffer, offset: number) => {
	const labels: string[] = [];
	let restoreTo = 0;

	if (range(buffer, offset, 2) === 0b11) {
		restoreTo = offset + 16;
		offset = range(buffer, offset + 2, 14) * 8;
	}

	for (; ;) {
		const size = range(buffer, offset, 8);
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

	return [restoreTo || offset, labels.join('.')] as const;
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

	const base: IResource = {order, name, type, class: kClass, ttl, data: {size: 0, source: null}};

	switch (type) {
		case ERecord.A:
		{
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
		}

		case ERecord.CNAME:
		case ERecord.NS:
		case ERecord.PTR:
		{
			const [n, name] = unpackLabel(buffer, offset);

			return [
				n,
				{
					...base,
					type: ERecord.CNAME | ERecord.NS | ERecord.PTR,
					data: {
						size,
						source: name,
					},
				},
			] as const;
		}

		case ERecord.HINFO:
		{
			const [n, cpu] = unpackText(buffer, offset);
			const [n2, os] = unpackText(buffer, n);

			return [
				n2,
				{
					...base,
					type: ERecord.HINFO,
					data: {
						size,
						source: {cpu, os},
					},
				},
			] as const;
		}

		case ERecord.MX:
		{
			const preference = range(buffer, offset, 16);
			offset += 16;
			const [n, exchange] = unpackLabel(buffer, offset);

			return [
				n,
				{
					...base,
					type: ERecord.MX,
					data: {
						size,
						source: {
							preference,
							exchange,
						},
					},
				},
			] as const;
		}

		case ERecord.SOA:
		{
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
						size,
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
		}

		case ERecord.TXT:
		{
			const [n, text] = unpackText(buffer, offset);
			offset = n;

			return [
				n,
				{
					...base,
					type: ERecord.TXT,
					data: {
						size,
						source: text,
					},
				},
			] as const;
		}

		case ERecord.WKS:
		{
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
						size,
						source: {
							address,
							protocol,
							ports,
						},
					},
				},
			] as const;
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
	};
};
