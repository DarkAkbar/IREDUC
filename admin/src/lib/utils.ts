import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatMoney(amount?: number | null, currency = "USD") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
    CANCELLED: "Annulée",
    COMPLETED: "Terminée",
    DRAFT: "Brouillon",
    ARCHIVED: "Archivé",
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
    ADMIN: "Administrateur",
    SUPER_ADMIN: "Super administrateur",
    USER: "Utilisateur",
    PROVIDER: "Partenaire",
  };
  return map[status] ?? status;
}
