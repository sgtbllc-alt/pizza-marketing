import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { NotificationsPage } from './notifications';

async function render(): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [NotificationsPage],
    providers: [provideRouter([]), { provide: SwPush, useValue: { isEnabled: false, subscription: of(null) } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(NotificationsPage);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom has no secure-context flag; the opt-in card reads it to decide what to show.
    vi.stubGlobal('isSecureContext', false);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the date notifications were turned on', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    localStorage.setItem('mmk_push_enabled_at', '2026-11-23T17:12:00Z');
    const el = await render();

    expect(el.querySelector('[data-testid="push-status-on"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="push-enabled-date"]')?.textContent).toContain('November 23, 2026');
  });

  it('says notifications are off when there is no date', async () => {
    vi.stubGlobal('Notification', { permission: 'default' });
    const el = await render();
    expect(el.querySelector('[data-testid="push-status-off"]')).not.toBeNull();
  });
});
