import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, IsArray, IsEnum } from 'class-validator'
import { NotificationTypeEnum, NotificationChannelEnum } from 'src/shared/enums/graphql-enums'

@InputType()
export class CreateNotificationTemplateInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  title: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  content: string;

  @Field(() => NotificationTypeEnum)
  @IsEnum(NotificationTypeEnum)
  notification_type: NotificationTypeEnum;

  @Field(() => [NotificationChannelEnum])
  @IsArray()
  @IsEnum(NotificationChannelEnum, { each: true })
  channel_types: NotificationChannelEnum[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}