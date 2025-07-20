import { Field, ID, ObjectType } from '@nestjs/graphql'
import { NotificationTemplate } from '../../notification-template/entities/notification-template.entity'
import { User } from '../../user/entities/user.entity'
import { NotificationChannelEnum, NotificationStatusEnum, NotificationTypeEnum } from 'src/shared/enums/graphql-enums'

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  template_id?: string;

  @Field(() => String)
  user_id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  content: string;

  @Field(() => NotificationTypeEnum)
  notification_type: NotificationTypeEnum;

  @Field(() => NotificationChannelEnum)
  channel: NotificationChannelEnum;

  @Field(() => NotificationStatusEnum)
  status: NotificationStatusEnum;

  @Field(() => Date, { nullable: true })
  scheduled_at?: Date;

  @Field(() => Date, { nullable: true })
  sent_at?: Date;

  @Field(() => Date, { nullable: true })
  read_at?: Date;

  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => User)
  user: User;

  @Field(() => NotificationTemplate, { nullable: true })
  template?: NotificationTemplate;
}