import { Component, OnInit, enableProdMode } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { AuthService } from './auth.service';
import { Auth } from './auth.component';
enableProdMode();

@Component({
  selector: 'c4c-app',
  templateUrl: 'views/main.html',
})
export class AppComponent implements OnInit {
  public user: Auth;

  constructor(private authService:AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getAuth().then(auth => this.user = auth);
    this.router.events.subscribe((event) => {
        if (event instanceof NavigationStart)
          $('#top-nav').collapse('hide'); // HACK: Stop-gap until we have proper Angular layout
    });
  }
}
