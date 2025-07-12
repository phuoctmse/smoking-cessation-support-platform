import { Injectable } from "@nestjs/common";
import { QuizQuestionRepository } from "./quiz-question.repository";
import { CreateQuizQuestionInput } from "./dto/request/create-quiz-question.input";
import { UpdateQuizQuestionInput } from "./dto/request/update-quiz-question.input";

@Injectable()
export class QuizQuestionService {
    constructor(private readonly quizQuestionRepository: QuizQuestionRepository) { }

    async createQuizQuestion(input: CreateQuizQuestionInput) { 
        return this.quizQuestionRepository.create(input);
    }

    async findAllQuizQuestions(quizId: string) {
        return this.quizQuestionRepository.findAll(quizId);
    }

    async findOneQuizQuestion(id: string) {
        return this.quizQuestionRepository.findOne(id);
    }

    async updateQuizQuestion(input: UpdateQuizQuestionInput) {
        return this.quizQuestionRepository.update(input.id, input);
    }

    async deleteQuizQuestion(id: string): Promise<void> {
        await this.quizQuestionRepository.delete(id);
    }
}