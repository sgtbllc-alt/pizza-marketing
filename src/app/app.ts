import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { InstallService } from './core/services/install.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    // Catch the browser's one-time install offer as early as possible (used by the notification pop-up).
    inject(InstallService).listen();
  }
}
