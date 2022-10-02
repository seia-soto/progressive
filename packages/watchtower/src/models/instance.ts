import {ConnectionPool, Transaction} from '@databases/pg';
import {EBlocklistType} from './blocklist.js';
import {blocklist, db, instance} from './database/provider.js';
import {Instance, User} from './database/schema/index.js';
import {EInstanceError} from './error/keys.js';
import {push} from './filter/binary.js';
import {build} from './filter/loader.js';
import {isDomain} from './validator/common.js';

export const isOwnedByUser = async (user: User['i'], id: Instance['i'], t: Transaction | ConnectionPool = db) => {
	const isOwnedByUser = await instance(t).count({i: id, i_user: user});

	return isOwnedByUser;
};

// Service
export const query = async (id: Instance['i']) => db.tx(async t => {
	const one = await instance(t).find({i: id}).select('i', 'alias', 'status', 'upstream').one();

	if (!one) {
		return [EInstanceError.instanceQueryFailed] as const;
	}

	return [EInstanceError.instanceQueried, one] as const;
});

export const queryByUser = async (user: User['i']) => db.tx(async t => {
	const many = await instance(t).find({i_user: user}).select('i', 'alias', 'status', 'upstream', 'updated_at').all();

	return [EInstanceError.instanceQueried, many.map(one => ({...one, updated_at: one.updated_at.getTime()}))] as const;
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
		address: 'progressive://i' + one.i,
		type: EBlocklistType.User,
		created_at: time,
		updated_at: time,
	});

	return [EInstanceError.instanceCreated, one] as const;
});

export const remove = async (user: User['i'], id: Instance['i']) => db.tx(async t => {
	if (!isOwnedByUser(user, id, t)) {
		return [EInstanceError.instanceNotOwnedByUser] as const;
	}

	await blocklist(t).delete({i_instance: id});
	await instance(t).delete({i: id});

	return [EInstanceError.instanceRemoved] as const;
});

export type TInstanceModifiablePayload = Partial<Pick<Instance, 'alias' | 'upstream'>>

export const modify = async (user: User['i'], id: Instance['i'], payload: TInstanceModifiablePayload) => db.tx(async t => {
	if (!isOwnedByUser(user, id, t)) {
		return [EInstanceError.instanceNotOwnedByUser] as const;
	}

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

	await instance(t).update({i: id}, modified);

	return [EInstanceError.instanceModified] as const;
});

/* eslint-disable no-unused-vars */
export const enum EInstanceStatus {
	Up = 0,
	Down,
	Error,
	Update
}
/* eslint-enable no-unused-vars */

export const refresh = async (id: Instance['i']) => db.tx(async t => {
	// Get existing blocklists
	const blocklists = await blocklist(t).find({i_instance: id}).select('address').all();

	// Set status to update
	await instance(t).update({i: id}, {status: EInstanceStatus.Update, updated_at: new Date()});

	// Build
	const built = await build(blocklists.map(entry => entry.address));
	const payload = JSON.stringify(built);

	await push(id.toString(), payload);

	// Set status to up
	await instance(t).update({i: id}, {status: EInstanceStatus.Up, updated_at: new Date()});
});
