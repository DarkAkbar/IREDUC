import { OfferType, PropertyListItem } from "../api/types";

export function formatPrice(amount: number, offerType?: OfferType) {
  const value = new Intl.NumberFormat("fr-FR").format(amount);
  if (offerType === "RENT") return `${value} $ / mois`;
  return `${value} $`;
}

export function offerBadge(offerType: OfferType) {
  return offerType === "RENT" ? "À louer" : "À vendre";
}

export function propertyLocation(item: Pick<PropertyListItem, "commune" | "neighborhood">) {
  if (item.neighborhood?.name) {
    return `${item.neighborhood.name}, ${item.commune.name}`;
  }
  return item.commune.name;
}

export function kindLabel(kind: string) {
  switch (kind) {
    case "HOUSE":
      return "Maison";
    case "APARTMENT":
      return "Appartement";
    case "VILLA":
      return "Villa";
    case "LAND":
      return "Terrain";
    default:
      return kind;
  }
}
