import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import {
  AccessTokenPayload,
  AccessTokenPayloadGenerate,
  RefreshTokenPayload,
  RefreshTokenPayloadGenerate,
} from '../types/jwt.type'
import envConfig from '../config/config'

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: AccessTokenPayloadGenerate) {
    return this.jwtService.sign(payload, {
      secret: envConfig.ACCESS_TOKEN_SECRET_KEY,
      expiresIn: envConfig.ACCESS_TOKEN_EXPIRE_IN,
      algorithm: 'HS256',
    })
  }

  signRefreshToken(payload: RefreshTokenPayloadGenerate) {
    return this.jwtService.sign(payload, {
      secret: envConfig.REFRESH_TOKEN_SECRET_KEY,
      expiresIn: envConfig.REFRESH_TOKEN_EXPIRE_IN,
      algorithm: 'HS256',
    })
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: envConfig.ACCESS_TOKEN_SECRET_KEY,
    })
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: envConfig.REFRESH_TOKEN_SECRET_KEY,
    })
  }
}
