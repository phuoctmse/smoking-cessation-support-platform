import { createClient } from '@supabase/supabase-js';
import { Logger } from '@nestjs/common';

export const SupabaseConfigProvider = {
  provide: 'SUPABASE',
  useFactory: () => {
    const logger = new Logger('SupabaseConfig');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    logger.log(`Initializing Supabase client with URL: ${supabaseUrl}`);

    const client = createClient(supabaseUrl, supabaseKey);

    // Test the connection
    client.auth.getSession().then(
      () => logger.log('Successfully connected to Supabase'),
      (err) => logger.error(`Failed to connect to Supabase: ${err.message}`)
    );

    return client;
  },
};