import { Field, InputType } from '@nestjs/graphql'
import { IsOptional, IsString, IsEnum } from 'class-validator'
import { NotificationTypeEnum, NotificationChannelEnum } from 'src/shared/enums/graphql-enums'

@InputType()
export class NotificationTemplateFiltersInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => NotificationTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationTypeEnum)
  notification_type?: NotificationTypeEnum;

  @Field(() => NotificationChannelEnum, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationChannelEnum)
  channel_type?: NotificationChannelEnum;
}