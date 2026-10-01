import { NamedApiResource } from './named-api-resource.model';

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: PokemonSprites;
  types: PokemonTypeSlot[];
  abilities: PokemonAbility[];
  stats: PokemonBaseStat[];
}

export interface PokemonSprites {
  front_default: string | null;
  other: {
    'official-artwork': {
      front_default: string | null;
    };
  };
}

export interface PokemonTypeSlot {
  slot: number;
  type: NamedApiResource;
}

export interface PokemonAbility {
  is_hidden: boolean;
  ability: NamedApiResource;
}

export interface PokemonBaseStat {
  base_stat: number;
  stat: NamedApiResource;
}
