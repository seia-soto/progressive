import {EUserError} from '../../models/error/keys.js';
import {user} from '../../models/index.js';
import {createBaseResponse} from '../../models/reply/common.js';
import {RUserModifyBody, RUserModifyResponse, RUserQueryResponse, RUserRemoveBody, RUserRemoveResponse} from '../../models/reply/user.js';
import {TFastifyTypedPluginCallback} from '../../typeRef.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
	fastify.route({
		url: '/',
		method: 'GET',
		schema: {
			response: {
				200: RUserQueryResponse,
			},
		},
		async handler(request, reply) {
			const [code, one] = await user.query(request.user.i);

			if (code !== EUserError.userQueried) {
				reply.clearCookie('a');

				throw new Error('The user self-queried but does not exist: ' + request.user.i);
			}

			const response = createBaseResponse(code);

			response.message.readable = 'You queried yourself.';

			return {
				...response,
				payload: one,
			};
		},
	});

	fastify.route({
		url: '/',
		method: 'PUT',
		schema: {
			body: RUserModifyBody,
			response: {
				200: RUserModifyResponse,
			},
		},
		async handler(request) {
			const [code] = await user.modify(request.user.i, request.body);
			const response = createBaseResponse(code);

			if (code === EUserError.userModifiedNothing) {
				response.message.identifiable = 'You requested modification but nothing actually modified.';
			}

			response.message.readable = 'You modified your account.';

			return response;
		},
	});

	fastify.route({
		url: '/',
		method: 'DELETE',
		schema: {
			body: RUserRemoveBody,
			response: {
				200: RUserRemoveResponse,
			},
		},
		async handler(request, reply) {
			const [code] = await user.remove(request.user.i);
			reply.clearCookie('a');

			const response = createBaseResponse(code);

			// There is no other response code branches
			response.message.readable = 'Your account was deleted.';

			return response;
		},
	});

	done();
};
