import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Deal } from '../../../core/models/deal.model';
import {
  DealSmsDeal,
  DealSmsPayload,
  DealSmsResult,
  DealSmsService,
  RecipientMode,
} from '../../../core/services/deal-sms.service';

type DealMode = 'existing' | 'new';
type SendDealStatus = 'idle' | 'loading' | 'sending' | 'success' | 'error';

@Component({
  selector: 'app-send-deal',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './send-deal.html',
  styleUrl: './send-deal.scss',
})
export class SendDeal implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dealSmsService = inject(DealSmsService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  protected readonly deals = signal<Deal[]>([]);
  protected readonly status = signal<SendDealStatus>('loading');
  protected readonly statusMessage = signal('');
  protected readonly result = signal<DealSmsResult | null>(null);
  protected readonly isSending = computed(() => this.status() === 'sending');

  protected readonly smsForm = this.formBuilder.group({
    recipient_mode: ['all' as RecipientMode, [Validators.required]],
    phone: [''],
    deal_mode: ['existing' as DealMode, [Validators.required]],
    deal_id: [''],
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    promo_code: [''],
    original_price: [null as number | null, [Validators.min(0.01)]],
    discounted_price: [null as number | null, [Validators.min(0.01)]],
    active: [true],
    message: ['', [Validators.required]],
  });

  protected selectedDeal(): Deal | null {
    const selectedId = this.smsForm.controls.deal_id.value;

    return this.deals().find((deal) => deal.id === selectedId) ?? null;
  }

  ngOnInit(): void {
    this.smsForm.controls.deal_id.valueChanges.subscribe(() => this.syncMessagePreview());
    this.smsForm.controls.deal_mode.valueChanges.subscribe(() => this.syncMessagePreview());
    this.smsForm.controls.title.valueChanges.subscribe(() => this.syncMessagePreview());
    this.smsForm.controls.description.valueChanges.subscribe(() => this.syncMessagePreview());
    this.smsForm.controls.promo_code.valueChanges.subscribe(() => this.syncMessagePreview());
    this.smsForm.controls.discounted_price.valueChanges.subscribe(() => this.syncMessagePreview());
    void this.loadDeals();
  }

  protected dealMode(): DealMode {
    return this.smsForm.controls.deal_mode.value ?? 'existing';
  }

  protected recipientMode(): RecipientMode {
    return this.smsForm.controls.recipient_mode.value ?? 'all';
  }

  protected formatPrice(value: number | null | undefined): string {
    return value ? this.currencyFormatter.format(value) : '-';
  }

  protected async send(): Promise<void> {
    this.statusMessage.set('');
    this.result.set(null);

    if (!this.validateCurrentMode()) {
      return;
    }

    if (this.recipientMode() === 'all' && !confirm('Send this deal SMS to all opted-in customers?')) {
      return;
    }

    this.status.set('sending');

    try {
      this.result.set(await this.dealSmsService.sendDealSms(await this.buildPayload()));
      this.status.set('success');
      this.statusMessage.set('Deal SMS sent.');
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Unable to send deal SMS');
    }
  }

  private async loadDeals(): Promise<void> {
    this.status.set('loading');
    this.statusMessage.set('');

    try {
      const deals = await this.dealSmsService.listDeals();
      this.deals.set(deals);
      this.smsForm.patchValue({ deal_id: deals[0]?.id ?? '' });
      this.syncMessagePreview();
      this.status.set('idle');
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Unable to load deals');
    }
  }

  private validateCurrentMode(): boolean {
    const dealMode = this.dealMode();
    const recipientMode = this.recipientMode();

    if (recipientMode === 'single' && !this.normalizePhone(this.smsForm.controls.phone.value ?? '')) {
      this.status.set('error');
      this.statusMessage.set('Please enter a valid 10-digit US phone number.');
      return false;
    }

    if (dealMode === 'existing' && !this.smsForm.controls.deal_id.value) {
      this.status.set('error');
      this.statusMessage.set('Pick a deal to send.');
      return false;
    }

    if (dealMode === 'new') {
      this.smsForm.controls.title.markAsTouched();
      this.smsForm.controls.description.markAsTouched();

      if (this.smsForm.controls.title.invalid || this.smsForm.controls.description.invalid) {
        this.status.set('error');
        this.statusMessage.set('Enter a title and description for the deal.');
        return false;
      }
    }

    this.smsForm.controls.message.markAsTouched();

    if (this.smsForm.controls.message.invalid) {
      this.status.set('error');
      this.statusMessage.set('Enter the SMS message text.');
      return false;
    }

    return true;
  }

  private async buildPayload(): Promise<DealSmsPayload> {
    const raw = this.smsForm.getRawValue();
    const recipientMode = this.recipientMode();
    const payload: DealSmsPayload = {
      recipient_mode: recipientMode,
      message: raw.message?.trim() ?? '',
    };

    if (recipientMode === 'single') {
      payload.phone = this.normalizePhone(raw.phone ?? '') ?? undefined;
    }

    if (this.dealMode() === 'existing') {
      payload.deal_id = raw.deal_id ?? undefined;
      return payload;
    }

    const newDeal = await this.dealSmsService.createDeal(this.buildNewDealPayload());
    this.deals.update((deals) => [newDeal, ...deals]);
    this.smsForm.patchValue({ deal_mode: 'existing', deal_id: newDeal.id }, { emitEvent: false });

    payload.deal_id = newDeal.id;
    return payload;
  }

  private buildNewDealPayload(): DealSmsDeal {
    const raw = this.smsForm.getRawValue();

    return {
      title: raw.title?.trim() ?? '',
      description: raw.description?.trim() ?? '',
      promo_code: raw.promo_code?.trim() || undefined,
      original_price: this.toOptionalNumber(raw.original_price),
      discounted_price: this.toOptionalNumber(raw.discounted_price),
      active: raw.active ?? true,
    };
  }

  private syncMessagePreview(): void {
    this.smsForm.controls.message.setValue(this.buildDefaultMessage(), { emitEvent: false });
  }

  private buildDefaultMessage(): string {
    const deal = this.getPreviewDeal();

    if (!deal.title || !deal.description) {
      return '';
    }

    const priceText = deal.discounted_price ? ` Only ${this.formatPrice(deal.discounted_price)}.` : '';
    const promoText = deal.promo_code ? ` Use code ${deal.promo_code}.` : '';
    return `Mountain Mike's Pizza 🍕 ${deal.title}: ${deal.description}.${priceText}${promoText} Call 408-622-4755.`;
  }

  private getPreviewDeal(): {
    title: string;
    description: string;
    promo_code?: string | null;
    discounted_price?: number | null;
  } {
    if (this.dealMode() === 'existing') {
      const deal = this.selectedDeal();
      return {
        title: deal?.title ?? '',
        description: deal?.description ?? '',
        promo_code: deal?.promo_code,
        discounted_price: deal?.discounted_price,
      };
    }

    return {
      title: this.smsForm.controls.title.value?.trim() ?? '',
      description: this.smsForm.controls.description.value?.trim() ?? '',
      promo_code: this.smsForm.controls.promo_code.value?.trim() || null,
      discounted_price: this.toOptionalNumber(this.smsForm.controls.discounted_price.value),
    };
  }

  private toOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }

  private normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      return `+1${digits}`;
    }

    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    return null;
  }
}
