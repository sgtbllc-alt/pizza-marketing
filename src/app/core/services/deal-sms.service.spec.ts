import { TestBed } from '@angular/core/testing';

import { DealSmsService } from './deal-sms.service';

describe('DealSmsService', () => {
  let service: DealSmsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DealSmsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
