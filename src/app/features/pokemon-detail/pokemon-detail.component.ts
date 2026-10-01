import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Observable,
  Subject,
  EMPTY,
  catchError,
  distinctUntilChanged,
  map,
  merge,
  switchMap,
  throwError,
} from 'rxjs';
import { findPokemonCategory, PokemonCategory } from '../../models/pokemon-category.model';
import { PokemonDetail, PokemonBaseStat } from '../../models/pokemon.model';
import { PokemonApiService } from '../../services/pokemon-api.service';

@Component({
  selector: 'app-pokemon-detail',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './pokemon-detail.component.html',
  styleUrl: './pokemon-detail.component.css',
})
export class PokemonDetailComponent implements OnInit {
  pokemon: PokemonDetail | null = null;
  currentName = '';
  returnType: string | null = null;
  isLoading = false;
  errorMessage = '';
  triedFallbackImage = false;
  imageUnavailable = false;

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pokemonApi = inject(PokemonApiService);
  private readonly retryRequests = new Subject<void>();

  private readonly statLabels: Record<string, string> = {
    hp: 'Punti salute',
    attack: 'Attacco',
    defense: 'Difesa',
    'special-attack': 'Attacco speciale',
    'special-defense': 'Difesa speciale',
    speed: 'Velocità',
  };

  private readonly typeLabels: Record<string, string> = {
    normal: 'Normale',
    fighting: 'Lotta',
    flying: 'Volante',
    poison: 'Veleno',
    ground: 'Terra',
    rock: 'Roccia',
    bug: 'Coleottero',
    ghost: 'Spettro',
    steel: 'Acciaio',
    fire: 'Fuoco',
    water: 'Acqua',
    grass: 'Erba',
    electric: 'Elettro',
    psychic: 'Psico',
    ice: 'Ghiaccio',
    dragon: 'Drago',
    dark: 'Buio',
    fairy: 'Folletto',
    stellar: 'Astrale',
    unknown: 'Sconosciuto',
  };

  get returnCategory(): PokemonCategory | undefined {
    return findPokemonCategory(this.returnType);
  }

  get heightInMeters(): number {
    return (this.pokemon?.height ?? 0) / 10;
  }

  get weightInKilograms(): number {
    return (this.pokemon?.weight ?? 0) / 10;
  }

  get imageUrl(): string | null {
    if (!this.pokemon || this.imageUnavailable) {
      return null;
    }

    const artwork = this.pokemon.sprites.other['official-artwork'].front_default;
    return this.triedFallbackImage
      ? this.pokemon.sprites.front_default
      : (artwork ?? this.pokemon.sprites.front_default);
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((parameters) => parameters.get('type')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(this.onReturnTypeChanged);

    const routePokemonName = this.route.paramMap.pipe(
      map((parameters) => parameters.get('name')),
      distinctUntilChanged(),
    );
    const retryPokemonName = this.retryRequests.pipe(map(() => this.currentName));

    merge(routePokemonName, retryPokemonName)
      .pipe(
        switchMap((name) => this.loadPokemon(name).pipe(catchError(this.onPokemonRequestError))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: this.onPokemonReceived,
        error: this.onPokemonError,
      });
  }

  retry(): void {
    this.retryRequests.next();
  }

  pokemonIdLabel(id: number): string {
    return id.toString().padStart(4, '0');
  }

  statLabel(stat: PokemonBaseStat): string {
    return this.statLabels[stat.stat.name] ?? stat.stat.name;
  }

  typeLabel(typeName: string): string {
    return this.typeLabels[typeName] ?? typeName;
  }

  statBarWidth(baseStat: number): number {
    return Math.min((baseStat / 255) * 100, 100);
  }

  readonly onReturnTypeChanged = (typeName: string | null): void => {
    this.returnType = findPokemonCategory(typeName)?.type ?? null;
  };

  readonly onPokemonReceived = (pokemon: PokemonDetail): void => {
    this.pokemon = pokemon;
    this.isLoading = false;
  };

  readonly onPokemonError = (error: HttpErrorResponse): void => {
    this.pokemon = null;
    this.isLoading = false;
    this.errorMessage =
      error.status === 404
        ? 'Nessun Pokémon corrisponde al nome o numero richiesto.'
        : error.status === 0
          ? 'Impossibile raggiungere PokéAPI. Controlla la connessione e riprova.'
          : 'Non è stato possibile caricare la scheda. Riprova tra poco.';
  };

  readonly onPokemonRequestError = (error: HttpErrorResponse): Observable<never> => {
    this.onPokemonError(error);
    return EMPTY;
  };

  readonly onImageError = (): void => {
    const artwork = this.pokemon?.sprites.other['official-artwork'].front_default;
    const sprite = this.pokemon?.sprites.front_default;

    if (!this.triedFallbackImage && artwork && sprite && artwork !== sprite) {
      this.triedFallbackImage = true;
    } else {
      this.imageUnavailable = true;
    }
  };

  private loadPokemon(name: string | null): Observable<PokemonDetail> {
    this.currentName = name?.trim().toLowerCase() ?? '';
    this.pokemon = null;
    this.errorMessage = '';
    this.isLoading = true;
    this.triedFallbackImage = false;
    this.imageUnavailable = false;

    if (!/^[a-z0-9-]+$/.test(this.currentName)) {
      return throwError(
        () => new HttpErrorResponse({ status: 404, statusText: 'Pokémon non trovato' }),
      );
    }

    const detailsRequest = this.pokemonApi.getPokemonDetails(this.currentName);
    return detailsRequest;
  }
}
