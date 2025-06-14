import { Test, TestingModule } from '@nestjs/testing';
import { SharedPostResolver } from './shared-post.resolver';
import { SharedPostService } from './shared-post.service';

describe('SharedPostResolver', () => {
  let resolver: SharedPostResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedPostResolver, SharedPostService],
    }).compile();

    resolver = module.get<SharedPostResolver>(SharedPostResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
