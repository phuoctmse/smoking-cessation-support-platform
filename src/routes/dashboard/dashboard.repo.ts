import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { DashboardStats, RevenueByMonth } from './entities/dashboard.entity'

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // Lấy tổng số user
    const totalUsers = await this.prisma.user.count({
      where: {
        status: 'ACTIVE'
      }
    })

    // Lấy tổng doanh thu từ bảng payment
    const revenueResult = await this.prisma.payment.aggregate({
      _sum: {
        price: true
      },
      where: {
        status: 'SUCCESS'
      }
    })

    // Lấy tổng số template kế hoạch cai thuốc
    const totalCessationTemplates = await this.prisma.cessationPlanTemplate.count({
      where: {
        is_active: true
      }
    })

    // Lấy tổng số coach
    const totalCoaches = await this.prisma.user.count({
      where: {
        role: 'COACH',
        status: 'ACTIVE'
      }
    })

    // Lấy đánh giá trung bình của các template
    const ratingResult = await this.prisma.cessationPlanTemplate.aggregate({
      _avg: {
        average_rating: true
      },
      where: {
        is_active: true
      }
    })

    return {
      totalUsers,
      totalRevenue: revenueResult._sum.price || 0,
      totalCessationTemplates,
      totalCoaches,
      averageTemplateRating: ratingResult._avg.average_rating || 0
    }
  }

  async getRevenueByMonth(year?: number): Promise<RevenueByMonth[]> {
    const currentYear = year || new Date().getFullYear()
    
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        payment_transaction: {
          transactionDate: {
            gte: new Date(`${currentYear}-01-01`),
            lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      include: {
        payment_transaction: true
      }
    })

    // Nhóm doanh thu theo tháng
    const revenueByMonth = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('en', { month: 'short' }),
      revenue: 0
    }))

    payments.forEach(payment => {
      if (payment.payment_transaction) {
        const month = payment.payment_transaction.transactionDate.getMonth()
        revenueByMonth[month].revenue += payment.price || 0
      }
    })

    return revenueByMonth
  }

  async getAllPaymentsWithTransactions() {
    return await this.prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            user_name: true,
            avatar_url: true
          }
        },
        subscription: {
          include: {
            package: {
              select: {
                name: true,
                description: true,
                price: true,
                duration_days: true
              }
            }
          }
        },
        payment_transaction: true
      },
      orderBy: {
        payment_transaction: {
          transactionDate: 'desc'
        }
      }
    })
  }

  async getPaymentDetail(paymentId: string) {
    return await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            user_name: true,
            avatar_url: true
          }
        },
        subscription: {
          include: {
            package: {
              select: {
                name: true,
                description: true,
                price: true,
                duration_days: true
              }
            }
          }
        },
        payment_transaction: true
      }
    })
  }

  async getPaymentById(id: string) {
    return await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            user_name: true,
            avatar_url: true,
            role: true
          }
        },
        subscription: {
          include: {
            package: {
              select: {
                name: true,
                description: true,
                price: true,
                duration_days: true
              }
            }
          }
        },
        payment_transaction: true
      }
    })
  }

  async getAllTransactions() {
    return await this.prisma.paymentTransaction.findMany({
      include: {
        Payment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                user_name: true
              }
            },
            subscription: {
              include: {
                package: {
                  select: {
                    name: true,
                    description: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        transactionDate: 'desc'
      }
    })
  }
}
