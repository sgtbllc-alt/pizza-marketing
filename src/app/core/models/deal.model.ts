export interface Deal {
  id: string;
  title: string;
  description: string;
  original_price: number | null;
  discounted_price: number;
  promo_code: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export type DealInput = Omit<Deal, 'id' | 'created_at' | 'updated_at'>;
