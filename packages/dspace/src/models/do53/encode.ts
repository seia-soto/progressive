import {octets} from 'buffertly';
import {THeader, TQuestionSection, TResourceRecord} from './decode.js';
import {EResourceRecord} from './definition.js';

export const writeStringToOctetFragment = (text: string) => {
	const fragments: (readonly [number, number])[] = [];

	for (let i = 0; i < text.length; i++) {
		fragments.push([text.charCodeAt(i), 8]);
	}

	return fragments;
};

export const writeLabelsToOctetFragment = (text: string) => {
	const fragments: (readonly [number, number])[] = [];

	const labels = text.split('.');

	for (let i = 0; i < labels.length; i++) {
		const label = labels[i];

		fragments.push([label.length, 8]);

		for (let k = 0; k < label.length; k++) {
			fragments.push([label.charCodeAt(k), 8]);
		}
	}

	fragments.push([0, 8]);

	return fragments;
};

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
	...writeLabelsToOctetFragment(data.domain),
	[data.type, 16],
	[data.class, 16],
]);

export const resourceRecord = (data: TResourceRecord) => {
	const fragments: (readonly [number, number])[] = [
		...writeLabelsToOctetFragment(data.domain),
		[data.type, 16],
		[data.unit, 16],
		[data.ttl, 32],
	];

	switch (data.type) {
		case EResourceRecord.A:
		{
			fragments.push(
				[4, 16],
				...data.resourceData.map(entry => [entry, 8] as const),
			);

			break;
		}

		case EResourceRecord.CNAME:
		case EResourceRecord.MB:
		case EResourceRecord.MG:
		case EResourceRecord.MR:
		case EResourceRecord.NS:
		case EResourceRecord.PTR:
		{
			const frames = writeLabelsToOctetFragment(data.resourceData);

			fragments.push(
				[frames.length, 16],
				...frames,
			);

			break;
		}

		case EResourceRecord.HINFO:
		{
			const text = data.resourceData.cpu + '\0'
				+ data.resourceData.operatingSystem + '\0';

			fragments.push(
				[text.length, 16],
				...writeStringToOctetFragment(text),
			);

			break;
		}

		case EResourceRecord.MINFO:
		{
			const rmailbox = writeLabelsToOctetFragment(data.resourceData.receiveMailbox);
			const emailbox = writeLabelsToOctetFragment(data.resourceData.errorMailbox);

			fragments.push(
				[rmailbox.length + emailbox.length, 16],
				...rmailbox,
				...emailbox,
			);

			break;
		}

		case EResourceRecord.MX:
		{
			const frames = writeLabelsToOctetFragment(data.resourceData.domain);

			fragments.push(
				[2 + frames.length, 16],
				[data.resourceData.preference, 16],
				...frames,
			);

			break;
		}

		case EResourceRecord.SOA:
		{
			const mainDomain = writeLabelsToOctetFragment(data.resourceData.mainDomain);
			const representativeName = writeLabelsToOctetFragment(data.resourceData.representativeName);

			fragments.push(
				[mainDomain.length + representativeName.length + (4 * 5), 16],
				...mainDomain,
				...representativeName,
				[data.resourceData.serial, 32],
				[data.resourceData.refreshIn, 32],
				[data.resourceData.retryIn, 32],
				[data.resourceData.expireIn, 32],
				[data.resourceData.minimumTtl, 32],
			);

			break;
		}

		case EResourceRecord.TXT:
		{
			const txtData = writeStringToOctetFragment(data.resourceData);

			fragments.push(
				[txtData.length, 16],
				...txtData,
			);

			break;
		}

		case EResourceRecord.WKS:
		{
			const portMap: (readonly [number, number])[] = [];
			let bits = 0;

			for (let i = 0; i < 65535; i++) {
				if (data.resourceData.ports.indexOf(i) >= 0) {
					portMap.push([1, 1]);

					if (
						++bits === data.resourceData.ports.length
						|| bits > 65495 // 65535 - 32 - 8
					) {
						break;
					}
				} else {
					portMap.push([0, 1]);
				}
			}

			fragments.push(
				[4 + 1 + Math.ceil(bits / 8), 16],
				...data.resourceData.address.map(entry => [entry, 8] as const),
				[data.resourceData.protocol, 8],
				...portMap,
			);

			break;
		}

		default: {
			throw new Error('This resource record is not supported yet!');
		}
	}

	return octets(fragments);
};

export const request = (
	_header: THeader,
	fields: {
		questions: TQuestionSection[],
		answers: TResourceRecord[],
		nameservers: TResourceRecord[],
		additionalResources: TResourceRecord[]
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
