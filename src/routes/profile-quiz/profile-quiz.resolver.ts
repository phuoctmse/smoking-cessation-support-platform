import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProfileQuiz } from './entities/profile-quiz.entity';
import { CreateProfileQuizInput } from './dto/request/create-profile-quiz.input';
import { QuizQuestionRepository } from '../quiz-question/quiz-question.repository';
import { ProfileQuizService } from './profile-quiz.service';
import { UpdateProfileQuizInput } from './dto/request/update-profile-quiz.input';
import { ProfileQuizResponse, DeleteProfileQuizResponse } from './dto/response/profile-quiz-response.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Resolver(() => ProfileQuiz)
@UseGuards(JwtAuthGuard)
export class ProfileQuizResolver {
  constructor(
    private readonly profileQuizService: ProfileQuizService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
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

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Mutation(() => ProfileQuizResponse)
  async updateProfileQuiz(
    @Args('input') input: UpdateProfileQuizInput,
  ): Promise<ProfileQuizResponse> {
    const updatedQuiz = await this.profileQuizService.updateProfileQuiz(input);
    return {
      message: 'Profile quiz updated successfully',
      data: updatedQuiz
    };
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Mutation(() => DeleteProfileQuizResponse)
  async deleteProfileQuiz(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DeleteProfileQuizResponse> {
    await this.profileQuizService.deleteProfileQuiz(id);
    return {
      message: 'Profile quiz deleted successfully',
      success: true
    };
  }
} 