export type PokemonTypeName = 'fire' | 'water' | 'grass';

export interface PokemonCategory {
  type: PokemonTypeName;
  label: string;
  number: string;
  icon: string;
  description: string;
  color: string;
}

export const POKEMON_CATEGORIES: readonly PokemonCategory[] = [
  {
    type: 'fire',
    label: 'Fuoco',
    number: '01',
    icon: '🔥',
    description: 'Pokémon energici, guidati dal calore e dalla passione.',
    color: '#df6048',
  },
  {
    type: 'water',
    label: 'Acqua',
    number: '02',
    icon: '💧',
    description: 'Esploratori versatili che si muovono tra fiumi e oceani.',
    color: '#428bb7',
  },
  {
    type: 'grass',
    label: 'Erba',
    number: '03',
    icon: '🌿',
    description: 'Pokémon in sintonia con la natura e la crescita.',
    color: '#558b5c',
  },
];

export function findPokemonCategory(
  typeName: string | null,
): PokemonCategory | undefined {
  const normalizedTypeName = typeName?.toLowerCase();
  return POKEMON_CATEGORIES.find(
    (category) => category.type === normalizedTypeName,
  );
}