import { Component, inject } from '@angular/core';
import { SessionPolicyService } from './core/services/session-policy';
import { RouterOutlet } from '@angular/router';
import { ChatboxComponent } from './chatbox/chatbox';
import { MessageNotificationsComponent } from './features/messages/message-notifications';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatboxComponent, MessageNotificationsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly sessionPolicy = inject(SessionPolicyService);
  title = 'CyberAcademy';
}
