import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Deal, DealInput } from '../../../core/models/deal.model';
import { DealService } from '../../../core/services/deal.service';

type AdminDealsStatus = 'idle' | 'loading' | 'saving' | 'error' | 'success';

@Component({
  selector: 'app-admin-deals',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './deals.html',
  styleUrl: './deals.scss',
})
export class AdminDeals implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dealService = inject(DealService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  protected readonly deals = signal<Deal[]>([]);
  protected readonly status = signal<AdminDealsStatus>('idle');
  protected readonly statusMessage = signal('');
  protected readonly editingDealId = signal<string | null>(null);
  protected readonly isDealModalOpen = signal(false);
  protected readonly isSaving = computed(() => this.status() === 'saving');

  protected readonly dealForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    original_price: [null as number | null, [Validators.min(0.01)]],
    discounted_price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    promo_code: [''],
    active: [true],
  });

  ngOnInit(): void {
    void this.loadDeals();
  }

  protected async submit(): Promise<void> {
    this.dealForm.markAllAsTouched();

    if (this.dealForm.invalid || this.isSaving()) {
      return;
    }

    this.status.set('saving');
    this.statusMessage.set('');

    try {
      const payload = this.buildDealInput();
      const editingId = this.editingDealId();

      if (editingId) {
        await this.dealService.updateDeal(editingId, payload);
        this.statusMessage.set('Deal updated.');
      } else {
        await this.dealService.addDeal(payload);
        this.statusMessage.set('Deal added.');
      }

      this.status.set('success');
      this.resetForm();
      this.isDealModalOpen.set(false);
      await this.loadDeals(false);
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Unable to save deal');
    }
  }

  protected openAddDealModal(): void {
    this.resetForm();
    this.status.set('idle');
    this.statusMessage.set('');
    this.isDealModalOpen.set(true);
  }

  protected editDeal(deal: Deal): void {
    this.editingDealId.set(deal.id);
    this.status.set('idle');
    this.statusMessage.set('');
    this.dealForm.setValue({
      title: deal.title,
      description: deal.description,
      original_price: deal.original_price,
      discounted_price: deal.discounted_price,
      promo_code: deal.promo_code ?? '',
      active: deal.active,
    });
    this.isDealModalOpen.set(true);
  }

  protected closeDealModal(): void {
    this.resetForm();
    this.isDealModalOpen.set(false);
    this.status.set('idle');
    this.statusMessage.set('');
  }

  protected async deleteDeal(deal: Deal): Promise<void> {
    if (!confirm(`Delete "${deal.title}"?`)) {
      return;
    }

    this.status.set('saving');
    this.statusMessage.set('');

    try {
      await this.dealService.deleteDeal(deal.id);
      this.status.set('success');
      this.statusMessage.set('Deal deleted.');
      await this.loadDeals(false);
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Unable to delete deal');
    }
  }

  protected async toggleActive(deal: Deal): Promise<void> {
    this.status.set('saving');
    this.statusMessage.set('');

    try {
      await this.dealService.toggleActive(deal);
      this.status.set('success');
      this.statusMessage.set(deal.active ? 'Deal hidden from customers.' : 'Deal made active.');
      await this.loadDeals(false);
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Unable to update deal');
    }
  }

  protected formatPrice(price: number | null): string {
    return price === null ? '-' : this.currencyFormatter.format(price);
  }

  protected hasError(controlName: keyof typeof this.dealForm.controls): boolean {
    const control = this.dealForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  private async loadDeals(showLoading = true): Promise<void> {
    if (showLoading) {
      this.status.set('loading');
    }

    try {
      this.deals.set(await this.dealService.getAllDeals());

      if (showLoading) {
        this.status.set('idle');
      }
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Unable to load deals');
    }
  }

  private resetForm(): void {
    this.editingDealId.set(null);
    this.dealForm.reset({
      title: '',
      description: '',
      original_price: null,
      discounted_price: null,
      promo_code: '',
      active: true,
    });
  }

  private buildDealInput(): DealInput {
    const raw = this.dealForm.getRawValue();
    const promoCode = raw.promo_code?.trim();

    return {
      title: raw.title?.trim() ?? '',
      description: raw.description?.trim() ?? '',
      original_price: this.toOptionalNumber(raw.original_price),
      discounted_price: this.toRequiredNumber(raw.discounted_price),
      promo_code: promoCode ? promoCode.toUpperCase() : null,
      active: raw.active ?? true,
    };
  }

  private toOptionalNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private toRequiredNumber(value: unknown): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }
}
