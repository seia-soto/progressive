/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: 7Rv83XfBIMZblBQyPUQ4lG7TpUfH+XGo67HZvbbpQP9VN0CRzy7X5GFZYG2sxSzWrrJXKgst0jGGYdW4wNkExg==
 */

/* eslint-disable */
// tslint:disable

import User from './user'

interface Instance {
  alias: string
  i: number & {readonly __brand?: 'instance_i'}
  i_user: User['i']
  name: string
  query_limit: number
}
export default Instance;

interface Instance_InsertParameters {
  alias: string
  i: number & {readonly __brand?: 'instance_i'}
  i_user: User['i']
  name: string
  query_limit: number
}
export type {Instance_InsertParameters}
