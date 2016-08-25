import { Routes, RouterModule } from '@angular/router';

import { AppComponent }      from './app.component';
import { HeroesComponent }      from './heroes.component';
import { HeroDetailComponent }      from './hero-detail.component';
import { DashboardComponent }      from './dashboard.component';

const appRoutes: Routes = [
  {
    path: 'heroes',
    component: HeroesComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'detail/:id',
    component: HeroDetailComponent
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];

export const routing = RouterModule.forRoot(appRoutes);
