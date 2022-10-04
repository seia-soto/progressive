import test from 'ava';
import * as encode from '../../src/models/do53/encode.js';
import * as decode from '../../src/models/do53/decode.js';
import {EClassType, EFlagType, EOperationType, EQueryType, EResourceRecordType, EResponseType} from '../../src/models/do53/definition.js';

const request: decode.TRequest = {
	identifier: 128,
	type: EQueryType.Query,
	operation: EOperationType.Query,
	flag: {
		authorized: EFlagType.Disabled,
		truncated: EFlagType.Disabled,
		recursionDesired: EFlagType.Disabled,
		recursionAvailable: EFlagType.Disabled,
		authenticData: EFlagType.Disabled,
		checkingDisabled: EFlagType.Disabled,
	},
	responseCode: EResponseType.NoError,
	count: {
		query: 0,
		answer: 0,
		nameserver: 0,
		additional: 0,
	},
};

test('header', async t => {
	t.deepEqual(
		request,
		decode.header(Buffer.from(encode.header(request)))[1],
	);
});

const question: decode.TQuestionSection = {
	record: EResourceRecordType.A,
	domain: 'domain.tld',
	unit: EClassType.Internet,
};

test('encode.questionSection', async t => {
	t.deepEqual(
		question,
		decode.questionSection(Buffer.from(encode.questionSection(question)), 0)[1],
	);
});

const resourceRecord: decode.IResourceRecordOfA = {
	domain: 'domain.tld',
	type: EResourceRecordType.A,
	unit: EClassType.Internet,
	ttl: 60 * 2,
	resourceDataLength: 32,
	resourceData: [127, 0, 0, 1],
};

test('encode.resourceRecord', async t => {
	t.deepEqual(
		resourceRecord,
		decode.resourceRecord(Buffer.from(encode.resourceRecord(resourceRecord)), 0)[1],
	);
});
