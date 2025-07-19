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
        const subscription = await this.subscriptionRepo.create(input)
        return subscription
    }

    //start date will start when transaction is successful
    //then set end date based on package
    async updateSubscription(input: UpdateSubscriptionSchemaType) {
        const subscription = await this.subscriptionRepo.update(input)
        return subscription
    }

    async getUserSubscription(user_id: string) {
        const subscriptions = await this.subscriptionRepo.getUserSubscription(user_id)
        return subscriptions || [];
    }
}

