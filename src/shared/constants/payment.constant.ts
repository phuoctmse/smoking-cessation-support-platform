import { registerEnumType } from '@nestjs/graphql';

export const PaymentStatus = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
} as const;

export const TransferType = {
    IN: 'in',
    OUT: 'out',
} as const;

// Đăng ký các const objects như enum với GraphQL
registerEnumType(PaymentStatus, {
    name: 'PaymentStatus',
    description: 'The status of a payment',
});

registerEnumType(TransferType, {
    name: 'TransferType',
    description: 'The type of transfer',
});

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus]
export type TransferTypeType = (typeof TransferType)[keyof typeof TransferType]