import {Static, TSchema, Type} from '@sinclair/typebox';

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

export const createBaseResponse = (code: string): TRBaseResponse => ({
	code,
	message: {
		readable: 'Our manual to mitigate the error failed. Please, contact us for future solution.',
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
