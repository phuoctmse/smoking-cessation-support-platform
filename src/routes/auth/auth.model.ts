import { UserSchema } from "src/shared/models/share-user.model"
import { z } from "zod"

export const SignupBodySchema = UserSchema.pick({
    email: true,
    password: true,
    name: true,
    username: true,
})
    .extend({
        confirmPassword: z.string().min(3).max(100),
    })
    .strict()
    .superRefine(({ confirmPassword, password }, ctx) => {
        if (confirmPassword !== password) {
            ctx.addIssue({
                code: 'custom',
                message: 'Password and confirm password must match',
                path: ['confirmPassword'],
            })
        }
    })

export const SignupResSchema = UserSchema.omit({
    password: true,
})

export const LoginBodySchema = UserSchema.pick({
    email: true,
    password: true,
})

export const LoginResSchema = UserSchema.omit({
    password: true,
})
// export const LoginResSchema = z.object({
//     accessToken: z.string(),
//     refreshToken: z.string(),
// })

export type SignupBodyType = z.infer<typeof SignupBodySchema>
export type SignupResType = z.infer<typeof SignupResSchema>
export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type LoginResType = z.infer<typeof LoginResSchema>