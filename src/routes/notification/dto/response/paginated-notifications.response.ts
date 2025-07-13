import { ObjectType } from '@nestjs/graphql';
import { Notification } from '../../entities/notification.entity';
import { PaginatedResponse } from '../../../../shared/models/dto/response/paginated-response'

@ObjectType()
export class PaginatedNotificationsResponse extends PaginatedResponse(Notification){}