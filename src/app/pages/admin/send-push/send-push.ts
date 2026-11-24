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
      <p>Send an offer to devices that opted in. Tapping it opens the deal you pick below, or today's deals.</p>
      <app-push-opt-in [showWhenOn]="true" />
      <form (ngSubmit)="send('test')">
        <fieldset [disabled]="busy()">
          <label>Start with a deal (optional)
            <select name="deal" [value]="dealId" (change)="chooseDeal($any($event.target).value)">
              <option value="">Write your own message</option>
              @for (deal of deals(); track deal.id) { <option [value]="deal.id">{{ deal.title }}</option> }
            </select>
          </label>
          <label>Title <input name="title" [(ngModel)]="title" required maxlength="80" /></label>
          <label>Message <textarea name="message" [(ngModel)]="message" required maxlength="240" rows="4"></textarea></label>
          <p class="tap-note">When tapped, opens:
            <strong>@if (dealId) { this deal’s page } @else { today’s deals page }</strong></p>
          <label class="check">
            <input type="checkbox" name="callButton" [(ngModel)]="callButton" />
            Add a "Call us" button (shows on Android and computers; iPhones don't show buttons)
          </label>
          <section class="preview" aria-label="Notification preview"><strong>{{ title }}</strong><p>{{ message }}</p></section>
          <section class="one-target" aria-label="Send to one phone">
            <label>Send to one phone (testing)
              <input name="target" [(ngModel)]="target" placeholder="Phone number or device code, e.g. (408) 555-0123 or A1B2C3D4"
                autocomplete="off" />
            </label>
            <p class="hint">Phone number: works for people who signed up and turned on notifications in the same browser.
              Device code: shown on the customer's green ✓ page; use it for iPhone Home Screen apps.</p>
            <button type="button" class="secondary" data-testid="send-one" (click)="send('one')">Send to this phone only</button>
          </section>
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
    label.check { display:flex; align-items:center; gap:10px; font-weight:500; }
    label.check input { width:auto; }
    .tap-note { margin:0; color:#594c46; }
    .one-target { margin:20px 0; padding:16px; border:1px dashed #cbb8a7; border-radius:12px; }
    .one-target label { margin:0 0 8px; }
    .hint { margin:0 0 12px; color:#7b6b63; font-size:.85rem; }
    button.secondary { background:#004438; }
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
  protected dealId = '';
  protected callButton = false;
  protected target = '';
  async ngOnInit() {
    try { this.deals.set(await this.dealService.listDeals()); }
    catch { this.status.set('Could not load deals. You can still write a notification.'); }
  }
  protected chooseDeal(id: string) {
    const deal = this.deals().find(d => d.id === id);
    this.dealId = deal?.id ?? '';
    if (!deal) return;
    this.title = deal.title.slice(0, 80);
    this.message = `${deal.description}${deal.promo_code ? ` Use code ${deal.promo_code}.` : ''}`.slice(0, 240);
  }
  protected async send(audience: 'test' | 'all' | 'one') {
    if (this.busy()) return;
    if (!this.title.trim() || !this.message.trim()) { this.status.set('Enter a title and message.'); return; }
    if (audience === 'all' && !confirm('Send this notification to every subscribed device?')) return;
    let target: string | undefined;
    if (audience === 'one') {
      target = normalizeTarget(this.target) ?? undefined;
      if (!target) { this.status.set('Enter a 10-digit phone number or an 8-character device code.'); return; }
    }
    const payload = { title: this.title.trim(), message: this.message.trim(), audience, campaignId: crypto.randomUUID(),
      ...(this.dealId ? { dealId: this.dealId } : {}), callButton: this.callButton, ...(target ? { target } : {}) };
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

/** Phone → +1XXXXXXXXXX; device code → 8 hex characters; otherwise null. */
export function normalizeTarget(value: string): string | null {
  const trimmed = value.trim();
  if (/^[0-9a-f]{8}$/i.test(trimmed) && /[a-f]/i.test(trimmed)) return trimmed.toUpperCase();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (/^[0-9a-f]{8}$/i.test(trimmed)) return trimmed.toUpperCase();
  return null;
}
