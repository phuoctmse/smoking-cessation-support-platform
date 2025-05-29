import { Field, ObjectType } from "@nestjs/graphql"
import { createZodDto } from "nestjs-zod"
import { LogoutResponseSchema } from "../../schema/logout.schema"

@ObjectType()
export class LogoutResponseDTO extends createZodDto(LogoutResponseSchema) {
  @Field(() => String, { nullable: true })
  error?: string
}