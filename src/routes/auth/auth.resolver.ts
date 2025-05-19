import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { LoginBodyDTO, LoginResDTO, SignupBodyDTO, SignupResDTO } from './auth.dto';
import { ZodSerializerDto } from 'nestjs-zod';

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  @Mutation(() => User)
  async signup(@Args('signupInput') signupInput: SignupBodyDTO) {
    return this.authService.signup(signupInput);
  }

  @Mutation(() => LoginResDTO)
  // @ZodSerializerDto(LoginResDTO)
  async login(@Args('loginInput') loginInput: LoginBodyDTO) {
    return this.authService.login(loginInput);
  }
}
