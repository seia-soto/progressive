import fs from 'fs';
import createConnectionPool, {sql} from '@databases/pg';
import tables from '@databases/pg-typed';
import type Schema from './schema/index.js';
import path from 'path';

export {sql};

export const db = createConnectionPool('postgres://test-user@localhost:5432/test-db');

export const dispose = async () => {
	console.log('Disposing database client...');

	await db.dispose()
		.catch(error => {
			console.error('Failed to dispose database!');
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
