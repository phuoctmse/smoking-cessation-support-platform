import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { QuizResponseRepository } from './quiz-response.repository';
import { CreateQuizResponseInput } from './dto/request/create-quiz-response.input';
import { StartQuizInput } from './dto/request/start-quiz.input';
import { SubmitQuizInput } from './dto/request/submit-quiz.input';
import { SubmitQuizResponse } from './dto/response/submit-quiz.response';
import { QuizResponse } from './entities/quiz-response.entity';
import { UserType } from '../user/schema/user.schema';
import { QuizAttempt } from '../quiz-attempt/quiz-attempt.entity';

@Injectable()
export class QuizResponseService {
  constructor(private readonly quizResponseRepo: QuizResponseRepository) {}

  async startQuiz(input: StartQuizInput, currentUser: UserType): Promise<QuizAttempt> {
    // 1. Validate input
    if (!input.quiz_id ) {
      throw new BadRequestException('Quiz ID are required');
    }

    // 2. Check permissions và existence
    const quiz = await this.quizResponseRepo.findQuizById(input.quiz_id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (!quiz.is_active) {
      throw new BadRequestException('Quiz is not active');
    }

    const memberProfile = await this.quizResponseRepo.findMemberProfileById(currentUser.member_profile_id);
    if (!memberProfile) {
      throw new NotFoundException('Member profile not found');
    }

    if (memberProfile.user_id !== currentUser.id) {
      throw new BadRequestException('Access denied to this member profile');
    }

    // 3. Create quiz attempt
    const attempt = await this.quizResponseRepo.createQuizAttempt(
      input.quiz_id, 
      currentUser.id, 
      currentUser.member_profile_id
    );

    return attempt;
  }

  async submitQuiz(input: SubmitQuizInput, currentUser: UserType): Promise<SubmitQuizResponse> {
    // 1. Validate input
    if (!input.attempt_id || !input.responses || input.responses.length === 0) {
      throw new BadRequestException('Attempt ID and responses are required');
    }

    // 2. Get attempt với details
    const attempt = await this.quizResponseRepo.findQuizAttemptWithDetails(input.attempt_id);
    
    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }

    if (attempt.user_id !== currentUser.id) {
      throw new BadRequestException('Access denied to this quiz attempt');
    }

    if (attempt.status === 'COMPLETED') {
      throw new BadRequestException('Quiz already completed');
    }

    // 3. Validate business rules
    this.validateQuizCompletion(input.responses, attempt.quiz.questions);

    // 4. Transform responses to member profile data
    const memberProfileData = this.mapResponsesToMemberProfile(input.responses);

    // 5. Execute database transaction
    const result = await this.quizResponseRepo.submitQuizTransaction(
      input.attempt_id,
      input.responses,
      attempt.member_profile_id,
      memberProfileData
    );

    // 6. Transform response
    return {
      message: 'Quiz submitted successfully',
      attempt_id: input.attempt_id,
      responses: result.map(r => ({
        id: r.id,
        question_id: r.question_id,
        attempt_id: r.attempt_id,
        answer: JSON.parse(r.answer as string),
        created_at: r.created_at,
        updated_at: r.updated_at
      })) as QuizResponse[],
      member_profile_updated: true
    };
  }

  // Legacy method
  async create(input: CreateQuizResponseInput, currentUser: UserType): Promise<QuizResponse> {
    // Business validation
    const isValid = await this.validateResponse(input.question_id, input.answer);
    if (!isValid) {
      throw new BadRequestException('Invalid answer format');
    }

    return this.quizResponseRepo.create(input, currentUser);
  }

  async findByAttemptId(attemptId: string): Promise<QuizResponse[]> {
    if (!attemptId) {
      throw new BadRequestException('Attempt ID is required');
    }
    
    return this.quizResponseRepo.findByAttemptId(attemptId);
  }

  async validateResponse(questionId: string, answer: any): Promise<boolean> {
    if (!questionId) {
      throw new BadRequestException('Question ID is required');
    }
    
    return this.quizResponseRepo.validateResponse(questionId, answer);
  }

  // Private business logic methods
  private validateQuizCompletion(responses: any[], questions: any[]): void {
    const questionMap = new Map(questions.map(q => [q.id, q]));
    const responseMap = new Map(responses.map(r => [r.question_id, r]));
    
    // Check required questions
    for (const question of questions) {
      if (question.is_required) {
        const response = responseMap.get(question.id);
        if (!response || this.isEmptyAnswer(response.answer)) {
          throw new BadRequestException(`Answer required for question: ${question.question_text}`);
        }
      }
    }

    // Check unknown questions
    for (const response of responses) {
      if (!questionMap.has(response.question_id)) {
        throw new BadRequestException(`Invalid question ID: ${response.question_id}`);
      }
    }
  }

  private isEmptyAnswer(answer: any): boolean {
    return answer === null || answer === undefined || answer === '' || 
           (Array.isArray(answer) && answer.length === 0);
  }

  private mapResponsesToMemberProfile(responses: any[]): any {
    const responseMap = new Map(responses.map(r => [r.question_id, r.answer]));
    
    return {
      cigarettes_per_day: this.parseIntOrNull(responseMap.get('q-001')),
      sessions_per_day: this.parseIntOrNull(responseMap.get('q-002')),
      price_per_pack: this.parseIntOrNull(responseMap.get('q-003')),
      smoking_years: this.parseIntOrNull(responseMap.get('q-004')),
      brand_preference: responseMap.get('q-005') || null,
      nicotine_level: this.parseFloatOrNull(responseMap.get('q-006')),
      health_conditions: this.ensureArray(responseMap.get('q-007')),
      allergies: this.ensureArray(responseMap.get('q-008')),
      medications: this.ensureArray(responseMap.get('q-009')),
      quit_motivation: this.mapQuitMotivation(responseMap.get('q-010')),
      previous_attempts: this.parseIntOrNull(responseMap.get('q-011')),
      preferred_support: this.ensureArray(responseMap.get('q-012')),
      stress_level: this.parseIntOrNull(responseMap.get('q-013')),
      social_support: this.parseBooleanOrNull(responseMap.get('q-014')),
      trigger_factors: this.ensureArray(responseMap.get('q-015')),
      daily_routine: {
        wake_time: responseMap.get('q-016'),
        sleep_time: responseMap.get('q-017'),
        work_type: responseMap.get('q-018')
      }
    };
  }

  private parseIntOrNull(value: any): number | null {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }

  private parseFloatOrNull(value: any): number | null {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  private parseBooleanOrNull(value: any): boolean | null {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return null;
  }

  private ensureArray(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  }

  private mapQuitMotivation(answer: string): string | null {
    if (!answer) return null;
    
    const answerLower = answer.toLowerCase();
    if (answerLower.includes('cao') || answerLower.includes('quyết tâm')) return 'HIGH';
    if (answerLower.includes('trung bình') || answerLower.includes('do dự')) return 'MEDIUM';
    if (answerLower.includes('thấp') || answerLower.includes('thử xem')) return 'LOW';
    
    return null;
  }
}
