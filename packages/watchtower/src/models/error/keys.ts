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
  userRemoved = 'userRemoved',
  userModified = 'userModified',
  userModifiedNothing = 'userModifiedNothing',
  userAuthenticated = 'userAuthenticated',
  userAuthenticationFailed = 'userAuthenticationFailed',
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
