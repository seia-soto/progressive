import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface IFastifyJWTUser {
    i: number
  }

  export interface FastifyJWT {
    payload: IFastifyJWTUser,
    user: IFastifyJWTUser
  }
}
