import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PushStatusService } from './push-status.service';

describe('PushStatusService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('records the server date and shows it while notifications are allowed', () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    const status = TestBed.inject(PushStatusService);

    status.record('2026-11-23T17:12:00Z');
    status.load();
    expect(status.enabledAt()).toBe('2026-11-23T17:12:00Z');
  });

  it('clears the date when the browser no longer allows notifications', () => {
    localStorage.setItem('mmk_push_enabled_at', '2026-11-23T17:12:00Z');
    vi.stubGlobal('Notification', { permission: 'denied' });
    const status = TestBed.inject(PushStatusService);

    status.load();
    expect(status.enabledAt()).toBeNull();
    expect(localStorage.getItem('mmk_push_enabled_at')).toBeNull();
  });

  it('gives a short device code', () => {
    localStorage.setItem('mmk_push_device', JSON.stringify({ deviceId: 'abcdef12-3456-4789-8abc-def012345678' }));
    expect(TestBed.inject(PushStatusService).deviceCode()).toBe('ABCDEF12');
  });
});
