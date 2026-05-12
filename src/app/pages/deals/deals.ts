import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Deal } from '../../core/models/deal.model';
import { CampaignEntry, DealService } from '../../core/services/deal.service';

type DealsStatus = 'loading' | 'ready' | 'error';
type CampaignEntriesStatus = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-deals',
  imports: [RouterLink],
  templateUrl: './deals.html',
  styleUrl: './deals.scss',
})
export class DealsPage implements OnInit {
  private readonly dealService = inject(DealService);
  private readonly router = inject(Router);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  protected readonly deals = signal<Deal[]>([]);
  protected readonly status = signal<DealsStatus>('loading');
  protected readonly statusMessage = signal('');
  protected readonly customerPhone = signal<string | null>(null);
  protected readonly campaignEntries = signal<CampaignEntry[]>([]);
  protected readonly campaignEntriesStatus = signal<CampaignEntriesStatus>('idle');
  protected readonly campaignEntriesMessage = signal('');
  protected readonly totalCampaignEntries = computed(() =>
    this.campaignEntries().reduce((total, entry) => total + this.getCampaignEntryCount(entry), 0),
  );

  ngOnInit(): void {
    const phone = localStorage.getItem('customer_phone');
    this.customerPhone.set(phone);

    void this.loadDeals();

    if (phone) {
      void this.loadCustomerCampaignEntries(phone);
    }
  }

  protected formatPrice(price: number): string {
    return this.currencyFormatter.format(price);
  }

  protected resetCustomer(): void {
    localStorage.removeItem('customer_signed_up');
    localStorage.removeItem('customer_phone');
    void this.router.navigate(['/']);
  }

  protected getCampaignTitle(entry: CampaignEntry): string {
    return String(entry['campaign_name'] ?? entry['campaign_title'] ?? entry['name'] ?? 'Active campaign');
  }

  protected getPrizeName(entry: CampaignEntry): string {
    return String(entry['prize_name'] ?? entry['prize'] ?? entry['reward_name'] ?? 'Prize');
  }

  protected getCampaignEntryCount(entry: CampaignEntry): number {
    const value = entry['entries'] ?? entry['entry_count'] ?? entry['prize_entries'] ?? 0;
    return typeof value === 'number' ? value : Number(value) || 0;
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

  private async loadCustomerCampaignEntries(phone: string): Promise<void> {
    this.campaignEntriesStatus.set('loading');
    this.campaignEntriesMessage.set('');

    try {
      this.campaignEntries.set(await this.dealService.getCustomerActiveCampaignEntries(phone));
      this.campaignEntriesStatus.set('ready');
    } catch (error) {
      this.campaignEntriesStatus.set('error');
      this.campaignEntriesMessage.set(
        error instanceof Error ? error.message : 'Unable to load your prize entries',
      );
    }
  }
}
