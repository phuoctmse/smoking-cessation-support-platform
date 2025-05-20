import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { RedisServices } from "src/shared/services/redis.service";
import envConfig from "src/shared/config/config";

@Injectable()
export class BlacklistGuard {
    constructor(private readonly redisService: RedisServices) { }
    
    
    async setBlackList(token: string, expiresInSeconds: number): Promise<void> {
        const client = this.redisService.getClient();
        const key = `${envConfig.TOKEN_BLACKLIST_PREFIX}${token}`;
        await client.setEx(key, expiresInSeconds, '1');
        console.log(`Token blacklisted for ${expiresInSeconds} seconds: ${token.substring(0, 10)}...`);
    }
    
    async isBlackList(token: string): Promise<boolean> {
        const client = this.redisService.getClient();
        const key = `${envConfig.TOKEN_BLACKLIST_PREFIX}${token}`;
        const result = await client.get(key);
        return result !== null;
    }
}
