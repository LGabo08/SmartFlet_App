import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = await auth.getToken();
  if (!token) {
    router.navigateByUrl('/login', { replaceUrl: true });
    return false;
  }

  // ✅ valida token con /me
  try {
    await firstValueFrom(auth.me());
    return true;
  } catch (e) {
    // si es inválido/expirado
    await auth.clearToken();
    router.navigateByUrl('/login', { replaceUrl: true });
    return false;
  }
};
