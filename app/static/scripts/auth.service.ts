import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { Auth } from './auth.component';

@Injectable()
export class AuthService {
  private authUrl = 'api/auth';

  constructor(private http: Http) {}

  getAuth(): Promise<Auth> {
    return this.http.get(this.authUrl)
      .toPromise()
      .then(response => response.json() as Auth)
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
