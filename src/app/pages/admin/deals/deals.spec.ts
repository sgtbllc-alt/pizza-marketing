import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDeals } from './deals';

describe('AdminDeals', () => {
  let component: AdminDeals;
  let fixture: ComponentFixture<AdminDeals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDeals],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDeals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
