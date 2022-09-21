import {EDatabaseError} from '../database/provider';
import {create} from '../objets/blocklist';

export enum EAbstractionSpaces {
  /* eslint-disable no-unused-vars */
  Database = 1,
  User = 2,
  Instance = 3,
  Blocklist = 4,
  /* eslint-enable no-unused-vars */
}

export const abstractionSize = 10 * 1000;

export const extractAbstract = (applied: number) => Math.floor(applied / abstractionSize);

export const createAbstractor = (ns: number) => (local: number) => (ns * abstractionSize) + local;

export const getAbstractSpace = (ns: number) => EAbstractionSpaces[ns];

export const handle = async <TSome extends readonly unknown[]>(some: Promise<TSome>) => {
	const result = await some;

	// eslint-disable-next-line default-case
	switch (result[0]) {
		case EDatabaseError.QueryFailure: {
			console.log('Database error occured!');

			break;
		}
	}

	return result;
};
