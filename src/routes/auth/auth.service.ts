import { Injectable } from '@nestjs/common'
import { AuthRepository } from './auth.repository'
import { HashingService } from 'src/shared/services/hashing.service'
import { LoginBodyType, LogoutResType, RefreshTokenResType, SignupBodyType } from './auth.model'
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
      const hashedPassword = await this.hashingService.hash(body.password)
      const user = await this.authRepository.createUser({
        email: body.email,
        password: hashedPassword,
        username: body.username,
        name: body.name,
      })
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error) && Array.isArray(error.meta?.target)) {
        const target = error.meta.target[0]
        throw FieldAlreadyExistsException(target)
      }

      throw error
    }
  }

  async login(body: LoginBodyType) {
    const user = await this.authRepository.findUserByEmail(body.email)
    if (!user) {
      throw EmailNotFoundException
    }
    const isPasswordValid = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw InvalidPasswordException
    }
    // xử lí trường hợp status khác ACTIVE
    // if(user.status) {}

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        user_id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        status: user.status,
      }),

      this.tokenService.signRefreshToken({
        user_id: user.id,
      }),
    ])

    await this.authRepository.setRefreshToken(refreshToken, user.id)

    return {
      accessToken,
      refreshToken,
    }
  }

  async logout(refreshToken: string, accessToken: string): Promise<LogoutResType> {
    if (!refreshToken) {
      return {
        message: USER_MESSAGES.LOGOUT_SUCCESS,
      }
    }

    try {
      const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
      const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)

      // Get token expiry time from the decoded token
      const currentTimeInSeconds = Math.floor(Date.now() / 1000)
      const refreshTokenExpiryTime = decodedRefreshToken.exp
      const accessTokenExpiryTime = decodedAccessToken.exp
      const timeLeftInSecondsRefreshToken = refreshTokenExpiryTime - currentTimeInSeconds
      const timeLeftInSecondsAccessToken = accessTokenExpiryTime - currentTimeInSeconds
      // If token still valid, add to blacklist
      if (timeLeftInSecondsRefreshToken > 0) {
        await this.blacklistGuard.setBlackList(refreshToken, timeLeftInSecondsRefreshToken)
        console.log(`Token blacklisted for ${timeLeftInSecondsRefreshToken} seconds`)
      }

      if (timeLeftInSecondsAccessToken > 0) {
        await this.blacklistGuard.setBlackList(accessToken, timeLeftInSecondsAccessToken)
        console.log(`Token blacklisted for ${timeLeftInSecondsAccessToken} seconds`)
      }

      return {
        message: USER_MESSAGES.LOGOUT_SUCCESS,
      }
    } catch (error) {
      console.log(error)
      return {
        message: USER_MESSAGES.LOGOUT_SUCCESS,
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResType> {
    const isBlacklisted = await this.blacklistGuard.isBlackList(refreshToken);
    if (isBlacklisted) {
      throw RefreshTokenBlacklistedException
    }
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.authRepository.findUserById(decodedRefreshToken.user_id);
    if (!user) {
      throw UserNotFoundException;
    }
    const accessToken = await this.tokenService.signAccessToken({
      user_id: decodedRefreshToken.user_id,
      email: user.email,
      role: user.role,
      username: user.username,
      status: user.status,
    })
    return {
      accessToken,
    }
  }
}
