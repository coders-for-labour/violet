import { Component, OnInit, enableProdMode } from '@angular/core';
import { AuthService } from './auth.service';
enableProdMode();

@Component({
  selector: 'c4c-app',
  templateUrl: 'views/main.html',
})
export class AppComponent implements OnInit {
  user: Object;

  constructor(private authService:AuthService) {}

  ngOnInit() {
    this.authService.getAuth().then(auth => this.user = auth);
  }
}
