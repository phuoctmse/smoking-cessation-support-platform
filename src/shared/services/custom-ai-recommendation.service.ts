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

// Temporary interface for raw AI response before template mapping
interface RawAIResponse {
    recommendedTemplate: string;
    confidence: number;
    reasoning: {
        matchingFactors: string[];
        considerations: string[];
        risks: string[];
        suggestions: string[];
    };
    alternativeTemplates: string[];
}

@Injectable()
export class CustomAIRecommendationService {
    private readonly logger = new Logger(CustomAIRecommendationService.name);
    private ai: GoogleGenAI;

    private readonly SYSTEM_PROMPT = `Bạn là một hệ thống AI chuyên gia về việc đề xuất kế hoạch cai thuốc lá. 
Nhiệm vụ của bạn là phân tích hồ sơ người hút thuốc và đề xuất kế hoạch cai thuốc phù hợp nhất từ danh sách các mẫu có sẵn.
Hãy xem xét tất cả các khía cạnh bao gồm nghiện nicotine, yếu tố tâm lý, tình trạng sức khỏe và lối sống.

QUAN TRỌNG: Bạn phải trả về CHÍNH XÁC định dạng JSON sau, không có văn bản bổ sung:
{
    "recommendedTemplate": "tên template từ danh sách có sẵn",
    "confidence": 0.85,
    "reasoning": {
        "matchingFactors": ["yếu tố 1", "yếu tố 2"],
        "considerations": ["cân nhắc 1", "cân nhắc 2"],
        "risks": ["rủi ro 1", "rủi ro 2"],
        "suggestions": ["gợi ý 1", "gợi ý 2"]
    },
    "alternativeTemplates": ["template khác 1", "template khác 2"]
}

Đảm bảo:
- recommendedTemplate phải được chọn từ danh sách Available Templates
- confidence là số từ 0.0 đến 1.0
- Tất cả các trường đều bắt buộc
- Trả về JSON hợp lệ, không có markdown hay văn bản giải thích bổ sung`;

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

Trả về JSON theo định dạng yêu cầu.`;

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

    private parseAIResponse(response: string): RawAIResponse {
        try {
            let cleanResponse = response.trim();
            
            this.logger.debug('Raw AI response:', response);
            
            // Remove markdown code blocks if present
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            this.logger.debug('Cleaned AI response:', cleanResponse);

            let parsed;
            try {
                parsed = JSON.parse(cleanResponse);
                this.logger.debug('Successfully parsed JSON:', parsed);
            } catch (jsonError) {
                this.logger.warn('AI response is not valid JSON, attempting to process as text');
                this.logger.error('JSON parse error:', jsonError);
                this.logger.error('Failed to parse:', cleanResponse);
                parsed = this.parseTextResponse(cleanResponse);
            }

            if (!parsed.recommendedTemplate || !parsed.confidence || !parsed.reasoning) {
                this.logger.error('Invalid AI response structure. Missing fields:', {
                    hasRecommendedTemplate: !!parsed.recommendedTemplate,
                    hasConfidence: !!parsed.confidence,
                    hasReasoning: !!parsed.reasoning,
                    actualStructure: Object.keys(parsed)
                });
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
            this.logger.error('Original response was:', response);
            throw new Error('Failed to parse AI recommendation');
        }
    }

    private parseTextResponse(response: string): any {
        this.logger.warn('Attempting to parse text response as fallback');
        
        try {
            // Try to extract JSON from text response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                return JSON.parse(jsonStr);
            }
            
            // If no JSON found, create a basic structure
            this.logger.warn('No JSON found in text response, creating fallback structure');
            return {
                recommendedTemplate: "Cai thuốc từ từ",
                confidence: 0.5,
                reasoning: {
                    matchingFactors: ["Fallback recommendation"],
                    considerations: ["AI response could not be parsed properly"],
                    risks: [],
                    suggestions: ["Please try again or contact support"]
                },
                alternativeTemplates: []
            };
        } catch (error) {
            this.logger.error('Failed to parse text response:', error);
            // Return absolute fallback
            return {
                recommendedTemplate: "Cai thuốc từ từ",
                confidence: 0.3,
                reasoning: {
                    matchingFactors: ["Default fallback"],
                    considerations: ["System error - using default recommendation"],
                    risks: [],
                    suggestions: ["Please contact support for better recommendations"]
                },
                alternativeTemplates: []
            };
        }
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
                where: { is_active: true }
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
            const recommendation = this.parseAIResponse(responseText);

            // Find the recommended template object
            const recommendedTemplate = availableTemplates.find(t => t.name === recommendation.recommendedTemplate);
            if (!recommendedTemplate) {
                this.logger.warn(`Recommended template "${recommendation.recommendedTemplate}" not found in available templates`);
                // Use first available template as fallback
                const fallbackTemplate = availableTemplates[0];
                this.logger.warn(`Using fallback template: ${fallbackTemplate.name}`);
                
                return {
                    recommendedTemplate: fallbackTemplate,
                    confidence: 0.3,
                    reasoning: {
                        matchingFactors: ['Fallback recommendation due to AI parsing error'],
                        considerations: ['AI recommendation system encountered an error'],
                        risks: ['May not be optimally suited for user profile'],
                        suggestions: ['Consider consulting with a healthcare professional']
                    },
                    alternativeTemplates: availableTemplates.slice(1, 3) // Get up to 2 alternatives
                };
            }

            // Find alternative template objects
            const alternativeTemplates = recommendation.alternativeTemplates
                .map(altName => availableTemplates.find(t => t.name === altName))
                .filter((template): template is CessationPlanTemplate => template !== undefined);

            // Return the properly structured response
            return {
                recommendedTemplate,
                confidence: recommendation.confidence,
                reasoning: recommendation.reasoning,
                alternativeTemplates
            };
        } catch (error) {
            this.logger.error('Error getting AI recommendation:', error);
            
            // Final fallback - return the first available template
            try {
                const availableTemplates = await this.prisma.cessationPlanTemplate.findMany({
                    where: { is_active: true },
                    take: 3
                });
                
                if (availableTemplates.length > 0) {
                    this.logger.warn('Using emergency fallback recommendation');
                    return {
                        recommendedTemplate: availableTemplates[0],
                        confidence: 0.2,
                        reasoning: {
                            matchingFactors: ['Emergency fallback due to system error'],
                            considerations: ['System error prevented AI analysis'],
                            risks: ['Recommendation may not be suitable'],
                            suggestions: ['Please try again later or consult a healthcare professional']
                        },
                        alternativeTemplates: availableTemplates.slice(1)
                    };
                }
            } catch (fallbackError) {
                this.logger.error('Emergency fallback also failed:', fallbackError);
            }
            
            throw new Error(`Failed to get cessation plan recommendation: ${error.message}`);
        }
    }
}