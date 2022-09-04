import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import {router} from './routes/index.js';

export const secret = process.env.SECRET ?? (Math.random() * Date.now() * 1024).toString(36).slice(0, 6);

export const iss = process.env.ISS ?? 'progressive.seia.io';

export const factory = async () => {
	const fastify = Fastify()
		.withTypeProvider<TypeBoxTypeProvider>();
		// TypeBoxCompiler seems not compatible with formats yet
		// .setValidatorCompiler(TypeBoxValidatorCompiler);

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

	return fastify;
};
