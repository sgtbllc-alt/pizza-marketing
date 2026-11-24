import { Routes } from '@angular/router';
import { SendPush } from './pages/admin/send-push/send-push';

import { LEGACY_REDIRECTS } from './core/data/legacy-urls.data';
import { adminAuthGuard } from './core/guards/admin-auth-guard';
import { Admin } from './pages/admin/admin';
import { AddOrder } from './pages/admin/add-order/add-order';
import { Customers } from './pages/admin/customers/customers';
import { AdminDeals } from './pages/admin/deals/deals';
import { SendDeal } from './pages/admin/send-deal/send-deal';
import { AdminLogin } from './pages/admin-login/admin-login';
import { DealsPage } from './pages/deals/deals';
import { SignupComponent } from './pages/signup/signup.component';

export const routes: Routes = [
  { path: 'admin/send-push', component: SendPush, canActivate: [adminAuthGuard] },
  { path: '', component: SignupComponent },
  { path: 'deals', component: DealsPage },
  { path: 'admin-login', component: AdminLogin },
  {
    path: 'admin',
    component: Admin,
    canActivate: [adminAuthGuard],
  },
  {
    path: 'admin/add-order',
    component: AddOrder,
    canActivate: [adminAuthGuard],
  },
  {
    path: 'admin/deals',
    component: AdminDeals,
    canActivate: [adminAuthGuard],
  },
  {
    path: 'admin/customers',
    component: Customers,
    canActivate: [adminAuthGuard],
  },
  {
    path: 'admin/send-deal',
    component: SendDeal,
    canActivate: [adminAuthGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog').then((m) => m.BlogPage),
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog-post/blog-post').then((m) => m.BlogPostPage),
  },
  // Old WordPress addresses → new pages.
  ...Object.entries(LEGACY_REDIRECTS).map(([path, target]) => ({
    path,
    redirectTo: target,
    pathMatch: 'full' as const,
  })),
  {
    path: '**',
    redirectTo: '',
  },
];
