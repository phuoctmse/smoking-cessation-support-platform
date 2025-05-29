import { Inject, Injectable } from '@nestjs/common'
import { AuthRepository } from './auth.repository'
import { HashingService } from 'src/shared/services/hashing.service'
import { isUniqueConstraintPrismaError } from 'src/shared/error-handlers/helpers'
import {
  EmailNotFoundException,
  FieldAlreadyExistsException,
  InvalidPasswordException,
  RefreshTokenBlacklistedException,
  UserNotFoundException,
} from './auth.error'
import { JwtService } from '@nestjs/jwt'
import { TokenService } from 'src/shared/services/token.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { USER_MESSAGES } from 'src/shared/constants/message.constant'
import { BlacklistGuard } from 'src/shared/guards/blacklist.guard'
import { SupabaseClient } from '@supabase/supabase-js'
import { SignupBodyType } from './schema/signup.schema'
import { LoginBodyType } from './schema/login.schema'
import { LogoutResponseType } from './schema/logout.schema'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly blacklistGuard: BlacklistGuard,
  ) { }

  async signup(body: SignupBodyType) {
    try {
      const { data, error } = await this.authRepository.signup(body)
      return {
        message: USER_MESSAGES.SIGNUP_SUCCESS,
        data, error
      }
    } catch (error) {
      if (isUniqueConstraintPrismaError(error) && Array.isArray(error.meta?.target)) {
        const target = error.meta.target[0]
        throw FieldAlreadyExistsException(target)
      }
      throw error
    }
  }

  async login(body: LoginBodyType) {
    try {
      const { data, error } = await this.authRepository.logIn(body)

      return {
        data, error
      }
    } catch (error) {
      throw error
    }
  }

  async logout(): Promise<LogoutResponseType> {
    try {
      const { error } = await this.authRepository.logOut()
      if (error) {
        throw error
      }
      
      return {
        error: USER_MESSAGES.LOGOUT_SUCCESS
      }
    } catch (error) {
      console.log(error)
    }
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.authRepository.refreshSession(refreshToken)

    return {
      data, error
    }
  }

  async verifyEmail(token: string) {
    try {
      const { data, error } = await this.authRepository.verifyEmail(token)
      return {
        message: USER_MESSAGES.VERIFY_EMAIL_SUCCESS,
        data, error
      }
    } catch (error) {
      throw error
    }
  }
}
