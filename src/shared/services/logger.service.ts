import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import Transport from 'winston-transport';
import * as net from 'net';

interface LogstashTransportOptions extends Transport.TransportStreamOptions {
  host?: string;
  port?: number;
  reconnectInterval?: number;
}

class LogstashTransport extends Transport {
  private client: net.Socket | null = null;
  private isConnecting = false;
  private host: string;
  private port: number;
  private reconnectInterval: number;

  constructor(options: LogstashTransportOptions = {}) {
    super(options);
    this.host = options.host || 'localhost';
    this.port = options.port || 5000;
    this.reconnectInterval = options.reconnectInterval || 5000;
  }

  private async ensureConnection() {
    if (this.client?.writable) return;
    if (this.isConnecting) return;

    try {
      this.isConnecting = true;
      this.client = new net.Socket();

      await new Promise<void>((resolve, reject) => {
        this.client!.connect(this.port, this.host, () => {
          console.log('Connected to Logstash');
          resolve();
        });

        this.client!.on('error', (err) => {
          console.error('Logstash connection error:', err);
          reject(err);
        });

        this.client!.on('close', () => {
          console.log('Connection to Logstash closed');
          this.client = null;
          setTimeout(() => this.ensureConnection(), this.reconnectInterval);
        });
      });
    } catch (error) {
      console.error('Failed to connect to Logstash:', error);
      this.client = null;
    } finally {
      this.isConnecting = false;
    }
  }

  async log(info: any, callback: () => void) {
    try {
      await this.ensureConnection();

      const payload = {
        ...info,
        type: 'nestjs',
        timestamp: new Date().toISOString(),
      };

      if (this.client?.writable) {
        this.client.write(JSON.stringify(payload) + '\n');
      }
    } catch (error) {
      console.error('Error sending log to Logstash:', error);
    } finally {
      callback();
    }
  }
}

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
        new LogstashTransport({
          level: 'info',
          host: process.env.LOGSTASH_HOST || 'localhost',
          port: parseInt(process.env.LOGSTASH_PORT || '5000', 10),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
} 