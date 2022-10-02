import {EUserError} from '../models/error/keys.js';
import {user} from '../models/index.js';
import {createBaseResponse, RBaseResponse} from '../models/reply/common.js';
import {RUserCreateBody, RUserCreateResponse, RUserEmailTokenVerifyQuery, RUserEmailTokenVerifyResponse, RUserVerifyBody, RUserVerifyResponse} from '../models/reply/user.js';
import {TFastifyTypedPluginCallback} from '../typeRef.js';

export const router: TFastifyTypedPluginCallback = (fastify, opts, done) => {
	fastify.route({
		url: '/',
		method: 'POST',
		schema: {
			body: RUserCreateBody,
			response: {
				200: RUserCreateResponse,
				400: RBaseResponse,
			},
		},
		async handler(request, reply) {
			const [code] = await user.create(request.body.email, request.body.password);
			const response = createBaseResponse(code);

			switch (code) {
				case EUserError.userCreated: {
					response.message.identifiable = 'Your account created but you need to do email verification to continue.';
					response.message.readable = 'Please check your email inbox to continue signing up.';

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
				400: RBaseResponse,
			},
		},
		async handler(request, reply) {
			const [code, isValid, i] = await user.verify(request.body.email, request.body.password);
			const response = createBaseResponse(code);

			if (code !== EUserError.userAuthenticated || !isValid) {
				reply.code(400);

				response.message.readable = 'We failed to sign you in as you gave invalid information.';

				return response;
			}

			reply.setCookie('a', await reply.jwtSign({i}));

			response.message.readable = 'You signed in.';

			return response;
		},
	});

	fastify.route({
		url: '/s',
		method: 'DELETE',
		schema: {
			response: {
				200: RUserVerifyResponse,
			},
		},
		async handler(request, reply) {
			reply.clearCookie('a');

			const response = createBaseResponse(EUserError.userSessionExpired);

			response.message.readable = 'You signed out.';

			return response;
		},
	});

	fastify.route({
		url: '/a',
		method: 'GET',
		schema: {
			querystring: RUserEmailTokenVerifyQuery,
			response: {
				200: RUserEmailTokenVerifyResponse,
				400: RBaseResponse,
			},
		},
		async handler(request, reply) {
			const [code] = await user.verifyEmailToken(request.query.i, request.query.token);
			const response = createBaseResponse(code);

			if (code !== EUserError.userEmailTokenVerified) {
				response.message.readable = 'Your email was verified.';

				return response;
			}

			reply.code(400);

			response.message.identifiable = 'Your email token was invalid.';
			response.message.readable = 'Please create another email verification request and try again.';

			return response;
		},
	});

	done();
};
