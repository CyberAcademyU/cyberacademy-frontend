import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiLoaderComponent } from './shared/ui/api-loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ApiLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'CyberAcademy';
}
