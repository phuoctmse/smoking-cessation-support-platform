import { ObjectType } from '@nestjs/graphql';
import { NotificationTemplate } from '../../entities/notification-template.entity';
import { PaginatedResponse } from 'src/shared/models/dto/response/paginated-response'

@ObjectType()
export class PaginatedNotificationTemplatesResponse extends PaginatedResponse(NotificationTemplate) {}