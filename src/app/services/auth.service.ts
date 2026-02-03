import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';
import type { LoginRequest, AuthResponse } from 'src/models/auth.model';
import type { Usuario } from 'src/models/usuario.model'; // usa tu model real

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiUrl;
  private TOKEN_KEY = 'auth_token';

  constructor(private http: HttpClient) {}

  async setToken(token: string) {
    await Preferences.set({ key: this.TOKEN_KEY, value: token });
  }

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: this.TOKEN_KEY });
    return value ?? null;
  }

  async clearToken() {
    await Preferences.remove({ key: this.TOKEN_KEY });
  }

  login(email: string, contrasena: string) {
    const url = `${this.baseUrl}/auth/login`;
    const body: LoginRequest = { email, contrasena };
    return this.http.post<AuthResponse>(url, body).pipe(
      tap(async (res) => {
        if (res?.ok && res?.token) await this.setToken(res.token);
        this.setUsuario(res.usuario);
      })
    );
  }

  me(): Observable<{ ok: boolean; usuario: Usuario }> {
    const url = `${this.baseUrl}/auth/me`;
    return this.http.get<{ ok: boolean; usuario: Usuario }>(url);
  }

  logout(): Observable<{ ok: boolean; message: string }> {
    const url = `${this.baseUrl}/auth/logout`;
    return this.http.post<{ ok: boolean; message: string }>(url, {}).pipe(
      tap(async () => {
  await this.clearToken();
  this.setUsuario(null); // ✅ limpiar
})
    );
}

  refresh(): Observable<AuthResponse> {
    const url = `${this.baseUrl}/auth/refresh`;
    return this.http.post<AuthResponse>(url, {}).pipe(
      tap(async (res) => {
        if (res?.ok && res?.token) await this.setToken(res.token);
      })
    );
  }
  private _usuario$ = new BehaviorSubject<Usuario | null>(null);
usuario$ = this._usuario$.asObservable();

setUsuario(u: Usuario | null) {
  this._usuario$.next(u);
}
getUsuarioSnapshot() {
  return this._usuario$.value;
}
}
