import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-asignaciones',
  templateUrl: './asignaciones.page.html',
  styleUrls: ['./asignaciones.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule, // aquí sí funciona para ion-card, ion-grid, etc.
  ],
})
export class AsignacionesPage implements OnInit {
  constructor() {}
  ngOnInit() {}
}
