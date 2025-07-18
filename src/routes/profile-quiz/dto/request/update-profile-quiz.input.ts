import { Field, ID, InputType, PartialType } from "@nestjs/graphql";
import { CreateProfileQuizInput } from "./create-profile-quiz.input";

@InputType()
export class UpdateProfileQuizInput extends PartialType(CreateProfileQuizInput) {
    @Field(() => ID)
    id: string;
}