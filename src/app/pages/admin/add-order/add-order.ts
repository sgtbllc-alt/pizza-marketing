import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { OrderService } from '../../../core/services/order.service';

type AddOrderStatus = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-add-order',
  imports: [ReactiveFormsModule],
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

    this.status.set('submitting');
    this.statusMessage.set('');

    try {
      await this.orderService.addOrder(phone.trim(), amount);
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
}
