import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin',
  imports: [RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);

  protected async logout(): Promise<void> {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    try {
      await this.adminAuth.logout();
    } finally {
      // Leave the admin area even if the network call fails; the guard re-checks the session.
      this.loggingOut.set(false);
      void this.router.navigate(['/admin-login']);
    }
  }

  protected readonly adminCards = [
    { title: 'Send push notification', description: 'Send pizza offers to subscribed devices.', link: '/admin/send-push', action: 'Send notification' },
    {
      title: 'Add order',
      description: 'Attach a new order total to a customer phone number.',
      link: '/admin/add-order',
      action: 'Add order',
    },
    {
      title: 'Deals',
      description: 'Review the active customer-facing offers.',
      link: '/admin/deals',
      action: 'View deals',
    },
    {
      title: 'All Customers',
      description: 'View signed-up customers, orders, and entries.',
      link: '/admin/customers',
      action: 'View customers',
    },
    {
      title: 'Send Deal SMS',
      description: 'Pick or create a deal and send it to customers by SMS.',
      link: '/admin/send-deal',
      action: 'Send SMS',
    },
  ];
}
