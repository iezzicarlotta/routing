import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PokemonApiService } from './pokemon-api.service';

describe('PokemonApiService', () => {
  let service: PokemonApiService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PokemonApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PokemonApiService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('richiede l’indice dei tipi all’endpoint corretto', () => {
    const typesRequest = service.getTypes();
    typesRequest.subscribe();

    const request = httpController.expectOne('https://pokeapi.co/api/v2/type');
    expect(request.request.method).toBe('GET');
    request.flush({ count: 21, next: null, previous: null, results: [] });
  });

  it('mantiene la corrispondenza corretta tra tipo fuoco e URL', () => {
    const pokemonRequest = service.getPokemonByType('fire');
    pokemonRequest.subscribe();

    const request = httpController.expectOne(
      'https://pokeapi.co/api/v2/type/fire/',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ id: 10, name: 'fire', pokemon: [] });
  });

  it('richiede i dettagli usando il nome normalizzato del Pokémon', () => {
    const detailsRequest = service.getPokemonDetails('Pikachu');
    detailsRequest.subscribe();

    const request = httpController.expectOne(
      'https://pokeapi.co/api/v2/pokemon/pikachu/',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      sprites: {
        front_default: null,
        other: { 'official-artwork': { front_default: null } },
      },
      types: [],
      abilities: [],
      stats: [],
    });
  });
});