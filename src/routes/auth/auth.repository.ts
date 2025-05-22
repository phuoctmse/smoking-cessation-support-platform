import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { UserType } from 'src/shared/models/share-user.model'
import { RedisServices } from 'src/shared/services/redis.service'
import envConfig from 'src/shared/config/config'

@Injectable()
export class AuthRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisServices,
  ) {}

  async createUser(user: UserType) {
    return await this.prismaService.user.create({
      data: {
        email: user.email,
        password: user.password,
        username: user.username,
        name: user.name,
      },
    })
  }

  async findUserByEmail(email: string): Promise<UserType> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    })
    return user
  }

  async findUserById(id: string): Promise<UserType> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    })
    return user
  }

  async setRefreshToken(refreshToken: string, userId: string) {
    const client = this.redisService.getClient()
    await client.set(
      `${envConfig.REFRESH_TOKEN_PREFIX}:${refreshToken}`,
      userId,
      { EX: Number(envConfig.COOKIES_MAX_AGE) },
    )
  }
}
