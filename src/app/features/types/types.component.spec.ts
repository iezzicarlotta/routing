import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PokemonTypeIndexResponse } from '../../models/pokemon-type.model';
import { PokemonApiService } from '../../services/pokemon-api.service';
import { TypesComponent } from './types.component';

describe('TypesComponent', () => {
  it('mostra soltanto i tre tipi scelti presenti nella risposta API', async () => {
    const response: PokemonTypeIndexResponse = {
      count: 4,
      next: null,
      previous: null,
      results: [
        { name: 'fire', url: 'https://pokeapi.co/api/v2/type/10/' },
        { name: 'water', url: 'https://pokeapi.co/api/v2/type/11/' },
        { name: 'grass', url: 'https://pokeapi.co/api/v2/type/12/' },
        { name: 'ghost', url: 'https://pokeapi.co/api/v2/type/8/' },
      ],
    };

    await TestBed.configureTestingModule({
      imports: [TypesComponent],
      providers: [
        provideRouter([]),
        {
          provide: PokemonApiService,
          useValue: { getTypes: () => of(response) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TypesComponent);
    fixture.detectChanges();

    const component = fixture.nativeElement as HTMLElement;
    const categoryLinks = component.querySelectorAll('.category-card__link');
    expect(categoryLinks).toHaveLength(3);
    expect(component.textContent).toContain('Fuoco');
    expect(component.textContent).toContain('Acqua');
    expect(component.textContent).toContain('Erba');
    expect(component.textContent).not.toContain('ghost');
  });
});
