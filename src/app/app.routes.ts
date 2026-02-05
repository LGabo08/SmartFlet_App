import { Routes } from '@angular/router';
import { ShellComponent } from './componentes/shell/shell.component';

// import { authGuard } from '../guards/auth.guard';
// import { guestGuard } from '../guards/guest.guard';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./paginas/login/login.page').then(m => m.LoginPage),
  },

  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },

      { path: 'panel', loadComponent: () => import('./paginas/panel/panel.page').then(m => m.PanelPage) },
      { path: 'viajes', loadComponent: () => import('./paginas/viajes/viajes.page').then(m => m.ViajesPage) },
      { path: 'asignaciones', loadComponent: () => import('./paginas/asignaciones/asignaciones.page').then(m => m.AsignacionesPage) },
      { path: 'register', loadComponent: () => import('./paginas/register/register.page').then(m => m.RegisterPage) },
      { path: 'usuarios', loadComponent: () => import('./paginas/usuarios/usuarios.page').then(m => m.UsuariosPage) },

      // ✅ NUEVA RUTA PARA EDITAR
      {
        path: 'usuarios/:id/editar',
        loadComponent: () =>
          import('./paginas/register/register.page').then(m => m.RegisterPage),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
