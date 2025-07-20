import { Resolver, Query, Args, Int } from '@nestjs/graphql'
import { DashboardService } from './dashboard.service'
import { DashboardMetrics } from './entities/dashboard.entity'
import { PaymentWithTransaction, PaymentDetail } from './entities/payment.entity'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard'
import { RolesGuard } from 'src/shared/guards/roles.guard'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { Role } from '@prisma/client'

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardMetrics, { name: 'getDashboardMetrics' })
  async getDashboardMetrics(
    @Args('year', { type: () => Int, nullable: true }) year?: number
  ): Promise<DashboardMetrics> {
    return await this.dashboardService.getDashboardMetrics(year)
  }

  @Query(() => [PaymentWithTransaction], { name: 'getAllPaymentsWithTransactions' })
  async getAllPaymentsWithTransactions(): Promise<PaymentWithTransaction[]> {
    return await this.dashboardService.getAllPaymentsWithTransactions()
  }

  @Query(() => PaymentDetail, { name: 'getPaymentDetail' })
  async getPaymentDetail(
    @Args('id', { type: () => String }) id: string
  ): Promise<PaymentDetail> {
    return await this.dashboardService.getPaymentDetail(id)
  }
}
