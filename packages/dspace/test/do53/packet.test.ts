import test from 'ava';
import {octets} from 'buffertly';
import * as decode from '../../src/models/do53/decode.js';
import {EClass, EFlag, EOperationCode, EProtocol, EQueryOrResponse, EResourceRecord, EResponseCode} from '../../src/models/do53/definition.js';
import * as encode from '../../src/models/do53/encode.js';

const domain = 'domain.tld';

const header: decode.THeader = {
	identifier: 128,
	isResponse: EQueryOrResponse.Query,
	operationCode: EOperationCode.Query,
	flag: {
		isAuthorized: EFlag.Disabled,
		isTruncated: EFlag.Disabled,
		isRecursionDesired: EFlag.Disabled,
		isRecursionAvailable: EFlag.Disabled,
	},
	responseCode: EResponseCode.NoError,
	count: {
		question: 0,
		answer: 0,
		nameserver: 0,
		additionalResources: 0,
	},
};

test('header', async t => {
	t.deepEqual(
		header,
		decode.header(Buffer.from(encode.header(header)))[1],
	);
});

const question: decode.TQuestionSection = {
	type: EResourceRecord.A,
	domain,
	class: EClass.Internet,
};

test('questionSection', async t => {
	t.deepEqual(
		question,
		decode.questionSection(Buffer.from(encode.questionSection(question)), 0)[1],
	);
});

const resourceRecordOfA: decode.IResourceRecordOfA = {
	domain,
	type: EResourceRecord.A,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: [127, 0, 0, 1],
};

const resourceRecordOfCname: decode.IResourceRecordOfCname = {
	domain,
	type: EResourceRecord.CNAME,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: 'cname.domain.tld',
};

const resourceRecordOfHinfo: decode.IResourceRecordOfHinfo = {
	domain,
	type: EResourceRecord.HINFO,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: {
		cpu: 'Apple',
		operatingSystem: 'macOS',
	},
};

const resourceRecordOfMb: decode.IResourceRecordOfMb = {
	domain,
	type: EResourceRecord.MB,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: domain,
};

const resourceRecordOfMg: decode.IResourceRecordOfMg = {
	domain,
	type: EResourceRecord.MG,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: domain,
};

const resourceRecordOfMinfo: decode.IResourceRecordOfMinfo = {
	domain,
	type: EResourceRecord.MINFO,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: {
		receiveMailbox: domain,
		errorMailbox: domain,
	},
};

const resourceRecordOfMr: decode.IResourceRecordOfMr = {
	domain,
	type: EResourceRecord.MR,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: domain,
};

const resourceRecordOfMx: decode.IResourceRecordOfMx = {
	domain,
	type: EResourceRecord.MX,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: {
		preference: 1,
		domain,
	},
};

const resourceRecordOfNs: decode.IResourceRecordOfNs = {
	domain,
	type: EResourceRecord.NS,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: domain,
};

const resourceRecordOfPtr: decode.IResourceRecordOfPtr = {
	domain,
	type: EResourceRecord.PTR,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: domain,
};

const resourceRecordOfSoa: decode.IResourceRecordOfSoa = {
	domain,
	type: EResourceRecord.SOA,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: {
		mainDomain: domain,
		representativeName: domain,
		serial: 0,
		refreshIn: 60,
		retryIn: 60,
		expireIn: 60,
		minimumTtl: 60,
	},
};

const resourceRecordOfWks: decode.IResourceRecordOfWks = {
	domain,
	type: EResourceRecord.WKS,
	unit: EClass.Internet,
	ttl: 60,
	resourceData: {
		address: [127, 0, 0, 1],
		protocol: EProtocol.TCP,
		ports: [25],
	},
};

test('resourceRecord', async t => {
	const targets = [
		resourceRecordOfA,
		resourceRecordOfCname,
		resourceRecordOfHinfo,
		resourceRecordOfMb,
		resourceRecordOfMg,
		resourceRecordOfMinfo,
		resourceRecordOfMr,
		resourceRecordOfMx,
		resourceRecordOfNs,
		resourceRecordOfNs,
		resourceRecordOfPtr,
		resourceRecordOfSoa,
		resourceRecordOfWks,
	];
	const generateResponse = (rr: decode.TResourceRecord) => decode.resourceRecord(Buffer.from(encode.resourceRecord(rr)), 0)[1];

	for (let i = 0; i < targets.length; i++) {
		t.deepEqual(targets[i], generateResponse(targets[i]));
	}
});

test('writeStringToOctetFragment', async t => {
	t.is(
		domain,
		decode.readArbitraryText(Buffer.from(octets(encode.writeStringToOctetFragment(domain))), 0)[1],
	);
});

test('writeLabelsToOctetFragment', async t => {
	t.is(
		domain,
		decode.readArbitraryLabel(Buffer.from(octets(encode.writeLabelsToOctetFragment(domain))), 0)[1],
	);
});
