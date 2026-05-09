import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Deal } from '../../core/models/deal.model';
import { DealService } from '../../core/services/deal.service';

type DealsStatus = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-deals',
  imports: [RouterLink],
  templateUrl: './deals.html',
  styleUrl: './deals.scss',
})
export class DealsPage implements OnInit {
  private readonly dealService = inject(DealService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  protected readonly deals = signal<Deal[]>([]);
  protected readonly status = signal<DealsStatus>('loading');
  protected readonly statusMessage = signal('');

  ngOnInit(): void {
    void this.loadDeals();
  }

  protected formatPrice(price: number): string {
    return this.currencyFormatter.format(price);
  }

  private async loadDeals(): Promise<void> {
    this.status.set('loading');
    this.statusMessage.set('');

    try {
      this.deals.set(await this.dealService.getActiveDeals());
      this.status.set('ready');
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Unable to load deals');
    }
  }
}
