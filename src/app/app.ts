import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatboxComponent } from './chatbox/chatbox';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatboxComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'CyberAcademy';
}
