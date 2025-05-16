import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { LoginInput, SignupInput } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) { }
  async signup(signupInput: SignupInput) {
    const user = await this.prismaService.user.create({
      data: {
        email: signupInput.email,
        password: signupInput.password,
        username: signupInput.username,
        name: signupInput.name,
      },
    });
    return user;
  }
  async login(loginInput: LoginInput) {
    const user = await this.prismaService.user.findUnique({
      where: { email: loginInput.email, password: loginInput.password },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
