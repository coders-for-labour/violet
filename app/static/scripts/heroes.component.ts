import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeroService } from './hero.service';
import { OnInit } from '@angular/core';
import { Hero } from './hero.component'

@Component({
  selector: 'my-heroes',
  templateUrl: 'views/heroes.html',
  providers: [HeroService]
})
export class HeroesComponent implements OnInit {
  heroes: Hero[];
  selectedHero: Hero;

  constructor(
    private heroService: HeroService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.getHeroes();
  }

  onSelect(hero: Hero): void {
    this.selectedHero = hero;
  }

  gotoDetail(): void {
    this.router.navigate(['/detail', this.selectedHero.id]);
  }

  getHeroes(): void {
    this.heroService.getHeroes()
      .then(heroes => this.heroes = heroes);
  }
}
