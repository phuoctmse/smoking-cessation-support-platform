import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { UserType } from "src/shared/models/share-user.model";



@Injectable()
export class AuthRepository {
    constructor(private readonly prismaService: PrismaService,
    ) { }

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

    async findUserByEmail(email: string): Promise<UserType> {
        const user = await this.prismaService.user.findUnique({
            where: { email },
        });
        return user
    }

}