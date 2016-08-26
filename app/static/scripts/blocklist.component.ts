import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BlocklistService } from './blocklist.service';
import { OnInit } from '@angular/core';
import { TwitterProfile } from './twitter-profile.component'

@Component({
  selector: 'violet-blocklist',
  templateUrl: 'views/blocklist-component.html',
  providers: []
})
export class BlocklistComponent implements OnInit {
  error: any;
  result: string;
  working: boolean;
  blocklist: TwitterProfile[];

  constructor(
    private authService: AuthService,
    private blocklistService: BlocklistService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.getBlocklist();
  }

  getBlocklist(): void {
    this.blocklistService.getBlocklist()
      .then(blocklist => this.blocklist = blocklist);
  }

  onBlockAll(): void {
    this.blocklistService.blockAll()
      .then(numBlocked => this.result = `Successfully blocked ${numBlocked} accounts.`)
      .catch(this.handleError);
  }

  private handleError(error:any):void {
    this.error = error;
  }
}
