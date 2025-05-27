export interface AccessTokenPayloadGenerate {
  sub: string
  email: string
  aud: string
  role: string
  exp: number
  iat: number
  user_metadata: {
    role: string
  }
}

export interface AccessTokenPayload extends AccessTokenPayloadGenerate {
  iss: string
  jti: string
}

export interface RefreshTokenPayloadGenerate {
  user_id: string
}

export interface RefreshTokenPayload extends RefreshTokenPayloadGenerate {
  exp: number
  iat: number
}
