import z from 'zod'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

config({
  path: '.env',
})
// Check if the .env file exists
if (!fs.existsSync(path.resolve('.env'))) {
  console.log('File .env not found')
  process.exit(1)
}

const configSchema = z.object({
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET_KEY: z.string(),
  REFRESH_TOKEN_SECRET_KEY: z.string(),
  ACCESS_TOKEN_EXPIRE_IN: z.string(),
  REFRESH_TOKEN_EXPIRE_IN: z.string(),
  COOKIES_MAX_AGE: z.string(),
  REDIS_URL: z.string(),
  TOKEN_BLACKLIST_PREFIX: z.string(),
  REFRESH_TOKEN_PREFIX: z.string(),
  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_BUCKET: z.string(),
  SUPABASE_ACCESS_KEY_ID: z.string(),
  SUPABASE_SECRET_ACCESS_KEY: z.string(),
  FRONTEND_URL: z.string(),
})

const configServer = configSchema.safeParse(process.env)

if (!configServer.success) {
  console.log('Environment variables are not valid')
  console.error(configServer.error)
  process.exit(1)
}

const envConfig = configServer.data

export default envConfig
