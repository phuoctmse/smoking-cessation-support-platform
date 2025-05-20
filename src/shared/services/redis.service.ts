import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import envConfig from '../config/config';

@Injectable()
export class RedisServices implements OnModuleInit {
    private client: RedisClientType;

    constructor() {
        this.client = createClient({
            url: envConfig.REDIS_URL
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });

        this.client.on('connect', () => {
            console.log('Connected to Redis');
        });
    }

    async onModuleInit() {
        await this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
            console.log('Successfully connected to Redis!');
        } catch (error) {
            console.error('Failed to connect to Redis', error);
            throw error;
        }
    }

    getClient(): RedisClientType {
        return this.client;
    }
}