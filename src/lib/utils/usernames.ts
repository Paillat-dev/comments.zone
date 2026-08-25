import { uniqueNamesGenerator } from "unique-names-generator";
import {
  adjectives,
  animals,
  colors,
  countries,
  languages,
  names,
  starWars,
  NumberDictionary,
} from "unique-names-generator";

function getSeededUsername(seed: string, index: number = 0): string {
  return uniqueNamesGenerator({
    dictionaries: [
      adjectives,
      animals,
      colors,
      countries,
      languages,
      names,
      starWars,
      NumberDictionary.generate({ min: 1, max: 9999 }),
    ],
    seed: index !== 0 ? `${seed}${index}` : seed,
    separator: "_",
    length: 2,
  });
}

export { getSeededUsername };
