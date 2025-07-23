import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  order: number;
  description?: string;
}

export interface QuizResponse {
  question_id: string;
  answer: any;
}

export interface MemberProfileData {
  cigarettes_per_day: number;
  sessions_per_day: number;
  price_per_pack: number;
  cigarettes_per_pack: number;
  smoking_years: number;
  brand_preference: string;
  nicotine_level: number;
  health_conditions: string[];
  allergies: string[];
  medications: string[];
  quit_motivation: 'HIGH' | 'MEDIUM' | 'LOW';
  previous_attempts: number;
  preferred_support: string[];
  stress_level: number; // 1-5
  social_support: boolean;
  trigger_factors: string[];
  daily_routine: {
    wake_time: string; // HH:MM format
    sleep_time: string; // HH:MM format
    work_type: string;
  };
}

@Injectable()
export class QuizToProfileAIService {
  private readonly logger = new Logger(QuizToProfileAIService.name);
  private ai: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not defined in environment variables');
      throw new Error('GEMINI_API_KEY is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  private readonly SYSTEM_PROMPT = `
Bạn là một chuyên gia phân tích dữ liệu cho nền tảng cai thuốc lá. Nhiệm vụ của bạn là phân tích các câu trả lời của bảng câu hỏi và ánh xạ chúng vào hồ sơ thành viên có cấu trúc.

CẤU TRÚC HỒ SƠ THÀNH VIÊN (TẤT CẢ FIELD ĐỀU BẮT BUỘC):
{
  cigarettes_per_day: number,              // Số điếu thuốc mỗi ngày (có trong quiz)
  sessions_per_day: number,                // Số lần hút mỗi ngày (có trong quiz)
  price_per_pack: number,                  // Giá tiền mỗi gói VND (có trong quiz)
  cigarettes_per_pack: number,             // Số điếu trong 1 gói thuốc lá (có trong quiz)
  smoking_years: number,                   // Số năm hút thuốc (có trong quiz)
  brand_preference: string,                // Thương hiệu ưa thích (mặc định: "Không xác định")
  nicotine_level: number,                  // Nồng độ nicotine mg (mặc định: 1.0)
  health_conditions: string[],             // Tình trạng sức khỏe (mặc định: [])
  allergies: string[],                     // Dị ứng (mặc định: [])
  medications: string[],                   // Thuốc đang dùng (mặc định: [])
  quit_motivation: "HIGH" | "MEDIUM" | "LOW",  // Động lực cai thuốc (có trong quiz)
  previous_attempts: number,               // Số lần cai thuốc trước đây (có trong quiz)
  preferred_support: string[],             // Phương pháp hỗ trợ ưa thích (mặc định: ["Ứng dụng theo dõi tiến độ"])
  stress_level: number,                    // Mức độ căng thẳng 1-5 (có trong quiz)
  social_support: boolean,                 // Có hỗ trợ từ gia đình/bạn bè (có trong quiz)
  trigger_factors: string[],               // Yếu tố kích thích hút thuốc (có trong quiz)
  daily_routine: {
    wake_time: string,                     // Giờ thức dậy HH:MM (có trong quiz)
    sleep_time: string,                    // Giờ đi ngủ HH:MM (có trong quiz)
    work_type: string                      // Loại công việc (mặc định: "Không xác định")
  }
}

QUY TẮC ÁNH XẠ QUAN TRỌNG:
1. KHÔNG BAO GIỜ trả về null cho bất kỳ field nào
2. Phân tích cẩn thận từng câu hỏi và câu trả lời
3. Ánh xạ câu trả lời vào trường phù hợp nhất trong hồ sơ thành viên
4. Chuyển đổi kiểu dữ liệu khi cần thiết (chuỗi thành số, v.v.)
5. Đối với quit_motivation, phân loại câu trả lời văn bản thành HIGH/MEDIUM/LOW dựa trên mức độ quyết tâm
6. Đối với mảng, đảm bảo chúng được định dạng đúng là mảng chuỗi, nếu không có dữ liệu thì trả về mảng rỗng []
7. Đối với trường boolean, chuyển đổi câu trả lời có/không/đúng/sai một cách phù hợp
8. Nếu không thể xác định một trường từ các câu trả lời, sử dụng giá trị mặc định đã chỉ định
9. Thông minh trong việc ánh xạ - sử dụng gợi ý ngữ cảnh từ văn bản câu hỏi và nội dung câu trả lời
10. Giờ phải ở định dạng HH:MM (ví dụ: "07:30", "23:45")

ĐỊNH DẠNG PHẢN HỒI:
Chỉ trả về một đối tượng JSON hợp lệ khớp với cấu trúc MemberProfileData. Không có văn bản hoặc giải thích bổ sung. Tất cả các field đều phải có giá trị, không được null.
`;

  async mapQuizToProfile(
    responses: QuizResponse[], 
    questions: QuizQuestion[]
  ): Promise<MemberProfileData> {
    try {
      this.logger.debug('Starting AI mapping for quiz responses');
      
      const userPrompt = this.generateUserPrompt(responses, questions);
      const aiResponse = await this.callAI(userPrompt);
      const mappedData = this.parseAIResponse(aiResponse);
      
      this.logger.debug('AI mapping completed successfully');
      return mappedData;
      
    } catch (error) {
      this.logger.error('Error in AI mapping, using fallback:', error);
      return this.getFallbackMapping(responses, questions);
    }
  }

  private generateUserPrompt(responses: QuizResponse[], questions: QuizQuestion[]): string {
    // Create question-answer pairs for context
    const questionMap = new Map(questions.map(q => [q.id, q]));
    const qaList = responses.map(response => {
      const question = questionMap.get(response.question_id);
      return {
        question_order: question?.order || 0,
        question_text: question?.question_text || 'Câu hỏi không xác định',
        question_type: question?.question_type || 'TEXT',
        answer: response.answer
      };
    }).sort((a, b) => a.question_order - b.question_order);

    let prompt = `Vui lòng ánh xạ các câu trả lời bảng câu hỏi sau vào hồ sơ thành viên:\n\n`;
    
    qaList.forEach((qa, index) => {
      prompt += `Câu ${qa.question_order}: ${qa.question_text}\n`;
      prompt += `Loại: ${qa.question_type}\n`;
      prompt += `Trả lời: ${JSON.stringify(qa.answer)}\n\n`;
    });

    prompt += `Ánh xạ các câu trả lời này vào cấu trúc MemberProfileData và trả về đối tượng JSON:`;
    
    return prompt;
  }

  private async callAI(userPrompt: string): Promise<string> {
    try {
      // Generate content using Gemini API
      const result = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${this.SYSTEM_PROMPT}\n\n${userPrompt}`
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
      return responseText;

    } catch (error) {
      this.logger.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  private parseAIResponse(response: string): MemberProfileData {
    try {
      // Clean up the response
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanResponse);
      
      // Validate the structure
      this.validateMemberProfileData(parsed);
      
      return parsed;
      
    } catch (error) {
      this.logger.error('Failed to parse AI response:', error);
      this.logger.error('Raw response:', response);
      throw new Error('Invalid AI response format');
    }
  }

  private validateMemberProfileData(data: any): void {
    // Basic validation - ensure it's an object
    if (!data || typeof data !== 'object') {
      throw new Error('AI response is not a valid object');
    }

    // Ensure required numeric fields have valid values (default to 0 if null/undefined)
    const numericFields = ['cigarettes_per_day', 'sessions_per_day', 'price_per_pack', 'smoking_years', 'previous_attempts'];
    numericFields.forEach(field => {
      if (data[field] === null || data[field] === undefined || isNaN(Number(data[field]))) {
        this.logger.warn(`Setting ${field} to 0 (was ${data[field]})`);
        data[field] = 0;
      } else {
        data[field] = Number(data[field]);
      }
    });

    // Validate cigarettes_per_pack separately (default to 20)
    if (data.cigarettes_per_pack === null || data.cigarettes_per_pack === undefined || isNaN(Number(data.cigarettes_per_pack))) {
      this.logger.warn(`Setting cigarettes_per_pack to 20 (was ${data.cigarettes_per_pack})`);
      data.cigarettes_per_pack = 20;
    } else {
      data.cigarettes_per_pack = Number(data.cigarettes_per_pack);
    }

    // Validate and set nicotine_level (default to 1.0)
    if (data.nicotine_level === null || data.nicotine_level === undefined || isNaN(Number(data.nicotine_level))) {
      this.logger.warn(`Setting nicotine_level to 1.0 (was ${data.nicotine_level})`);
      data.nicotine_level = 1.0;
    } else {
      data.nicotine_level = Number(data.nicotine_level);
    }

    // Validate and set brand_preference (default to "Không xác định")
    if (!data.brand_preference || typeof data.brand_preference !== 'string') {
      this.logger.warn(`Setting brand_preference to "Không xác định" (was ${data.brand_preference})`);
      data.brand_preference = 'Không xác định';
    }

    // Validate quit_motivation enum (default to MEDIUM)
    if (!data.quit_motivation || !['HIGH', 'MEDIUM', 'LOW'].includes(data.quit_motivation)) {
      this.logger.warn(`Invalid quit_motivation value: ${data.quit_motivation}, setting to MEDIUM`);
      data.quit_motivation = 'MEDIUM';
    }

    // Validate stress_level range (default to 3 if invalid)
    if (data.stress_level === null || data.stress_level === undefined) {
      data.stress_level = 3; // Default to medium stress
    } else {
      const level = Number(data.stress_level);
      if (isNaN(level) || level < 1 || level > 5) {
        this.logger.warn(`Invalid stress_level value: ${data.stress_level}, setting to 3`);
        data.stress_level = 3;
      } else {
        data.stress_level = level;
      }
    }

    // Validate social_support boolean (default to false)
    if (data.social_support === null || data.social_support === undefined) {
      data.social_support = false;
    } else if (typeof data.social_support !== 'boolean') {
      // Try to convert string values
      if (data.social_support === 'true' || data.social_support === 'có' || data.social_support === 'yes') {
        data.social_support = true;
      } else {
        data.social_support = false;
      }
    }

    // Ensure arrays are properly formatted
    const arrayFields = ['health_conditions', 'allergies', 'medications', 'trigger_factors'];
    arrayFields.forEach(field => {
      if (!data[field] || !Array.isArray(data[field])) {
        if (typeof data[field] === 'string' && data[field].trim() !== '') {
          data[field] = [data[field]];
        } else {
          this.logger.warn(`Setting ${field} to empty array (was ${data[field]})`);
          data[field] = [];
        }
      }
    });

    // Handle preferred_support separately (default to app tracking)
    if (!data.preferred_support || !Array.isArray(data.preferred_support)) {
      if (typeof data.preferred_support === 'string' && data.preferred_support.trim() !== '') {
        data.preferred_support = [data.preferred_support];
      } else {
        this.logger.warn(`Setting preferred_support to default (was ${data.preferred_support})`);
        data.preferred_support = ['Ứng dụng theo dõi tiến độ'];
      }
    }

    // Validate daily_routine object
    if (!data.daily_routine || typeof data.daily_routine !== 'object') {
      data.daily_routine = {
        wake_time: '07:00',
        sleep_time: '23:00',
        work_type: 'Không xác định'
      };
    } else {
      // Validate time format and set defaults
      if (!data.daily_routine.wake_time || !this.isValidTimeFormat(data.daily_routine.wake_time)) {
        data.daily_routine.wake_time = '07:00';
      }
      if (!data.daily_routine.sleep_time || !this.isValidTimeFormat(data.daily_routine.sleep_time)) {
        data.daily_routine.sleep_time = '23:00';
      }
      if (!data.daily_routine.work_type || typeof data.daily_routine.work_type !== 'string') {
        data.daily_routine.work_type = 'Không xác định';
      }
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Fallback method if AI fails
  getFallbackMapping(responses: QuizResponse[], questions: QuizQuestion[]): MemberProfileData {
    this.logger.warn('Using fallback mapping due to AI failure');
    
    // Basic fallback mapping with default values instead of null
    const responseMap = new Map(responses.map(r => [r.question_id, r.answer]));
    
    return {
      cigarettes_per_day: 0,
      sessions_per_day: 0,
      price_per_pack: 0,
      cigarettes_per_pack: 20,
      smoking_years: 0,
      brand_preference: 'Không xác định',
      nicotine_level: 1.0,
      health_conditions: [],
      allergies: [],
      medications: [],
      quit_motivation: 'MEDIUM',
      previous_attempts: 0,
      preferred_support: ['Ứng dụng theo dõi tiến độ'],
      stress_level: 3,
      social_support: false,
      trigger_factors: [],
      daily_routine: {
        wake_time: '07:00',
        sleep_time: '23:00',
        work_type: 'Không xác định'
      }
    };
  }
}
