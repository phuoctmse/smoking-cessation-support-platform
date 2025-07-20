import { Field, InputType } from '@nestjs/graphql'
import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator'
import { NotificationTypeEnum, NotificationChannelEnum } from 'src/shared/enums/graphql-enums'

@InputType()
export class UpdateNotificationTemplateInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    name?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    title?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    content?: string;

    @Field(() => NotificationTypeEnum, { nullable: true })
    @IsOptional()
    @IsEnum(NotificationTypeEnum)
    notification_type?: NotificationTypeEnum;

    @Field(() => [NotificationChannelEnum], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsEnum(NotificationChannelEnum, { each: true })
    channel_types?: NotificationChannelEnum[];

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    variables?: string[];
}