import test from 'ava';
import {octets} from 'buffertly';
import * as decode from '../../src/models/do53/decode.js';
import {EClass, EFlag, EOperationCode, EQueryOrResponse, EResourceRecord, EResponseCode} from '../../src/models/do53/definition.js';
import * as encode from '../../src/models/do53/encode.js';

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
	domain: 'domain.tld',
	class: EClass.Internet,
};

test('questionSection', async t => {
	t.deepEqual(
		question,
		decode.questionSection(Buffer.from(encode.questionSection(question)), 0)[1],
	);
});

const resourceRecord: decode.IResourceRecordOfA = {
	domain: 'domain.tld',
	type: EResourceRecord.A,
	unit: EClass.Internet,
	ttl: 60 * 2,
	resourceDataLength: 4,
	resourceData: [127, 0, 0, 1],
};

test('resourceRecord', async t => {
	t.deepEqual(
		resourceRecord,
		decode.resourceRecord(Buffer.from(encode.resourceRecord(resourceRecord)), 0)[1],
	);
});

const text = 'domain.tld';

test('writeStringToOctetFragment', async t => {
	t.is(
		text,
		decode.readArbitraryText(Buffer.from(octets(encode.writeStringToOctetFragment(text))), 0)[1],
	);
});

test('writeLabelsToOctetFragment', async t => {
	t.is(
		text,
		decode.readArbitraryLabel(Buffer.from(octets(encode.writeLabelsToOctetFragment(text))), 0)[1],
	);
});
