import test from 'ava';
import * as mod from '../src/index.js';

test('isHostname', t => {
	const truthy = [
		'google.com',
		'google.co.kr',
		'naver.com',
		'kakao.com',
		'123.com',
		'mixed123.com',
	];

	for (let i = 0; i < truthy.length; i++) {
		const [result, error, message] = mod.isHostname(truthy[i]);

		if (!result) {
			console.log('should be true on', truthy[i], error, message);
		}

		t.is(true, mod.isHostname(truthy[i])[0]);
	}

	const falsy = [
		'.google.com',
		'~',
		'g..oogle.com',
		'google.com.',
		'google.com/',
		'google.com^',
	];

	for (let i = 0; i < falsy.length; i++) {
		const [result] = mod.isHostname(falsy[i]);

		if (result) {
			console.log('should be false on', falsy[i]);
		}

		t.is(false, result);
	}
});
