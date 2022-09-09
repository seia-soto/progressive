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
		a: {
			name: string,
			value: string,
			path: string,
			httpOnly: boolean,
			secure: boolean,
			sameSite: string,
		}
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
		a: {
			name: 'a',
			value: '',
			path: '/',
			httpOnly: false,
			secure: false,
			sameSite: 'Strict',
		},
	};
});

test.after(async t => {
	await t.context.server.close();
});

test('[public] user: /s/user', async t => {
	const rSignUp = await t.context.server.inject({
		method: 'put',
		url: '/s/user',
		payload: t.context.user,
	});
	const jSignUp = rSignUp.json<IResponseJson>();

	t.is(jSignUp.code, 'signup_requested');

	const rSignIn = await t.context.server.inject({
		method: 'post',
		url: '/s/user',
		payload: t.context.user,
	});
	const jSignIn = rSignIn.json<IResponseJson>();

	const authorization = rSignIn.cookies[0] as IExecutionContext['cookies']['a'];

	t.is(jSignIn.code, 'sign_success');
	t.truthy(authorization);

	t.context.cookies.a = authorization;
});
