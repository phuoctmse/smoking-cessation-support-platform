import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'
import envConfig from '../config/config'

@Injectable()
export class RedisServices implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisServices.name)
  private static instance: RedisServices
  private static client: RedisClientType
  private static isConnected = false
  private static isInitialized = false
  private static instanceCount = 0

  constructor() {
    RedisServices.instanceCount++
    this.logger.log(`RedisServices constructor called. Instance count: ${RedisServices.instanceCount}`)
    
    // Singleton pattern to prevent multiple instances
    if (RedisServices.instance) {
      this.logger.warn('RedisServices already exists, returning existing instance')
      return RedisServices.instance
    }

    if (!RedisServices.isInitialized) {
      this.initializeClient()
      RedisServices.isInitialized = true
    }

    RedisServices.instance = this
    this.logger.log('New RedisServices instance created')
  }

  private initializeClient() {
    if (RedisServices.client) {
      this.logger.warn('Redis client already exists')
      return
    }

    RedisServices.client = createClient({
      url: envConfig.REDIS_URL,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis connection retries exceeded')
          }
          return Math.min(retries * 50, 500)
        },
      }
    })

    RedisServices.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err)
    })

    RedisServices.client.on('connect', () => {
      RedisServices.isConnected = true
      this.logger.log('Connected to Redis')
    })

    RedisServices.client.on('disconnect', () => {
      RedisServices.isConnected = false
      this.logger.log('Disconnected from Redis')
    })

    RedisServices.client.on('ready', () => {
      this.logger.log('Redis client is ready')
    })
  }

  async onModuleInit() {
    if (!RedisServices.isConnected && !RedisServices.client?.isOpen) {
      await this.connect()
    }
  }

  async onModuleDestroy() {
    if (RedisServices.isConnected && RedisServices.client?.isOpen) {
      await this.disconnect()
    }
  }

  async connect() {
    try {
      if (!RedisServices.client?.isOpen) {
        await RedisServices.client?.connect()
        this.logger.log('Successfully connected to Redis!')
      } else {
        this.logger.log('Redis already connected')
      }
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error)
      throw error
    }
  }

  async disconnect() {
    try {
      if (RedisServices.client?.isOpen) {
        await RedisServices.client.disconnect()
        this.logger.log('Successfully disconnected from Redis!')
        RedisServices.isConnected = false
      }
    } catch (error) {
      this.logger.error('Failed to disconnect from Redis', error)
    }
  }

  getClient(): RedisClientType {
    if (!RedisServices.client?.isOpen) {
      throw new Error('Redis client is not connected')
    }
    return RedisServices.client
  }

  isClientConnected(): boolean {
    return RedisServices.isConnected && RedisServices.client?.isOpen
  }
}
