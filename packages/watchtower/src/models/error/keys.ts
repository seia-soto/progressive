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
  instanceRemoved = 'instanceRemoved',
  instanceModified = 'instanceModified',
  instanceUpstreamValidationFailed = 'instanceUpstreamValidationFailed',
  instanceModifiedNothing = 'instanceModifiedNothing'
}
