export const up = 1000 * 20;

export const idToAlias = (id: number) => (up + id).toString(24);

export const aliasToId = (alias: string) => parseInt(alias, 24) - up;
