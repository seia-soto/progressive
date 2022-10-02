import {Static} from '@sinclair/typebox';
import untypedTest, {TestFn} from 'ava';
import fss from 'node:fs';
import fs from 'node:fs/promises';
import {factory} from '../src/index.js';
import {EInstanceError, EUserError} from '../src/models/error/keys.js';
import {RBaseResponse} from '../src/models/reply/common.js';
import {RInstanceCreateResponse, RInstanceModifyBody, RInstanceModifyResponse, RInstanceQueryByUserResponse, RInstanceRefreshResponse, RInstanceRemoveResponse} from '../src/models/reply/instance.js';
import {RUserCreateBody, RUserModifyBody, RUserModifyResponse, RUserQueryResponse, RUserRemoveBody, RUserRemoveResponse, RUserVerifyBody} from '../src/models/reply/user.js';
import {shared} from '../src/states/workspace.js';
import {TFastifyTyped} from '../src/typeRef.js';

// @ts-expect-error
const persistence: {
  server: TFastifyTyped,
  cookie: Record<string, string>,
	identifiers: {
		instance: number
	}
} = {};

const test = untypedTest as TestFn<typeof persistence>;

const email = 'user@domain.tld';
const password = Date.now().toString(36) + 'something long that will over 32 character';

const utils = {
	sleep: (ms: number) => new Promise(resolve => {
		setTimeout(() => resolve(null), ms);
	}),
};

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

	if (!t.context.identifiers) {
		t.log('bootstrapping the identifier store');

		t.context.identifiers = {
			instance: -1,
		};
	}

	if (fss.existsSync(shared)) {
		t.log('cleaning up the workspace directory');

		await fs.rm(shared, {recursive: true});
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

test.serial('POST /s/a/instance: create instance', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/instance',
		method: 'POST',
		cookies: t.context.cookie,
	});
	const json = response.json<Static<typeof RInstanceCreateResponse>>();

	t.log(json);
	t.is(json.code, EInstanceError.instanceCreated);
});

test.serial('GET /s/a/instance: get instance by user', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/instance',
		method: 'GET',
		cookies: t.context.cookie,
	});
	const json = response.json<Static<typeof RInstanceQueryByUserResponse>>();

	t.log(json);
	t.is(json.payload.length, 1);

	t.context.identifiers.instance = json.payload[0].i;
});

test.serial('PUT /s/a/instance/:instance: modify instance (nothing)', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/instance/' + t.context.identifiers.instance,
		method: 'PUT',
		cookies: t.context.cookie,
		payload: {},
	});
	const json = response.json<Static<typeof RInstanceModifyResponse>>();

	t.log(json);
	t.is(json.code, EInstanceError.instanceModifiedNothing);
});

test.serial('PUT /s/a/instance/:instance: modify instance', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/instance/' + t.context.identifiers.instance,
		method: 'PUT',
		cookies: t.context.cookie,
		payload: {
			alias: 'Name',
		} as Static<typeof RInstanceModifyBody>,
	});
	const json = response.json<Static<typeof RInstanceModifyResponse>>();

	t.log(json);
	t.is(json.code, EInstanceError.instanceModified);

	// Check modified
	const modified = (await t.context.server.inject({
		url: '/s/a/instance',
		method: 'GET',
		cookies: t.context.cookie,
	})).json<Static<typeof RInstanceQueryByUserResponse>>();

	t.is(modified.payload[0].alias, 'Name');
});

test.serial('DELETE /s/a/instance/:instance: delete instance', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/instance/' + t.context.identifiers.instance,
		method: 'DELETE',
		cookies: t.context.cookie,
	});
	const json = response.json<Static<typeof RInstanceRemoveResponse>>();

	t.log(json);
	t.is(json.code, EInstanceError.instanceRemoved);

	// Check removed
	const modified = (await t.context.server.inject({
		url: '/s/a/instance',
		method: 'GET',
		cookies: t.context.cookie,
	})).json<Static<typeof RInstanceQueryByUserResponse>>();

	t.is(modified.payload.length, 0);

	// Create for next test
	await t.context.server.inject({
		url: '/s/a/instance',
		method: 'POST',
		cookies: t.context.cookie,
	});
	const created = (await t.context.server.inject({
		url: '/s/a/instance',
		method: 'GET',
		cookies: t.context.cookie,
	})).json<Static<typeof RInstanceQueryByUserResponse>>();

	t.context.identifiers.instance = created.payload[0].i;
});

test.serial('GET /s/a/instance/:instance/refresh: refresh instance filters', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/instance/' + t.context.identifiers.instance + '/refresh',
		method: 'GET',
		cookies: t.context.cookie,
	});
	const json = response.json<Static<typeof RInstanceRefreshResponse>>();

	t.log(json);
	t.is(json.code, EInstanceError.instanceFilterUpdateRequested);

	// Set timeout for building the filter
	t.timeout(5 * 1000);

	const current = (await t.context.server.inject({
		url: '/s/a/instance',
		method: 'GET',
		cookies: t.context.cookie,
	})).json<Static<typeof RInstanceQueryByUserResponse>>();

	for (; ;) {
		const queried = (await t.context.server.inject({
			url: '/s/a/instance',
			method: 'GET',
			cookies: t.context.cookie,
		})).json<Static<typeof RInstanceQueryByUserResponse>>();

		if (
			current.payload[0].updated_at !== queried.payload[0].updated_at
			&& !queried.payload[0].status
		) {
			t.log('diff of updated timestamp from saved timestamp in ms:', queried.payload[0].updated_at - current.payload[0].updated_at);
			t.pass();

			break;
		}

		await utils.sleep(0.1 * 1000);
	}
});

test.serial('DELETE /s/a/user: delete user', async t => {
	const response = await t.context.server.inject({
		url: '/s/a/user',
		method: 'DELETE',
		cookies: t.context.cookie,
		payload: {
			password,
		} as Static<typeof RUserRemoveBody>,
	});
	const json = response.json<Static<typeof RUserRemoveResponse>>();

	t.is(json.code, EUserError.userRemoved);
});
