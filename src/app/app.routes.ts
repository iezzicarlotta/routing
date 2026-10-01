import { Routes } from '@angular/router';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { PokemonDetailComponent } from './features/pokemon-detail/pokemon-detail.component';
import { TypePokemonComponent } from './features/type-pokemon/type-pokemon.component';
import { TypesComponent } from './features/types/types.component';

export const routes: Routes = [
  { path: '', redirectTo: 'types', pathMatch: 'full' },
  { path: 'types', component: TypesComponent },
  { path: 'types/:type', component: TypePokemonComponent },
  { path: 'pokemon/:name', component: PokemonDetailComponent },
  { path: '**', component: NotFoundComponent },
];
