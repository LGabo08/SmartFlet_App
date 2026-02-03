import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = await auth.getToken();

  if (token) {
    router.navigateByUrl('/panel', { replaceUrl: true });
    return false;
  }

  return true;
};
