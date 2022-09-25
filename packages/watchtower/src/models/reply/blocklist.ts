import {Type} from '@sinclair/typebox';
import {RBaseResponse, RBaseResponseWithPayload} from './common';
import {RTInstanceId} from './instance';

// Definition
export const RTBlocklistId = Type.Number({
	minimum: 0,
});
export const RTBlocklistName = Type.String({
	minLength: 4,
	maxLength: 16,
});
export const RTBlocklistAddress = Type.String({
	minLength: 'http://a.b'.length,
	maxLength: 2048,
});

export const RTBlocklist = Type.Object({
	i: RTBlocklistId,
	name: RTBlocklistName,
	address: RTBlocklistAddress,
});

// Create
export const RBlocklistCreateParam = Type.Object({
	instance: RTInstanceId,
});
export const RBlocklistCreateBody = Type.Object({
	name: RTBlocklistName,
	address: RTBlocklistAddress,
});
export const RBlocklistCreateResponse = RBaseResponse;

// Query
export const RBlocklistQueryByInstanceParam = Type.Object({
	instance: RTInstanceId,
});
export const RBlocklistQueryByInstanceResponse = RBaseResponseWithPayload(Type.Array(RTBlocklist));

// Remove
export const RBlocklistRemoveParam = Type.Object({
	blocklist: RTBlocklistId,
});
export const RBlocklistRemoveResponse = RBaseResponse;

// Modify
export const RBlocklistModifyParam = Type.Object({
	blocklist: RTBlocklistId,
});
export const RBlocklistModifyBody = Type.Object({
	name: Type.Optional(RTBlocklistName),
	address: Type.Optional(RTBlocklistAddress),
});
export const RBlocklistModifyResponse = RBaseResponse;
