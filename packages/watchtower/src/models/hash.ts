import argon2 from 'argon2';

export const encode = (text: string) => argon2.hash(text, {type: argon2.argon2id});

export const validate = (text: string, hash: string) => argon2.verify(hash, text, {type: argon2.argon2id});
