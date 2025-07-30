import { Resolver, Query, Args } from '@nestjs/graphql'
import { TemplateMatchingResultService } from './template-matching-result.service'
import { TemplateMatchingResultSummary } from './entities/template-matching-result.entity'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard'

@Resolver(() => TemplateMatchingResultSummary)
@UseGuards(JwtAuthGuard)
export class TemplateMatchingResultResolver {
  constructor(private readonly templateMatchingResultService: TemplateMatchingResultService) {}

  @Query(() => [TemplateMatchingResultSummary], {
    name: 'getMyTemplateMatchingResults',
    description: 'Get template matching results for the current user',
  })
  async getMyTemplateMatchingResults(@CurrentUser() user: UserType): Promise<TemplateMatchingResultSummary[]> {
    return this.templateMatchingResultService.getUserTemplateMatchingResults(user.id)
  }

  @Query(() => TemplateMatchingResultSummary, {
    name: 'getTemplateMatchingResultDetails',
    description: 'Get detailed information of a specific template matching result',
  })
  async getTemplateMatchingResultDetails(
    @Args('id') id: string
  ): Promise<TemplateMatchingResultSummary | null> {
    return await this.templateMatchingResultService.getTemplateMatchingResultDetails(id)
  }
}
