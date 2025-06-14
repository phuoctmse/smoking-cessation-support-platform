import { Injectable } from "@nestjs/common";
import { SubscriptionRepo } from "./subscription.repo";
import { CreateSubscriptionSchemaType } from "./schema/create-subscription.schema";
import { UpdateSubscriptionInput } from "./dto/request/update-subscription.input";
import { UpdateSubscriptionSchemaType } from "./schema/update-subscription.schema";
import { start } from "node:repl";

@Injectable()
export class SubscriptionService {
    constructor(private readonly subscriptionRepo: SubscriptionRepo) { }

    async createSubscription(input: CreateSubscriptionSchemaType) {
        const start_date = new Date()
        //call cache on Redis to get duration days
        // const end_date = new Date(start_date.getTime() + input.package_id.duration_days * 24 * 60 * 60 * 1000)
        const end_date = new Date(start_date.getTime() + 30 * 24 * 60 * 60 * 1000) //test end date
        input.start_date = start_date
        input.end_date = end_date
        const subscription = await this.subscriptionRepo.create(input)
        return subscription
    }

    //start date will start when transaction is successful
    //then set end date based on package
    async updateSubscription(id: string, input: UpdateSubscriptionSchemaType) {
        const subscription = await this.subscriptionRepo.update(id, input)
        return subscription
    }

    async getUserSubscription(user_id: string) {
        const subscription = await this.subscriptionRepo.getUserSubscription(user_id)
        return subscription
    }
}

