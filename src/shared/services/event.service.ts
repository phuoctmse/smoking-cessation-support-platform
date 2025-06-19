import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentType } from 'src/routes/payment/schema/payment.schema';

@Injectable()
export class EventService {
    constructor(private eventEmitter: EventEmitter2) {}

    async emitPaymentEvent(payment: PaymentType) {
        return this.eventEmitter.emit('payment.processed', payment);
    }

    async onPaymentProcessed(callback: (payment: PaymentType) => Promise<void>) {
        this.eventEmitter.on('payment.processed', callback);
    }
} 