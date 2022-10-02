import {Type} from '@sinclair/typebox';
import {RTNumericIdentifier} from '../format.js';
import {RBaseResponse, RBaseResponseWithPayload} from './common.js';

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
	format: 'url',
});
export const RTBlocklistType = Type.Number({
	minimum: 0,
	maximum: 1,
});

export const RTBlocklist = Type.Object({
	i: RTBlocklistId,
	name: RTBlocklistName,
	address: RTBlocklistAddress,
	type: RTBlocklistType,
});

// Create
export const RBlocklistCreateParam = Type.Object({
	instance: RTNumericIdentifier,
});
export const RBlocklistCreateBody = Type.Object({
	name: RTBlocklistName,
	address: RTBlocklistAddress,
});
export const RBlocklistCreateResponse = RBaseResponse;

// Query
export const RBlocklistQueryByInstanceParam = Type.Object({
	instance: RTNumericIdentifier,
});
export const RBlocklistQueryByInstanceResponse = RBaseResponseWithPayload(Type.Array(RTBlocklist));

// Remove
export const RBlocklistRemoveParam = Type.Object({
	blocklist: RTNumericIdentifier,
});
export const RBlocklistRemoveResponse = RBaseResponse;

// Modify
export const RBlocklistModifyParam = Type.Object({
	blocklist: RTNumericIdentifier,
});
export const RBlocklistModifyBody = Type.Object({
	name: Type.Optional(RTBlocklistName),
	address: Type.Optional(RTBlocklistAddress),
});
export const RBlocklistModifyResponse = RBaseResponse;
