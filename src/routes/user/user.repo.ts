import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { CoachProfileType, MemberProfileType, UserType } from "./schema/user.schema";
import { UpdateUserInput } from "./dto/update-user.input";
import { UpdateUserProfileInput } from './dto/update-user-profile.input'
import { RoleNameType, StatusType } from 'src/shared/constants/role.constant'

@Injectable()
export class UserRepo {
    constructor(private readonly prismaService: PrismaService) { }

    async createUser(user: UserType, memberProfile?: MemberProfileType, coachProfile?: CoachProfileType) {
        const [userData, memberProfileData, coachProfileData] = await Promise.all([
            this.prismaService.user.create({
                data: {
                    ...user,
                    name: user.name,
                    user_name: user.user_name,
                    avatar_url: user.avatar_url,
                    role: user.role,
                    status: user.status,
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            }),
            memberProfile ? this.prismaService.memberProfile.create({
                data: {
                    user_id: user.id,
                    ...memberProfile
                }
            }) : null,
            coachProfile ? this.prismaService.coachProfile.create({
                data: {
                    user_id: user.id,
                    ...coachProfile
                }
            }) : null
        ])
        return { userData, memberProfileData, coachProfileData }
    }

    async findAll() {
        return this.prismaService.user.findMany()
    }

    async findOne(id: string) {
        return this.prismaService.user.findUnique({
            where: { id }
        })
    }

    async update(id: string, updateUserInput: UpdateUserProfileInput) {
        return this.prismaService.user.update({
            where: { id },
            data: {
                ...updateUserInput
            }
        })
    }

    async updateByAdmin(id: string, updateUserInput: UpdateUserInput) {
        return this.prismaService.user.update({
            where: { id },
            data: {
                ...updateUserInput
            }
        })
    }

    async removeByAdmin(id: string) {
        // Lấy thông tin user để biết role
        const user = await this.prismaService.user.findUnique({
            where: { id },
            include: {
                MemberProfile: true,
                CoachProfile: true
            }
        })

        if (!user) {
            throw new Error('User not found')
        }

        return this.prismaService.$transaction(async (tx) => {
            // Nếu là member thì xóa MemberProfile
            if (user.role === 'MEMBER' && user.MemberProfile?.length > 0) {
                await tx.memberProfile.delete({
                    where: { id: user.MemberProfile[0].id }
                })
            }
            
            // Nếu là coach thì xóa CoachProfile
            if (user.role === 'COACH' && user.CoachProfile?.length > 0) {
                await tx.coachProfile.delete({
                    where: { id: user.CoachProfile[0].id }
                })
            }

            // Xóa user
            return tx.user.delete({
                where: { id }
            })
        })
    }
}