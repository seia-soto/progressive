import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import anyTest, {TestFn} from 'ava';
import {FastifyBaseLogger, FastifyInstance} from 'fastify';
import {IncomingMessage, Server, ServerResponse} from 'http';
import {factory} from '../src/index.js';

interface IExecutionContext {
	server: FastifyInstance<Server, IncomingMessage, ServerResponse, FastifyBaseLogger, TypeBoxTypeProvider>
	user: {
		email: string,
		password: string,
	}
	cookies: {
		a: string
	}
}

interface IResponseJson {
	code: string
}

const test = anyTest as TestFn<IExecutionContext>;

test.before(async t => {
	const server = await factory();

	t.context.server = server;
	t.context.user = {
		email: 'test@seia.io',
		password: 'this_is_testing_password',
	};
	t.context.cookies = {
		a: '',
	};
});

test.after(async t => {
	await t.context.server.close();
});

test('create user: put /s/user', async t => {
	const response = await t.context.server.inject({
		method: 'put',
		url: '/s/user',
		payload: t.context.user,
	});
	const json = response.json<IResponseJson>();

	t.is(json.code, 'signup_requested');
});
