import { z } from 'zod'
import { RoleNameEnum, StatusEnum } from 'src/shared/enums/graphql-enums'

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(100),
  user_name: z.string().min(3).max(100),
  avatar_url: z.string().optional(),
  role: z.nativeEnum(RoleNameEnum).default(RoleNameEnum.MEMBER),
  status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE),
  member_profile_id: z.string().uuid().nullable(),
  coach_profile_id: z.string().uuid().nullable(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

export const MemberProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Thông tin về thói quen hút thuốc
  cigarettes_per_day: z.number().nullable(),
  sessions_per_day: z.number().nullable(),
  price_per_pack: z.number().nullable(),
  smoking_years: z.number().nullable(),
  brand_preference: z.string().nullable(),
  nicotine_level: z.number().nullable(),
  
  // Thông tin sức khỏe
  health_conditions: z.array(z.string()).nullable(),
  allergies: z.array(z.string()).nullable(),
  medications: z.array(z.string()).nullable(),
  
  // Thông tin cho hệ thống gợi ý
  quit_motivation: z.string().nullable(),
  previous_attempts: z.number().nullable(),
  preferred_support: z.array(z.string()).nullable(),
  stress_level: z.number().nullable(),
  daily_routine: z.any().nullable(),
  social_support: z.boolean().nullable(),
  trigger_factors: z.array(z.string()).nullable(),
  
  recorded_at: z.date().nullable(),
})

export const CoachProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Thông tin chuyên môn
  experience_years: z.number().nullable(),
  specializations: z.array(z.string()).nullable(),
  certifications: z.array(z.string()).nullable(),
  education: z.string().nullable(),
  professional_bio: z.string().nullable(),
  
  // Thống kê hiệu quả
  success_rate: z.number().nullable(),
  total_clients: z.number().nullable(),
  average_rating: z.number().nullable(),
  total_sessions: z.number().nullable(),
  
  // Thông tin bổ sung
  approach_description: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date().nullable(),
})

export type MemberProfileType = z.infer<typeof MemberProfileSchema>
export type CoachProfileType = z.infer<typeof CoachProfileSchema>
export type UserType = z.infer<typeof UserSchema>