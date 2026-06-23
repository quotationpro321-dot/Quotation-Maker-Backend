export enum CalculatorCatalogType {
  UMRAH = "umrah",
  HOLIDAY = "holiday",
}

export const CALCULATOR_CATALOG_TYPES = [
  CalculatorCatalogType.UMRAH,
  CalculatorCatalogType.HOLIDAY,
] as const;

export function slugifyCatalogName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
