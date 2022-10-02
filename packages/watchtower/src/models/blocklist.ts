import {blocklist, db} from './database/provider.js';
import {Blocklist, Instance, User} from './database/schema/index.js';
import {EBlocklistError} from './error/keys.js';

/* eslint-disable no-unused-vars */
export const enum EBlocklistType {
	Remote = 0,
	User
}
/* eslint-enable no-unused-vars */

export const queryByInstance = async (instance: Instance['i']) => db.tx(async t => {
	const many = await blocklist(t).find({i_instance: instance}).select('i', 'name', 'address', 'type').all();

	return [EBlocklistError.blocklistQueried, many] as const;
});

export const create = async (user: User['i'], instance: Instance['i'], options: {
	name: Blocklist['name'],
	address: Blocklist['address'],
	type: EBlocklistType
}) => db.tx(async t => {
	const time = new Date();

	const [one] = await blocklist(t).insert({
		i_user: user,
		i_instance: instance,
		name: options.name,
		address: options.address,
		type: options.type,
		created_at: time,
		updated_at: time,
	});

	return [EBlocklistError.blocklistCreated, one] as const;
});

export const remove = async (id: Blocklist['i']) => db.tx(async t => {
	await blocklist(t).delete({i: id});

	return [EBlocklistError.blocklistRemoved] as const;
});

export type TBlocklistModifiablePayload = Partial<Pick<Blocklist, 'name' | 'address'>>

export const modify = async (id: Blocklist['i'], payload: TBlocklistModifiablePayload) => {
	const modified: Partial<Blocklist> = {
		updated_at: new Date(),
	};

	if (payload.name) {
		modified.name = payload.name;
	}

	if (payload.address) {
		modified.address = payload.address;
	}

	if (Object.keys(modified).length < 2) {
		return [EBlocklistError.blocklistModifiedNothing] as const;
	}

	return db.tx(async t => {
		await blocklist(t).update({i: id}, modified);

		return [EBlocklistError.blocklistModified] as const;
	});
};
