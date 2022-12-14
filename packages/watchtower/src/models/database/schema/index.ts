/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: LwCftDskJ+LjzAhe/GF/XIkz/scHCc3LAT7slW8wNaFTK0AcqgdlKz6ATDkg9LJaR7C0ptWHy8qp+/YaT07tjQ==
 */

/* eslint-disable */
// tslint:disable

import AtdatabasesMigrationsApplied, {AtdatabasesMigrationsApplied_InsertParameters} from './atdatabases_migrations_applied'
import AtdatabasesMigrationsVersion, {AtdatabasesMigrationsVersion_InsertParameters} from './atdatabases_migrations_version'
import Blocklist, {Blocklist_InsertParameters} from './blocklist'
import Instance, {Instance_InsertParameters} from './instance'
import Session, {Session_InsertParameters} from './session'
import User, {User_InsertParameters} from './user'

interface DatabaseSchema {
  atdatabases_migrations_applied: {record: AtdatabasesMigrationsApplied, insert: AtdatabasesMigrationsApplied_InsertParameters};
  atdatabases_migrations_version: {record: AtdatabasesMigrationsVersion, insert: AtdatabasesMigrationsVersion_InsertParameters};
  blocklist: {record: Blocklist, insert: Blocklist_InsertParameters};
  instance: {record: Instance, insert: Instance_InsertParameters};
  session: {record: Session, insert: Session_InsertParameters};
  user: {record: User, insert: User_InsertParameters};
}
export default DatabaseSchema;

function serializeValue(_tableName: string, _columnName: string, value: unknown): unknown {
  return value;
}
export {serializeValue}

export type {
  AtdatabasesMigrationsApplied,
  AtdatabasesMigrationsApplied_InsertParameters,
  AtdatabasesMigrationsVersion,
  AtdatabasesMigrationsVersion_InsertParameters,
  Blocklist,
  Blocklist_InsertParameters,
  Instance,
  Instance_InsertParameters,
  Session,
  Session_InsertParameters,
  User,
  User_InsertParameters,
}
