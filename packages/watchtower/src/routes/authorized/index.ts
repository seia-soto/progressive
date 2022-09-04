import type {FastifyPluginCallback} from 'fastify';
import {router as user} from './user.js';

export const router: FastifyPluginCallback = (fastify, opts, done) => {
	fastify.addHook('onRequest', request => request.jwtVerify());

	fastify.register(user, {prefix: '/user'});

	done();
};
