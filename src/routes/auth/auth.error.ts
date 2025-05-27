import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'

export const FieldAlreadyExistsException = (field: string) =>
  new UnprocessableEntityException([
    {
      message: `Error.${field}AlreadyExists`,
      path: field,
    },
  ])

export const EmailNotFoundException = new UnprocessableEntityException([
  {
    message: 'Error.EmailNotFound',
    path: 'email',
  },
])

export const InvalidPasswordException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidPassword',
    path: 'password',
  },
])

export const UserNotFoundException = new UnprocessableEntityException([
  {
    message: 'Error.UserNotFound',
    path: 'user',
  },
])

export const InvalidAuthorizationHeaderException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidAuthorizationHeader',
    path: 'authorization',
  },
])

export const AccessTokenBlacklistedException = new UnprocessableEntityException([
  {
    message: 'Error.AccessTokenBlacklisted',
    path: 'accessToken',
  },
])

export const RefreshTokenBlacklistedException = new UnprocessableEntityException([
  {
    message: 'Error.RefreshTokenBlacklisted',
    path: 'refreshToken',
  },
])

