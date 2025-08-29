import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DatabaseService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tableName: string) {
    const { data, error } = await this.supabaseService.client
      .from(tableName)
      .select('*');
    
    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findById(tableName: string, id: string) {
    const { data, error } = await this.supabaseService.client
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async create(tableName: string, payload: any) {
    const { data, error } = await this.supabaseService.client
      .from(tableName)
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(tableName: string, id: string, payload: any) {
    const { data, error } = await this.supabaseService.client
      .from(tableName)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async delete(tableName: string, id: string) {
    const { error } = await this.supabaseService.client
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Record deleted successfully' };
  }
}