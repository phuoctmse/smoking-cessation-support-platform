import { Test, TestingModule } from '@nestjs/testing';
import { SharedPostService } from './shared-post.service';

describe('SharedPostService', () => {
  let service: SharedPostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedPostService],
    }).compile();

    service = module.get<SharedPostService>(SharedPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
