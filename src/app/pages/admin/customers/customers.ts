import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CustomerAdminService, CustomerSummary } from '../../../core/services/customer-admin.service';

type CustomersStatus = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-customers',
  imports: [FormsModule, RouterLink],
  templateUrl: './customers.html',
  styleUrl: './customers.scss',
})
export class Customers implements OnInit {
  private readonly customerAdminService = inject(CustomerAdminService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  protected readonly customers = signal<CustomerSummary[]>([]);
  protected readonly status = signal<CustomersStatus>('loading');
  protected readonly statusMessage = signal('');
  protected readonly searchTerm = signal('');

  protected readonly filteredCustomers = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();

    if (!query) {
      return this.customers();
    }

    return this.customers().filter((customer) => {
      const name = customer.name?.toLowerCase() ?? '';
      const phone = customer.phone.toLowerCase();

      return name.includes(query) || phone.includes(query);
    });
  });

  ngOnInit(): void {
    void this.loadCustomers();
  }

  protected formatCurrency(value: number): string {
    return this.currencyFormatter.format(value ?? 0);
  }

  protected formatDate(value: string): string {
    return this.dateFormatter.format(new Date(value));
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  private async loadCustomers(): Promise<void> {
    this.status.set('loading');
    this.statusMessage.set('');

    try {
      this.customers.set(await this.customerAdminService.listCustomers());
      this.status.set('ready');
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Unable to load customers');
    }
  }
}
