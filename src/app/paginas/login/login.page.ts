import { Component } from '@angular/core';
import { IonicModule, MenuController } from '@ionic/angular';
// import { LoginCardComponent } from '../../componentes/login-card/login-card.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  constructor(
    private router: Router,
    private menu: MenuController
  ) {}

  ionViewWillEnter() {
    // Desactiva el menú en login
    this.menu.enable(false);
  }

  ionViewWillLeave() {
    // Lo vuelves a activar al salir (para dashboard)
    this.menu.enable(true);
  }

  onLogin(data: { email: string; password: string }) {
    console.log('LOGIN', data);
    this.router.navigateByUrl('/app/dashboard');
  }

  onRegister() {
    this.router.navigateByUrl('/register');
  }
}
