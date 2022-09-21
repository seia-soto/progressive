import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import anyTest, {TestFn} from 'ava';
import {FastifyBaseLogger, FastifyInstance} from 'fastify';
import {IncomingMessage, Server, ServerResponse} from 'http';
import {factory} from '../src/index.js';

// Context
interface IExecutionContext {
	server: FastifyInstance<Server, IncomingMessage, ServerResponse, FastifyBaseLogger, TypeBoxTypeProvider>
	user: {
		email: string,
		password: string,
	}
}

/* eslint-disable no-unused-vars */
type THelperFunction<T extends unknown = void> = (server: IExecutionContext['server'], user: IExecutionContext['user']) => Promise<T>
/* eslint-enable no-unused-vars */

const test = anyTest as TestFn<IExecutionContext>;

// Helpers
const signIn: THelperFunction<string> = async (server, user) => {
	const response = await server.inject({
		method: 'post',
		url: '/s/user',
		payload: user,
	});

	const authorization = (response.cookies[0] as { value: string }).value;

	return authorization;
};

const signUp: THelperFunction = async (server, user) => {
	await server.inject({
		method: 'put',
		url: '/s/user',
		payload: user,
	});
};

const signOut: THelperFunction = async (server, user) => {
	await server.inject({
		method: 'delete',
		url: '/s/a/user',
		payload: user,
	});
};

const getAuthorizedCookie: THelperFunction<readonly [{readonly a: string}, () => Promise<void>]> = async (server, user) => {
	let token = await signIn(server, user);

	if (!token) {
		await signUp(server, user);

		token = await signIn(server, user);
	}

	return [
		{
			a: token,
		},
		async () => {
			await signOut(server, user);
		},
	] as const;
};

// Hooks
test.before(async t => {
	const server = await factory();

	t.context.server = server;
	t.context.user = {
		email: 'test@seia.io',
		password: 'this_is_testing_password',
	};
});

test.after(async t => {
	await t.context.server.close();
});

// Tests
test('user', async t => {
	const [, complete] = await getAuthorizedCookie(t.context.server, t.context.user);

	await complete();
});
