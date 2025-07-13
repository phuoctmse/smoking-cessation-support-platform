import { Test, TestingModule } from '@nestjs/testing';
import { NotificationTemplateResolver } from './notification-template.resolver';
import { NotificationTemplateService } from './notification-template.service';

describe('NotificationTemplateResolver', () => {
  let resolver: NotificationTemplateResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationTemplateResolver, NotificationTemplateService],
    }).compile();

    resolver = module.get<NotificationTemplateResolver>(NotificationTemplateResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
