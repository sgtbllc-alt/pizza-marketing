import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { InstallService } from '../core/services/install.service';
import { PushService } from '../core/services/push.service';
import { PUSH_PROMPT_DISMISSED_KEY, PushPrompt } from './push-prompt';

function fakePush(overrides: Partial<Record<string, unknown>> = {}) {
  const enabled = signal(false);
  return {
    needsHomeScreen: false,
    supported: true,
    denied: false,
    enabled,
    ready: signal(true),
    busy: signal(false),
    message: signal(''),
    initialize: vi.fn().mockResolvedValue(undefined),
    enable: vi.fn().mockImplementation(async () => enabled.set(true)),
    ...overrides,
  };
}

function fakeInstaller(canInstall = false) {
  return { canInstall: signal(canInstall), installed: signal(false), install: vi.fn().mockResolvedValue(true) };
}

async function render(
  push: ReturnType<typeof fakePush>,
  installer = fakeInstaller(),
): Promise<{ el: HTMLElement; fixture: ComponentFixture<PushPrompt> }> {
  await TestBed.configureTestingModule({
    imports: [PushPrompt],
    providers: [
      { provide: PushService, useValue: push },
      { provide: InstallService, useValue: installer },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PushPrompt);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { el: fixture.nativeElement as HTMLElement, fixture };
}

describe('PushPrompt', () => {
  beforeEach(() => localStorage.clear());

  it('asks a newly signed-up customer and enables push from the button tap', async () => {
    localStorage.setItem('customer_signed_up', 'true');
    const push = fakePush();
    const { el, fixture } = await render(push);

    expect(el.querySelector('[data-testid="push-prompt"]')?.textContent).toContain('One tap to a FREE soda');

    el.querySelector<HTMLButtonElement>('[data-testid="push-prompt-enable"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(push.enable).toHaveBeenCalledTimes(1);
    expect(el.textContent).toContain('Your FREE soda is unlocked!');
  });

  it('shows Home Screen steps on iPhone Safari instead of asking for permission', async () => {
    localStorage.setItem('customer_signed_up', 'true');
    const push = fakePush({ needsHomeScreen: true });
    const { el } = await render(push);

    expect(el.textContent).toContain('3 steps to a FREE soda');
    expect(el.textContent).toContain('Add to Home Screen');
    expect(push.initialize).not.toHaveBeenCalled();
    expect(el.querySelector('[data-testid="push-prompt-enable"]')).toBeNull();
  });

  it('stays hidden for visitors who have not signed up', async () => {
    const { el } = await render(fakePush());
    expect(el.querySelector('[data-testid="push-prompt"]')).toBeNull();
  });

  it('stays hidden when push is already on or blocked', async () => {
    localStorage.setItem('customer_signed_up', 'true');
    const { el } = await render(fakePush({ enabled: signal(true) }));
    expect(el.querySelector('[data-testid="push-prompt"]')).toBeNull();

    TestBed.resetTestingModule();
    const blocked = await render(fakePush({ denied: true }));
    expect(blocked.el.querySelector('[data-testid="push-prompt"]')).toBeNull();
  });

  it('remembers "Not now" and does not ask again right away', async () => {
    localStorage.setItem('customer_signed_up', 'true');
    const { el, fixture } = await render(fakePush());

    const notNow = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Not now')!;
    notNow.click();
    fixture.detectChanges();

    expect(el.querySelector('[data-testid="push-prompt"]')).toBeNull();
    expect(localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY)).not.toBeNull();

    TestBed.resetTestingModule();
    const again = await render(fakePush());
    expect(again.el.querySelector('[data-testid="push-prompt"]')).toBeNull();
  });

  it('offers Install the app when the browser allows it, and hides it otherwise', async () => {
    localStorage.setItem('customer_signed_up', 'true');
    const installer = fakeInstaller(true);
    const { el } = await render(fakePush(), installer);

    const installButton = el.querySelector<HTMLButtonElement>('[data-testid="push-prompt-install"]');
    expect(installButton).not.toBeNull();
    installButton!.click();
    expect(installer.install).toHaveBeenCalledTimes(1);

    TestBed.resetTestingModule();
    const noInstall = await render(fakePush(), fakeInstaller(false));
    expect(noInstall.el.querySelector('[data-testid="push-prompt-install"]')).toBeNull();
  });
});
