import { NamedApiResource } from './named-api-resource.model';

export interface PokemonTypeIndexResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedApiResource[];
}

export interface PokemonTypeResponse {
  id: number;
  name: string;
  pokemon: PokemonTypeAssociation[];
}

export interface PokemonTypeAssociation {
  slot: number;
  pokemon: NamedApiResource;
}