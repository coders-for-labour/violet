import { NgModule }       from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { HttpModule }    from '@angular/http';

//import { XHRBackend } from '@angular/http';
//import { InMemoryBackendService, SEED_DATA } from 'angular2-in-memory-web-api';
//import { InMemoryDataService }               from './in-memory-data.service';

import { AppComponent }   from './app.component';
import { routing }        from './app.routing';

import { DashboardComponent }  from './dashboard.component';
import { BlocklistComponent }  from './blocklist.component';
import { TwitterProfileDetailComponent }  from './twitter-profile-detail.component';

import { AuthService }  from './auth.service';
import { BlocklistService }  from './blocklist.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    routing,
   HttpModule
  ],
  declarations: [
    AppComponent,
    DashboardComponent,
    BlocklistComponent,
    TwitterProfileDetailComponent
  ],
  providers: [
    AuthService,
    BlocklistService,
   // { provide: XHRBackend, useClass: InMemoryBackendService }, // in-mem server
   // { provide: SEED_DATA,  useClass: InMemoryDataService }     // in-mem server data
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
