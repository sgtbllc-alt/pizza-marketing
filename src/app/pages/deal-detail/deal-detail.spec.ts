import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { STORE } from '../../core/data/store.data';
import { DealService } from '../../core/services/deal.service';
import { DealDetailPage } from './deal-detail';

const deal = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Two Large for $30',
  description: 'Any two large one-topping pizzas.',
  original_price: 40,
  discounted_price: 30,
  promo_code: 'TWO30',
  active: true,
};

async function render(getDeal: ReturnType<typeof vi.fn>): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [DealDetailPage],
    providers: [
      provideRouter([]),
      { provide: DealService, useValue: { getDeal } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: deal.id }) } } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(DealDetailPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('DealDetailPage', () => {
  it('shows the deal with code, price, Order and Call buttons', async () => {
    const getDeal = vi.fn().mockResolvedValue(deal);
    const el = await render(getDeal);

    expect(getDeal).toHaveBeenCalledWith(deal.id);
    const card = el.querySelector('[data-testid="deal-detail"]')!;
    expect(card.querySelector('h1')?.textContent?.trim()).toBe(deal.title);
    expect(card.textContent).toContain('TWO30');
    expect(card.textContent).toContain('$30.00');
    expect(el.querySelector('[data-testid="deal-order"]')?.getAttribute('href')).toBe(STORE.orderUrl);
    expect(el.querySelector('[data-testid="deal-call"]')?.getAttribute('href')).toBe(STORE.phoneHref);
  });

  it('says the deal has ended when it is inactive or missing', async () => {
    const el = await render(vi.fn().mockResolvedValue({ ...deal, active: false }));
    expect(el.querySelector('[data-testid="deal-ended"]')).not.toBeNull();

    TestBed.resetTestingModule();
    const missing = await render(vi.fn().mockResolvedValue(null));
    expect(missing.querySelector('[data-testid="deal-ended"]')).not.toBeNull();
  });
});
