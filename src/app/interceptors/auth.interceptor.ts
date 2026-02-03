import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);

  // No le pongas token al login (opcional)
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  return from(auth.getToken()).pipe(
    switchMap((token) => {
      if (!token) return next(req);

      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });

      return next(authReq);
    })
  );
};
