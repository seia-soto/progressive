import {ConnectionPool, Transaction} from '@databases/pg';
import {db, session} from './database/provider.js';
import {Session, User} from './database/schema/index.js';
import {ESessionError} from './error/keys.js';

export const isOwnedByUser = async (user: User['i'], ref: number, t: Transaction | ConnectionPool = db) => {
	const count = await session(t).count({i_user: user, i: ref});

	return count;
};

// Service
export const queryByUser = async (user: User['i']) => db.tx(async t => {
	const many = await session(t).find({i_user: user}).select('i', 'name', 'created_at').all();

	return [ESessionError.sessionQueried, many];
});

export const create = async (user: User['i'], name: string) => db.tx(async t => {
	const [one] = await session(t).insert({
		i_user: user,
		name,
		created_at: new Date(),
	});

	return [ESessionError.sessionCreated, one] as const;
});

export const remove = async (user: User['i'], id: Session['i']) => db.tx(async t => {
	if (!await isOwnedByUser(user, id, t)) {
		return [ESessionError.sessionNotOwnedByUser] as const;
	}

	await session(t).delete({i: id});

	return [ESessionError.sessionRemoved] as const;
});
