import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { PushOptIn } from './push-opt-in';

async function render(showWhenOn = false): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [PushOptIn],
    providers: [{ provide: SwPush, useValue: { isEnabled: false, subscription: of(null) } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(PushOptIn);
  fixture.componentRef.setInput('showWhenOn', showWhenOn);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PushOptIn', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('isSecureContext', false);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the card while notifications are off', async () => {
    vi.stubGlobal('Notification', { permission: 'default' });
    const el = await render();
    expect(el.querySelector('[data-testid="push-opt-in"]')).not.toBeNull();
  });

  it('hides the card once notifications are on (customer pages)', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    localStorage.setItem('mmk_push_enabled_at', '2026-11-23T17:12:00Z');
    const el = await render();
    expect(el.querySelector('[data-testid="push-opt-in"]')).toBeNull();
  });

  it('keeps the card when asked to (admin send page)', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    localStorage.setItem('mmk_push_enabled_at', '2026-11-23T17:12:00Z');
    const el = await render(true);
    expect(el.querySelector('[data-testid="push-opt-in"]')).not.toBeNull();
  });
});
