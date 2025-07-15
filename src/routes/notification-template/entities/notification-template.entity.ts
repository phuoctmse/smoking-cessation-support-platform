import { Field, ID, ObjectType } from '@nestjs/graphql'
import { NotificationTypeEnum, NotificationChannelEnum } from 'src/shared/enums/graphql-enums'

@ObjectType()
export class NotificationTemplate {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  content: string;

  @Field(() => NotificationTypeEnum)
  notification_type: NotificationTypeEnum;

  @Field(() => [NotificationChannelEnum])
  channel_types: NotificationChannelEnum[];

  @Field(() => [String], { nullable: true })
  variables?: string[];

  @Field(() => Boolean, { defaultValue: true })
  is_active: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}