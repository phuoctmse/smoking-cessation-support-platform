import { z } from 'zod'
import { RoleName, Status } from '../constants/role.constant'

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(100),
  userName: z.string().min(3).max(100),
  avatar_url: z.string().nullable(),
  role: z.enum([RoleName.Member, RoleName.Coach, RoleName.Admin]).default(RoleName.Member),
  status: z.enum([Status.Active, Status.Inactive, Status.Blocked]).default(Status.Active),
  cigarettes_per_day: z.number().nullable(),
  session_per_day: z.number().nullable(),
  price_per_pack: z.number().nullable(),
  recorded_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type UserType = z.infer<typeof UserSchema>
