import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    const res = await firstValueFrom(auth.me());
    const roleId = res?.usuario?.role_id ?? 0;

    if (roleId === 1) return true;

    router.navigateByUrl('/panel', { replaceUrl: true });
    return false;
  } catch {
    router.navigateByUrl('/login', { replaceUrl: true });
    return false;
  }
};
