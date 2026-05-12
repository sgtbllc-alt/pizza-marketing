import { Injectable } from '@angular/core';

import { Deal } from '../models/deal.model';
import { supabase } from '../supabase.client';

export type RecipientMode = 'all' | 'single';

export interface DealSmsDeal {
  title: string;
  description: string;
  promo_code?: string;
  original_price?: number;
  discounted_price?: number;
  active?: boolean;
}

export interface DealSmsPayload {
  deal_id?: string;
  deal?: DealSmsDeal;
  recipient_mode: RecipientMode;
  phone?: string;
  message?: string;
}

export interface DealSmsResult {
  total_sent: number;
  total_failed: number;
  errors?: string[];
}

@Injectable({ providedIn: 'root' })
export class DealSmsService {
  private readonly sendDealSmsUrl = 'https://xnjofnibkiouqhkbqfqr.supabase.co/functions/v1/send-deal-sms';

  async listDeals(): Promise<Deal[]> {
    const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async createDeal(deal: DealSmsDeal): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .insert({
        title: deal.title,
        description: deal.description,
        promo_code: deal.promo_code ?? null,
        original_price: deal.original_price ?? null,
        discounted_price: deal.discounted_price ?? null,
        active: deal.active ?? true,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async sendDealSms(payload: DealSmsPayload): Promise<DealSmsResult> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      throw new Error('Admin is not logged in');
    }

    const response = await fetch(this.sendDealSmsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send deal SMS');
    }

    return {
      total_sent: result.total_sent ?? 0,
      total_failed: result.total_failed ?? 0,
      errors: result.errors ?? [],
    };
  }
}
