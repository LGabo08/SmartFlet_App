import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  // No le pongas token al login
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  return from(auth.getToken()).pipe(
    switchMap((token) => {
      if (!token) return next(req);

      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {

          // ── 401: token inválido o expirado ──────────────────────────────
          if (error.status === 401) {
            auth.clearToken();
            auth.setUsuario(null);
            router.navigateByUrl('/login', { replaceUrl: true });
            mostrarToast(toastCtrl, 'Tu sesión ha expirado. Inicia sesión nuevamente.', 'warning');
          }

          // ── 403: sin permisos ───────────────────────────────────────────
          if (error.status === 403) {
            mostrarToast(toastCtrl, 'No tienes permiso para realizar esta acción.', 'danger');
          }

          return throwError(() => error);
        })
      );
    })
  );
};

async function mostrarToast(toastCtrl: ToastController, mensaje: string, color: string) {
  const t = await toastCtrl.create({
    message:  mensaje,
    duration: 3000,
    color,
    position: 'bottom',
    buttons: [{ text: 'OK', role: 'cancel' }],
  });
  t.present();
}