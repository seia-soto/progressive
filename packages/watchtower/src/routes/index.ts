import {TFastifyTypedPluginCallback} from '../typeRef.js';
import {router as authorized} from './authorized/index.js';
import {router as user} from './user.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
	fastify.register(authorized, {prefix: '/a'});
	fastify.register(user, {prefix: '/user'});

	done();
};
