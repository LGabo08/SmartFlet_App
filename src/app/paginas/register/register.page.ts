import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
// Importa el servicio de usuario para manejar el registro
//import { UsuarioService } from 'src/app/services/usuario.service'; // Asegúrate de crear este servicio

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  standalone: true,
  imports: [IonicModule,IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, RouterLink],
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private alertController: AlertController,
    //private usuarioService: UsuarioService // Usamos el servicio para manejar el registro
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      apellidos: ['', [Validators.required]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      role_id: [1, Validators.required],  // El rol predeterminado será Administrador
      estado: ['activo'],
    });
  }

  ngOnInit() {}

  // Método para registrar al usuario
   async onRegister() {
  //   if (this.registerForm.invalid) {
  //     return;
  //   }

  //   // Tomar los valores del formulario
  //   const formData = this.registerForm.value;
    
  //   try {
  //     const result = await this.usuarioService.register(formData);
  //     this.showSuccessAlert();
  //   } catch (error) {
  //     this.showErrorAlert(error);
  //   }
   }

  // Mostrar alerta de éxito
  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Éxito!',
      message: 'Usuario registrado correctamente.',
      buttons: ['OK'],
    });

    await alert.present();
    this.router.navigate(['/login']); // Redirige al login
  }

  // Mostrar alerta de error
  async showErrorAlert(error: any) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: `Hubo un problema: ${error.message}`,
      buttons: ['OK'],
    });

    await alert.present();
  }
}
