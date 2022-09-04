import type {FastifyPluginCallback} from 'fastify';
import {router as authorized} from './authorized/index.js';
import {router as user} from './user.js';

export const router: FastifyPluginCallback = (fastify, opts, done) => {
	fastify.register(authorized, {prefix: '/a'});
	fastify.register(user, {prefix: '/user'});

	done();
};
