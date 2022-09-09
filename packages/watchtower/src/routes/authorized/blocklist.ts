import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import type {FastifyPluginCallback} from 'fastify';
import * as database from '../../models/database/provider.js';
import * as blocklist from '../../models/filter/user.js';
import {Error} from '../../models/reply/schema.js';

export const router: FastifyPluginCallback = (fastify, opts, done) => {
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'GET',
		url: '/:instanceId',
		schema: {
			params: Type.Object({
				instanceId: Type.Number({
					minimum: 0,
				}),
			}),
			response: {
				403: Type.Object({
					code: Type.Literal('invalid_instance'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('blocklists_listed'),
				}),
			},
		},
		async handler(request, reply) {
			const {i} = request.user;
			const {instanceId} = request.params;

			// Check for existing instance
			const exists = await database.instance(database.db)
				.count({i: instanceId, i_user: i});

			if (!exists) {
				reply.code(403);
				reply.clearCookie('a');

				return {
					code: 'invalid_instance' as const,
					message: {
						readable: 'Sorry, your session has been terminated due to information mismatch and to protect your account.',
					},
				};
			}

			const payload = await database.blocklist(database.db)
				.find({i_instance: instanceId})
				.all();

			return {
				code: 'blocklists_listed' as const,
				payload,
			};
		},
	});
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'PUT',
		url: '/:instanceId',
		schema: {
			params: Type.Object({
				instanceId: Type.Number({
					minimum: 0,
				}),
			}),
			body: Type.Object({
				name: Type.String({
					minLength: 2,
					maxLength: 20,
				}),
				address: Type.String({
					minLength: 1,
					maxLength: 256,
				}),
			}),
			response: {
				403: Type.Object({
					code: Type.Literal('invalid_instance'),
					message: Error,
				}),
				402: Type.Object({
					code: Type.Literal('filter_limit_reached'),
					message: Error,
				}),
				400: Type.Object({
					code: Type.Literal('invalid_filter'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('blocklist_created'),
				}),
			},
		},
		async handler(request, reply) {
			const {i} = request.user;
			const {instanceId} = request.params;
			const {name, address} = request.body;

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

			// Check for protocol
			const [protocol, kAddress] = address.split('://');

			switch (protocol) {
				case 'https': {
					break;
				}

				default: {
					reply.code(400);

					return {
						code: 'invalid_filter' as const,
						message: {
							readable: 'Sorry, the protocol you specified is not supported. We only support HTTPS yet.',
						},
					};
				}
			}

			// Check for address
			if (!/^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(kAddress)) {
				reply.code(400);

				return {
					code: 'invalid_filter' as const,
					message: {
						readable: 'Sorry, the protocol you specified is not supported. We only support HTTPS yet.',
					},
				};
			}

			// Check for filter limit
			const pressure = await database.blocklist(database.db)
				.count({i_instance: instanceId});

			if (instance.filter_limit <= pressure) {
				reply.code(402);

				return {
					code: 'filter_limit_reached' as const,
					message: {
						readable: 'You reached your filter limit. Please, contact for increasement.',
					},
				};
			}

			// Create
			const now = new Date();

			await database.blocklist(database.db)
				.insert({
					i_user: i,
					i_instance: instanceId,
					name,
					address,
					entry_limit: 50 * 1000,
					created_at: now,
					updated_at: now,
				});

			return {
				code: 'blocklist_created' as const,
			};
		},
	});
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'PUT',
		url: '/:instanceId/:blocklistId',
		schema: {
			params: Type.Object({
				instanceId: Type.Number({
					minimum: 0,
				}),
				blocklistId: Type.Number({
					minimum: 0,
				}),
			}),
			response: {
				403: Type.Object({
					code: Type.Literal('invalid_blocklist'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('blocklist_deleted'),
				}),
			},
		},
		async handler(request, reply) {
			const {i} = request.user;
			const {instanceId, blocklistId} = request.params;

			// Check for existing blocklist
			const exists = await database.blocklist(database.db)
				.count({i: blocklistId, i_user: i, i_instance: instanceId});

			if (!exists) {
				reply.code(403);
				reply.clearCookie('a');

				return {
					code: 'invalid_blocklist' as const,
					message: {
						readable: 'Sorry, your session has been terminated due to information mismatch and to protect your account.',
					},
				};
			}

			await database.blocklist(database.db)
				.delete({i: blocklistId});

			return {
				code: 'blocklist_deleted' as const,
			};
		},
	});

	// File
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'GET',
		url: '/user/:instanceId',
		schema: {
			params: Type.Object({
				instanceId: Type.Number({
					minimum: 0,
				}),
			}),
			response: {
				500: Type.Object({
					code: Type.Literal('userland_connection_lost'),
					message: Error,
				}),
				403: Type.Object({
					code: Type.Literal('invalid_instance'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('blocklist_queried'),
				}),
			},
		},
		async handler(request, reply) {
			const {i} = request.user;
			const {instanceId} = request.params;

			// Check for existing instance
			const exists = await database.instance(database.db)
				.count({i: instanceId, i_user: i});

			if (!exists) {
				reply.code(403);
				reply.clearCookie('a');

				return {
					code: 'invalid_instance' as const,
					message: {
						readable: 'Sorry, your session has been terminated due to information mismatch and to protect your account.',
					},
				};
			}

			// Read
			let result: boolean | string | void = await blocklist.read(instanceId)
				.catch(error => {
					console.error(error);

					result = false;
				});

			if (!result) {
				reply.code(500);

				return {
					code: 'userland_connection_lost' as const,
					message: {
						readable: 'Sorry, we failed to deliver your asset. Please, contact support to recover.',
					},
				};
			}

			return {
				code: 'blocklist_queried' as const,
			};
		},
	});
	fastify.withTypeProvider<TypeBoxTypeProvider>().route({
		method: 'PATCH',
		url: '/user/:instanceId',
		schema: {
			params: Type.Object({
				instanceId: Type.Number({
					minimum: 0,
				}),
			}),
			body: Type.Object({
				f: Type.String({
					maxLength: 2500 * 256,
				}),
			}),
			response: {
				500: Type.Object({
					code: Type.Literal('userland_connection_lost'),
					message: Error,
				}),
				403: Type.Object({
					code: Type.Literal('invalid_instance'),
					message: Error,
				}),
				200: Type.Object({
					code: Type.Literal('blocklist_updated'),
				}),
			},
		},
		async handler(request, reply) {
			const {i} = request.user;
			const {instanceId} = request.params;
			const {f} = request.body;

			// Check for existing instance
			const exists = await database.instance(database.db)
				.count({i: instanceId, i_user: i});

			if (!exists) {
				reply.code(403);
				reply.clearCookie('a');

				return {
					code: 'invalid_instance' as const,
					message: {
						readable: 'Sorry, your session has been terminated due to information mismatch and to protect your account.',
					},
				};
			}

			// Write
			let result: boolean | void = await blocklist.save(instanceId, f)
				.catch(error => {
					console.error(error);

					result = false;
				});

			if (!result) {
				reply.code(500);

				return {
					code: 'userland_connection_lost' as const,
					message: {
						readable: 'Sorry, we failed to deliver your asset. Please, contact support to recover.',
					},
				};
			}

			return {
				code: 'blocklist_updated' as const,
			};
		},
	});

	done();
};
