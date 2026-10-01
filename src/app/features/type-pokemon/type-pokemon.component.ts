import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Observable,
  Subject,
  catchError,
  distinctUntilChanged,
  EMPTY,
  map,
  merge,
  switchMap,
  throwError,
} from 'rxjs';
import { findPokemonCategory, PokemonCategory } from '../../models/pokemon-category.model';
import { PokemonTypeAssociation, PokemonTypeResponse } from '../../models/pokemon-type.model';
import { PokemonApiService } from '../../services/pokemon-api.service';

@Component({
  selector: 'app-type-pokemon',
  imports: [RouterLink],
  templateUrl: './type-pokemon.component.html',
  styleUrl: './type-pokemon.component.css',
})
export class TypePokemonComponent implements OnInit {
  readonly pageSize = 24;
  currentType = '';
  pokemonAssociations: PokemonTypeAssociation[] = [];
  currentPage = 1;
  isLoading = false;
  errorMessage = '';

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pokemonApi = inject(PokemonApiService);
  private readonly retryRequests = new Subject<void>();

  get category(): PokemonCategory | undefined {
    return findPokemonCategory(this.currentType);
  }

  get visiblePokemon(): PokemonTypeAssociation[] {
    const firstIndex = (this.currentPage - 1) * this.pageSize;
    return this.pokemonAssociations.slice(firstIndex, firstIndex + this.pageSize);
  }

  get pageCount(): number {
    return Math.ceil(this.pokemonAssociations.length / this.pageSize);
  }

  get firstVisibleNumber(): number {
    return this.pokemonAssociations.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastVisibleNumber(): number {
    return Math.min(this.currentPage * this.pageSize, this.pokemonAssociations.length);
  }

  ngOnInit(): void {
    const routeTypeName = this.route.paramMap.pipe(
      map((parameters) => parameters.get('type')),
      distinctUntilChanged(),
    );
    const retryTypeName = this.retryRequests.pipe(
      map(() => this.route.snapshot.paramMap.get('type')),
    );

    merge(routeTypeName, retryTypeName)
      .pipe(
        switchMap((typeName) =>
          this.loadPokemonForType(typeName).pipe(catchError(this.onPokemonRequestError)),
        ),
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

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.pageCount) {
      this.currentPage += 1;
    }
  }

  pokemonIdLabel(association: PokemonTypeAssociation): string {
    const resourceId = association.pokemon.url.split('/').at(-2);
    return resourceId ? resourceId.padStart(4, '0') : '----';
  }

  readonly onPokemonReceived = (response: PokemonTypeResponse): void => {
    this.pokemonAssociations = response.pokemon;
    this.currentPage = 1;
    this.isLoading = false;
  };

  readonly onPokemonError = (error: HttpErrorResponse): void => {
    this.pokemonAssociations = [];
    this.isLoading = false;
    this.errorMessage = this.category
      ? error.status === 0
        ? 'Impossibile raggiungere PokéAPI. Controlla la connessione e riprova.'
        : 'Non è stato possibile caricare i Pokémon. Riprova tra poco.'
      : 'Questo tipo non esiste. Scegli una delle categorie disponibili.';
  };

  readonly onPokemonRequestError = (error: HttpErrorResponse): Observable<never> => {
    this.onPokemonError(error);
    return EMPTY;
  };

  private loadPokemonForType(typeName: string | null): Observable<PokemonTypeResponse> {
    this.currentType = typeName?.toLowerCase() ?? '';
    this.currentPage = 1;
    this.pokemonAssociations = [];
    this.errorMessage = '';
    this.isLoading = true;

    const selectedCategory = findPokemonCategory(this.currentType);
    if (!selectedCategory) {
      return throwError(
        () => new HttpErrorResponse({ status: 404, statusText: 'Tipo non trovato' }),
      );
    }

    const pokemonRequest = this.pokemonApi.getPokemonByType(selectedCategory.type);
    return pokemonRequest;
  }
}
