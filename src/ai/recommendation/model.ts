import { CessationPlanTemplate, MemberProfile } from '@prisma/client';

export interface AIPromptTemplate {
  systemPrompt: string;
  userPrompt: string;
  examples: AITrainingExample[];
}

export interface AITrainingExample {
  input: AIRecommendationInput;
  output: AIRecommendationOutput;
  explanation: string;
}

export interface AIRecommendationInput {
  // Thông tin thói quen hút thuốc
  smokingHabits: {
    cigarettesPerDay: number;
    smokingYears: number;
    nicotineLevel: number;
    brand: string;
  };
  
  // Thông tin sức khỏe
  healthInfo: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
  
  // Thông tin tâm lý
  psychologicalInfo: {
    quitMotivation: string;
    previousAttempts: number;
    stressLevel: number;
    triggerFactors: string[];
    socialSupport: boolean;
  };
}

export interface AIRecommendationOutput {
  recommendedTemplate: CessationPlanTemplate;
  confidence: number;
  reasoning: {
    matchingFactors: string[];
    considerations: string[];
    risks: string[];
    suggestions: string[];
  };
  alternativeTemplates: CessationPlanTemplate[];
}

export interface AIRecommendationHistory {
  userId: string;
  templateId: string;
  recommendationDate: Date;
  success: boolean;
  feedback: string;
  matchingScore: number;
} 