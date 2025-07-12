import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai'; // Correct import for new library
import { PrismaService } from './prisma.service';
import { MemberProfile, CessationPlanTemplate } from '@prisma/client';
import {
    AIRecommendationInput,
    AIRecommendationOutput,
    AIPromptTemplate,
    AITrainingExample
} from '../../ai/recommendation/model';

@Injectable()
export class CustomAIRecommendationService {
    private readonly logger = new Logger(CustomAIRecommendationService.name);
    private ai: GoogleGenAI;

    private readonly SYSTEM_PROMPT = `Bạn là một hệ thống AI chuyên gia về việc đề xuất kế hoạch cai thuốc lá. 
Nhiệm vụ của bạn là phân tích hồ sơ người hút thuốc và đề xuất kế hoạch cai thuốc phù hợp nhất từ danh sách các mẫu có sẵn.
Hãy xem xét tất cả các khía cạnh bao gồm nghiện nicotine, yếu tố tâm lý, tình trạng sức khỏe và lối sống.
Trả về phản hồi dưới dạng JSON với cấu trúc sau:
{
    "recommendedTemplate": string,
    "confidence": number,
    "reasoning": {
        "matchingFactors": string[],
        "considerations": string[],
        "risks": string[],
        "suggestions": string[]
    },
    "alternativeTemplates": string[]
}
Đảm bảo recommendedTemplate và alternativeTemplates được chọn từ danh sách các mẫu có sẵn được cung cấp.`;

    private readonly USER_PROMPT_TEMPLATE = `Vui lòng phân tích hồ sơ người hút thuốc này và đề xuất kế hoạch cai thuốc phù hợp nhất:

THÓI QUEN HÚT THUỐC:
- Số điếu thuốc mỗi ngày: {cigarettesPerDay}
- Số năm hút thuốc: {smokingYears}
- Nồng độ nicotine: {nicotineLevel}mg
- Thương hiệu ưa thích: {brand}

THÔNG TIN SỨC KHỎE:
- Tình trạng sức khỏe: {healthConditions}
- Thuốc đang sử dụng: {medications}
- Dị ứng: {allergies}

YẾU TỐ TÂM LÝ:
- Động lực cai thuốc: {quitMotivation}
- Số lần cai thuốc trước đây: {previousAttempts}
- Mức độ căng thẳng: {stressLevel}
- Yếu tố gây kích thích: {triggerFactors}
- Hỗ trợ xã hội: {socialSupport}

Dựa trên hồ sơ này, vui lòng:
1. Đề xuất kế hoạch cai thuốc phù hợp nhất
2. Giải thích lý do lựa chọn
3. Xác định các rủi ro và thách thức tiềm ẩn
4. Đề xuất các kế hoạch thay thế nếu có
5. Đưa ra các khuyến nghị cụ thể để tùy chỉnh kế hoạch

Vui lòng trả lời bằng tiếng Việt.`;

    constructor(private prisma: PrismaService) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY is not defined in environment variables');
            throw new Error('GEMINI_API_KEY is required');
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    private mapProfileToInput(profile: MemberProfile): AIRecommendationInput {
        return {
            smokingHabits: {
                cigarettesPerDay: profile.cigarettes_per_day || 0,
                smokingYears: profile.smoking_years || 0,
                nicotineLevel: profile.nicotine_level || 0,
                brand: profile.brand_preference || 'Unknown'
            },
            healthInfo: {
                conditions: profile.health_conditions || [],
                medications: profile.medications || [],
                allergies: profile.allergies || []
            },
            psychologicalInfo: {
                quitMotivation: profile.quit_motivation || 'MEDIUM',
                previousAttempts: profile.previous_attempts || 0,
                stressLevel: profile.stress_level || 5,
                triggerFactors: profile.trigger_factors || [],
                socialSupport: profile.social_support ?? false
            }
        };
    }

    private generatePrompt(input: AIRecommendationInput): string {
        const safeJoin = (arr: any[] | null | undefined, separator = ', '): string =>
            Array.isArray(arr) ? arr.join(separator) : 'None';

        return this.USER_PROMPT_TEMPLATE
            .replace('{cigarettesPerDay}', String(input.smokingHabits.cigarettesPerDay ?? 0))
            .replace('{smokingYears}', String(input.smokingHabits.smokingYears ?? 0))
            .replace('{nicotineLevel}', String(input.smokingHabits.nicotineLevel ?? 0))
            .replace('{brand}', String(input.smokingHabits.brand ?? 'Unknown'))
            .replace('{healthConditions}', safeJoin(input.healthInfo.conditions))
            .replace('{medications}', safeJoin(input.healthInfo.medications))
            .replace('{allergies}', safeJoin(input.healthInfo.allergies))
            .replace('{quitMotivation}', String(input.psychologicalInfo.quitMotivation ?? 'MEDIUM'))
            .replace('{previousAttempts}', String(input.psychologicalInfo.previousAttempts ?? 0))
            .replace('{stressLevel}', String(input.psychologicalInfo.stressLevel ?? 5))
            .replace('{triggerFactors}', safeJoin(input.psychologicalInfo.triggerFactors))
            .replace('{socialSupport}', input.psychologicalInfo.socialSupport ? 'Yes' : 'No');
    }

    private async parseAIResponse(response: string): Promise<AIRecommendationOutput> {
        try {
            let parsed;
            try {
                parsed = JSON.parse(response);
            } catch (jsonError) {
                this.logger.warn('AI response is not valid JSON, attempting to process as text');
                parsed = this.parseTextResponse(response);
            }

            if (!parsed.recommendedTemplate || !parsed.confidence || !parsed.reasoning) {
                throw new Error('Invalid AI response structure');
            }

            return {
                recommendedTemplate: parsed.recommendedTemplate,
                confidence: parsed.confidence,
                reasoning: {
                    matchingFactors: parsed.reasoning.matchingFactors || [],
                    considerations: parsed.reasoning.considerations || [],
                    risks: parsed.reasoning.risks || [],
                    suggestions: parsed.reasoning.suggestions || []
                },
                alternativeTemplates: parsed.alternativeTemplates || []
            };
        } catch (error) {
            this.logger.error('Error parsing AI response:', error);
            throw new Error('Failed to parse AI recommendation');
        }
    }

    private parseTextResponse(response: string): any {
        this.logger.warn('Text parsing not fully implemented');
        throw new Error('Text response parsing not supported');
    }

    async getRecommendation(memberProfile: MemberProfile): Promise<AIRecommendationOutput> {
        if (!memberProfile) {
            this.logger.error('Member profile is null or undefined');
            throw new Error('Member profile is required');
        }

        try {
            // Map profile to AI input
            const input = this.mapProfileToInput(memberProfile);
            const prompt = this.generatePrompt(input);

            // Fetch available templates
            const availableTemplates = await this.prisma.cessationPlanTemplate.findMany({
                where: { is_active: true },
                select: { name: true, description: true }
            });

            if (!availableTemplates.length) {
                this.logger.error('No active cessation plan templates found');
                throw new Error('No active cessation plan templates available');
            }

            // Build context with available templates
            const context = `Available Templates:\n${availableTemplates
                .map(t => `- ${t.name}: ${t.description}`)
                .join('\n')}`;

            // Generate content using the new API
            const result = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `${this.SYSTEM_PROMPT}\n\n${context}\n\n${prompt}`
            });

            // Extract response text using the correct path for the new library
            let responseText = '';
            if (result.candidates && result.candidates.length > 0) {
                const candidate = result.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    responseText = candidate.content.parts[0].text || '';
                }
            }

            if (!responseText) {
                throw new Error('No response received from AI model');
            }

            this.logger.debug('AI response received:', responseText);

            // Parse and validate response
            const recommendation = await this.parseAIResponse(responseText);

            // Verify recommended template exists
            if (!availableTemplates.some(t => t.name === recommendation.recommendedTemplate.name)) {
                this.logger.warn(`Recommended template "${recommendation.recommendedTemplate}" not found in available templates`);
                throw new Error('Invalid recommended template');
            }

            // Verify alternative templates exist
            recommendation.alternativeTemplates = recommendation.alternativeTemplates.filter(alt =>
                availableTemplates.some(t => t.name === alt.name)
            );

            return recommendation;
        } catch (error) {
            this.logger.error('Error getting AI recommendation:', error);
            throw new Error(`Failed to get cessation plan recommendation: ${error.message}`);
        }
    }
}