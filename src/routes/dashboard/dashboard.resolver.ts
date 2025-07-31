import { Resolver, Query, Args, Int } from '@nestjs/graphql'
import { DashboardService } from './dashboard.service'
import { DashboardMetrics } from './entities/dashboard.entity'
import { PaymentWithTransaction, PaymentDetail } from './entities/payment.entity'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard'
import { RolesGuard } from 'src/shared/guards/roles.guard'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema'

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(Role.ADMIN)
  @Query(() => DashboardMetrics, { name: 'getDashboardMetrics' })
  async getDashboardMetrics(
    @Args('year', { type: () => Int, nullable: true }) year?: number,
  ): Promise<DashboardMetrics> {
    return await this.dashboardService.getDashboardMetrics(year)
  }

  @Roles(Role.ADMIN)
  @Query(() => [PaymentWithTransaction], { name: 'getAllPaymentsWithTransactions' })
  async getAllPaymentsWithTransactions(
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
  ): Promise<PaymentWithTransaction[]> {
    return await this.dashboardService.getAllPaymentsWithTransactions(startDate, endDate)
  }

  @Roles(Role.ADMIN)
  @Query(() => PaymentDetail, { name: 'getPaymentDetail' })
  async getPaymentDetail(@Args('id', { type: () => String }) id: string): Promise<PaymentDetail> {
    return await this.dashboardService.getPaymentDetail(id)
  }

  @Query(() => [PaymentWithTransaction], { name: 'getMemberPaymentsWithTransactions' })
  @Roles(Role.MEMBER)
  async getMyPaymentsWithTransactions(@CurrentUser() user: UserType): Promise<PaymentWithTransaction[]> {
    return await this.dashboardService.getMemberPaymentsWithTransactions(user.id)
  }

  @Query(() => PaymentDetail, { name: 'getMemberPaymentDetail' })
  @Roles(Role.MEMBER)
  async getMyPaymentDetail(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: UserType,
  ): Promise<PaymentDetail> {
    return await this.dashboardService.getMemberPaymentDetail(id, user.id)
  }
}
