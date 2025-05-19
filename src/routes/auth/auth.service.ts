import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { HashingService } from 'src/shared/services/hashing.service';
import { LoginBodyType, SignupBodyType } from './auth.model';
import { isUniqueConstraintPrismaError } from 'src/shared/error-handlers/helpers';
import { EmailNotFoundException, FieldAlreadyExistsException, InvalidPasswordException } from './auth.error';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated';
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService
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
}
