import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';


import {
  IonSplitPane,
  IonMenu,
  IonContent,
  IonRouterOutlet,
  IonMenuToggle,
  IonIcon,
  IonAccordionGroup,
  IonAccordion,
} from '@ionic/angular/standalone';

import { AuthService } from 'src/app/services/auth.service';
import type { Usuario } from 'src/models/usuario.model';

@Component({
  selector: 'app-shell',
  standalone: true,
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  imports: [
    CommonModule,
    RouterLink,

    IonSplitPane,
    IonMenu,
    IonContent,
    IonRouterOutlet,
    IonMenuToggle,
    IonIcon,
    IonAccordionGroup,
    IonAccordion,  
  ],
})
export class ShellComponent implements OnInit {

  usuario: Usuario | null = null;

  // 🔥 controla el ancho del sidebar aquí
  menuW = '190px';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.auth.usuario$.subscribe(u => this.usuario = u);

    // recuperar usuario al refrescar
    this.auth.me().subscribe({
      next: res => this.usuario = res.usuario,
      error: () => {}
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login', { replaceUrl: true }),
      error: () => this.router.navigateByUrl('/login', { replaceUrl: true }),
    });
  }
  get isAdmin(): boolean {
  return (this.usuario?.role_id ?? 0) === 1;
}
}
