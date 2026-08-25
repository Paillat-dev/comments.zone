function hashString(value: string): number {
  let hash = 2_166_136_261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}
function getSeededRandom(seed: string): number {
  let value = hashString(seed) + 0x6d2b79f5;

  value = Math.imul(value ^ (value >>> 15), 1 | value);
  value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);

  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
}

function getDistributedRandom(seed: string, min: number, max: number): number {
  const u: number = getSeededRandom(seed);
  const t: number = Math.acos(1 - 2 * u) / Math.PI;

  return Math.floor(min + t * (max - min));
}

function getBoundedRandom(seed: string, min: number, max: number) {
  const u: number = getSeededRandom(seed);
  return Math.floor(min + u * (max - min));
}

export { getSeededRandom, getDistributedRandom, getBoundedRandom };
