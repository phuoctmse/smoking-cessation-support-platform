import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { DemoGraphqlService } from './demo-graphql.service';
import { DemoGraphql } from './entities/demo-graphql.entity';
import { CreateDemoGraphqlInput } from './dto/create-demo-graphql.input';
import { UpdateDemoGraphqlInput } from './dto/update-demo-graphql.input';

@Resolver(() => DemoGraphql)
export class DemoGraphqlResolver {
  constructor(private readonly demoGraphqlService: DemoGraphqlService) {}

  @Mutation(() => DemoGraphql)
  createDemoGraphql(@Args('createDemoGraphqlInput') createDemoGraphqlInput: CreateDemoGraphqlInput) {
    return this.demoGraphqlService.create(createDemoGraphqlInput);
  }

  @Query(() => [DemoGraphql], { name: 'demoGraphql' })
  findAll() {
    return this.demoGraphqlService.findAll();
  }

  @Query(() => DemoGraphql, { name: 'demoGraphqlId' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.demoGraphqlService.findOne(id);
  }

  @Mutation(() => DemoGraphql)
  updateDemoGraphql(@Args('updateDemoGraphqlInput') updateDemoGraphqlInput: UpdateDemoGraphqlInput) {
    return this.demoGraphqlService.update(updateDemoGraphqlInput.id, updateDemoGraphqlInput);
  }

  @Mutation(() => DemoGraphql)
  removeDemoGraphql(@Args('id', { type: () => Int }) id: number) {
    return this.demoGraphqlService.remove(id);
  }
}
