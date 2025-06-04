import { Resolver } from "@nestjs/graphql";
import { PaymentService } from "./payment.service";

@Resolver()
export class PaymentResolver {
    constructor(private readonly paymentService: PaymentService) { }

    
}

