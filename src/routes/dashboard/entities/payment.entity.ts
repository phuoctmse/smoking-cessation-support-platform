import { ObjectType, Field, Int, Float } from '@nestjs/graphql'
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client'
import { PaymentStatus } from 'src/shared/constants/payment.constant'

@ObjectType()
export class UserInfo {
  @Field()
  id: string

  @Field()
  name: string

  @Field()
  user_name: string

  @Field({ nullable: true })
  avatar_url?: string
}

@ObjectType()
export class MembershipPackageInfo {
  @Field()
  name: string

  @Field(() => [String])
  description: string[]

  @Field(() => Int, { nullable: true })
  price?: number

  @Field(() => Int, { nullable: true })
  duration_days?: number
}

@ObjectType()
export class SubscriptionInfo {
  @Field()
  id: string

  @Field(() => MembershipPackageInfo)
  package: MembershipPackageInfo
}

@ObjectType()
export class PaymentTransactionInfo {
  @Field()
  id: string

  @Field()
  sepay_id: string

  @Field()
  gateway: string

  @Field()
  transactionDate: Date

  @Field({ nullable: true })
  accountNumber?: string

  @Field({ nullable: true })
  subAccount?: string

  @Field(() => Int, { nullable: true })
  amountIn?: number

  @Field(() => Int, { nullable: true })
  amountOut?: number

  @Field(() => Int, { nullable: true })
  accumulated?: number

  @Field({ nullable: true })
  code?: string

  @Field({ nullable: true })
  transactionContent?: string

  @Field({ nullable: true })
  referenceNumber?: string

  @Field({ nullable: true })
  body?: string
}

// Entity tổng hợp cho Payment và Transaction
@ObjectType()
export class PaymentWithTransaction {
  @Field()
  id: string

  @Field()
  user_id: string

  @Field(() => UserInfo)
  user: UserInfo

  @Field()
  subscription_id: string

  @Field(() => SubscriptionInfo)
  subscription: SubscriptionInfo

  @Field({ nullable: true })
  content?: string

  @Field(() => Int, { nullable: true })
  price?: number

  @Field(() => PaymentStatus)
  status: PrismaPaymentStatus

  @Field(() => PaymentTransactionInfo, { nullable: true })
  payment_transaction?: PaymentTransactionInfo

  @Field({ nullable: true })
  payment_transaction_id?: string
}

@ObjectType()
export class PaymentDetail {
  @Field()
  id: string

  @Field()
  user_id: string

  @Field(() => UserInfo)
  user: UserInfo

  @Field()
  subscription_id: string

  @Field(() => SubscriptionInfo)
  subscription: SubscriptionInfo

  @Field({ nullable: true })
  content?: string

  @Field(() => Int, { nullable: true })
  price?: number

  @Field(() => PaymentStatus)
  status: PrismaPaymentStatus

  @Field(() => PaymentTransactionInfo, { nullable: true })
  payment_transaction?: PaymentTransactionInfo

  @Field()
  created_at: Date

  @Field({ nullable: true })
  updated_at?: Date

  // Thêm thông tin chi tiết
  @Field({ nullable: true })
  payment_method?: string

  @Field({ nullable: true })
  notes?: string
}
