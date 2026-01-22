import { Routes } from '@angular/router';
import { ShellComponent } from './componentes/shell/shell.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  { path: 'login', loadComponent: () => import('./paginas/login/login.page').then(m => m.LoginPage) },

  {
    path: '',
    component: ShellComponent,
    children: [
      { path: 'panel', loadComponent: () => import('./paginas/panel/panel.page').then(m => m.PanelPage) },
      // { path: 'viajes', loadComponent: () => import('./paginas/viajes/viajes.page').then(m => m.ViajesPage) },
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
