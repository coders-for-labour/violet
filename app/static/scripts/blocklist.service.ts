import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { TwitterProfile } from './twitter-profile.component';

@Injectable()
export class BlocklistService {
  private blocklistUrl = 'api/blocklist';
  private blocklistCountUrl = 'api/blocklist/count';
  private blocklistBlockUrl = 'api/blocklistblock';

  constructor(private http: Http) {}

  getBlocklist(): Promise<TwitterProfile[]> {
    return this.http.get(this.blocklistUrl)
      .toPromise()
      .then(response => response.json() as TwitterProfile[])
      .catch(this.handleError);
  }

  getBlocklistCount(): Promise<number> {
    return this.http.get(this.blocklistCountUrl)
      .toPromise()
      .then(response => response.json() as number)
      .catch(this.handleError);
  }

  getProfile(id: number): Promise<TwitterProfile> {
    return this.http.get(this.blocklistUrl)
      .toPromise()
      .then(response => response.json().find(p => p.id === id))
      .catch(this.handleError);
  }

  blockAll(): Promise<number> {
    return this.http.get(this.blocklistBlockUrl)
      .toPromise()
      .then(response => response.json() as number)
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
