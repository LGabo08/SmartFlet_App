import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { IonContent, IonIcon, AlertController } from '@ionic/angular/standalone';

import { UsuarioService } from 'src/app/services/usuario.service';
import type { Usuario } from 'src/models/usuario.model';

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
  eyeOutline = eyeOutline;
  eyeOffOutline = eyeOffOutline;

  isEdit = false;
  usuarioId: number | null = null;

  saving = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      apellidos: ['', [Validators.required, Validators.maxLength(255)]],
      role_id: [2, Validators.required],
      estado: ['activo', Validators.required],

      // En REGISTRO son requeridas; en EDIT serán opcionales (ajustamos en ngOnInit)
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.usuarioId = Number(id);

      // ✅ En editar la contraseña es opcional
      this.registerForm.get('contrasena')?.clearValidators();
      this.registerForm.get('confirmarContrasena')?.clearValidators();
      this.registerForm.updateValueAndValidity();

      this.loadUsuario();
    }
  }

  get showNoMatch(): boolean {
    const pass = String(this.registerForm.get('contrasena')?.value ?? '');
    const conf = String(this.registerForm.get('confirmarContrasena')?.value ?? '');

    // ✅ En editar: si ambos vacíos, no hay mismatch
    if (this.isEdit && !pass && !conf) return false;

    // si uno está vacío y el otro no, sí consideramos mismatch
    if ((pass && !conf) || (!pass && conf)) return true;

    return conf.length > 0 && pass !== conf;
  }

  async loadUsuario() {
    if (!this.usuarioId) return;

    try {
      const res = await firstValueFrom(this.usuarioService.getById(this.usuarioId));
      const u: Usuario = res?.usuario;

      this.registerForm.patchValue({
        email: u.email,
        nombre: u.nombre,
        apellidos: u.apellidos,
        role_id: u.role_id,
        estado: u.estado ?? 'activo',
      });

      // NO rellenamos contraseñas
      this.registerForm.patchValue({ contrasena: '', confirmarContrasena: '' });

    } catch (err: any) {
      await this.showError(err?.error?.message ?? 'No se pudo cargar el usuario.');
      this.router.navigateByUrl('/usuarios', { replaceUrl: true });
    }
  }

  async onSubmit() {
    if (this.registerForm.invalid || this.showNoMatch) return;

    const payload: any = {
      email: String(this.registerForm.value.email ?? '').trim(),
      nombre: String(this.registerForm.value.nombre ?? '').trim(),
      apellidos: String(this.registerForm.value.apellidos ?? '').trim(),
      role_id: Number(this.registerForm.value.role_id),
      estado: String(this.registerForm.value.estado ?? 'activo').toLowerCase(),
    };

    const pass = String(this.registerForm.value.contrasena ?? '');
    if (pass) payload.contrasena = pass;

    this.saving = true;
    try {
      if (this.isEdit) {
        if (!this.usuarioId) throw new Error('ID inválido');
        const res = await firstValueFrom(this.usuarioService.update(this.usuarioId, payload));

        if (!res?.ok) {
          await this.showError(this.formatErrors(res?.errors) ?? res?.message ?? 'No se pudo actualizar.');
          return;
        }

        const alert = await this.alertController.create({
          header: '¡Éxito!',
          message: 'Usuario actualizado correctamente.',
          buttons: ['OK'],
        });
        await alert.present();

        this.router.navigateByUrl('/usuarios', { replaceUrl: true });

      } else {
        const res = await firstValueFrom(this.usuarioService.create({ ...payload, contrasena: payload.contrasena ?? '' }));

        if (!res?.ok) {
          await this.showError(this.formatErrors(res?.errors) ?? res?.message ?? 'No se pudo registrar el usuario.');
          return;
        }

        const alert = await this.alertController.create({
          header: '¡Éxito!',
          message: `Usuario creado: ${res.usuario?.email ?? payload.email}`,
          buttons: ['OK'],
        });
        await alert.present();

        this.registerForm.reset({ role_id: 2, estado: 'activo' });
        this.router.navigateByUrl('/usuarios', { replaceUrl: true });
      }

    } catch (err: any) {
      const msg =
        this.formatErrors(err?.error?.errors) ??
        err?.error?.message ??
        err?.message ??
        'Error inesperado al guardar';

      await this.showError(msg);
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigateByUrl('/usuarios', { replaceUrl: true });
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
