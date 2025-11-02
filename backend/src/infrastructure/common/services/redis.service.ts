// src/common/services/redis.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Inicializar conexão com Redis na startup
   */
  async onModuleInit(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const redisConfig = this.configService.get('redis');

      const options: RedisOptions = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        host: redisConfig.host,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        port: redisConfig.port,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        db: redisConfig.db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (redisConfig.password) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        options.password = redisConfig.password;
      }

      this.client = new Redis(options);

      // Event handlers
      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('✅ Redis conectado com sucesso');
      });

      this.client.on('error', (err) => {
        this.logger.error('❌ Erro de conexão Redis:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.logger.warn('⚠️  Conexão Redis fechada');
        this.isConnected = false;
      });

      // Testar conexão
      await this.client.ping();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Falha ao conectar ao Redis:', error.message);
      throw error;
    }
  }

  /**
   * Fechar conexão ao destruir módulo
   */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis desconectado');
    }
  }

  /**
   * Obter valor do cache
   * @param key Chave
   * @returns Valor ou null
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn(
          `Redis não conectado. Retornando null para key: ${key}`,
        );
        return null;
      }

      const value = await this.client.get(key);

      if (!value) {
        return null;
      }

      // Tentar fazer parse como JSON
      try {
        return JSON.parse(value) as T;
      } catch {
        // Se não for JSON válido, retornar como string
        return value as unknown as T;
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao obter key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Definir valor no cache com TTL
   * @param key Chave
   * @param value Valor (objeto será convertido para JSON)
   * @param ttlSeconds TTL em segundos (opcional, usa default do config)
   */
  async set<T = any>(
    key: string,
    value: T,
    ttlSeconds: number = 0,
  ): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis não conectado. Não salvando key: ${key}`);
        return;
      }

      const serializedValue =
        typeof value === 'string' ? value : JSON.stringify(value);

      if (ttlSeconds > 0) {
        await this.client.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao definir key ${key}:`, error.message);
    }
  }

  /**
   * Definir valor sem expiração
   * @param key Chave
   * @param value Valor
   */
  async setPersistent<T = any>(key: string, value: T): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(
          `Redis não conectado. Não salvando key persistente: ${key}`,
        );
        return;
      }

      const serializedValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.set(key, serializedValue);
    } catch (error) {
      this.logger.error(
        `Erro ao definir key persistente ${key}:`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.message,
      );
    }
  }

  /**
   * Deletar valor do cache
   * @param key Chave
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis não conectado. Não deletando key: ${key}`);
        return;
      }

      await this.client.del(key);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao deletar key ${key}:`, error.message);
    }
  }

  /**
   * Deletar múltiplas chaves
   * @param keys Array de chaves
   */
  async deleteMany(keys: string[]): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis não conectado. Não deletando chaves');
        return;
      }

      if (keys.length === 0) return;
      await this.client.del(...keys);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Erro ao deletar múltiplas chaves:', error.message);
    }
  }

  /**
   * Verificar se chave existe
   * @param key Chave
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Erro ao verificar existência de ${key}:`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.message,
      );
      return false;
    }
  }

  /**
   * Incrementar valor (útil para contadores)
   * @param key Chave
   * @param increment Valor a incrementar (padrão: 1)
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis não conectado. Não incrementando key: ${key}`);
        return 0;
      }

      const result = await this.client.incrby(key, increment);
      return result;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao incrementar key ${key}:`, error.message);
      return 0;
    }
  }

  /**
   * Decrementar valor
   * @param key Chave
   * @param decrement Valor a decrementar (padrão: 1)
   */
  async decrement(key: string, decrement: number = 1): Promise<number> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis não conectado. Não decrementando key: ${key}`);
        return 0;
      }

      const result = await this.client.decrby(key, decrement);
      return result;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao decrementar key ${key}:`, error.message);
      return 0;
    }
  }

  /**
   * Obter TTL restante (em segundos)
   * @param key Chave
   * @returns TTL em segundos ou -1 (sem expiração) ou -2 (não existe)
   */
  async getTtl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -2;
      }

      return await this.client.ttl(key);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao obter TTL de ${key}:`, error.message);
      return -2;
    }
  }

  /**
   * Estender TTL de uma chave
   * @param key Chave
   * @param ttlSeconds Novo TTL em segundos
   */
  async extendTtl(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis não conectado. Não estendendo TTL de: ${key}`);
        return false;
      }

      const result = await this.client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao estender TTL de ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Obter todas as chaves que correspondem a padrão
   * ⚠️ Usar com cuidado em produção! Use SCAN em datasets grandes
   * @param pattern Padrão (ex: "user:*")
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      // Em produção, usar SCAN ao invés de KEYS para não bloquear Redis
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar chaves com padrão ${pattern}:`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.message,
      );
      return [];
    }
  }

  /**
   * Usar SCAN para iteração segura de chaves (não bloqueia Redis)
   * @param pattern Padrão
   * @param count Aproximação de chaves por iteração
   */
  async *scanKeys(
    pattern: string,
    count: number = 100,
  ): AsyncGenerator<string> {
    if (!this.isConnected) {
      return;
    }

    let cursor = '0';

    do {
      const [newCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      );

      cursor = newCursor;

      for (const key of keys) {
        yield key;
      }

      if (cursor === '0') {
        break;
      }
    } while (cursor !== '0');
  }

  /**
   * Limpar todas as chaves (cuidado!)
   */
  async flushAll(): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis não conectado. Não limpando DB');
        return;
      }

      await this.client.flushdb();
      this.logger.log('⚠️  Database Redis limpo');
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Erro ao limpar database Redis:', error.message);
    }
  }

  /**
   * Obter estatísticas do Redis
   */
  async getInfo(): Promise<any> {
    try {
      if (!this.isConnected) {
        return null;
      }

      const info = await this.client.info();
      return info;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Erro ao obter info do Redis:', error.message);
      return null;
    }
  }

  /**
   * Executar comando customizado direto no Redis
   */
  async executeCommand(command: string, ...args: any[]): Promise<any> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis não conectado');
        return null;
      }

      // Na versão mais recente do ioredis, o método correto é call()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.client.call(command, ...args);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao executar comando ${command}:`, error.message);
      return null;
    }
  }

  /**
   * Verificar se Redis está conectado
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Obter cliente Redis bruto (para operações avançadas)
   */
  getClient(): Redis {
    return this.client;
  }
}
