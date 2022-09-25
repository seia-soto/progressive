import {greaterThan} from '@databases/pg-typed';
import {blocklist, db, instance, user} from './database/provider.js';
import User from './database/schema/user.js';
import derive from './error/derive.js';
import {EUserError} from './error/keys.js';
import {encode, validate} from './hash.js';
import {isEmail} from './validator/common.js';

export const create = async (email: string, password: string) => {
	if (!isEmail(email)) {
		return [EUserError.userEmailValidationFailed] as const;
	}

	return db.tx(async t => {
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
};

export const remove = async (id: number) => db.tx(async t => {
	await blocklist(t).delete({i_user: id});
	await instance(t).delete({i_user: id});
	await user(t).delete({i: id});

	return [EUserError.userRemoved] as const;
});

export type TUserModifiablePayload = Pick<User, 'email' | 'password'>

export const modify = async (id: number, payload: TUserModifiablePayload) => {
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

export const verify = async (email: string, password: string) => {
	const one = await user(db).find({email, email_token: -1}).select('i', 'password').one();

	if (!one) {
		return [EUserError.userAuthenticationFailed] as const;
	}

	return [EUserError.userAuthenticated, await validate(password, one.password), one.i] as const;
};

export const createEmailToken = async (id: number) => db.tx(async t => {
	const key = Math.floor(Math.random() * Date.now());

	await user(t).update({i: id}, {email_token: key});

	return [EUserError.userEmailTokenCreated, key.toString(36)] as const;
});

export const verifyEmailToken = async (id: number, token: string) => {
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
