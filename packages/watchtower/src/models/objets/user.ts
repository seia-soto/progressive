import {argon2id, hash, verify} from 'argon2';
import derive from '../../utils/derive';
import {db, EDatabaseError, user} from '../database/provider';
import {User} from '../database/schema';
import {createAbstractor, EAbstractionSpaces} from '../error/namespace';

export const expose = () => user(db);

export const abstract = createAbstractor(EAbstractionSpaces.User);

/* eslint-disable no-unused-vars */
export enum EUserExistResult {
  Inexist = abstract(10),
  Exist = abstract(11),
}
/* eslint-enable no-unused-vars */

export const exist = async (email: string) => {
	const [databaseQueryFailure, exists] = await derive(expose().count({email}));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	return [EUserExistResult[abstract((exists as 0 | 1) + 10)], exists] as const;
};

export interface IUserCreateOption {
  useEmailCheck: boolean
}

/* eslint-disable no-unused-vars */
export enum EUserCreateResult {
  Created = abstract(20),
  PasswordHashFailure = abstract(21),
}
/* eslint-enable no-unused-vars */

export const create = async (email: string, password: string, options: IUserCreateOption = {
	useEmailCheck: false,
}) => {
	const time = new Date();

	// Create email token for verification
	let emailToken = -1;

	if (options.useEmailCheck) {
		emailToken = Math.random() * time.getTime();
	}

	// Hash the password
	const [passwordHashFailure, passwordHash] = await derive(hash(password, {type: argon2id}));

	if (passwordHashFailure) {
		return [EUserCreateResult.PasswordHashFailure] as const;
	}

	// Create user
	const [databaseQueryFailure, users] = await derive(expose().insert({
		email,
		email_token: emailToken,
		password: passwordHash,
		created_at: time,
	}));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	return [EUserCreateResult.Created, users[0].i] as const;
};

export type TPartialUser = Partial<User>

/* eslint-disable no-unused-vars */
export enum EUserUpdateResult {
  Updated = abstract(30),
  NothingToDo = abstract(31),
  PasswordHashFailure = abstract(32),
}
/* eslint-enable no-unused-vars */

export const update = async (i: number, partial: TPartialUser) => {
	const query: TPartialUser = {};

	if (partial.email) {
		query.email = partial.email;
		query.email_token = Math.random() * Date.now();
	}

	if (partial.password) {
		const [passwordHashFailure, hashed] = await derive(hash(partial.password, {type: argon2id}));

		if (passwordHashFailure) {
			return [EUserUpdateResult.PasswordHashFailure] as const;
		}

		query.password = hashed;
	}

	// Check condition to update
	if (!Object.keys(query)) {
		return [EUserUpdateResult.NothingToDo] as const;
	}

	const [databaseQueryFailure] = await derive(expose().update({i}, query));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	return [EUserUpdateResult.Updated, query.email_token];
};

/* eslint-disable no-unused-vars */
export enum EUserRemoveResult {
  Deleted = abstract(40),
}
/* eslint-enable no-unused-vars */

export const remove = async (i: number) => {
	const [databaseQueryFailure] = await derive(expose().delete({i}));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	return [EUserRemoveResult.Deleted, i] as const;
};

/* eslint-disable no-unused-vars */
export enum EUserAuthenticateResult {
	Valid = abstract(50),
	Invalid = abstract(51),
	PasswordHashFailure = abstract(52)
}
/* eslint-enable no-unused-vars */

export const authenticateByPassword = async (email: string, password: string) => {
	const [databaseQueryFailure, user] = await derive(expose().find({email}).select('password').one());

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	if (!user) {
		return [EUserAuthenticateResult.Invalid] as const;
	}

	const [passwordHashFailure, isValid] = await derive(verify(user.password, password, {type: argon2id}));

	if (passwordHashFailure) {
		return [EUserAuthenticateResult.PasswordHashFailure] as const;
	}

	if (!isValid) {
		return [EUserAuthenticateResult.Invalid] as const;
	}

	return [EUserAuthenticateResult.Valid] as const;
};
