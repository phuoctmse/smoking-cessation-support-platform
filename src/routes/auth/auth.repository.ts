import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { LoginInput, SignupInput } from "./auth.dto";
import { UserType } from "src/shared/models/share-user.model";
import { User } from "generated/prisma";

@Injectable()
export class AuthRepository {
    constructor(private readonly prismaService: PrismaService) { }

    async createUser(user: UserType) {
        return await this.prismaService.user.create({
            data: {
                email: user.email,
                password: user.password,
                username: user.username,
                name: user.name,
            },
        });

    }

    async findUserByEmail(email: string): Promise<Pick<UserType, 'email' | 'password'>> {
        const user = await this.prismaService.user.findUnique({
            where: { email },
        });
        return user
    }
}