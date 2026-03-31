import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PanelService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getResumen(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/panel/resumen`);
  }
}