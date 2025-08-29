import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async validateUser(token: string) {
    const { data, error } = await this.supabaseService.client.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }

    return data.user;
  }
}