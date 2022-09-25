import {blocklist, db, instance} from './database/provider.js';
import {Instance, User} from './database/schema/index.js';
import {EInstanceError} from './error/keys.js';
import {isDomain} from './validator/common.js';

export const query = async (id: number) => db.tx(async t => {
	const one = await instance(t).find({i: id}).select('i', 'alias', 'status', 'upstream');

	if (!one) {
		return [EInstanceError.instanceQueryFailed] as const;
	}

	return [EInstanceError.instanceQueried, one] as const;
});

export const queryByUser = async (user: User['i']) => db.tx(async t => {
	const many = await instance(t).find({i_user: user}).select('i', 'alias', 'status', 'upstream').all();

	return [EInstanceError.instanceQueried, many] as const;
});

export const create = async (user: User['i']) => db.tx(async t => {
	const time = new Date();

	const [one] = await instance(t).insert({
		i_user: user,
		alias: 'Network',
		status: 0,
		upstream: 'dot://dns.seia.io\ndot://secondary.dns.seia.io',
		created_at: time,
		updated_at: time,
	});
	await blocklist(t).insert({
		i_user: user,
		i_instance: one.i,
		name: 'User',
		address: 'progressive://internal',
		created_at: time,
		updated_at: time,
	});

	return [EInstanceError.instanceCreated, one] as const;
});

export const remove = async (id: Instance['i']) => db.tx(async t => {
	await blocklist(t).delete({i_instance: id});
	await instance(t).delete({i: id});

	return id;
});

export type TInstanceModifiablePayload = Pick<Instance, 'alias' | 'upstream'>

export const modify = async (id: Instance['i'], payload: TInstanceModifiablePayload) => {
	const time = new Date();
	const modified: Partial<Instance> = {
		updated_at: time,
	};

	if (payload.alias) {
		modified.alias = payload.alias;
	}

	if (payload.upstream) {
		const lines = payload.upstream.split('\n');
		const count = lines.length;
		let validCounts = 0;

		modified.upstream = '';

		if (count > 4) {
			return [EInstanceError.instanceUpstreamValidationFailed] as const;
		}

		for (let i = 0; i < count; i++) {
			const [protocol, address] = lines[i].split('://');

			if (
				(protocol === 'dns' && /\d+\.\d+\.\d+\.\d+/.test(address))
        || ((protocol === 'dot' || protocol === 'doh') && isDomain(address))
			) {
				modified.upstream += lines[i] + '\n';
				validCounts++;
			}
		}

		if (!validCounts || validCounts > 4) {
			return [EInstanceError.instanceUpstreamValidationFailed] as const;
		}
	}

	if (Object.keys(modified).length < 2) {
		return [EInstanceError.instanceModifiedNothing] as const;
	}

	return db.tx(async t => {
		await instance(t).update({i: id}, modified);

		return [EInstanceError.instanceModified] as const;
	});
};
