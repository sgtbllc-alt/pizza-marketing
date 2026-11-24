import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { STORE } from '../core/data/store.data';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <address>
        <strong>{{ store.name }}</strong>
        <span>{{ store.address }}</span>
        <a [href]="store.phoneHref">{{ store.phoneDisplay }}</a>
      </address>
      <div class="links">
        <a routerLink="/deals">See today's deals</a>
        <a routerLink="/blog">Read our blog</a>
      </div>
      <small>© {{ year }} {{ store.name }}</small>
    </footer>
  `,
  styles: `
    .site-footer {
      display: grid;
      gap: 10px;
      justify-items: center;
      padding: 28px 16px;
      background: #004438;
      color: #fff4d3;
      text-align: center;
    }
    address {
      display: grid;
      gap: 4px;
      font-style: normal;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    }
    a {
      color: #f5d93f;
      font-weight: 800;
    }
  `,
})
export class SiteFooter {
  protected readonly store = STORE;
  protected readonly year = new Date().getFullYear();
}
