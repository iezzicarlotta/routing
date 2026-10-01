import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { TypePokemonComponent } from './type-pokemon.component';

describe('TypePokemonComponent', () => {
  let fixture: ComponentFixture<TypePokemonComponent>;
  let routeParameters: BehaviorSubject<ParamMap>;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    routeParameters = new BehaviorSubject(
      convertToParamMap({ type: 'fire' }),
    );
    const activatedRoute = {
      paramMap: routeParameters.asObservable(),
      snapshot: { paramMap: routeParameters.value },
    } as ActivatedRoute;

    await TestBed.configureTestingModule({
      imports: [TypePokemonComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TypePokemonComponent);
    fixture.componentInstance.ngOnInit();
  });

  afterEach(() => {
    httpController.verify();
  });

  it('carica tutti i risultati e li divide in pagine navigabili', () => {
    const request = httpController.expectOne(
      'https://pokeapi.co/api/v2/type/fire/',
    );
    const pokemon = Array.from({ length: 25 }, (_, index) => ({
      slot: 1,
      pokemon: {
        name: `pokemon-${index + 1}`,
        url: `https://pokeapi.co/api/v2/pokemon/${index + 1}/`,
      },
    }));
    request.flush({ id: 10, name: 'fire', pokemon });

    const component = fixture.componentInstance;
    expect(component.isLoading).toBe(false);
    expect(component.pokemonAssociations).toHaveLength(25);
    expect(component.visiblePokemon).toHaveLength(24);
    expect(component.pageCount).toBe(2);

    component.goToNextPage();

    expect(component.visiblePokemon).toHaveLength(1);
    expect(component.firstVisibleNumber).toBe(25);
    expect(component.lastVisibleNumber).toBe(25);
  });

  it('annulla la richiesta precedente quando cambia il parametro di rotta', () => {
    const fireRequest = httpController.expectOne(
      'https://pokeapi.co/api/v2/type/fire/',
    );

    routeParameters.next(convertToParamMap({ type: 'water' }));

    expect(fireRequest.cancelled).toBe(true);
    const waterRequest = httpController.expectOne(
      'https://pokeapi.co/api/v2/type/water/',
    );
    waterRequest.flush({
      id: 11,
      name: 'water',
      pokemon: [
        {
          slot: 1,
          pokemon: {
            name: 'squirtle',
            url: 'https://pokeapi.co/api/v2/pokemon/7/',
          },
        },
      ],
    });

    expect(fixture.componentInstance.currentType).toBe('water');
    expect(fixture.componentInstance.pokemonAssociations[0].pokemon.name).toBe(
      'squirtle',
    );
  });

  it('gestisce un tipo inesistente senza inviare richieste HTTP', () => {
    const fireRequest = httpController.expectOne(
      'https://pokeapi.co/api/v2/type/fire/',
    );
    routeParameters.next(convertToParamMap({ type: 'ghost' }));

    expect(fireRequest.cancelled).toBe(true);
    expect(fixture.componentInstance.errorMessage).toContain(
      'Questo tipo non esiste',
    );
    expect(fixture.componentInstance.isLoading).toBe(false);
    httpController.expectNone('https://pokeapi.co/api/v2/type/ghost/');
  });
});