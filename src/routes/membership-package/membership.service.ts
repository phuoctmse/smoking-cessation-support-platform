import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MembershipRepo } from './membership.repo';
import { MembershipPackageType } from './schema/membership.schema';

@Injectable()
export class MembershipService {
    constructor(
        private readonly membershipRepo: MembershipRepo,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async findAll() {
        const memberships = await this.membershipRepo.findMany();

        // Store each membership in cache with its own key
        await Promise.all(
            memberships.map(async (membership) => {
                const cacheKey = `membership_${membership.id}`;
                await this.cacheManager.set(cacheKey, membership);
            })
        );

        return memberships;
    }

    async findById(id: string): Promise<MembershipPackageType> {
        const cacheKey = `membership_${id}`;

        // Try to get from cache
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        // If not in cache, get from database
        const membership = await this.membershipRepo.findById(id);

        if (membership) {
            // Store in cache
            await this.cacheManager.set(cacheKey, membership);
        }

        return membership;
    }

    async create(data: any) {
        const membership = await this.membershipRepo.create(data);

        const cacheKey = `membership_${membership.id}`;
        await this.cacheManager.set(cacheKey, membership);

        return membership;
    }

    async update(id: string, data: any) {
        const membership = await this.membershipRepo.update(data);

        if (membership) {
            // Invalidate specific and list cache
            const cacheKey = `membership_${id}`;
            await this.cacheManager.del(cacheKey)
        }

        return membership;
    }
}