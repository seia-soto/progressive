import createConnectionPool, {sql} from '@databases/pg';
import tables from '@databases/pg-typed';
import fs from 'node:fs';
import path from 'node:path';
import {createAbstractor, EAbstractionSpaces} from '../error/namespace.js';
import type Schema from './schema/index.js';

export {sql};

export const db = createConnectionPool('postgres://test-user@localhost:5432/test-db');

export const dispose = async () => {
	console.log('Disposing database client...');

	await db.dispose()
		.catch(error => {
			console.error(error);
		});
};

export const {
	user,
	instance,
	blocklist,
} = tables<Schema>({
	databaseSchema: JSON.parse(
		fs.readFileSync(
			path.dirname(import.meta.url.replace('file://', '')) + '/schema/schema.json',
			'utf-8',
		),
	),
});

export const abstract = createAbstractor(EAbstractionSpaces.Database);

export enum EDatabaseError {
	/* eslint-disable no-unused-vars */
	QueryFailure = abstract(1),
	/* eslint-enable no-unused-vars */
}
