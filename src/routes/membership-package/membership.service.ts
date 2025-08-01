import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { MembershipRepo } from './membership.repo'
import { MembershipPackageType } from './schema/membership.schema'

@Injectable()
export class MembershipService {
  constructor(
    private readonly membershipRepo: MembershipRepo,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll() {
    const memberships = await this.membershipRepo.findMany()

    // Store each membership in cache with its own key
    await Promise.all(
      memberships.map(async (membership) => {
        const cacheKey = `membership_${membership.id}`
        await this.cacheManager.set(cacheKey, membership)
      }),
    )

    return memberships
  }

  async findById(id: string): Promise<MembershipPackageType> {
    const cacheKey = `membership_${id}`

    // Try to get from cache
    const cachedData = await this.cacheManager.get(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // If not in cache, get from database
    const membership = await this.membershipRepo.findById(id)

    if (membership) {
      // Store in cache
      await this.cacheManager.set(cacheKey, membership)
    }

    return membership
  }

  async create(data: any) {
    if (data.is_active === true) {
      const activePackages = await this.membershipRepo.findActivePackages()

      if (activePackages.length >= 3) {
        throw new Error('Không thể tạo thêm membership package active. Hệ thống chỉ cho phép tối đa 3 gói active.')
      }
    }

    const membership = await this.membershipRepo.create(data)

    const cacheKey = `membership_${membership.id}`
    await this.cacheManager.set(cacheKey, membership)

    return membership
  }

  async update(id: string, data: any) {
    const existingPackage = await this.membershipRepo.findById(id)
    if (!existingPackage) {
      throw new Error('Membership package không tồn tại.')
    }

    // Kiểm tra xem có user nào đang sử dụng package này không
    const usersUsingPackage = await this.membershipRepo.checkUsersUsingPackage(id)
    if (usersUsingPackage > 0) {
      throw new Error(`Không thể cập nhật membership package này. Hiện có ${usersUsingPackage} user đang sử dụng package này.`)
    }

    // Kiểm tra nếu đang cố gắng set is_active = true
    if (data.is_active === true && !existingPackage.is_active) {
      const activePackages = await this.membershipRepo.findActivePackages()
      
      if (activePackages.length >= 3) {
        throw new Error('Không thể kích hoạt package này. Hệ thống chỉ cho phép tối đa 3 gói active.')
      }
    }

    const membership = await this.membershipRepo.update(data)

    if (membership) {
      // Invalidate specific and list cache
      const cacheKey = `membership_${id}`
      await this.cacheManager.del(cacheKey)
    }

    return membership
  }

  async delete(id: string): Promise<boolean> {
    try {
      const existingMembership = await this.membershipRepo.findById(id)
      if (!existingMembership) {
        throw new Error('Membership package không tồn tại.')
      }

      if (existingMembership.is_active) {
        throw new Error('Không thể xóa membership package đang active. Vui lòng deactivate trước khi xóa.')
      }

      const activePackages = await this.membershipRepo.findActivePackages()
      if (activePackages.length <= 1) {
        throw new Error('Không thể xóa package này. Hệ thống phải có ít nhất 1 gói active.')
      }

      const usersUsingPackage = await this.membershipRepo.checkUsersUsingPackage(id)
      if (usersUsingPackage > 0) {
        throw new Error(`Không thể xóa membership package này. Hiện có ${usersUsingPackage} user đang sử dụng package này.`)
      }

      await this.membershipRepo.delete(id)

      const cacheKey = `membership_${id}`
      await this.cacheManager.del(cacheKey)

      return true
    } catch (error) {
      throw new Error(`Không thể xóa membership package: ${error.message}`)
    }
  }
}
