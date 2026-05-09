import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MarketingApiService } from '../../services/marketing-api.service';

type SignupStatus = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly marketingApi = inject(MarketingApiService);

  protected readonly status = signal<SignupStatus>('idle');
  protected readonly statusMessage = signal('');
  protected readonly isSubmitting = computed(() => this.status() === 'submitting');

  protected readonly signupForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ()-]{10,20}$/)]],
    smsConsent: [false, [Validators.requiredTrue]],
  });

  protected submit(): void {
    this.signupForm.markAllAsTouched();

    if (this.signupForm.invalid || this.isSubmitting()) {
      return;
    }

    const { name, phone, smsConsent } = this.signupForm.getRawValue();

    this.status.set('submitting');
    this.statusMessage.set('');

    this.marketingApi
      .signupUser({
        name: name.trim(),
        phone: phone.trim(),
        smsConsent,
      })
      .subscribe({
        next: (response) => {
          this.status.set('success');
          this.statusMessage.set(response.message || 'You are signed up. Check your phone for a text from us.');
          this.signupForm.reset();
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
}
