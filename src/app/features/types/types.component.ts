import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NamedApiResource } from '../../models/named-api-resource.model';
import { PokemonCategory, POKEMON_CATEGORIES } from '../../models/pokemon-category.model';
import { PokemonTypeIndexResponse } from '../../models/pokemon-type.model';
import { PokemonApiService } from '../../services/pokemon-api.service';

@Component({
  selector: 'app-types',
  imports: [RouterLink],
  templateUrl: './types.component.html',
  styleUrl: './types.component.css',
})
export class TypesComponent implements OnInit {
  readonly supportedCategories: readonly PokemonCategory[] = POKEMON_CATEGORIES;
  categories: PokemonCategory[] = [];
  isLoading = false;
  errorMessage = '';

  private readonly pokemonApi = inject(PokemonApiService);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const typesRequest = this.pokemonApi.getTypes();
    typesRequest.subscribe({
      next: this.onTypesReceived,
      error: this.onTypesError,
    });
  }

  readonly onTypesReceived = (response: PokemonTypeIndexResponse): void => {
    const availableTypes = new Set(
      response.results.map((resource: NamedApiResource) => resource.name),
    );

    this.categories = this.supportedCategories.filter((category) =>
      availableTypes.has(category.type),
    );
    this.isLoading = false;
  };

  readonly onTypesError = (error: HttpErrorResponse): void => {
    this.isLoading = false;
    this.errorMessage =
      error.status === 0
        ? 'Impossibile raggiungere PokéAPI. Controlla la connessione e riprova.'
        : 'Non è stato possibile caricare le categorie. Riprova tra poco.';
  };
}