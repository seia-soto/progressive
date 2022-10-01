/* eslint-disable no-unused-vars */
export const enum EUnhandledError {
  unknown = 'unhandledUnknownError'
}

export const enum EDatabaseError {
  transactionFailure = 'databaseTransactionFailure'
}

export const enum EUserError {
  userCreated = 'userCreated',
  userUniquenessCheckFailed = 'userUniquenessCheckFailed',
  userEmailValidationFailed = 'userEmailValidationFailed',
  userQueried = 'userQueried',
  userQueryFailed = 'userQueryFailed',
  userRemoved = 'userRemoved',
  userModified = 'userModified',
  userModifiedNothing = 'userModifiedNothing',
  userAuthenticated = 'userAuthenticated',
  userAuthenticationFailed = 'userAuthenticationFailed',
  userSessionExpired = 'userSessionExpired',
  userEmailTokenCreated = 'userEmailTokenCreated',
  userEmailTokenVerified = 'userEmailTokenVerified',
  userEmailTokenValidationFailed = 'userEmailTokenValidationFailed'
}

export const enum EInstanceError {
  instanceCreated = 'instanceCreated',
  instanceQueried = 'instanceQueried',
  instanceQueryFailed = 'instanceQueryFailed',
  instanceRemoved = 'instanceRemoved',
  instanceModified = 'instanceModified',
  instanceUpstreamValidationFailed = 'instanceUpstreamValidationFailed',
  instanceModifiedNothing = 'instanceModifiedNothing',
  instanceFilterUpdateRequested = 'instanceFilterUpdateRequested'
}

export const enum EBlocklistError {
  blocklistCreated = 'blocklistCreated',
  blocklistQueried = 'blocklistQueried',
  blocklistRemoved = 'blocklistRemoved',
  blocklistModified = 'blocklistModified',
  blocklistAddressValidationFailed = 'blocklistAddressValidationFailed',
  blocklistModifiedNothing = 'blocklistModifiedNothing'
}
