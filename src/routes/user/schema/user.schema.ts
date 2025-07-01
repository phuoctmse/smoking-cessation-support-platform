import { z } from 'zod'
import { RoleName, Status } from 'src/shared/constants/role.constant'

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(100),
  user_name: z.string().min(3).max(100),
  avatar_url: z.string().nullable(),
  role: z.enum([RoleName.Member, RoleName.Coach, RoleName.Admin]).default(RoleName.Member),
  status: z.enum([Status.Active, Status.Inactive, Status.Blocked]).default(Status.Active),
  created_at: z.date(),
  updated_at: z.date(),
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