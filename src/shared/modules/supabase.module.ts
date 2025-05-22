import { Module } from '@nestjs/common';
import { SupabaseConfigProvider } from '../config/supabase.config';
import { SupabaseStorageService } from '../services/supabase-storage.service';

@Module({
  providers: [SupabaseConfigProvider, SupabaseStorageService],
  exports: [SupabaseConfigProvider, SupabaseStorageService],
})
export class SupabaseModule {}