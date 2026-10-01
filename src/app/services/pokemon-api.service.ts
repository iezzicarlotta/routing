import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PokemonTypeIndexResponse,
  PokemonTypeResponse,
} from '../models/pokemon-type.model';
import { PokemonDetail } from '../models/pokemon.model';

@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://pokeapi.co/api/v2';

  getTypes(): Observable<PokemonTypeIndexResponse> {
    return this.http.get<PokemonTypeIndexResponse>(`${this.apiUrl}/type`);
  }

  getPokemonByType(typeName: string): Observable<PokemonTypeResponse> {
    const type = encodeURIComponent(typeName.toLowerCase());
    return this.http.get<PokemonTypeResponse>(`${this.apiUrl}/type/${type}/`);
  }

  getPokemonDetails(nameOrId: string): Observable<PokemonDetail> {
    const pokemon = encodeURIComponent(nameOrId.toLowerCase());
    return this.http.get<PokemonDetail>(`${this.apiUrl}/pokemon/${pokemon}/`);
  }
}