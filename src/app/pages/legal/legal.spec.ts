import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { LegalPage } from './legal';

async function render(doc: string): Promise<string> {
  await TestBed.configureTestingModule({
    imports: [LegalPage],
    providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { doc } } } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(LegalPage);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('LegalPage', () => {
  it('SMS Terms include what carriers check for', async () => {
    const text = await render('sms-terms');
    for (const phrase of ['STOP', 'HELP', 'Message frequency varies', 'Message and data rates may apply',
      'not a condition of any purchase', 'Carriers are not liable']) {
      expect(text).toContain(phrase);
    }
  });

  it('Privacy Policy says mobile information is not shared for marketing', async () => {
    const text = await render('privacy');
    expect(text).toContain('No mobile information will be shared with third parties or affiliates');
    expect(text).toContain('opt-in data and consent are not shared');
  });
});
