import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { STORE } from '../../core/data/store.data';
import { CallPage } from './call';

describe('CallPage', () => {
  it('shows a big Call button with the store phone number', async () => {
    await TestBed.configureTestingModule({ imports: [CallPage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(CallPage);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('[data-testid="call-button"]');
    expect(button?.getAttribute('href')).toBe(STORE.phoneHref);
    expect(button?.textContent).toContain(STORE.phoneDisplay);
  });
});
