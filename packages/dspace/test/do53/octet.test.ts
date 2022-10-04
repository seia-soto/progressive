import test from 'ava';
import * as encode from '../../src/models/do53/encode.js';
import * as decode from '../../src/models/do53/decode.js';

test('encode.octets', async t => {
	for (let i = 0; i < (16 ** 2) - 1; i++) {
		const source = encode.octets([[i, 8]]);

		const buffer = Buffer.from(source);

		t.is(source.length, 1);
		t.is(buffer.readUint8(0), i);
	}

	for (let i = 0; i < (256 ** 2) - 1; i++) {
		const source = encode.octets([[i, 16]]);

		const buffer = Buffer.from(source);

		t.is(source.length, 2);
		t.is(buffer.readUInt16BE(0), i);
	}
});

test('decode.pick', async t => {
	const source = [1, 8] as const;
	const buffer = Buffer.from(encode.octets([source]));

	for (let i = 0; i < 6; i++) {
		t.is(decode.pick(buffer, i), 0);
	}

	t.is(decode.pick(buffer, 7), 1);
});

test('decode.range', async t => {
	const source = [0xFF, 8] as const;
	const buffer = Buffer.from(encode.octets([source]));

	t.is(decode.range(buffer, 0, 4), 15);
	t.is(decode.range(buffer, 3, 4), 15);
	t.is(decode.range(buffer, 0, 3), 7);
	t.is(decode.range(buffer, 0, 2), 3);
});

test('decode.readArbitraryText', async t => {
	const source = 'text\0'.split('').map(char => [char.charCodeAt(0), 8] as const);
	const buffer = Buffer.from(encode.octets(source));

	t.is(decode.readArbitraryText(buffer, 0)[1], 'text');
});
