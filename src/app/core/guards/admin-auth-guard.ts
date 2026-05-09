import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthGuard: CanActivateFn = async () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  const loggedIn = await authService.isLoggedIn();

  if (!loggedIn) {
    return router.createUrlTree(['/admin-login']);
  }

  return true;
};
