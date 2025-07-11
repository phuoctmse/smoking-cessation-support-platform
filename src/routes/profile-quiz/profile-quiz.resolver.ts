import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProfileQuiz } from './entities/profile-quiz.entity';
import { CreateProfileQuizInput } from './dto/request/create-profile-quiz.input';
import { QuizQuestionRepository } from '../quiz-question/quiz-question.repository';
import { ProfileQuizService } from './profile-quiz.service';
import { UpdateProfileQuizInput } from './dto/request/update-profile-quiz.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Role } from 'generated';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@Resolver(() => ProfileQuiz)
@UseGuards(JwtAuthGuard)
export class ProfileQuizResolver {
  constructor(
    private readonly profileQuizService: ProfileQuizService,
  ) {}

  @Mutation(() => ProfileQuiz)
  async createProfileQuiz(
    @Args('input') input: CreateProfileQuizInput,
  ): Promise<ProfileQuiz> {
    return this.profileQuizService.createProfileQuiz(input);
  }

  @Query(() => [ProfileQuiz])
  async getProfileQuizzes(): Promise<ProfileQuiz[]> {
    return this.profileQuizService.findAllProfileQuizzes();
  }

  @Query(() => ProfileQuiz)
  async getProfileQuiz(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ProfileQuiz> {
    return this.profileQuizService.findOneProfileQuiz(id);
  }

  @Mutation(() => ProfileQuiz)
  async updateProfileQuiz(
    @Args('input') input: UpdateProfileQuizInput,
  ): Promise<ProfileQuiz> {
    return this.profileQuizService.updateProfileQuiz(input);
  }

  @Mutation(() => ProfileQuiz)
  async deleteProfileQuiz(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ProfileQuiz> {
    return this.profileQuizService.deleteProfileQuiz(id);
  }
} 