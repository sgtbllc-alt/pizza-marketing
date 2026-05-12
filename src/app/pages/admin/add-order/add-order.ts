import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OrderService } from '../../../core/services/order.service';

type AddOrderStatus = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-add-order',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-order.html',
  styleUrl: './add-order.scss',
})
export class AddOrder {
  private readonly formBuilder = inject(FormBuilder);
  private readonly orderService = inject(OrderService);

  protected readonly status = signal<AddOrderStatus>('idle');
  protected readonly statusMessage = signal('');
  protected readonly isSubmitting = computed(() => this.status() === 'submitting');

  protected readonly orderForm = this.formBuilder.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ()-]{10,20}$/)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
  });

  protected async submit(): Promise<void> {
    this.orderForm.markAllAsTouched();

    if (this.orderForm.invalid || this.isSubmitting()) {
      return;
    }

    const { phone, amount } = this.orderForm.getRawValue();
    const normalizedPhone = this.normalizePhone(phone);

    if (!normalizedPhone) {
      this.status.set('error');
      this.statusMessage.set('Please enter a valid 10-digit US phone number.');
      return;
    }

    this.status.set('submitting');
    this.statusMessage.set('');

    try {
      await this.orderService.addOrder(normalizedPhone, amount);
      this.status.set('success');
      this.statusMessage.set('Order added successfully.');
      this.orderForm.reset();
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Failed to add order');
    }
  }

  protected hasError(controlName: 'phone' | 'amount'): boolean {
    const control = this.orderForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
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
