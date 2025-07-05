import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../services/prisma.service';

export const createWebSocketContext = (
  supabase: SupabaseClient,
  prisma: PrismaService,
) => {
  return {
    async subscriptionContextBuilder(context: any) {
      const { connectionParams } = context;

      if (!connectionParams?.Authorization) {
        throw new Error('Missing auth token!');
      }

      const accessToken = connectionParams.Authorization.replace('Bearer ', '');

      try {
        // Verify token with Supabase
        const {
          data: { user: supabaseUser },
          error,
        } = await supabase.auth.getUser(accessToken);

        if (error || !supabaseUser) {
          throw new Error('Invalid or expired token');
        }

        // Get user role from your database using Prisma
        const userData = await prisma.user.findUnique({
          where: { id: supabaseUser.id },
          select: {
            id: true,
            role: true,
            status: true,
            name: true,
            user_name: true,
          },
        });

        if (!userData) {
          throw new Error('User not found in database');
        }

        // Return user object with same structure as HTTP context
        return {
          user: {
            user_id: supabaseUser.id,
            email: supabaseUser.email,
            role: userData.role,
            username: userData.user_name,
            name: userData.name,
            status: userData.status,
          }
        };
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        throw new Error('Authentication failed');
      }
    }
  };
}; 