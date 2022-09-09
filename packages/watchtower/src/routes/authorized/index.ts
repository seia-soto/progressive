import type {FastifyPluginCallback} from 'fastify';
import {router as user} from './user.js';
import {router as instance} from './instance.js';
import {router as blocklist} from './blocklist.js';

export const router: FastifyPluginCallback = (fastify, opts, done) => {
	fastify.addHook('onRequest', request => request.jwtVerify());

	fastify.register(user, {prefix: '/user'});
	fastify.register(instance, {prefix: '/instance'});
	fastify.register(blocklist, {prefix: '/blocklist'});

	done();
};
