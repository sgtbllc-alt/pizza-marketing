import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendDeal } from './send-deal';

describe('SendDeal', () => {
  let component: SendDeal;
  let fixture: ComponentFixture<SendDeal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendDeal],
    }).compileComponents();

    fixture = TestBed.createComponent(SendDeal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
