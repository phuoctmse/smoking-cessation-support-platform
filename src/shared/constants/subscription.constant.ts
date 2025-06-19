import { registerEnumType } from "@nestjs/graphql";

export const SubscriptionStatus = {
    Active: 'ACTIVE',
    Inactive: 'INACTIVE',
    Expired: 'EXPIRED',
} as const

registerEnumType(SubscriptionStatus, {
    name: 'SubscriptionStatus',
    description: 'The status of a subscription',
});

export type SubscriptionStatusType = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

