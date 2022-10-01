import {factory} from '../src/index.js';
import {TFastifyTyped} from '../src/typeRef.js';
import untypedTest, {TestFn} from 'ava';
import {Static} from '@sinclair/typebox';
import {RUserCreateBody, RUserModifyBody, RUserModifyResponse, RUserQueryResponse, RUserVerifyBody} from '../src/models/reply/user.js';
import {RBaseResponse} from '../src/models/reply/common.js';
import {EUserError} from '../src/models/error/keys.js';

// @ts-expect-error
const persistence: {
  server: TFastifyTyped,
  cookie: Record<string, string>
} = {};

const test = untypedTest as TestFn<typeof persistence>;

const email = 'user@domain.tld';
const password = Date.now().toString(36) + 'something long that will over 32 character';

test.serial.before('bootstrap', async t => {
	if (!t.context.server) {
		t.log('bootstrapping the server');

		t.context.server = await factory();
		await t.context.server.ready();
	}

	if (!t.context.cookie) {
		t.log('bootstrapping the cookie store');

		t.context.cookie = {};
	}
});

test.serial.after('cleanup', async t => {
	if (t.context.server) {
		t.log('closing the server');

		await t.context.server.close();
	}
});

type TRBaseResponse = Static<typeof RBaseResponse>

test.serial('POST /s/user: create user', async t => {
	const response = await t.context.server.inject({
		url: '/s/user',
		method: 'POST',
		payload: {
			email,
			password,
			passwordConfirmation: password,
		} as Static<typeof RUserCreateBody>,
	});
	const json = response.json<TRBaseResponse>();

	t.log(json);
	t.is(json.code, EUserError.userCreated);
});

test.serial('POST /s/user/s: authenticate user', async t => {
	const response = await t.context.server.inject({
		url: '/s/user/s',
		method: 'POST',
		payload: {
			email,
			password,
		} as Static<typeof RUserVerifyBody>,
	});
	const json = response.json<TRBaseResponse>();

	t.log(json);
	t.is(response.statusCode, 200);
	t.is(json.code, EUserError.userAuthenticated);

	// @ts-expect-error
	t.context.cookie.a = response.cookies.find(cookie => cookie.name === 'a')?.value;

	if (!t.context.cookie.a) {
		t.fail('The authorization cookie not saved!');
	}

	t.log('The authorization cookie saved: ' + t.context.cookie.a);
});

test.serial('GET /s/a/user: get user', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/user',
		method: 'GET',
		cookies: t.context.cookie,
	});
	const json = response.json<Static<typeof RUserQueryResponse>>();

	t.log(json);
	t.is(json.code, EUserError.userQueried);
});

test.serial('PUT /s/a/user: modify user (nothing)', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/user',
		method: 'PUT',
		cookies: t.context.cookie,
		payload: {},
	});
	const json = response.json<Static<typeof RUserModifyResponse>>();

	t.log(json);
	t.is(json.code, EUserError.userModifiedNothing);
});

test.serial('PUT /s/a/user: modify user', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/user',
		method: 'PUT',
		cookies: t.context.cookie,
		payload: {
			password: password + ' will be updated!',
		} as Static<typeof RUserModifyBody>,
	});
	const json = response.json<Static<typeof RUserModifyResponse>>();

	t.log(json);
	t.is(json.code, EUserError.userModified);

	// Restore the password
	await t.context.server.inject({
		url: '/s/a/user',
		method: 'PUT',
		cookies: t.context.cookie,
		payload: {
			password,
		} as Static<typeof RUserModifyBody>,
	});
});
