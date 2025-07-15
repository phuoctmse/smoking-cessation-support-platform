import { Injectable } from "@nestjs/common";
import { QuizQuestionRepository } from "./quiz-question.repository";
import { CreateQuizQuestionInput } from "./dto/request/create-quiz-question.input";
import { UpdateQuizQuestionInput } from "./dto/request/update-quiz-question.input";
import { QuestionType } from "src/shared/constants/question-type.constant";
import { QuizQuestion } from "./entities/quiz-question.entity";

@Injectable()
export class QuizQuestionService {
    constructor(private readonly quizQuestionRepository: QuizQuestionRepository) { }

    private transformPrismaToEntity(prismaData: any): QuizQuestion {
        return {
            ...prismaData,
            question_type: prismaData.question_type as QuestionType
        };
    }

    async createQuizQuestion(input: CreateQuizQuestionInput): Promise<QuizQuestion> { 
        const result = await this.quizQuestionRepository.create(input);
        return this.transformPrismaToEntity(result);
    }

    async findAllQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
        const results = await this.quizQuestionRepository.findAll(quizId);
        return results.map(result => this.transformPrismaToEntity(result));
    }

    async findOneQuizQuestion(id: string): Promise<QuizQuestion> {
        const result = await this.quizQuestionRepository.findOne(id);
        return this.transformPrismaToEntity(result);
    }

    async updateQuizQuestion(input: UpdateQuizQuestionInput): Promise<QuizQuestion> {
        const result = await this.quizQuestionRepository.update(input.id, input);
        return this.transformPrismaToEntity(result);
    }

    async deleteQuizQuestion(id: string): Promise<void> {
        await this.quizQuestionRepository.delete(id);
    }
}