import {TFastifyTypedPluginCallback} from '../../typeRef.js';
import {router as blocklist} from './blocklist.js';
import {router as instance} from './instance.js';
import {router as user} from './user.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
	fastify.addHook('onRequest', request => request.jwtVerify());

	fastify.register(user, {prefix: '/user'});
	fastify.register(instance, {prefix: '/instance'});
	fastify.register(blocklist, {prefix: '/blocklist'});

	done();
};
