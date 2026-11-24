import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { STORE } from '../core/data/store.data';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="header-inner">
        <div class="brand">
          <a class="brand-name" routerLink="/home">{{ store.name }}</a>
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
}
