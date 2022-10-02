/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: Fqb/NOGd2MAzOZ4gJ1jwt4S3jZ51vNFstUK4wzjts4V+qSETSF4ocQLJsDoRcRaWhgIzf61UhXujn8cROLOdxg==
 */

/* eslint-disable */
// tslint:disable

import User from './user'

interface Session {
  created_at: Date
  /**
   * @default nextval('session_i_seq'::regclass)
   */
  i: number & {readonly __brand?: 'session_i'}
  /**
   * @default nextval('session_i_user_seq'::regclass)
   */
  i_user: User['i']
  name: string
}
export default Session;

interface Session_InsertParameters {
  created_at: Date
  /**
   * @default nextval('session_i_seq'::regclass)
   */
  i?: number & {readonly __brand?: 'session_i'}
  /**
   * @default nextval('session_i_user_seq'::regclass)
   */
  i_user?: User['i']
  name: string
}
export type {Session_InsertParameters}
