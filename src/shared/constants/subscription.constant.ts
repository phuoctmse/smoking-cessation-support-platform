export const SubscriptionStatus = {
    Active: 'ACTIVE',
    Inactive: 'INACTIVE',
    Expired: 'EXPIRED',
} as const

export type SubscriptionStatusType = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

