import {Type} from '@sinclair/typebox';
import {RTNumericIdentifier} from '../format.js';
import {RBaseResponse, RBaseResponseWithPayload} from './common.js';

// Definition
export const RTInstanceId = Type.Number({
	minimum: 0,
});
export const RTInstanceAlias = Type.String({
	minLength: 4,
	maxLength: 16,
});
export const RTInstanceStatus = Type.Number({
	minimum: 0,
});
export const RTInstanceUpstream = Type.String();
export const RTInstanceUpdatedAt = Type.Number();

export const RTInstance = Type.Object({
	i: RTInstanceId,
	alias: RTInstanceAlias,
	status: RTInstanceStatus,
	upstream: RTInstanceUpstream,
	updated_at: RTInstanceUpdatedAt,
});

// Create
export const RInstanceCreateResponse = RBaseResponse;

// Query
export const RInstanceQueryParam = Type.Object({
	instance: RTNumericIdentifier,
});
export const RInstanceQueryResponse = RBaseResponseWithPayload(RTInstance);

// QueryByUser
export const RInstanceQueryByUserResponse = RBaseResponseWithPayload(Type.Array(RTInstance));

// Remove
export const RInstanceRemoveParam = Type.Object({
	instance: RTNumericIdentifier,
});
export const RInstanceRemoveResponse = RBaseResponse;

// Modify
export const RInstanceModifyParam = Type.Object({
	instance: RTNumericIdentifier,
});
export const RInstanceModifyBody = Type.Object({
	alias: Type.Optional(RTInstanceAlias),
	upstream: Type.Optional(RTInstanceUpstream),
});
export const RInstanceModifyResponse = RBaseResponse;

// Refreh
export const RInstanceRefreshParam = Type.Object({
	instance: RTNumericIdentifier,
});
export const RInstanceRefreshResponse = RBaseResponse;
