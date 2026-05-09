import { Injectable } from '@angular/core';

import { Deal, DealInput } from '../models/deal.model';
import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class DealService {
  private readonly tableName = 'deals';

  async getActiveDeals(): Promise<Deal[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getAllDeals(): Promise<Deal[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async addDeal(deal: DealInput): Promise<Deal> {
    const { data, error } = await supabase.from(this.tableName).insert(deal).select('*').single();

    if (error) throw error;
    return data;
  }

  async updateDeal(id: string, deal: Partial<DealInput>): Promise<Deal> {
    const { data, error } = await supabase.from(this.tableName).update(deal).eq('id', id).select('*').single();

    if (error) throw error;
    return data;
  }

  async deleteDeal(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);

    if (error) throw error;
  }

  async toggleActive(deal: Deal): Promise<Deal> {
    return this.updateDeal(deal.id, { active: !deal.active });
  }
}
