import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonMenuToggle,
  IonItem,
  IonRouterOutlet,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonMenuToggle,
    IonItem,
    IonRouterOutlet,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {}
