import { Module } from '@nestjs/common';
import { BadgeTypeService } from './badge-type.service';
import { BadgeTypeResolver } from './badge-type.resolver';
import {GuardModule} from "../../shared/guards/guard.module";
import {SupabaseModule} from "../../shared/modules/supabase.module";
import {BadgeTypeRepository} from "./badge-type.repository";

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [BadgeTypeResolver, BadgeTypeService, BadgeTypeRepository],
  exports: [BadgeTypeService, BadgeTypeRepository],
})
export class BadgeTypeModule {}
