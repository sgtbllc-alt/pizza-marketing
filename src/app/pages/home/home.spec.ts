import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { of } from 'rxjs';

import { MENU_ITEMS } from '../../core/data/menu.data';
import { STORE } from '../../core/data/store.data';
import { DealService } from '../../core/services/deal.service';
import { HomePage } from './home';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let getActiveDeals: ReturnType<typeof vi.fn>;

  async function setup(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: DealService, useValue: { getActiveDeals } },
        { provide: SwPush, useValue: { isEnabled: false, subscription: of(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders all 18 pizzas exactly once', async () => {
    getActiveDeals = vi.fn().mockResolvedValue([]);
    const el = await setup();

    const cards = el.querySelectorAll('[data-testid="menu-card"]');
    expect(MENU_ITEMS.length).toBe(18);
    expect(cards.length).toBe(18);

    const names = Array.from(cards).map((card) => card.querySelector('h3')?.textContent?.trim());
    expect(new Set(names).size).toBe(18);
    expect(names).toEqual(MENU_ITEMS.map((item) => item.name));
  });

  it('gives every card an order link to the order URL that opens in a new tab', async () => {
    getActiveDeals = vi.fn().mockResolvedValue([]);
    const el = await setup();

    const cards = el.querySelectorAll('[data-testid="menu-card"]');
    cards.forEach((card) => {
      const link = card.querySelector<HTMLAnchorElement>('[data-testid="order-link"]');
      expect(link).not.toBeNull();
      expect(link!.getAttribute('href')).toBe(STORE.orderUrl);
      expect(link!.getAttribute('target')).toBe('_blank');
      expect(link!.getAttribute('rel')).toContain('noopener');
    });
  });

  it('shows the fallback banner text when the deal call fails', async () => {
    getActiveDeals = vi.fn().mockRejectedValue(new Error('Supabase unreachable'));
    const el = await setup();

    const promo = el.querySelector('[data-testid="promo-text"]');
    expect(promo?.textContent?.trim()).toBe('Unlock 30% OFF Now!');
  });

  it("shows the newest deal's title when one exists", async () => {
    getActiveDeals = vi.fn().mockResolvedValue([{ id: '1', title: 'Two Large for $30' }]);
    const el = await setup();

    const promo = el.querySelector('[data-testid="promo-text"]');
    expect(promo?.textContent?.trim()).toBe('Two Large for $30');
  });

  it('omits the description line when a description is empty', async () => {
    getActiveDeals = vi.fn().mockResolvedValue([]);
    const el = await setup();

    const tuscan = Array.from(el.querySelectorAll('[data-testid="menu-card"]')).find(
      (card) => card.querySelector('h3')?.textContent?.trim() === 'Garlic Tuscan',
    );
    expect(tuscan?.querySelector('.card-body p')).toBeNull();
    expect(tuscan?.querySelector('.badge-new')).not.toBeNull();
  });
});
