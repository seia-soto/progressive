import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import type {FastifyPluginCallback} from 'fastify';
import {defaultPath} from '../../models/blocklist/file.js';
import * as database from '../../models/database/provider.js';
import Instance from '../../models/database/schema/instance.js';
import {Error} from '../../models/reply/schema.js';

export const router: FastifyPluginCallback = (fastify, opts, done) => {
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'GET',
		url: '/',
		schema: {
			response: {
				200: Type.Object({
					code: Type.Literal('instances_listed'),
				}),
			},
		},
		async handler(request) {
			const payload = await database.instance(database.db)
				.find({i: request.user.i})
				.orderByDesc('i')
				.all();

			return {
				code: 'instances_listed' as const,
				payload,
			};
		},
	});
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'PUT',
		url: '/',
		schema: {
			body: Type.Object({
				alias: Type.String({
					minLength: 4,
					maxLength: 24,
				}),
			}),
			response: {
				200: Type.Object({
					code: Type.Literal('instance_created'),
				}),
				402: Type.Object({
					code: Type.Literal('instance_limit_reached'),
					message: Error,
				}),
				403: Type.Object({
					code: Type.Literal('invalid_user'),
					message: Error,
				}),
			},
		},
		async handler(request, reply) {
			const {alias} = request.body;
			const {i} = request.user;

			// Check for existing user
			const user = await database.user(database.db)
				.find({i})
				.select('instance_limit')
				.one();

			if (!user) {
				reply.code(403);
				reply.clearCookie('a');

				return {
					code: 'invalid_user' as const,
					message: {
						readable: 'Sorry, your session has been terminated due to information mismatch and to protect your account.',
					},
				};
			}

			// Check for instance limit
			const pressure = await database.instance(database.db)
				.count({i_user: i});

			if (user.instance_limit >= pressure) {
				reply.code(402);

				return {
					code: 'instance_limit_reached' as const,
					message: {
						readable: 'You reached your instance limit. Please, contact for increasement.',
					},
				};
			}

			// Create
			await database.db.tx(async t => {
				const [instance] = await database.instance(t)
					.insert({
						i_user: i,
						alias,
						upstream: 'dot://dns.seia.io;dot://secondary.dns.seia.io',
						query_limit: 100 * 1000,
						manual_limit: 0,
					});
				await database.blocklist(t)
					.insert({
						i_user: i,
						i_instance: instance.i,
						address: defaultPath,
						entry_limit: 2500,
					});
			});

			return {
				code: 'instance_created' as const,
			};
		},
	});
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'PATCH',
		url: '/:instanceId',
		schema: {
			params: Type.Object({
				instanceId: Type.Number({
					minimum: 1,
				}),
			}),
			body: Type.Object({
				alias: Type.Optional(Type.String({
					minLength: 4,
					maxLength: 24,
				})),
				upstream: Type.Optional(Type.String()),
			}),
			response: {
				200: Type.Object({
					code: Type.Literal('instance_updated'),
				}),
				402: Type.Object({
					code: Type.Literal('upstream_limit_reached'),
					message: Error,
				}),
				403: Type.Object({
					code: Type.Literal('invalid_instance'),
					message: Error,
				}),
			},
		},
		async handler(request, reply) {
			const {instanceId} = request.params;
			const {alias, upstream} = request.body;
			const {i} = request.user;

			// Check for existing instance
			const instance = await database.instance(database.db)
				.findOne({i: instanceId, i_user: i});

			if (!instance) {
				reply.code(403);
				reply.clearCookie('a');

				return {
					code: 'invalid_instance' as const,
					message: {
						readable: 'Sorry, your session has been terminated due to information mismatch and to protect your account.',
					},
				};
			}

			const payload: Partial<Instance> = {};

			// Check for upstream types
			if (upstream) {
				const entries = upstream.split(';');
				const updated = [] as string[];

				for (let i = 0; i < entries.length; i++) {
					const [protocol, address] = entries[i].split('://');

					switch (protocol) {
						case 'dns': {
							if (!/\d+\.\d+\.\d+\.\d+/.test(address)) {
								continue;
							}

							break;
						}

						case 'dot':
						case 'doh': {
							if (!/^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/.test(address)) {
								continue;
							}

							break;
						}

						default: {
							continue;
						}
					}

					updated.push(entries[i]);
				}

				if (updated.length > 4) {
					reply.code(402);

					return {
						code: 'upstream_limit_reached' as const,
						message: {
							readable: 'You reached instance upstream limit. Please, contact for increasement.',
						},
					};
				}

				payload.upstream = updated.join(';');
			}

			// Checks for alias
			if (alias) {
				payload.alias = alias;
			}

			// Update
			await database.instance(database.db)
				.update({i: instanceId}, payload);

			return {
				code: 'instance_updated' as const,
			};
		},
	});
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'DELETE',
		url: '/:instanceId',
		schema: {
			params: Type.Object({
				instanceId: Type.Number({
					minimum: 1,
				}),
			}),
			response: {
				200: Type.Object({
					code: Type.Literal('instance_deleted'),
				}),
				403: Type.Object({
					code: Type.Literal('invalid_instance'),
					message: Error,
				}),
			},
		},
		async handler(request, reply) {
			const {instanceId} = request.params;
			const {i} = request.user;

			// Check for existing instance
			const instance = await database.instance(database.db)
				.findOne({i: instanceId, i_user: i});

			if (!instance) {
				reply.code(403);
				reply.clearCookie('a');

				return {
					code: 'invalid_instance' as const,
					message: {
						readable: 'Sorry, your session has been terminated due to information mismatch and to protect your account.',
					},
				};
			}

			// Delete
			await database.instance(database.db)
				.delete({i: instanceId});

			return {
				code: 'instance_deleted' as const,
			};
		},
	});

	done();
};
