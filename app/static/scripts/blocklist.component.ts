import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { Auth } from './auth.component';
import { BlocklistService } from './blocklist.service';
import { OnInit } from '@angular/core';
import { TwitterProfile } from './twitter-profile.component'

@Component({
  selector: 'violet-blocklist',
  templateUrl: 'views/blocklist-component.html',
  providers: []
})
export class BlocklistComponent implements OnInit {
  private auth: Auth;

  error: any;
  result: string;
  working: boolean;
  complete: boolean;
  blocklistCount: number = 0;
  blocklist: TwitterProfile[];

  constructor(
    private authService: AuthService,
    private blocklistService: BlocklistService
  ) {}

  ngOnInit(): void {
    this.authService.getAuth()
      .then(auth => {
        this.auth = auth;

        this.getBlocklistCount();

        if (auth)
          this.getBlocklist();
      });
  }

  onLogin(): void {
    window.location.href = "/auth/twitter";
  }

  getBlocklist(): void {
    this.blocklistService.getBlocklist()
      .then(blocklist => this.blocklist = blocklist);
  }

  getBlocklistCount(): void {
    this.blocklistService.getBlocklistCount()
      .then(blocklistCount => this.blocklistCount = blocklistCount);
  }

  onBlockAll(): void {
    this.working = true;
    this.blocklistService.blockAll()
      .then(numBlocked => {
        this.complete = true;
        this.working = false;
        this.result = `Successfully blocked ${numBlocked} accounts.`
      })
      .catch(this.handleError);
  }

  private handleError(error:any):void {
    this.error = error;
  }
}
