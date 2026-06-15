import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import ws from 'ws';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | null = null;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      console.warn('[Supabase] No credentials configured');
      return;
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: ws as unknown as WebSocketLikeConstructor,
      },
    });
  }

  async verifyToken(
    token: string,
  ): Promise<{ user: { id: string; email?: string } } | { error: string }> {
    if (!this.client) return { error: 'Supabase not initialized' };
    try {
      const { data, error } = await this.client.auth.getUser(token);
      if (error || !data.user) {
        return { error: error?.message ?? 'Invalid token' };
      }
      return { user: { id: data.user.id, email: data.user.email } };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  get isEnabled(): boolean {
    return !!this.client;
  }
}
