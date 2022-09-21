import derive from '../../utils/derive';
import {isUrl} from '../../utils/validate';
import {blocklist, db, EDatabaseError} from '../database/provider';
import {Blocklist, Instance, User} from '../database/schema';
import {createAbstractor, EAbstractionSpaces} from '../error/namespace';

export const expose = () => blocklist(db);

export const abstract = createAbstractor(EAbstractionSpaces.Blocklist);

/* eslint-disable no-unused-vars */
export enum EBlocklistCreateResult {
  Created = abstract(20),
  AddressValidityFailure = abstract(21),
}
/* eslint-enable no-unused-vars */

export const create = async (user: User['i'], instance: Instance['i'], name: string, address: string) => {
	const time = new Date();

	if (!isUrl(address)) {
		return [EBlocklistCreateResult.AddressValidityFailure] as const;
	}

	const [databaseQueryFailure, blocklists] = await derive(expose().insert({
		i_user: user,
		i_instance: instance,
		name,
		address,
		created_at: time,
		updated_at: time,
	}));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure, databaseQueryFailure] as const;
	}

	return [EBlocklistCreateResult.Created, blocklists[0].i] as const;
};

export type TPartial = Partial<Blocklist>

/* eslint-disable no-unused-vars */
export enum EBlocklistUpdateResult {
	Updated = abstract(30),
	NothingToDo = abstract(31),
	AddressValidityFailure = abstract(32),
}
/* eslint-enable no-unused-vars */

export const update = async (i: number, partial: TPartial) => {
	const query: TPartial = {};

	if (partial.name) {
		query.name = partial.name;
	}

	if (partial.address) {
		if (!isUrl(partial.address)) {
			return [EBlocklistUpdateResult.AddressValidityFailure] as const;
		}

		query.address = partial.address;
	}

	if (!Object.keys(query)) {
		return [EBlocklistUpdateResult.NothingToDo] as const;
	}

	const [databaseQueryFailure] = await derive(expose().update({i}, query));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure, databaseQueryFailure] as const;
	}

	return [EBlocklistUpdateResult.Updated] as const;
};

/* eslint-disable no-unused-vars */
export enum EBlocklistRemoveResult {
	Removed = abstract(40),
}
/* eslint-enable no-unused-vars */

export const remove = async (i: number) => {
	const [databaseQueryFailure] = await derive(expose().delete({i}));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure, databaseQueryFailure] as const;
	}

	return [EBlocklistRemoveResult.Removed] as const;
};
