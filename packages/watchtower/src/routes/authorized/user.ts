import {EUserError} from '../../models/error/keys.js';
import {user} from '../../models/index.js';
import {createBaseResponse} from '../../models/reply/common.js';
import {RUserModifyBody, RUserModifyResponse} from '../../models/reply/user.js';
import {TFastifyTypedPluginCallback} from '../../typeRef.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
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

			switch (code) {
				case EUserError.userModified: {
					response.message.readable = 'A data for account was saved.';

					break;
				}

				case EUserError.userModifiedNothing: {
					response.message.identifiable = 'You requested modification but nothing actually modified.';
					response.message.readable = 'A data for account was saved.';

					break;
				}
			}

			return response;
		},
	});

	done();
};
