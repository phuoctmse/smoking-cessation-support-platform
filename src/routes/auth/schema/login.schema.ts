import { z } from "zod";

export const LoginBodySchema = z.object({
    email: z.string().email('Email is required'),
    password: z.string().min(6, 'Password is required'),
})

export type LoginBodyType = z.infer<typeof LoginBodySchema>
