export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Priorise isFeatured, puis mélange aléatoirement chaque groupe. */
export function pickRandomFeaturedFirst<T extends { isFeatured: boolean }>(
  items: T[],
  limit: number
): T[] {
  const featured = shuffle(items.filter((item) => item.isFeatured));
  const others = shuffle(items.filter((item) => !item.isFeatured));
  return [...featured, ...others].slice(0, limit);
}
