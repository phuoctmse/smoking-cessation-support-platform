export interface AccessTokenPayloadGenerate {
    user_id: string
    email: string
    role: string
    username: string
    status: string
}

export interface AccessTokenPayload extends AccessTokenPayloadGenerate {
    exp: number
    iat: number
}

export interface RefreshTokenPayloadGenerate {
    user_id: string
}

export interface RefreshTokenPayload extends RefreshTokenPayloadGenerate {
    exp: number
    iat: number
}
