import { Injectable } from '@angular/core';

import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async logout() {
    await supabase.auth.signOut();
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}
