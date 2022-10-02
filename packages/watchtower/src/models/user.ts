import {greaterThan} from '@databases/pg-typed';
import {blocklist, db, instance, session, user} from './database/provider.js';
import User from './database/schema/user.js';
import derive from './error/derive.js';
import {EUserError} from './error/keys.js';
import {encode, validate} from './hash.js';

// Service
export const query = async (id: User['i']) => db.tx(async t => {
	const one = await user(t).find({i: id}).select('i', 'email').one();

	if (!one) {
		return [EUserError.userQueryFailed] as const;
	}

	return [EUserError.userQueried, one] as const;
});

export const create = async (email: User['email'], password: User['password']) => db.tx(async t => {
	const existing = await user(t).count({email});

	if (existing) {
		return [EUserError.userUniquenessCheckFailed];
	}

	const time = new Date();

	const hash = await encode(password);
	const [one] = await user(t).insert({
		email,
		email_token: -1,
		password: hash,
		created_at: time,
	});

	return [EUserError.userCreated, one] as const;
});

export const remove = async (id: User['i']) => db.tx(async t => {
	await blocklist(t).delete({i_user: id});
	await instance(t).delete({i_user: id});
	await session(t).delete({i_user: id});
	await user(t).delete({i: id});

	return [EUserError.userRemoved] as const;
});

export type TUserModifiablePayload = Partial<Pick<User, 'email' | 'password'>>

export const modify = async (id: User['i'], payload: TUserModifiablePayload) => {
	const modified: Partial<User> = {};

	if (payload.email) {
		modified.email = payload.email;
	}

	if (payload.password) {
		modified.password = await encode(payload.password);
	}

	if (!Object.keys(modified).length) {
		return [EUserError.userModifiedNothing] as const;
	}

	return db.tx(async t => {
		await user(t).update({i: id}, modified);

		return [EUserError.userModified] as const;
	});
};

export const verify = async (email: User['email'], password: User['password']) => db.tx(async t => {
	const one = await user(t).find({email, email_token: -1}).select('i', 'password').one();

	if (!one) {
		return [EUserError.userAuthenticationFailed] as const;
	}

	return [EUserError.userAuthenticated, await validate(password, one.password), one.i] as const;
});

export const createEmailToken = async (id: User['i']) => db.tx(async t => {
	const key = Math.floor(Math.random() * Date.now());

	await user(t).update({i: id}, {email_token: key});

	return [EUserError.userEmailTokenCreated, key.toString(36)] as const;
});

export const verifyEmailToken = async (id: User['i'], token: string) => {
	const [keyParsingError, key] = await derive(parseInt(token, 36));

	if (keyParsingError) {
		return [EUserError.userEmailTokenValidationFailed] as const;
	}

	return db.tx(async t => {
		const one = await user(t).find({i: id, email_token: greaterThan(-1)}).select('email_token').one();

		if (!one || one.email_token !== key) {
			return [EUserError.userEmailTokenValidationFailed] as const;
		}

		await user(t).update({i: id}, {email_token: -1});

		return [EUserError.userEmailTokenVerified] as const;
	});
};
