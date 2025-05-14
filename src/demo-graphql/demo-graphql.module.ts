import { Module } from '@nestjs/common';
import { DemoGraphqlService } from './demo-graphql.service';
import { DemoGraphqlResolver } from './demo-graphql.resolver';

@Module({
  providers: [DemoGraphqlResolver, DemoGraphqlService],
})
export class DemoGraphqlModule {}
