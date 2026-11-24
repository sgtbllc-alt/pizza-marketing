import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AdminAuthService } from '../../core/services/admin-auth.service';
import { Admin } from './admin';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    logout = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [provideRouter([]), { provide: AdminAuthService, useValue: { logout } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('logs out and goes to the admin login page', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="admin-logout"]')!.click();
    await fixture.whenStable();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/admin-login']);
  });
});
