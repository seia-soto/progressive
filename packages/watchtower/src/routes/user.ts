import {EUserError} from '../models/error/keys.js';
import {user} from '../models/index.js';
import {createBaseResponse} from '../models/reply/common.js';
import {RUserCreateBody, RUserCreateResponse, RUserVerifyBody, RUserVerifyResponse} from '../models/reply/user.js';
import {TFastifyTypedPluginCallback} from '../typeRef.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
	fastify.route({
		url: '/',
		method: 'POST',
		schema: {
			body: RUserCreateBody,
			response: {
				200: RUserCreateResponse,
				400: RUserCreateResponse,
			},
		},
		async handler(request, reply) {
			const [code] = await user.create(request.body.email, request.body.password);
			const response = createBaseResponse(code);

			switch (code) {
				case EUserError.userCreated: {
					response.message.readable = 'Your account was created.';

					break;
				}

				case EUserError.userEmailValidationFailed: {
					reply.code(400);

					response.message.readable = 'Pleaes check your email address.';

					break;
				}

				case EUserError.userUniquenessCheckFailed: {
					reply.code(400);

					response.message.readable = 'A user with same email alrady registered.';

					break;
				}
			}

			return response;
		},
	});

	fastify.route({
		url: '/s',
		method: 'POST',
		schema: {
			body: RUserVerifyBody,
			response: {
				200: RUserVerifyResponse,
				400: RUserVerifyResponse,
			},
		},
		async handler(request, reply) {
			const [code, isValid, i] = await user.verify(request.body.email, request.body.password);
			const response = createBaseResponse(code);

			if (code !== EUserError.userAuthenticated || !isValid) {
				reply.code(400);

				response.message.readable = 'We failed to sign your session as you gave invalid information.';

				return response;
			}

			reply.setCookie('a', await reply.jwtSign({i}));

			response.message.readable = 'You signed in.';

			return response;
		},
	});

	done();
};
