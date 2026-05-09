import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealsPage } from './deals';

describe('DealsPage', () => {
  let component: DealsPage;
  let fixture: ComponentFixture<DealsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(DealsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
