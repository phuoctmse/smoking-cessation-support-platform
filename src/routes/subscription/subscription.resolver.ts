import { Resolver, Query, Args, Mutation } from "@nestjs/graphql";
import { SubscriptionService } from "./subscription.service";
import { Subscription } from "./entities/subscription.entity";
import { CreateSubscriptionInput } from "./dto/request/create-subscription.input";
import { RolesGuard } from "src/shared/guards/roles.guard";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { UseGuards } from "@nestjs/common";
import { Roles } from "src/shared/decorators/roles.decorator";
import { RoleName } from "src/shared/constants/role.constant";
import { UpdateSubscriptionInput } from "./dto/request/update-subscription.input";

@Resolver()
export class SubscriptionResolver {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    @UseGuards(JwtAuthGuard)
    @Query(() => Subscription)
    async getUserSubscription(@Args('user_id') user_id: string) {
        return this.subscriptionService.getUserSubscription(user_id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleName.Admin)
    @Mutation(() => Subscription)
    async createSubscription(@Args('input') input: CreateSubscriptionInput) {
        return this.subscriptionService.createSubscription(input);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleName.Admin)
    @Mutation(() => Subscription)
    async updateSubscription(@Args('id') id: string, @Args('input') input: UpdateSubscriptionInput) {
        return this.subscriptionService.updateSubscription(id, input);
    }

}

