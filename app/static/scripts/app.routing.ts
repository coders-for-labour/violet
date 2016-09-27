import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard.component';
import { BlocklistComponent } from './blocklist.component';
import { TwitterProfileDetailComponent }  from './twitter-profile-detail.component';
import { TwibbynComponent } from "./twibbyn.component";

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'blocker',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'blocker',
    component: BlocklistComponent
  },
  {
    path: 'twibbyn',
    component: TwibbynComponent
  }
];

export const routing = RouterModule.forRoot(appRoutes);
