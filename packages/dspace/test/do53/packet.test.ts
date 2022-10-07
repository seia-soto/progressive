import test from 'ava';
import {octets} from 'buffertly';
import {createSocket} from 'dgram';
import {EClass, EQueryOrResponse, ERecord} from '../../src/models/do53/definition.js';
import {pack, packLabel, packText, unpack, unpackLabel, unpackText} from '../../src/models/do53/packet.js';

const text = 'text';

test('text', async t => {
	const packed = Buffer.from(octets(packText(text)));

	t.is(text, unpackText(packed, 0)[1]);
});

const label = 'domain.tld';

test('label', async t => {
	const packed = Buffer.from(octets(packLabel(label)));

	t.is(label, unpackLabel(packed, 0)[1]);
});

test('packet', async t => {
	const built = pack({
		id: 0,
		isQueryOrResponse: EQueryOrResponse.Query,
		questions: [
			{
				type: ERecord.A,
				name: 'domain.tld',
				class: EClass.Internet,
			},
		],
	});

	t.deepEqual(unpack(built), {
		id: 0,
		isQueryOrResponse: 0,
		operationCode: 0,
		responseCode: 0,
		options: {
			isAuthoritativeAnswer: 0,
			isTruncated: 0,
			isRecursionDesired: 0,
			isRecursionAvailable: 0,
		},
		questions: [
			{
				class: 1,
				name: 'domain.tld',
				type: 1,
			},
		],
		resources: [],
		counts: {
			additional: 0,
			answer: 0,
			nameserver: 0,
			question: 1,
		},
	});
});

test('@1.1.1.2 cloudflare.com', async t => {
	const query = () => new Promise(resolve => {
		const soc = createSocket('udp4');
		const req = pack({
			isQueryOrResponse: EQueryOrResponse.Query,
			questions: [
				{
					type: ERecord.A,
					name: 'cloudflare.com',
				},
			],
			options: {
				isRecursionDesired: 1,
			},
		});

		soc.send(req, 53, '1.1.1.2');
		soc.once('message', message => resolve(message));
	});

	const res = await query();

	t.log(JSON.stringify(unpack(res as Buffer), null, 2));
	t.pass();
});
