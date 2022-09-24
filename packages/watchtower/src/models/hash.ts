import {argon2id, hash, verify} from 'argon2';

export const encode = (text: string) => hash(text, {type: argon2id});

export const validate = (text: string, hash: string) => verify(text, hash, {type: argon2id});
