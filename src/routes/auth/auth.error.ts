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
