import { Injectable, OnModuleInit } from '@nestjs/common'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { EnvService } from '../../config/config.service'

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | null = null

  constructor(private readonly env: EnvService) {}

  onModuleInit() {
    const { supabase_url, supabase_service_key } = this.env.getAuthConfig()

    if (!supabase_url || !supabase_service_key) {
      console.warn('[Supabase] No credentials configured')
      return
    }

    this.client = createClient(supabase_url, supabase_service_key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  async verifyToken(token: string): Promise<
    | {
        user: { id: string; email?: string; emailVerified: boolean }
      }
    | { error: string }
  > {
    if (!this.client) return { error: 'Supabase not initialized' }
    try {
      const { data, error } = await this.client.auth.getUser(token)
      if (error || !data.user) {
        return { error: error?.message ?? 'Invalid token' }
      }
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailVerified: !!data.user.email_confirmed_at,
        },
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  }

  get isEnabled(): boolean {
    return !!this.client
  }
}
