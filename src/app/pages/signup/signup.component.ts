import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MarketingApiService } from '../../services/marketing-api.service';

type SignupStatus = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly marketingApi = inject(MarketingApiService);
  private readonly router = inject(Router);

  protected readonly status = signal<SignupStatus>('idle');
  protected readonly statusMessage = signal('');
  protected readonly isSubmitting = computed(() => this.status() === 'submitting');

  protected readonly signupForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ()-]{10,20}$/)]],
    smsConsent: [false, [Validators.requiredTrue]],
  });

  ngOnInit(): void {
    if (localStorage.getItem('customer_signed_up') === 'true') {
      void this.router.navigate(['/deals']);
    }
  }

  protected submit(): void {
    this.signupForm.markAllAsTouched();

    if (this.signupForm.invalid || this.isSubmitting()) {
      return;
    }

    const { name, phone, smsConsent } = this.signupForm.getRawValue();
    const normalizedPhone = this.normalizePhone(phone);

    if (!normalizedPhone) {
      this.status.set('error');
      this.statusMessage.set('Please enter a valid 10-digit US phone number.');
      return;
    }

    this.status.set('submitting');
    this.statusMessage.set('');

    this.marketingApi
      .signupUser({
        name: name.trim(),
        phone: normalizedPhone,
        smsConsent,
      })
      .subscribe({
        next: (response) => {
          localStorage.setItem('customer_signed_up', 'true');
          localStorage.setItem('customer_phone', normalizedPhone);
          this.status.set('success');
          this.statusMessage.set(response.message || 'You are signed up. Check your phone for a text from us.');
          this.signupForm.reset({ name: '', phone: '', smsConsent: false });
          void this.router.navigate(['/deals']);
        },
        error: (error: Error) => {
          this.status.set('error');
          this.statusMessage.set(error.message);
        },
      });
  }

  protected hasError(controlName: 'name' | 'phone' | 'smsConsent'): boolean {
    const control = this.signupForm.controls[controlName];

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
