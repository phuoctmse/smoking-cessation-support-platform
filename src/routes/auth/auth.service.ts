import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { HashingService } from 'src/shared/services/hashing.service';
import { LoginBodyType, LogoutResType, SignupBodyType } from './auth.model';
import { isUniqueConstraintPrismaError } from 'src/shared/error-handlers/helpers';
import { EmailNotFoundException, FieldAlreadyExistsException, InvalidPasswordException } from './auth.error';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated';
import { TokenService } from 'src/shared/services/token.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { USER_MESSAGES } from 'src/shared/constants/message.constant';


@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
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
        status: user.status
      }),

      this.tokenService.signRefreshToken({
        user_id: user.id
      })
    ])

    return {
      accessToken,
      refreshToken
    }
  }

  async logout(refreshToken: string): Promise<LogoutResType> {
    if (!refreshToken) {
      return {
        message: USER_MESSAGES.LOGOUT_SUCCESS
      };
    }

    try {
      const decodedToken = await this.tokenService.verifyRefreshToken(refreshToken);

      // Get token expiry time from the decoded token
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      const expiryTimeInSeconds = decodedToken.exp;
      const timeLeftInSeconds = expiryTimeInSeconds - currentTimeInSeconds;

      // If token still valid, add to blacklist
      if (timeLeftInSeconds > 0) {
        // In a real implementation, this would use Redis to blacklist the token
        // await redisServices.blacklistToken(refreshToken, timeLeftInSeconds)
        console.log(`Token blacklisted for ${timeLeftInSeconds} seconds`);
      }

      // In a real implementation, this would delete from a refresh token table
      // await databaseServices.refreshTokens.deleteOne({ token: refreshToken })
      console.log('Token deleted from database');

      return {
        message: USER_MESSAGES.LOGOUT_SUCCESS
      };
    } catch (error) {
      // If token verification fails, still return success since we're logging out
      return {
        message: USER_MESSAGES.LOGOUT_SUCCESS
      };
    }
  }
}
