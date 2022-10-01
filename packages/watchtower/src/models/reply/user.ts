import {Type} from '@sinclair/typebox';
import {RBaseResponse, RBaseResponseWithPayload} from './common.js';

// Definition
export const RTUserId = Type.Number({
	minimum: 0,
});
export const RTUserEmail = Type.String({
	minLength: 'a@b.c'.length,
	maxLength: 320,
});
export const RTUserPassword = Type.String({
	minLength: 32,
	maxLength: 2048,
});
export const RTUserEmailToken = Type.String({
	minLength: 1,
	maxLength: 16,
});

export const RUser = Type.Object({
	i: RTUserId,
	email: RTUserEmail,
});

// Create
export const RUserCreateBody = Type.Object({
	email: RTUserEmail,
	password: RTUserPassword,
	passwordConfirmation: RTUserPassword,
});
export const RUserCreateResponse = RBaseResponse;

// Query
export const RUserQueryResponse = RBaseResponseWithPayload(RUser);

// Remove
export const RUserRemoveBody = Type.Object({
	password: RTUserPassword,
});
export const RUserRemoveResponse = RBaseResponse;

// Modify
export const RUserModifyBody = Type.Object({
	email: Type.Optional(RTUserEmail),
	password: Type.Optional(RTUserPassword),
});
export const RUserModifyResponse = RBaseResponse;

// Verify
export const RUserVerifyBody = RUserModifyBody;
export const RUserVerifyResponse = RBaseResponse;

// EmailTokenCreate
export const RUserEmailTokenCreateResponse = RBaseResponse;

// EmailTokenVerify
export const RUserEmailTokenVerifyQuery = Type.Object({
	i: RTUserId,
	token: RTUserEmailToken,
});
export const RUserEmailTokenVerifyResponse = RBaseResponse;
