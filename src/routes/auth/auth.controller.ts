import { Controller, Get, Query } from '@nestjs/common'
import { AuthRepository } from './auth.repository'

@Controller('auth')
export class AuthController {
    constructor(private readonly authRepository: AuthRepository) {}

    @Get('callback')
    async handleEmailVerification(
        @Query('access_token') access_token: string,
        @Query('refresh_token') refresh_token: string,
        @Query('type') type: string
    ) {
        if (type === 'signup') {
            await this.authRepository.handleEmailVerification(access_token)
        }
        // Redirect về trang chủ hoặc trang login
        return { message: 'Email verified successfully' }
    }
} 