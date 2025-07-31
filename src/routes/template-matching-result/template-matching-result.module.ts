import { Module } from '@nestjs/common';
import { TemplateMatchingResultService } from './template-matching-result.service';
import { TemplateMatchingResultResolver } from './template-matching-result.resolver';
import { TemplateMatchingResultRepository } from './template-matching-result.repository';
import { SharedModule } from '../../shared/shared.module';
import { GuardModule } from 'src/shared/guards/guard.module';

@Module({
  imports: [SharedModule, GuardModule],
  providers: [
    TemplateMatchingResultService,
    TemplateMatchingResultResolver,
    TemplateMatchingResultRepository
  ],
  exports: [
    TemplateMatchingResultService,
    TemplateMatchingResultRepository
  ]
})
export class TemplateMatchingResultModule {}
