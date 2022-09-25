import {EInstanceError} from '../../models/error/keys.js';
import {instance} from '../../models/index.js';
import {createBaseResponse, RBaseResponse} from '../../models/reply/common.js';
import {RInstanceCreateResponse, RInstanceModifyBody, RInstanceModifyParam, RInstanceModifyResponse, RInstanceQueryByUserResponse, RInstanceQueryParam, RInstanceQueryResponse} from '../../models/reply/instance.js';
import {TFastifyTypedPluginCallback} from '../../typeRef.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
	fastify.route({
		url: '/',
		method: 'GET',
		schema: {
			response: {
				200: RInstanceQueryByUserResponse,
			},
		},
		async handler(request) {
			const [code, many] = await instance.queryByUser(request.user.i);
			const response = createBaseResponse(code);

			response.message.readable = 'Listed instances of the user.';

			return {
				...response,
				payload: many,
			};
		},
	});

	fastify.route({
		url: '/:i',
		method: 'GET',
		schema: {
			params: RInstanceQueryParam,
			response: {
				200: RInstanceQueryResponse,
				400: RBaseResponse,
			},
		},
		async handler(request, reply) {
			const [code, one] = await instance.query(request.params.i);
			const response = createBaseResponse(code);

			if (code !== EInstanceError.instanceQueried) {
				reply.code(400);

				response.message.readable = 'You requested instance is not available on our server.';

				return response;
			}

			response.message.readable = 'You queried the instance.';

			return {
				...response,
				payload: one,
			};
		},
	});

	fastify.route({
		url: '/',
		method: 'POST',
		schema: {
			response: {
				200: RInstanceCreateResponse,
			},
		},
		async handler(request) {
			const [code] = await instance.create(request.user.i);
			const response = createBaseResponse(code);

			response.message.readable = 'You created a new instance.';

			return response;
		},
	});

	fastify.route({
		url: '/:i',
		method: 'PUT',
		schema: {
			params: RInstanceModifyParam,
			body: RInstanceModifyBody,
			response: {
				200: RInstanceModifyResponse,
				400: RBaseResponse,
			},
		},
		async handler(request, reply) {
			const [code] = await instance.modify(request.params.i, request.body);
			const response = createBaseResponse(code);

			switch (code) {
				case EInstanceError.instanceModified: {
					response.message.readable = 'You modified the instance.';

					break;
				}

				case EInstanceError.instanceModifiedNothing: {
					response.message.identifiable = 'You requested modification but nothing actually modified.';
					response.message.readable = 'You modified the instance.';

					break;
				}

				case EInstanceError.instanceUpstreamValidationFailed: {
					reply.code(400);

					response.message.readable = 'The format of instance upstream protocol should be one of doh, dot, and dns and qualify its corresponding value format.';

					break;
				}
			}

			return response;
		},
	});

	done();
};
