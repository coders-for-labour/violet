import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Auth } from './auth.component';

@Component({
  selector: 'my-dashboard',
  templateUrl: 'views/dashboard-component.html',
})
export class DashboardComponent implements OnInit {
  private auth: Auth;

  constructor(
    private authService:AuthService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.authService.getAuth()
      .then(auth => this.auth = auth);
  }

  onLogin(): void {
    window.location.href = "/auth/twitter";
  }
}
