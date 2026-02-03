import { Component } from '@angular/core';
import { IonicModule, MenuController, ToastController, LoadingController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, RouterLink, FormsModule, CommonModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  email = '';
  contrasena = '';

  constructor(
    private router: Router,
    private menu: MenuController,
    private auth: AuthService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ionViewWillEnter() {
    this.menu.enable(false);
  }

  ionViewWillLeave() {
    this.menu.enable(true);
  }

  async doLogin() {
    // Validación rápida
    if (!this.email?.trim() || !this.contrasena?.trim()) {
      return this.toast('Completa correo y contraseña');
    }

    const loading = await this.loadingCtrl.create({ message: 'Iniciando sesión...' });
    await loading.present();

    this.auth.login(this.email.trim(), this.contrasena).subscribe({
      next: async (res) => {
        await loading.dismiss();

        if (res?.ok) {
          // ya guardaste token en el service (si dejaste el tap)
          await this.toast('Bienvenido ✅');
          // ajusta tu ruta real
          this.router.navigateByUrl('/panel', { replaceUrl: true });
        } else {
          this.toast(res?.message ?? 'No se pudo iniciar sesión');
        }
      },
      error: async (err) => {
        await loading.dismiss();

        // Laravel suele mandar err.error.message o err.error.errors
        const msg =
          err?.error?.message ||
          (err?.status === 401 ? 'Credenciales inválidas' : 'Error al conectar con el servidor');

        this.toast(msg);
      }
    });
  }

  onRegister() {
    this.router.navigateByUrl('/register');
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
    });
    await t.present();
  }
}
