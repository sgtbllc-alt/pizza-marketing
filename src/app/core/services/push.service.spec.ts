import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PushService } from './push.service';

const subscription = { toJSON: () => ({ endpoint: 'https://web.push.apple.com/test', keys: {} }), unsubscribe: vi.fn().mockResolvedValue(true) };
describe('PushService', () => {
  let service: PushService;
  let fetchMock: ReturnType<typeof vi.fn>;
  let requestSubscription: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('PushManager', class {});
    vi.stubGlobal('Notification', { permission: 'default' });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('navigator', { userAgent: 'Android', platform: 'Linux', maxTouchPoints: 1,
      serviceWorker: { ready: Promise.resolve({ active: {} }) } });
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ publicKey: 'public-key' }) });
    vi.stubGlobal('fetch', fetchMock);
    requestSubscription = vi.fn().mockResolvedValue(subscription);
    TestBed.configureTestingModule({ providers: [{ provide: SwPush, useValue: { isEnabled: true, subscription: of(null), requestSubscription } }] });
    service = TestBed.inject(PushService);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); TestBed.resetTestingModule(); });
  it('guides iPhone browser users to install without requesting permission', async () => {
    vi.stubGlobal('navigator', { userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 1 });
    expect(service.needsHomeScreen).toBe(true);
    await service.initialize();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(requestSubscription).not.toHaveBeenCalled();
  });
  it('recognizes an installed iPhone app', () => {
    vi.stubGlobal('navigator', { userAgent: 'iPhone', platform: 'iPhone', standalone: true });
    expect(service.needsHomeScreen).toBe(false);
  });
  it('requests permission synchronously from the tap, then saves the subscription', async () => {
    await service.initialize();
    const enabling = service.enable();
    expect(requestSubscription).toHaveBeenCalledWith({ serverPublicKey: 'public-key' });
    await enabling;
    expect(service.enabled()).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.action).toBe('subscribe');
    expect(body.deviceSecret.length).toBe(43);
    expect(body.subscription.endpoint).toContain('push.apple.com');
  });
  it('does not claim success if subscription storage fails', async () => {
    await service.initialize();
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Storage failed' }) });
    await service.enable();
    expect(service.enabled()).toBe(false);
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(service.message()).toContain('Storage failed');
  });
  it('handles denied permission without saving a subscription', async () => {
    await service.initialize();
    vi.stubGlobal('Notification', { permission: 'denied' });
    requestSubscription.mockRejectedValueOnce(new Error('denied'));
    await service.enable();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(service.message()).toContain('blocked');
  });
  it('keeps unsubscribe retryable when the server fails', async () => {
    await service.initialize(); await service.enable();
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Offline' }) });
    await service.disable();
    expect(service.enabled()).toBe(true);
    expect(service.message()).toBe('Offline');
  });
  it('sends the signup phone with the device so the admin can target one phone', async () => {
    localStorage.setItem('customer_phone', '+14085550123');
    await service.initialize();
    await service.enable();
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.phone).toBe('+14085550123');
  });
  it('sends no phone when this browser has not signed up', async () => {
    await service.initialize();
    await service.enable();
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.phone).toBeUndefined();
  });
});
