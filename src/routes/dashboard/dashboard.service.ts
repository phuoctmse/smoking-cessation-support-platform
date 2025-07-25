import { Injectable } from '@nestjs/common'
import { DashboardRepository } from './dashboard.repo'
import { DashboardMetrics } from './entities/dashboard.entity'
import { PaymentWithTransaction, PaymentDetail } from './entities/payment.entity'

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepo: DashboardRepository) {}

  async getDashboardMetrics(year?: number): Promise<DashboardMetrics> {
    const [stats, revenueByMonth] = await Promise.all([
      this.dashboardRepo.getDashboardStats(),
      this.dashboardRepo.getRevenueByMonth(year)
    ])

    return {
      stats,
      revenueByMonth
    }
  }

  async getAllPaymentsWithTransactions(): Promise<PaymentWithTransaction[]> {
    const payments = await this.dashboardRepo.getAllPaymentsWithTransactions()
    
    return payments.map(payment => ({
      id: payment.id,
      user_id: payment.user_id,
      user: payment.user,
      subscription_id: payment.subscription_id,
      subscription: payment.subscription,
      content: payment.content,
      price: payment.price,
      status: payment.status,
      payment_transaction: payment.payment_transaction,
      payment_transaction_id: payment.payment_transaction_id
    }))
  }

  async getPaymentDetail(id: string): Promise<PaymentDetail> {
    const payment = await this.dashboardRepo.getPaymentDetail(id)
    if (!payment) {
      throw new Error('Payment not found')
    }
    
    return {
      id: payment.id,
      user_id: payment.user_id,
      user: payment.user,
      subscription_id: payment.subscription_id,
      subscription: payment.subscription,
      content: payment.content,
      price: payment.price,
      status: payment.status,
      payment_transaction: payment.payment_transaction,
      created_at: payment.payment_transaction?.transactionDate || new Date(),
      updated_at: payment.payment_transaction?.transactionDate || new Date(),
      payment_method: payment.payment_transaction?.gateway || null,
      notes: null
    }
  }
}
