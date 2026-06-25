import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService) {}

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.configService.get<string>(key);
    if (!value && throwOnMissing) {
      throw new Error(`Missing ${key} from env`);
    }
    return value!;
  }

  getPort(): string {
    return this.getValue('PORT');
  }

  getCorsOrigins(): string[] {
    return this.getValue('CORS_ORIGIN')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  getAuthConfig() {
    return {
      supabase_url: this.getValue('SUPABASE_URL'),
      supabase_service_key: this.getValue('SUPABASE_SERVICE_ROLE_KEY'),
    };
  }

  isProduction(): boolean {
    return this.getValue('NODE_ENV', false) !== 'development';
  }

  getDBConfig() {
    return {
      type: 'postgres' as const,
      host: this.getValue('DB_HOST'),
      port: parseInt(this.getValue('DB_PORT'), 10),
      username: this.getValue('DB_USERNAME'),
      password: this.getValue('DB_PASSWORD'),
      database: this.getValue('DB_NAME'),
      autoLoadEntities: true,
      synchronize: !this.isProduction(),
    };
  }
}
