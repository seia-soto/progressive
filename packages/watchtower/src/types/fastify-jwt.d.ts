import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface IFastifyJWTUser {
    i: number,
    ref: number
  }

  export interface FastifyJWT {
    payload: IFastifyJWTUser,
    user: IFastifyJWTUser
  }
}
