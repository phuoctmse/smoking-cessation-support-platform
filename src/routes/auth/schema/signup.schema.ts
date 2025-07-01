import { RoleName } from "src/shared/constants/role.constant"
import { RoleNameEnum, StatusEnum } from "src/shared/enums/graphql-enums"
import { z } from "zod"

export const SignupBodySchema = z.object({
    email: z.string().email('Email is required'),
    password: z.string().min(6, 'Password is required'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
    username: z.string().min(3, 'Username is required').max(20, 'Username is too long'),
    name: z.string().min(2, 'Name is required').max(50, 'Name is too long'),
    phoneNumber: z.string().optional(),
    role: z.nativeEnum(RoleNameEnum).default(RoleNameEnum.MEMBER),
    status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE),
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


export type SignupBodyType = z.infer<typeof SignupBodySchema>
