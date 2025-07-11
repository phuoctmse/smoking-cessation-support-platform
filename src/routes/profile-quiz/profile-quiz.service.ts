import { Injectable } from "@nestjs/common";
import { ProfileQuizRepository } from "./profile-quiz.repository";
import { CreateProfileQuizInput } from "./dto/request/create-profile-quiz.input";
import { ProfileQuiz } from "./entities/profile-quiz.entity";
import { UpdateProfileQuizInput } from "./dto/request/update-profile-quiz.input";

@Injectable()
export class ProfileQuizService {
    constructor(private readonly profileQuizRepository: ProfileQuizRepository) { }

    async createProfileQuiz(input: CreateProfileQuizInput): Promise<ProfileQuiz> {
        return this.profileQuizRepository.create(input);
    }

    async findAllProfileQuizzes(): Promise<ProfileQuiz[]> {
        return this.profileQuizRepository.findAll();
    }

    async findOneProfileQuiz(id: string): Promise<ProfileQuiz> {
        return this.profileQuizRepository.findOne(id);
    }

    async updateProfileQuiz(input: UpdateProfileQuizInput): Promise<ProfileQuiz> {
        return this.profileQuizRepository.update(input.id, input);
    }

    async deleteProfileQuiz(id: string): Promise<ProfileQuiz> {
        return this.profileQuizRepository.delete(id);
    }
}