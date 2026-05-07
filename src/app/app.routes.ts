import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/signup/signup.component').then((component) => component.SignupComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
