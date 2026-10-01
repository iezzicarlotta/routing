import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PokemonDetail } from '../../models/pokemon.model';
import { PokemonDetailComponent } from './pokemon-detail.component';

function createPokemonDetails(name = 'pikachu', id = 25): PokemonDetail {
  return {
    id,
    name,
    height: 4,
    weight: 60,
    sprites: {
      front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      other: {
        'official-artwork': {
          front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
        },
      },
    },
    types: [
      {
        slot: 1,
        type: { name: 'electric', url: 'https://pokeapi.co/api/v2/type/13/' },
      },
    ],
    abilities: [
      {
        is_hidden: false,
        ability: { name: 'static', url: 'https://pokeapi.co/api/v2/ability/9/' },
      },
    ],
    stats: [
      {
        base_stat: 35,
        stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' },
      },
    ],
  };
}

describe('PokemonDetailComponent', () => {
  let fixture: ComponentFixture<PokemonDetailComponent>;
  let pokemonNames: BehaviorSubject<ParamMap>;
  let queryParameters: BehaviorSubject<ParamMap>;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    pokemonNames = new BehaviorSubject(convertToParamMap({ name: 'pikachu' }));
    queryParameters = new BehaviorSubject(convertToParamMap({ type: 'fire' }));
    const activatedRoute = {
      paramMap: pokemonNames.asObservable(),
      queryParamMap: queryParameters.asObservable(),
      snapshot: {
        paramMap: pokemonNames.value,
        queryParamMap: queryParameters.value,
      },
    } as ActivatedRoute;

    await TestBed.configureTestingModule({
      imports: [PokemonDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PokemonDetailComponent);
    fixture.componentInstance.ngOnInit();
  });

  afterEach(() => {
    httpController.verify();
  });

  it('carica i dettagli, traduce i tipi e converte peso e altezza', () => {
    const request = httpController.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    request.flush(createPokemonDetails());

    const component = fixture.componentInstance;
    expect(component.isLoading).toBe(false);
    expect(component.pokemon?.id).toBe(25);
    expect(component.heightInMeters).toBe(0.4);
    expect(component.weightInKilograms).toBe(6);
    expect(component.typeLabel('electric')).toBe('Elettro');
    expect(component.statLabel(component.pokemon!.stats[0])).toBe('Punti salute');
    expect(component.returnCategory?.type).toBe('fire');
    expect(component.pokemonIdLabel(25)).toBe('0025');
  });

  it('usa la sprite alternativa e gestisce anche l’assenza di entrambe le immagini', () => {
    const request = httpController.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    request.flush(createPokemonDetails());

    const component = fixture.componentInstance;
    expect(component.imageUrl).toContain('/other/official-artwork/');
    component.onImageError();
    expect(component.imageUrl).toMatch(/\/sprites\/pokemon\/25\.png$/);
    component.onImageError();
    expect(component.imageUrl).toBeNull();

    pokemonNames.next(convertToParamMap({ name: 'missing-image' }));
    const imageRequest = httpController.expectOne(
      'https://pokeapi.co/api/v2/pokemon/missing-image/',
    );
    imageRequest.flush({
      ...createPokemonDetails('missing-image', 1000),
      sprites: {
        front_default: null,
        other: { 'official-artwork': { front_default: null } },
      },
    });
    expect(component.imageUrl).toBeNull();
    expect(component.pokemon?.name).toBe('missing-image');
  });

  it('aggiorna i query parameter senza richieste extra e annulla i dettagli precedenti', () => {
    const firstRequest = httpController.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    pokemonNames.next(convertToParamMap({ name: 'charmander' }));
    queryParameters.next(convertToParamMap({ type: 'grass' }));

    expect(firstRequest.cancelled).toBe(true);
    const charmanderRequest = httpController.expectOne(
      'https://pokeapi.co/api/v2/pokemon/charmander/',
    );
    expect(fixture.componentInstance.returnCategory?.type).toBe('grass');
    charmanderRequest.flush(createPokemonDetails('charmander', 4));

    expect(fixture.componentInstance.pokemon?.name).toBe('charmander');
    expect(fixture.componentInstance.isLoading).toBe(false);
  });

  it('mostra un errore HTTP e permette di riprovare', () => {
    const failedRequest = httpController.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    failedRequest.flush('Servizio non disponibile', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(fixture.componentInstance.isLoading).toBe(false);
    expect(fixture.componentInstance.errorMessage).toContain('Non è stato possibile caricare');

    fixture.componentInstance.retry();
    const retriedRequest = httpController.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    retriedRequest.flush(createPokemonDetails());

    expect(fixture.componentInstance.isLoading).toBe(false);
    expect(fixture.componentInstance.pokemon?.name).toBe('pikachu');
    expect(fixture.componentInstance.errorMessage).toBe('');
  });

  it('rifiuta identificativi malformati e termina lo stato loading', () => {
    const firstRequest = httpController.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    pokemonNames.next(convertToParamMap({ name: 'not a pokemon' }));

    expect(firstRequest.cancelled).toBe(true);
    expect(fixture.componentInstance.isLoading).toBe(false);
    expect(fixture.componentInstance.errorMessage).toContain('Nessun Pokémon corrisponde');
    httpController.expectNone('https://pokeapi.co/api/v2/pokemon/not%20a%20pokemon/');
  });

  it('usa il collegamento generale quando la route non conserva la categoria', () => {
    const initialRequest = httpController.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    initialRequest.flush(createPokemonDetails());
    queryParameters.next(convertToParamMap({}));

    expect(fixture.componentInstance.returnCategory).toBeUndefined();
    expect(fixture.componentInstance.returnType).toBeNull();
  });
});
