import { Component, afterNextRender, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { STORE } from '../core/data/store.data';
import { PushStatusService } from '../core/services/push-status.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="header-inner">
        <div class="brand">
          <span class="brand-row">
            <a class="brand-name" routerLink="/home">{{ store.name }}</a>
            @if (push.enabledAt()) {
              <a class="push-tick" routerLink="/notifications" data-testid="push-tick"
                aria-label="Notifications are on. See details" title="Notifications are on">✓</a>
            }
          </span>
          <span class="brand-address">{{ store.address }}</span>
        </div>
        <nav aria-label="Main navigation">
          <a routerLink="/home" routerLinkActive="active">Home</a>
          <a routerLink="/deals" routerLinkActive="active">Deals</a>
          <a routerLink="/blog" routerLinkActive="active">Blog</a>
          <a class="nav-order" [href]="store.orderUrl" target="_blank" rel="noopener">Order online</a>
        </nav>
      </div>
    </header>
  `,
  styles: `
    .site-header {
      background: #004438;
      color: #fff;
      padding: 12px 16px;
    }
    .header-inner {
      width: min(100%, 1120px);
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: grid;
      gap: 2px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .push-tick {
      display: inline-grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #2fb36d;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 900;
      line-height: 1;
      text-decoration: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
    }
    .brand-name {
      color: #fff;
      font-weight: 900;
      text-decoration: none;
    }
    .brand-address {
      color: #fff4d3;
      font-size: 0.82rem;
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    nav a {
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 0.9rem;
      font-weight: 800;
      text-decoration: none;
    }
    nav a.active {
      background: rgba(255, 255, 255, 0.14);
    }
    nav .nav-order {
      background: #f5d93f;
      border-color: #f5d93f;
      color: #004438;
    }
  `,
})
export class SiteHeader {
  protected readonly store = STORE;
  protected readonly push = inject(PushStatusService);

  constructor() {
    // Browser only (reads localStorage); pre-rendered pages show the tick after loading.
    afterNextRender(() => this.push.load());
  }
}
