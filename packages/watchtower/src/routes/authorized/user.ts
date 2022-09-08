import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import * as argon2 from 'argon2';
import type {FastifyPluginCallback} from 'fastify';
import * as database from '../../models/database/provider.js';
import {Error} from '../../models/reply/schema.js';

export const router: FastifyPluginCallback = (fastify, opts, done) => {
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'DELETE',
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
					code: Type.Literal('verification_failed'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('user_deleted'),
				}),
			},
		},
		async handler(request, reply) {
			const {i} = request.user;
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
        || !await argon2.verify(one.password, password, {type: argon2.argon2id})
			) {
				reply.code(403);

				return {
					code: 'verification_failed' as const,
					message: {
						readable: 'We were unable to verify who you are.',
					},
				};
			}

			// Delete user and their components
			await database.db.tx(async t => {
				await database.instance(t).delete({i_user: i});
				await database.blocklist(t).delete({i_user: i});
				await database.user(t).delete({i});
			});

			// Delete session
			await reply.clearCookie('a');

			return {
				code: 'user_deleted' as const,
			};
		},
	});

	done();
};
