import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { InstallService } from './install.service';

function installEvent(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  return event;
}

describe('InstallService', () => {
  it('keeps the browser install offer and shows it on request', async () => {
    const service = TestBed.inject(InstallService);
    service.listen();
    expect(service.canInstall()).toBe(false);

    const event = installEvent('accepted');
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(service.canInstall()).toBe(true);

    await expect(service.install()).resolves.toBe(true);
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(service.canInstall()).toBe(false);
    expect(service.installed()).toBe(true);
  });

  it('does nothing when the browser has not offered install', async () => {
    const service = TestBed.inject(InstallService);
    await expect(service.install()).resolves.toBe(false);
  });

  it('picks up an offer that arrived before the app started', () => {
    const early = installEvent('accepted');
    (window as Window & { __mmkInstallPrompt?: unknown }).__mmkInstallPrompt = early;
    const service = TestBed.inject(InstallService);
    service.listen();
    expect(service.canInstall()).toBe(true);
    (window as Window & { __mmkInstallPrompt?: unknown }).__mmkInstallPrompt = undefined;
  });
});
