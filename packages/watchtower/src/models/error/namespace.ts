export enum EAbstractionSpaces {
  /* eslint-disable no-unused-vars */
  Database = 1,
  User = 2,
  Instance = 3,
  Blocklist = 4,
  /* eslint-enable no-unused-vars */
}

export const abstractionSize = 10 * 1000;

export const extractAbstract = (applied: number) => Math.floor(applied / abstractionSize);

export const createAbstractor = (ns: number) => (local: number) => (ns * abstractionSize) + local;

export const getAbstractSpace = (ns: number) => EAbstractionSpaces[ns];
