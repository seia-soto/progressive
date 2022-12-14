/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: q32HVQT5jTVMO8wPoQCHbBObm60wbLZRviqs3BtZOAOEZfNyg9xEfRNZlNrxsqVJzEwWQlolrSk7YYU31xqEjw==
 */

/* eslint-disable */
// tslint:disable

import Instance from './instance'
import User from './user'

interface Blocklist {
  address: string
  created_at: Date
  /**
   * @default nextval('blocklist_i_seq'::regclass)
   */
  i: number & {readonly __brand?: 'blocklist_i'}
  /**
   * @default nextval('blocklist_i_instance_seq'::regclass)
   */
  i_instance: Instance['i']
  /**
   * @default nextval('blocklist_i_user_seq'::regclass)
   */
  i_user: User['i']
  name: string
  type: number
  updated_at: Date
}
export default Blocklist;

interface Blocklist_InsertParameters {
  address: string
  created_at: Date
  /**
   * @default nextval('blocklist_i_seq'::regclass)
   */
  i?: number & {readonly __brand?: 'blocklist_i'}
  /**
   * @default nextval('blocklist_i_instance_seq'::regclass)
   */
  i_instance?: Instance['i']
  /**
   * @default nextval('blocklist_i_user_seq'::regclass)
   */
  i_user?: User['i']
  name: string
  type: number
  updated_at: Date
}
export type {Blocklist_InsertParameters}
