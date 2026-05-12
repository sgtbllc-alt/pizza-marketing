import { Injectable } from '@angular/core';

import { supabase } from '../supabase.client';

export interface CustomerSummary {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  total_orders: number;
  total_spend: number;
  total_entries: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerAdminService {
  async listCustomers(): Promise<CustomerSummary[]> {
    const { data, error } = await supabase
      .from('customer_summary')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }
}
