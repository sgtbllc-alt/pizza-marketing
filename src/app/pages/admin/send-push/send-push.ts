import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PushService, PushResult } from '../../../core/services/push.service';
import { DealSmsService } from '../../../core/services/deal-sms.service';
import { Deal } from '../../../core/models/deal.model';
import { PushOptIn } from '../../../shared/push-opt-in';

@Component({
  selector: 'app-send-push',
  imports: [FormsModule, RouterLink, PushOptIn],
  template: `
    <main>
      <a routerLink="/admin">← Dashboard</a>
      <h1>Send push notification</h1>
      <p>Send an offer to devices that opted in. Tapping it opens today's deals.</p>
      <app-push-opt-in />
      <form (ngSubmit)="send('test')">
        <fieldset [disabled]="busy()">
          <label>Start with a deal (optional)
            <select name="deal" (change)="chooseDeal($any($event.target).value)">
              <option value="">Write your own message</option>
              @for (deal of deals(); track deal.id) { <option [value]="deal.id">{{ deal.title }}</option> }
            </select>
          </label>
          <label>Title <input name="title" [(ngModel)]="title" required maxlength="80" /></label>
          <label>Message <textarea name="message" [(ngModel)]="message" required maxlength="240" rows="4"></textarea></label>
          <section class="preview" aria-label="Notification preview"><strong>{{ title }}</strong><p>{{ message }}</p></section>
          <div class="actions">
            <button type="submit" [disabled]="!push.enabled()">Send test to this device</button>
            <button type="button" (click)="send('all')">Send to all subscribers</button>
          </div>
        </fieldset>
      </form>
      <p role="status">{{ status() }}</p>
    </main>
  `,
  styles: [`
    main { max-width:720px; margin:40px auto; padding:0 20px; color:#35271e; }
    h1 { font-size:2rem; } p { line-height:1.5; } fieldset { border:0; padding:0; }
    label { display:grid; gap:8px; margin:20px 0; font-weight:600; }
    input,textarea,select { box-sizing:border-box; width:100%; padding:12px; font:inherit; border:1px solid #cbb8a7; border-radius:8px; }
    .preview { background:#fff8ed; padding:20px; border-radius:12px; overflow-wrap:anywhere; }
    .actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:20px; }
    button { background:#a93224; color:white; border:0; border-radius:10px; padding:12px 18px; font:inherit; cursor:pointer; }
    button:disabled,fieldset:disabled { opacity:.6; }
  `],
})
export class SendPush implements OnInit {
  protected readonly push = inject(PushService);
  private readonly dealService = inject(DealSmsService);
  protected readonly deals = signal<Deal[]>([]);
  protected readonly busy = signal(false);
  protected readonly status = signal('');
  protected title = "Mountain Mike's Pizza";
  protected message = '';
  async ngOnInit() {
    try { this.deals.set(await this.dealService.listDeals()); }
    catch { this.status.set('Could not load deals. You can still write a notification.'); }
  }
  protected chooseDeal(id: string) {
    const deal = this.deals().find(d => d.id === id);
    if (!deal) return;
    this.title = deal.title.slice(0, 80);
    this.message = `${deal.description}${deal.promo_code ? ` Use code ${deal.promo_code}.` : ''}`.slice(0, 240);
  }
  protected async send(audience: 'test' | 'all') {
    if (this.busy()) return;
    if (!this.title.trim() || !this.message.trim()) { this.status.set('Enter a title and message.'); return; }
    if (audience === 'all' && !confirm('Send this notification to every subscribed device?')) return;
    const payload = { title: this.title.trim(), message: this.message.trim(), audience, campaignId: crypto.randomUUID() };
    this.busy.set(true);
    let sent = 0, failed = 0, expired = 0;
    let cursor: string | undefined;
    try {
      do {
        this.status.set(`Sending… ${sent} accepted by push services so far. Keep this page open.`);
        const result: PushResult = await this.push.send({ ...payload, cursor });
        sent += result.sent; failed += result.failed; expired += result.expired;
        cursor = result.nextCursor ?? undefined;
      } while (cursor);
      this.status.set(`${sent} accepted by push services, ${failed} failed, ${expired} expired subscriptions removed. Device delivery is not guaranteed.`);
    } catch (error) {
      this.status.set(`${error instanceof Error ? error.message : 'Sending failed.'} ${sent} accepted so far. Some requests may already have sent; check before sending again.`);
    } finally { this.busy.set(false); }
  }
}
