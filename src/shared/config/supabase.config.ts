import { createClient } from '@supabase/supabase-js'
import { Logger } from '@nestjs/common'
import envConfig from './config'

export const SupabaseConfigProvider = {
  provide: 'SUPABASE',
  useFactory: () => {
    const logger = new Logger('SupabaseConfig')

    const supabaseUrl = envConfig.SUPABASE_URL
    const supabaseKey = envConfig.SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    const client = createClient(supabaseUrl, supabaseKey)

    return client
  },
}