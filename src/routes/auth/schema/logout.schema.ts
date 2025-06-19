import { z } from "zod";

export const LogoutResponseSchema = z.object({
  error: z.string().optional(),
})

export type LogoutResponseType = z.infer<typeof LogoutResponseSchema>
