import { Field, InputType } from "@nestjs/graphql"
import { createZodDto } from "nestjs-zod"
import { SignupBodySchema } from "../../schema/signup.schema"

@InputType()
export class SignupBodyDTO extends createZodDto(SignupBodySchema) {
    @Field(() => String)
    email: string

    @Field(() => String)
    password: string

    @Field(() => String)
    username: string

    @Field(() => String)
    name: string

    @Field(() => String)
    confirmPassword: string
}