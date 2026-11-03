/** Accord français pour un compteur de résultats de liste. */
export function formatResultCount(total: number): string {
  return total === 1 ? "1 résultat" : `${total} résultats`;
}
