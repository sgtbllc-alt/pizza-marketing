import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  protected readonly adminCards = [
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
