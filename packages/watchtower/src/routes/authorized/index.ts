import {ESessionError} from '../../models/error/keys.js';
import {createBaseResponse} from '../../models/reply/common.js';
import {isOwnedByUser} from '../../models/session.js';
import {tokenCache} from '../../states/cache.js';
import {TFastifyTypedPluginCallback} from '../../typeRef.js';
import {router as blocklist} from './blocklist.js';
import {router as instance} from './instance.js';
import {router as user} from './user.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
	fastify.addHook('onRequest', async (request, reply) => {
		await request.jwtVerify();

		const usid = request.user.ref.toString();
		let result = tokenCache.get(usid)?.value;

		if (typeof result === 'undefined') {
			result = await isOwnedByUser(request.user.i, request.user.ref);

			tokenCache.set(usid, result);
		}

		if (!result) {
			reply.unsignCookie('a');

			const response = createBaseResponse(ESessionError.sessionNotOwnedByUser);

			response.message.readable = 'Your session is not valid or already revoked.';

			reply.send(response);
		}
	});

	fastify.register(user, {prefix: '/user'});
	fastify.register(instance, {prefix: '/instance'});
	fastify.register(blocklist, {prefix: '/blocklist'});

	done();
};
