import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { IonContent, IonIcon, AlertController } from '@ionic/angular/standalone';

import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonIcon],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  showPass = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private alertController: AlertController,
    private router: Router
  ) {
   this.registerForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  nombre: ['', [Validators.required, Validators.maxLength(120)]], // ✅
  apellidos: ['', [Validators.required, Validators.maxLength(255)]],
  role_id: [2, Validators.required],
  contrasena: ['', [Validators.required, Validators.minLength(6)]],
  confirmarContrasena: ['', [Validators.required]],
  estado: ['activo', Validators.required],
});
  }

  ngOnInit() {}

  get showNoMatch(): boolean {
    const pass = this.registerForm.get('contrasena')?.value ?? '';
    const conf = this.registerForm.get('confirmarContrasena')?.value ?? '';
    return conf.length > 0 && pass !== conf;
  }

  async onRegister() {
    if (this.registerForm.invalid || this.showNoMatch) return;

    const payload = {
      email: String(this.registerForm.value.email ?? '').trim(),
      nombre: String(this.registerForm.value.nombre ?? '').trim(),
      apellidos: String(this.registerForm.value.apellidos ?? '').trim(),
      contrasena: String(this.registerForm.value.contrasena ?? ''),
      role_id: Number(this.registerForm.value.role_id),
      // ✅ tu backend usa 'activo' por defecto; mandamos minúsculas por consistencia
      estado: String(this.registerForm.value.estado ?? 'activo').toLowerCase(),
    };

    try {
      const res = await firstValueFrom(this.usuarioService.create(payload));

      if (!res?.ok) {
        await this.showError(
          this.formatErrors(res?.errors) ?? res?.message ?? 'No se pudo registrar el usuario.'
        );
        return;
      }

      const alert = await this.alertController.create({
        header: '¡Éxito!',
        message: `Usuario creado: ${res.usuario?.email ?? payload.email}`,
        buttons: ['OK'],
      });
      await alert.present();

      // Limpia y vuelve al panel (o puedes dejarlo en register)
      this.registerForm.reset({ role_id: 2, estado: 'activo' });
      this.router.navigateByUrl('/panel', { replaceUrl: true });

    } catch (err: any) {
      // Laravel típicamente: err.error.errors (422), err.error.message (401/403)
      const msg =
        this.formatErrors(err?.error?.errors) ??
        err?.error?.message ??
        err?.message ??
        'Error inesperado al registrar';

      await this.showError(msg);
    }
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private formatErrors(errors: any): string | null {
    if (!errors) return null;

    const lines: string[] = [];
    for (const key of Object.keys(errors)) {
      const arr = Array.isArray(errors[key]) ? errors[key] : [String(errors[key])];
      for (const m of arr) lines.push(`• ${m}`);
    }
    return lines.length ? lines.join('<br>') : null;
  }
}
