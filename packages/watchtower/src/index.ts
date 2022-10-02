import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import {EUnhandledError} from './models/error/keys.js';
import {typeValidator} from './models/format.js';
import {createBaseResponse} from './models/reply/common.js';
import {router} from './routes/index.js';

export const secret = process.env.SECRET ?? (Math.random() * Date.now() * 1024).toString(36).slice(0, 6);

export const iss = process.env.ISS ?? 'progressive.seia.io';

export const factory = async () => {
	const fastify = Fastify()
		.withTypeProvider<TypeBoxTypeProvider>()
		.setValidatorCompiler(typeValidator);

	fastify.register(fastifyJwt, {
		secret,
		sign: {
			iss,
		},
		verify: {
			allowedIss: iss,
			cache: 3600,
		},
		cookie: {
			cookieName: 'a',
			signed: false,
		},
	});
	fastify.register(fastifyCookie);
	fastify.register(router, {prefix: '/s'});

	fastify.setErrorHandler((error, request, reply) => {
		const response = createBaseResponse();
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

		response.message.identifiable = 'progressive-process-id:' + time + '-' + request.id;

		if (error.validation?.length) {
			const validation = error.validation[0];

			response.code = EUnhandledError.validation;
			response.message.readable = validation.message
			+ ' for '
			// @ts-expect-error
			+ (error?.validationContext || 'internal')
			+ validation.instancePath;

			reply.code(400);
			reply.send(response);

			return;
		}

		reply.code(500);
		reply.send(response);
	});

	return fastify;
};
