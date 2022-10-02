import {ConnectionPool, Transaction} from '@databases/pg';
import crypto from 'node:crypto';
import {db, session} from './database/provider.js';
import {Session, User} from './database/schema/index.js';
import {ESessionError} from './error/keys.js';

export const isOwnedByUser = async (user: User['i'], id: Session['i'], t: Transaction | ConnectionPool) => {
	const count = await session(t).count({i: id, i_user: user});

	return count;
};

// Service
export const queryByUser = async (user: User['i']) => db.tx(async t => {
	const many = await session(t).find({i_user: user}).select('i', 'name', 'created_at').all();

	return [ESessionError.sessionQueried, many];
});

export const create = async (user: User['i'], token: string, name: string) => db.tx(async t => {
	const hash = crypto.createHash('md5').update(token).digest('hex');

	const [one] = await session(t).insert({
		i_user: user,
		name,
		token: hash,
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
