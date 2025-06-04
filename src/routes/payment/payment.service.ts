import { Injectable } from "@nestjs/common";
import { PaymentRepo } from "./payment.repo";

@Injectable()
export class PaymentService {
    constructor(private readonly paymentRepo: PaymentRepo) { }
}

