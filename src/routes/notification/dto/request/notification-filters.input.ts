import { Field, InputType } from '@nestjs/graphql'
import { IsOptional, IsBoolean, IsEnum, IsDateString } from 'class-validator'
import { NotificationTypeEnum, NotificationChannelEnum, NotificationStatusEnum } from 'src/shared/enums/graphql-enums'

@InputType()
export class NotificationFiltersInput {
  @Field(() => NotificationTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationTypeEnum)
  notification_type?: NotificationTypeEnum;

  @Field(() => NotificationChannelEnum, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationChannelEnum)
  channel?: NotificationChannelEnum;

  @Field(() => NotificationStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationStatusEnum)
  status?: NotificationStatusEnum;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateString()
  end_date?: Date;
}