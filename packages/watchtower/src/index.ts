import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import {TypeBoxTypeProvider, TypeBoxValidatorCompiler} from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import {createBaseResponse} from './models/reply/common.js';
import {router} from './routes/index.js';

export const secret = process.env.SECRET ?? (Math.random() * Date.now() * 1024).toString(36).slice(0, 6);

export const iss = process.env.ISS ?? 'progressive.seia.io';

export const factory = async () => {
	const fastify = Fastify()
		.withTypeProvider<TypeBoxTypeProvider>()
		.setValidatorCompiler(TypeBoxValidatorCompiler);

	fastify.register(fastifyJwt, {
		secret,
		sign: {
			iss,
		},
		verify: {
			allowedIss: iss,
		},
		cookie: {
			cookieName: 'a',
			signed: false,
		},
	});
	fastify.register(fastifyCookie);
	fastify.register(router, {prefix: '/s'});

	fastify.setErrorHandler((error, request, reply) => {
		const time = Date.now();

		console.error(
			time,
			request.id,
			request.method,
			request.url,
			request.headers['user-agent'] ?? 'bot',
			request.ip,
			error,
		);

		const response = createBaseResponse();

		response.message.identifiable = 'progressive-process-id:' + time + '-' + request.id;

		reply.code(500);
		reply.send(response);
	});

	return fastify;
};
