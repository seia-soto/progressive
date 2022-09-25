import {Static, TSchema, Type} from '@sinclair/typebox';
import {EUnhandledError} from '../error/keys.js';

export const RBaseResponse = Type.Object({
	code: Type.String(),
	message: Type.Object({
		identifiable: Type.Optional(Type.String({
			description: 'The message for developer.',
		})),
		readable: Type.String({
			description: 'The message for user.',
		}),
	}),
});

export type TRBaseResponse = Static<typeof RBaseResponse>

export const createBaseResponse = (code: string = EUnhandledError.unknown): TRBaseResponse => ({
	code,
	message: {
		identifiable: '',
		readable: 'Sorry, We failed to process your request. Please, contact us if you experience again after retrying.',
	},
});

export const RBaseResponseWithPayload = <T extends TSchema>(type: T) => Type.Object({
	code: Type.String(),
	message: Type.Object({
		identifiable: Type.Optional(Type.String({
			description: 'The message for developer.',
		})),
		readable: Type.String({
			description: 'The message for user.',
		}),
	}),
	payload: type,
});
