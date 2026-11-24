import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { UpdateBanner } from './update-banner';

describe('UpdateBanner', () => {
  it('shows Refresh when a new version is ready', async () => {
    const versionUpdates = new Subject<VersionEvent>();
    const updates = {
      isEnabled: true,
      versionUpdates,
      unrecoverable: new Subject(),
      checkForUpdate: vi.fn().mockResolvedValue(true),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };
    await TestBed.configureTestingModule({
      imports: [UpdateBanner],
      providers: [{ provide: SwUpdate, useValue: updates }],
    }).compileComponents();
    const fixture = TestBed.createComponent(UpdateBanner);
    fixture.detectChanges();

    expect(updates.checkForUpdate).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="update-banner"]')).toBeNull();

    versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="update-banner"]')?.textContent).toContain('new version');
  });

  it('stays hidden when the service worker is off', async () => {
    await TestBed.configureTestingModule({ imports: [UpdateBanner] }).compileComponents();
    const fixture = TestBed.createComponent(UpdateBanner);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="update-banner"]')).toBeNull();
  });
});
