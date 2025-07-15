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
  cigarettes_per_day: z.number().nullable(),
  sessions_per_day: z.number().nullable(),
  price_per_pack: z.number().nullable(),
  recorded_at: z.date().nullable(),
})

export const CoachProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  experience_years: z.number().nullable(),
  bio: z.string().nullable(),
})

export type MemberProfileType = z.infer<typeof MemberProfileSchema>
export type CoachProfileType = z.infer<typeof CoachProfileSchema>
export type UserType = z.infer<typeof UserSchema>