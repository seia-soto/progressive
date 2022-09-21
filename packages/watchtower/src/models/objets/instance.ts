import derive from '../../utils/derive';
import {isUrl} from '../../utils/validate';
import {db, EDatabaseError, instance} from '../database/provider';
import {Instance, User} from '../database/schema';
import {createAbstractor, EAbstractionSpaces} from '../error/namespace';

export const expose = () => instance(db);

export const abstract = createAbstractor(EAbstractionSpaces.Instance);

/* eslint-disable no-unused-vars */
export enum EInstanceExistResult {
  Inexist = abstract(10),
  Exist = abstract(11),
}
/* eslint-enable no-unused-vars */

export const exist = async (i: number) => {
	const [databaseQueryFailure, exists] = await derive(expose().count({i}));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	return [EInstanceExistResult[abstract((exists as 0 | 1) + 10)], exists] as const;
};

/* eslint-disable no-unused-vars */
export enum EInstanceCreateResult {
  Created = abstract(20),
}
/* eslint-enable no-unused-vars */

export const create = async (user: User['i'], alias: string, upstream: string = 'dot://dns.seia.io\ndot://secondary.dns.seia.io') => {
	const time = new Date();

	const [databaseQueryFailure, instances] = await derive(expose().insert({
		i_user: user,
		status: 0,
		alias,
		upstream,
		created_at: time,
		updated_at: time,
	}));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	return [EInstanceCreateResult.Created, instances[0].i] as const;
};

export type TPartial = Partial<Instance>

/* eslint-disable no-unused-vars */
export enum EInstanceUpdateResult {
  Updated = abstract(30),
  NothingToDo = abstract(31),
}
/* eslint-enable no-unused-vars */

export const update = async (i: number, partial: TPartial) => {
	const query: TPartial = {};

	if (partial.alias) {
		query.alias = partial.alias;
	}

	if (partial.upstream) {
		const upstreams = partial.upstream.split('\n');
		const updated: string[] = [];

		for (let i = 0; i < upstreams.length; i++) {
			const [protocol, address] = upstreams[i].split('://');

			switch (protocol) {
				case 'dns': {
					if (!/\d+\.\d+\.\d+\.\d+/.test(address)) {
						continue;
					}

					break;
				}

				case 'dot':
				case 'doh': {
					if (!isUrl(address)) {
						continue;
					}

					break;
				}

				default: {
					continue;
				}
			}

			updated.push(upstreams[i]);
		}

		query.upstream = updated.join('\n');
	}

	if (!Object.keys(query)) {
		return [EInstanceUpdateResult.NothingToDo] as const;
	}

	const [databaseQueryFailure] = await derive(expose().update({i}, query));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	return [EInstanceUpdateResult.Updated] as const;
};

/* eslint-disable no-unused-vars */
export enum EInstanceRemoveResult {
  Deleted = abstract(40),
}
/* eslint-enable no-unused-vars */

export const remove = async (i: number) => {
	const [databaseQueryFailure] = await derive(expose().delete({i}));

	if (databaseQueryFailure) {
		return [EDatabaseError.QueryFailure] as const;
	}

	return [EInstanceRemoveResult.Deleted] as const;
};

/* eslint-disable no-unused-vars */
export enum EInstanceQueryResult {
	Queried = abstract(50),
	Inexist = abstract(51)
}
/* eslint-enable no-unused-vars */
