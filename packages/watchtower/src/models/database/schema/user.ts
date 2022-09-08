/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: gnJ2a7G2DF8td6zbkN3qwitMprjZahK3dh/7XRckZcIXVpkkro7la50w3VrYXPztgXbxff5U1kND7qi5sNgjig==
 */

/* eslint-disable */
// tslint:disable

interface User {
  created_at: Date
  email: string
  email_token: number
  /**
   * @default nextval('user_i_seq'::regclass)
   */
  i: number & {readonly __brand?: 'user_i'}
  instance_limit: number
  password: string
}
export default User;

interface User_InsertParameters {
  created_at: Date
  email: string
  email_token: number
  /**
   * @default nextval('user_i_seq'::regclass)
   */
  i?: number & {readonly __brand?: 'user_i'}
  instance_limit: number
  password: string
}
export type {User_InsertParameters}
