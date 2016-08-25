import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeroService } from './hero.service';
import { Hero } from './hero.component';

@Component({
  selector: 'my-dashboard',
  templateUrl: 'views/dashboard.html',
})
export class DashboardComponent implements OnInit {
  heroes: Hero[] = [];

  constructor(
    private heroService:HeroService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.heroService.getHeroes()
      .then(heroes => this.heroes = heroes.slice(1, 5));
  }

  gotoDetailHero(hero: Hero): void {
    let link = ['/detail', hero.id];
    this.router.navigate(link);
  }
}
