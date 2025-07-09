import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai'; // Adjust import based on actual library
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
    private genAI: GoogleGenAI;
    private model: any; // Replace with actual type (e.g., GenerativeModel)

    private readonly SYSTEM_PROMPT = `You are an expert AI system specializing in smoking cessation recommendations. 
Your role is to analyze smoker profiles and recommend the most suitable cessation plan templates from the provided list.
Consider all aspects including physical addiction, psychological factors, health conditions, and lifestyle.
Return your response in JSON format with the following structure:
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
Ensure the recommendedTemplate and alternativeTemplates are selected from the provided list of available templates.`;

    private readonly USER_PROMPT_TEMPLATE = `Please analyze this smoker's profile and recommend the most suitable cessation plan:

SMOKING HABITS:
- Cigarettes per day: {cigarettesPerDay}
- Years of smoking: {smokingYears}
- Nicotine level: {nicotineLevel}mg
- Preferred brand: {brand}

HEALTH INFORMATION:
- Health conditions: {healthConditions}
- Current medications: {medications}
- Allergies: {allergies}

PSYCHOLOGICAL FACTORS:
- Quit motivation: {quitMotivation}
- Previous quit attempts: {previousAttempts}
- Stress level: {stressLevel}
- Trigger factors: {triggerFactors}
- Social support available: {socialSupport}

Based on this profile, please:
1. Recommend the most suitable cessation plan template
2. Explain your reasoning
3. Identify potential risks and challenges
4. Suggest alternative templates if available
5. Provide specific recommendations for customizing the plan`;

    constructor(private prisma: PrismaService) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY is not defined in environment variables');
            throw new Error('GEMINI_API_KEY is required');
        }
        const modelName = 'gemini-2.5-flash';
        this.genAI = new GoogleGenAI({ apiKey });
        try {
            // Initialize the model without calling generateContent
            this.model = this.genAI.models.generateContent({ model: modelName, contents: [] }); 
        } catch (error) {
            this.logger.error(`Failed to initialize model ${modelName}:`, error);
            throw new Error(`Invalid or unsupported model: ${modelName}`);
        }
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

            // Generate content using the model
            const result = await this.model.generateContent({
                contents: [
                    { role: 'system', parts: [{ text: this.SYSTEM_PROMPT }] },
                    { role: 'user', parts: [{ text: context }] },
                    { role: 'user', parts: [{ text: prompt }] }
                ]
            });

            // Extract response text
            const responseText = result.response.text();
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