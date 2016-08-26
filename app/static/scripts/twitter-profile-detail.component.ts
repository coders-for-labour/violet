// import {  Component, Input, OnInit } from '@angular/core';
import {  Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { BlocklistService } from './blocklist.service';
import { TwitterProfile } from './twitter-profile.component';

@Component({
  selector: 'twitter-profile',
  templateUrl: 'views/twitter-profile-detail-component.html'
})
export class TwitterProfileDetailComponent implements OnInit {
  profile: TwitterProfile;

  constructor(
    private blocklistService: BlocklistService,
    private route: ActivatedRoute ) {
  }

  ngOnInit(): void {
    this.route.params.forEach((params: Params) => {
      if (params['id'] !== undefined) {
        let id = +params['id'];
        this.blocklistService.getProfile(id)
          .then(profile => this.profile = profile);
      }
    });
  }

  goBack(): void {
    window.history.back();
  }
}
