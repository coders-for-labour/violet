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
  // error: any;
  // addingHero: boolean;

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

  // addHero(): void {
  //   this.addingHero = true;
  //   this.selectedHero = null;
  // }
  //
  // deleteHero(hero: Hero, event: any): void {
  //   event.stopPropagation();
  //   this.heroService
  //     .delete(hero)
  //     .then(res => {
  //       this.heroes = this.heroes.filter(h => h !== hero);
  //       if (this.selectedHero === hero) { this.selectedHero = null; }
  //     })
  //     .catch(error => this.error = error);
  // }
  //
  // close(savedHero: Hero): void {
  //   this.addingHero = false;
  //   if (savedHero) { this.getHeroes(); }
  // }

  gotoDetail(): void {
    this.router.navigate(['/detail', this.selectedHero.id]);
  }

  getHeroes(): void {
    this.heroService.getHeroes()
      .then(heroes => this.heroes = heroes);
  }
}
