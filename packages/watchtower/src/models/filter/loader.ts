import * as database from '../database/provider.js';
import {build} from './binary.js';
import {save} from './file.js';
import {load} from './remote.js';
import {read} from './user.js';

export enum EInstanceStatus {
  /* eslint-disable no-unused-vars */
  UP = 0,
  DOWN = 1,
  RELOAD = 2,
  POPULATE = 4,
  IMPERFECT = 5,
  MAINTAIN = 6,
  /* eslint-enable no-unused-vars */
}

export const merge = async (instanceId: number) => {
	const filters = await database.blocklist(database.db)
		.find({i_instance: instanceId})
		.select('address')
		.all();
	let merged = '';

	for (let i = 0; i < filters.length; i++) {
		const {address} = filters[i];
		const [protocol] = address.split('://');

		let filter = '';

		switch (protocol) {
			case 'https': {
				filter = await load(address)
					.catch(error => {
						console.error(error);
					}) || '';

				break;
			}

			case 'file': {
				filter = await read(instanceId);

				break;
			}

			default: {
				break;
			}
		}

		merged += filter;
	}

	return merged;
};

export const reload = async (instanceId: number) => {
	try {
		await database.instance(database.db)
			.update({i: instanceId}, {status: EInstanceStatus.RELOAD});

		const merged = await merge(instanceId);
		const filter = await build(merged);

		await database.instance(database.db)
			.update({i: instanceId}, {status: EInstanceStatus.POPULATE});

		await save(instanceId, filter);

		await database.instance(database.db)
			.update({i: instanceId}, {status: EInstanceStatus.UP});

		return true;
	} catch (error) {
		console.error(error);

		await database.instance(database.db)
			.update({i: instanceId}, {status: EInstanceStatus.IMPERFECT});

		return false;
	}
};
