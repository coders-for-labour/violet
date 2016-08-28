import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent }      from './dashboard.component';
import { BlocklistComponent }      from './blocklist.component';
import { TwitterProfileDetailComponent }      from './twitter-profile-detail.component';

const appRoutes: Routes = [
  {
    path: '',
    component: BlocklistComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'detail/:id',
    component: TwitterProfileDetailComponent
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];

export const routing = RouterModule.forRoot(appRoutes);
