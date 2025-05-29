import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { User } from '../user/entities/user.entity'
import { ZodSerializerDto } from 'nestjs-zod'
import { Response } from 'express'
import { Res } from '@nestjs/common'
import envConfig from 'src/shared/config/config'
import { InvalidAuthorizationHeaderException } from './auth.error'
import { AuthResponse } from './dto/response/auth.response'
import { SignupBodyDTO } from './dto/request/signup.input'
import { LoginBodyDTO } from './dto/request/login.input'
import { LogoutResponseDTO } from './dto/response/logout.response'

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  @Mutation(() => AuthResponse)
  async signup(@Args('signupInput') signupInput: SignupBodyDTO) {
    return await this.authService.signup(signupInput)
  }

  @Mutation(() => AuthResponse)
  // @ZodSerializerDto(LoginResDTO)
  async login(@Args('loginInput') loginInput: LoginBodyDTO, @Context() context) {
    const data = await this.authService.login(loginInput)

    if (context.req.res && typeof context.req.res.cookie === 'function') {
      context.req.res.cookie('refreshToken', data.data.session.refresh_token, {
        httpOnly: true,
        sameSite: 'strict',
      })
    }

    return {
      data: data.data
    }
  }

  @Query(() => LogoutResponseDTO)
  async logout(@Context() context) {

    const result = await this.authService.logout()

    if (context.req.res && typeof context.req.res.clearCookie === 'function') {
      context.req.res.clearCookie('refreshToken')
    }

    return result
  }

  @Query(() => AuthResponse)
  async refreshToken(@Context() context) {
    const refreshToken = context.req.cookies?.refreshToken
    const { data, error } = await this.authService.refreshToken(refreshToken)
    if (context.req.res && typeof context.req.res.cookie === 'function') {
      context.req.res.cookie('refreshToken', data.session.refresh_token, {
        httpOnly: true,
        sameSite: 'strict',
      })
    }
    return {
      data, error
    }
  }

  @Mutation(() => AuthResponse)
  async verifyEmail(@Args('token') token: string, @Context() context): Promise<AuthResponse> {
    const data = await this.authService.verifyEmail(token)
    if (context.req.res && typeof context.req.res.cookie === 'function') {
      context.req.res.cookie('refreshToken', data.data.session.refresh_token, {
        httpOnly: true,
        sameSite: 'strict',
      })
    }
    return {
      message: data.message,
      data: data.data,
      error: data.error
    }
  }
}
