import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { BlacklistGuard } from "./blacklist.guard";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('SUPABASE') private supabase: SupabaseClient,
    private readonly blacklistGuard: BlacklistGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

      // Get the session from Supabase
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    if (error || !session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Get user metadata which contains role
    const user = session.user;
    const userRole = user.user_metadata?.role;

    if (!userRole) {
      throw new UnauthorizedException('User role not found');
    }
    // Add user info to request
    request.user = {
      user_id: user.id,
      email: user.email,
      role: userRole,
    };

    return true;
  }
}