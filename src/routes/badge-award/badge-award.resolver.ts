import { Resolver } from '@nestjs/graphql';
import { BadgeAwardService } from './badge-award.service';

@Resolver(() => String)
export class BadgeAwardResolver {
  constructor(private readonly badgeAwardService: BadgeAwardService) {}
}
