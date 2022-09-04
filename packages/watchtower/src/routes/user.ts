import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import * as argon2 from 'argon2';
import type {FastifyPluginCallback} from 'fastify';
import * as database from '../models/database/provider.js';
import {Error} from '../models/reply/schema.js';

export const router: FastifyPluginCallback = (fastify, opts, done) => {
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'PUT',
		url: '/',
		schema: {
			body: Type.Object({
				email: Type.String({
					format: 'email',
				}),
				password: Type.String({
					minLength: 16,
				}),
			}),
			response: {
				403: Type.Object({
					code: Type.Literal('signup_refused'),
					message: Error,
				}),
				418: Type.Object({
					code: Type.Literal('signup_conflicted'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('signup_requested'),
				}),
			},
		},
		async handler(request, reply) {
			const {
				email,
				password,
			} = request.body;

			// Check for email address allowlist
			const domainsAllowed = [
				'seia.io',
			];

			if (domainsAllowed.indexOf(email.split('@')[1]) < 0) {
				reply.code(403);

				return {
					code: 'signup_refused' as const,
					message: {
						readable: 'We are doing our best to support your email address. Sorry for this time.',
					},
				};
			}

			// Check for existing user
			const one = await database.user(database.db).findOne({
				email,
			});

			if (one) {
				reply.code(418);

				return {
					code: 'signup_conflicted' as const,
					message: {
						readable: 'You already signed up with this email address.',
					},
				};
			}

			// Create user
			// const token = Math.floor(Math.random() * Date.now() * 16);
			const hash = await argon2.hash(password, {
				type: argon2.argon2id,
			});

			await database.user(database.db).insert({
				i: -1,
				email,
				email_token: -1, // Disable email verification for a while
				password: hash,
				instance_limit: 1,
				created_at: new Date(),
			});

			return {
				code: 'signup_requested' as const,
			};
		},
	});

	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'PUT',
		url: '/ack',
		schema: {
			body: Type.Object({
				email: Type.String({
					format: 'email',
				}),
				password: Type.String({
					minLength: 16,
				}),
				token: Type.Number({
					minimum: 0,
				}),
			}),
			response: {
				403: Type.Object({
					code: Type.Literal('signup_failed'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('signup_completed'),
				}),
			},
		},
		async handler(request, reply) {
			const {
				email,
				password,
				token,
			} = request.body;

			// Check for existing user
			const one = await database.user(database.db).findOne({
				email,
				email_token: token,
			});

			if (
				!one
				|| !await argon2.verify(one.password, password, {type: argon2.argon2id})
			) {
				reply.code(403);

				return {
					code: 'signup_failed' as const,
					message: {
						readable: 'We failed to validate you are real.',
					},
				};
			}

			await database.user(database.db).update({email}, {email_token: -1});

			return {
				code: 'signup_completed' as const,
			};
		},
	});

	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'POST',
		url: '/',
		schema: {
			body: Type.Object({
				email: Type.String({
					format: 'email',
				}),
				password: Type.String({
					minLength: 16,
				}),
			}),
			response: {
				403: Type.Object({
					code: Type.Literal('sign_failed'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('sign_success'),
				}),
			},
		},
		async handler(request, reply) {
			const {
				email,
				password,
			} = request.body;

			// Check for existing user
			const one = await database.user(database.db).findOne({
				email,
			});

			if (
				!one
				|| one.email_token > 0
				|| !await argon2.verify(one.password, password, {type: argon2.argon2id})
			) {
				reply.code(403);

				return {
					code: 'sign_failed' as const,
					message: {
						readable: 'Bruh!',
					},
				};
			}

			// Assign JWT
			const jwt = await reply.jwtSign({
				i: one.i,
			});
			await reply.setCookie('a', jwt, {
				domain: 'progressive.seia.io',
				path: '/',
				secure: true,
				httpOnly: true,
				sameSite: true,
			});

			return {
				code: 'sign_success' as const,
			};
		},
	});

	done();
};
