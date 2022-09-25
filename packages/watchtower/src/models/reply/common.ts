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

export const createBaseResponse = (code: string = EUnhandledError.unknown): Static<typeof RBaseResponse> => ({
	code,
	message: {
		readable: 'Sorry, We failed to process your request. Please, contact us if you experience again after retrying.',
	},
});
