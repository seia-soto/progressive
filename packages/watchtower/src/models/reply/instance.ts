import {Type} from '@sinclair/typebox';
import {RBaseResponse, RBaseResponseWithPayload} from './common';

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

export const RTInstance = Type.Object({
	i: RTInstanceId,
	alias: RTInstanceAlias,
	status: RTInstanceStatus,
	upstream: RTInstanceUpstream,
});

// Create
export const RInstanceCreateResponse = RBaseResponse;

// Query
export const RInstanceQueryParam = Type.Object({
	i: RTInstanceId,
});
export const RInstanceQueryResponse = RBaseResponseWithPayload(RTInstance);

// QueryByUser
export const RInstanceQueryByUserResponse = RBaseResponseWithPayload(Type.Array(RTInstance));

// Remove
export const RInstanceRemoveBody = Type.Object({
	i: RTInstanceId,
});

// Modify
export const RInstanceModifyBody = Type.Object({
	alias: RTInstanceAlias,
	upstream: RTInstanceUpstream,
});
export const RInstanceModifyResponse = RBaseResponse;
