import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminAuthService } from '../../core/services/admin-auth.service';

type LoginStatus = 'idle' | 'submitting' | 'error';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
})
export class AdminLogin {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminAuthService = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly status = signal<LoginStatus>('idle');
  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = computed(() => this.status() === 'submitting');

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected async submit(): Promise<void> {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid || this.isSubmitting()) {
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.status.set('submitting');
    this.errorMessage.set('');

    try {
      await this.adminAuthService.login(email.trim(), password);
      await this.router.navigateByUrl('/admin/add-order');
    } catch (error) {
      this.status.set('error');
      this.errorMessage.set(error instanceof Error ? error.message : 'Login failed');
    }
  }

  protected hasError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }
}
