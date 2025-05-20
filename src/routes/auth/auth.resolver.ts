import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { User } from '../user/entities/user.entity'
import { LoginBodyDTO, LoginResDTO, LogoutResDTO, RefreshTokenResDTO, SignupBodyDTO, SignupResDTO } from './auth.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { Response } from 'express'
import { Res } from '@nestjs/common'
import envConfig from 'src/shared/config/config'

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => User)
  async signup(@Args('signupInput') signupInput: SignupBodyDTO) {
    return this.authService.signup(signupInput)
  }

  @Mutation(() => LoginResDTO)
  // @ZodSerializerDto(LoginResDTO)
  async login(@Args('loginInput') loginInput: LoginBodyDTO, @Context() context) {
    const { accessToken, refreshToken } = await this.authService.login(loginInput)

    if (context.req.res && typeof context.req.res.cookie === 'function') {
      context.req.res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: Number(envConfig.COOKIES_MAX_AGE),
      })
    }

    return {
      accessToken,
      refreshToken,
    }
  }

  @Query(() => LogoutResDTO)
  async logout(@Context() context) {
    // Get refreshToken from cookies
    const refreshToken = context.req.cookies?.refreshToken
    const accessToken = context.req.headers.authorization.split(' ')[1]

    const result = await this.authService.logout(refreshToken, accessToken)

    if (context.req.res && typeof context.req.res.clearCookie === 'function') {
      context.req.res.clearCookie('refreshToken')
    }

    return result
  }

  @Query(() => RefreshTokenResDTO)
  async refreshToken(@Context() context) {
    const refreshToken = context.req.cookies?.refreshToken
    const result = await this.authService.refreshToken(refreshToken)

    return result
  }
}
