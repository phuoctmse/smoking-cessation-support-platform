import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginInput, SignupInput } from './auth.dto';
import { AuthRepository } from './auth.repository';
import { HashingService } from 'src/shared/services/hashing.service';
import { LoginBodyType, SignupBodyType } from './auth.model';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService
  ) { }

  async signup(body: SignupBodyType) {
    try {
      console.log(body)
      const hashedPassword = await this.hashingService.hash(body.password)
      const user = await this.authRepository.createUser({
        email: body.email,
        password: hashedPassword,
        username: body.username,
        name: body.name,
      })
      return user
    } catch (error) {
      throw new BadRequestException(error)
    }

  }

  async login(body: LoginBodyType) {
    const user = await this.authRepository.findUserByEmail(body.email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const isPasswordValid = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }
    return user
  }
}
