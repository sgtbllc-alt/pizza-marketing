import { Injectable } from '@angular/core';

import { AdminAuthService } from './admin-auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly addOrderUrl =
    'https://xnjofnibkiouqhkbqfqr.supabase.co/functions/v1/edge-add-order';

  constructor(private adminAuthService: AdminAuthService) {}

  async addOrder(phone: string, amount: number) {
    const token = await this.adminAuthService.getAccessToken();

    if (!token) {
      throw new Error('Admin is not logged in');
    }

    const response = await fetch(this.addOrderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone, amount }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to add order');
    }

    return result;
  }
}
