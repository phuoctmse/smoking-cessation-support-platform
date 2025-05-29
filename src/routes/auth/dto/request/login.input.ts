import { Field, InputType } from "@nestjs/graphql"
import { createZodDto } from "nestjs-zod"
import { LoginBodySchema } from "../../schema/login.schema"

@InputType()
export class LoginBodyDTO extends createZodDto(LoginBodySchema) {
  @Field(() => String)
  email: string

  @Field(() => String)
  password: string
}