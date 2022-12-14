import {EBlocklistType} from '../../models/blocklist.js';
import {EBlocklistError} from '../../models/error/keys.js';
import {blocklist} from '../../models/index.js';
import {RBlocklistCreateBody, RBlocklistCreateParam, RBlocklistCreateResponse, RBlocklistModifyBody, RBlocklistModifyParam, RBlocklistModifyResponse, RBlocklistQueryByInstanceParam, RBlocklistQueryByInstanceResponse, RBlocklistRemoveParam, RBlocklistRemoveResponse} from '../../models/reply/blocklist.js';
import {createBaseResponse, RBaseResponse} from '../../models/reply/common.js';
import {TFastifyTypedPluginCallback} from '../../typeRef.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
	fastify.route({
		url: '/:instance',
		method: 'GET',
		schema: {
			params: RBlocklistQueryByInstanceParam,
			response: {
				200: RBlocklistQueryByInstanceResponse,
			},
		},
		async handler(request) {
			const [code, many] = await blocklist.queryByInstance(request.user.i, parseInt(request.params.instance, 10));
			const response = createBaseResponse(code);

			response.message.readable = 'You queried blocklists of the instance.';

			return {
				...response,
				payload: many,
			};
		},
	});

	fastify.route({
		url: '/:instance',
		method: 'POST',
		schema: {
			params: RBlocklistCreateParam,
			body: RBlocklistCreateBody,
			response: {
				200: RBlocklistCreateResponse,
			},
		},
		async handler(request) {
			const {name, address} = request.body;

			const [code] = await blocklist.create(request.user.i, parseInt(request.params.instance, 10), {name, address, type: EBlocklistType.Remote});
			const response = createBaseResponse(code);

			response.message.readable = 'You created a blocklist.';

			return response;
		},
	});

	fastify.route({
		url: '/:blocklist',
		method: 'DELETE',
		schema: {
			params: RBlocklistRemoveParam,
			response: {
				200: RBlocklistRemoveResponse,
			},
		},
		async handler(request) {
			const [code] = await blocklist.remove(request.user.i, parseInt(request.params.blocklist, 10));
			const response = createBaseResponse(code);

			response.message.readable = 'You removed a blocklist.';

			return response;
		},
	});

	fastify.route({
		url: '/:blocklist',
		method: 'PUT',
		schema: {
			params: RBlocklistModifyParam,
			body: RBlocklistModifyBody,
			response: {
				200: RBlocklistModifyResponse,
				400: RBaseResponse,
			},
		},
		async handler(request) {
			const [code] = await blocklist.modify(request.user.i, parseInt(request.params.blocklist, 10), request.body);
			const response = createBaseResponse(code);

			switch (code) {
				case EBlocklistError.blocklistModified: {
					response.message.readable = 'You modified the blocklist.';

					break;
				}

				case EBlocklistError.blocklistModifiedNothing: {
					response.message.identifiable = 'You requested modification but nothing actually modified.';
					response.message.readable = 'You modified the blocklist.';

					break;
				}
			}

			return response;
		},
	});

	done();
};
